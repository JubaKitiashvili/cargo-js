var Translation = function (baseURI, options) {

    'use strict';
    if (!Model) throw new Error("cargo.Model API is required.");
    if (!Promise) throw new Error("cargo.Promise API is required.");
    if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
    if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");
    if (!Handlebars) throw new Error("Handlebars is required. (https://github.com/wycats/handlebars.js/)");

    var config = Model.state({});

    // Base URI is the locales sub directory relative to the current file.
    // It is assumed that if the current location matches "PATH/*.*",
    // the base URI resolves to "PATH/locales". Otherwise, "/locales" is
    // appended to the URI path.
    if (!baseURI) {
        var uri = "" + document.location;
        var pos = uri.indexOf("#");
        if (pos != -1) {
            uri = uri.substring(0, pos);
        }
        if (uri.match(/\.html/)) {
            pos = uri.lastIndexOf("/");
            if (pos != -1) {
                uri = uri.substring(0, pos + 1);
            }
        }
        baseURI = uri + "locales";
    }
    baseURI = baseURI.replace(/\/+$/, "");
    config = config.put('baseURI', baseURI);

    options = options || {};

    config = config.put('namespaces', options.namespaces || (options.defaultNamespace ? [options.defaultNamespace] : ['translation']));
    config = config.put('defaultLang', options.defaultLang || 'en');
    config = config.put('lang', config.get('defaultLang'));
    config = config.put('caching', options.caching || true);

    var cache = Model.state({});

    var model = new Model({
        loading: function (lang, config) {
            return {lang: lang, namespaces: config.get('namespaces'), loading: true};
        },
        finished: function (lang, config, translation) {
            return {
                loading: false,
                lang: lang,
                locales: [lang, _parentLocale(lang) || lang, config.get('defaultLang')],
                namespaces: config.get('namespaces'),
                translations: translation
            };
        }
    });

    var handlebars = Handlebars.create();
    handlebars.registerHelper('i18n', function () {
        switch (arguments.length) {
            case 0:
            case 1:
                return "";
            case 2:
                return arguments[0];
            default:
                return arguments[1] + "." + arguments[0];
        }
    });

    var _cache = function (lang, ns, translation) {
        if (!config.get('caching')) {
            return;
        }
        var t = {};
        t[lang] = {};
        t[lang][ns] = translation;
        cache = cache.deepMerge(t);
    };

    var _parentLocale = function (lang) {
        var re = new RegExp("(.+)_.+");
        var matches = re.exec(lang);
        return matches ? matches[1] : undefined;
    };

    var _createLoader = function (lang, namespace) {
        if (cache.has(lang) && cache.get(lang).get(namespace)) {
            return new Promise(function (resolve) {
                resolve({lang: lang, namespace: namespace, translation: cache.get(lang).get(namespace)});
            });
        }
        var url = baseURI + "/" + lang + "/" + namespace + ".json";
        return new Promise(function (resolve) {
            superagent.get(url).end(function (err, response) {
                if (response && response.ok) {
                    _cache(lang, namespace, response.body);
                    resolve({lang: lang, namespace: namespace, translation: response.body});
                    return;
                }
                resolve({lang: lang, namespace: namespace, translation: undefined});
            });
        });
    };

    var _createTranslator = function (config, translation) {
        var lang = config.get('lang');
        var parentLang = _parentLocale(lang) || lang;
        var defaultLang = config.get('defaultLang');
        var defaultNamespace = config.get('namespaces').get(0);
        return function (key, namespace) {
            namespace = namespace || defaultNamespace;
            var val = _.chain([lang, parentLang, defaultLang])
                .uniq()
                .reduce(function (result, lang) {
                    if (!result) {
                        if (translation.has(lang) && translation.get(lang).get(namespace)) {
                            result = translation.get(lang).get(namespace).get(key);
                        }
                    }
                    return result;
                }, undefined)
                .value();
            return val || key;
        };
    };

    var _load = function (config) {
        var lang = config.get('lang');
        var namespaces = config.get('namespaces').toJS();
        var languages = _.uniq([lang, _parentLocale(lang) || lang, config.get('defaultLang')]);
        var loaders = [];
        _.each(languages, function (l) {
            _.each(namespaces, function (ns) {
                loaders.push(_createLoader(l, ns));
            });
        });
        model.loading(lang, namespaces);
        var p = Promise
            .when(loaders)
            .then(function (results) {
                var translation = Model.state({});
                _.each(results, function (result) {
                    var t = {};
                    t[result.lang] = {};
                    t[result.lang][result.namespace] = result.translation;
                    translation = translation.deepMerge(t);
                    _cache(result.lang, result.namespace, result.translation);
                });
                var _t = _createTranslator(config, translation);
                if (handlebars.helpers.i18n) {
                    handlebars.unregisterHelper('i18n');
                }
                handlebars.registerHelper('i18n', function () {
                    switch (arguments.length) {
                        case 0:
                        case 1:
                            return "";
                        case 2:
                            return _t(arguments[0]);
                        default:
                            return _t(arguments[0], arguments[1]);
                    }
                });

                model.finished(lang, config, translation);
                return Promise.resolve(_t);
            });
        p.catch(function (e) {
            console.log(e && e.stack ? e.stack : e);
        });
        return p;
    };

    this.setDefaultLanguage = function (lang) {
        config = config.put('defaultLang', lang);
        return _load(config);
    };

    this.setNamespace = function (namespace) {
        var namespaces = !_.isArray(namespace) ? [namespace] : namespace;
        config = config.put('namespaces', namespaces);
        return _load(config);
    };

    this.addNamespace = function (namespace) {
        var namespaces = config.get('namespaces').toJS();
        if (!_.contains(namespaces, namespace)) {
            namespaces.push(namespace);
        }
        config = config.put('namespaces', namespaces);
        return _load(config);
    };

    this.getHandlebars = function () {
        return handlebars;
    };

    this.select = function (lang) {
        config = config.put('lang', lang);
        return _load(config);
    };

    this.subscribe = function (subscriber) {
        return model(subscriber);
    };

};

