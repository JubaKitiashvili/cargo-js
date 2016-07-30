var Translation = function (baseURI, namespaces) {

    'use strict';
    if (!Model) throw new Error("cargo.Model API is required.");
    if (!Promise) throw new Error("cargo.Promise API is required.");
    if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
    if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");
    if (!Handlebars) throw new Error("Handlebars is required. (https://github.com/wycats/handlebars.js/)");

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

    namespaces = namespaces || ['translation'];

    var defaultLang = 'en';
    var parentLang = 'en';
    var currentLang = 'en';
    var _loading = undefined;
    var translation = Model.state({});

    var model = new Model({
        update: function () {
            return {
                lang: currentLang,
                locales: [ currentLang, parentLang, defaultLang ],
                namespaces: namespaces,
                translations: translation,
                loading: _loading !== undefined ? true : false
            };
        }
    });


    var handlebars = Handlebars.create();
    handlebars.registerHelper('i18n', function() {
        switch (arguments.length) {
            case 0:
            case 1:
                return "";
            case 2:
                return _translate(arguments[0]);
            default:
                return _translate(arguments[0], arguments[1]);
        }
    });

    var _parentLocale = function (lang) {
        var re = new RegExp("(.+)_.+");
        var matches = re.exec(lang);
        return matches ? matches[1] : undefined;
    };

    var _loader = function (lang, namespace) {
        var url = baseURI + "/" + lang + "/" + namespace + ".json";
        return new Promise(function (resolve) {
            superagent.get(url).end(function (err, response) {
                if (response && response.ok) {
                    resolve({lang: lang, namespace: namespace, translation: response.body});
                    return;
                }
                resolve({lang: lang, namespace: namespace, translation: undefined});
                return;
            });
        });
    };

    var _translate = function (key, namespace) {
        if (namespace === undefined) {
            namespace = namespaces[0];
        }
        var val = _.chain([currentLang, parentLang, defaultLang])
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


    this.setDefaultLanguage = function (lang) {
        defaultLang = lang;
        return this.select(currentLang);
    };

    this.setNamespace = function(namespace) {
        if ( !_.isArray(namespace) ) {
            namespaces = [ namespace ];
        } else {
            namespaces = namespace;
        }
        return this.select(currentLang);
    };

    this.addNamespace = function (namespace) {
        if (!_.contains(namespaces, namespace)) {
            namespaces.push(namespace);
        }
        return this.select(currentLang);
    };

    this.getHandlebars = function() {
        return handlebars;
    };

    this.select = function (lang) {
        var self = this;
        if (_loading) {
            return _loading.then(function (s) {
                self.select(lang);
            });
        }
        var loaders = [];
        var languages = _.uniq([lang, _parentLocale(lang) || lang, defaultLang]);
        _.each(translation.keys(), function (lang) {
            if (!_.contains(languages, lang)) {
                translation = translation.remove(lang);
            }
        });
        _.each(languages, function (lang) {
            _.each(namespaces, function (ns) {
                if (!translation.has(lang) || !translation.get(lang).has(ns)) {
                    loaders.push(_loader(lang, ns));
                }
            })
        });
        _loading = Promise
            .when(loaders)
            .then(function (results) {
                _.each(results, function (result) {
                    var t = {};
                    t[result.lang] = {};
                    t[result.lang][result.namespace] = result.translation;
                    translation = translation.deepMerge(t);
                });
                _loading = undefined;
                currentLang = lang;
                parentLang = _parentLocale(lang) || currentLang;
                model.update();
                return _translate;
            })
            .catch(function (e) {
                console.log(e && e.stack ? e.stack : e);
            });
        model.update();
        return new Promise(function (resolve) {
            var unsubscribe = model(function (state) {
                if (state.get('loading')) {
                    return;
                }
                unsubscribe();
                resolve(_translate);
            });
        });
    };

    this.subscribe = function (subscriber) {
        return model(subscriber);
    };

    this.asStream = function() {
        return Model.stream(model);
    };


};

