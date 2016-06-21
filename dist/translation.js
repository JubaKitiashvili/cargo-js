;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['cargo.Promise', 'cargo.Model', 'superagent', '_'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('cargo.Promise'), require('cargo.Model'), require('superagent'), require('_'));
    } else {
        root.cargo = root.cargo || {};
        root.cargo.Translation = factory(root.cargo.Promise, root.cargo.Model, root.superagent, root._);
    }
}(this, function(Promise, Model, superagent, _) {
var Translation = function (options) {

    'use strict';
    if (!Model) throw new Error("cargo.Model API is required.");
    if (!Promise) throw new Error("cargo.Promise API is required.");
    if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
    if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");

    var actions = {};
    var config = {};

    var translations = {};

    var _parentLocale = function (lang) {
        var re = new RegExp("(.+)_.+");
        var matches = re.exec(lang);
        return matches ? matches[1] : undefined;
    };

    var _loader = function (lang) {
        var url = config.baseURI + "/" + lang + "/" + config.namespace + ".json";
        return new Promise(function (resolve) {
            superagent.get(url).end(function (err, response) {
                if (response && response.ok) {
                    resolve({lang: lang, translation: response.body});
                    return;
                }
                var parentLang = _parentLocale(lang);
                if (!parentLang) {
                    resolve({lang: lang, translation: undefined});
                    return;
                }
                _loader(parentLang)
                    .then(function (translation) {
                        translation.lang = lang;
                        resolve(translation);
                    })
                    .catch(function () {
                        resolve({lang: lang, translation: undefined});
                    });
            });
        });
    };

    options = options || {};

    // The namespace resolves to "BASE_URI/LANG/NAMESPACE.json".
    config.namespace = options.namespace || "translation";

    // Base URI is the locales sub directory relative to the current file.
    // It is assumed that if the current location matches "PATH/*.*",
    // the base URI resolves to "PATH/locales". Otherwise, "/locales" is
    // appended to the URI path.
    if (!options.baseURI) {
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
        config.baseURI = uri + "locales";
    } else {
        config.baseURI = options.baseURI;
    }
    config.baseURI = config.baseURI.replace(/\/+$/, "");

    // Default language is English if not configured.
    config.defaultLang = options.defaultLang || "en";
    
    var languages = _.union(options.languages, [ config.defaultLang ]) || [];
    var loaders = _.chain(languages)
        .uniq(true)
        .map(function (lang) {
            return lang.toLowerCase();
        })
        .map(function (lang) {
            return _loader(lang);
        })
        .value();

    config.loading = Promise.when(loaders).then(function (results) {
        _.each(results, function (result) {
            if (!result.translation) {
                return;
            }
            translations[result.lang] = result.translation;
            var parentLang = _parentLocale(result.lang);
            if (parentLang && !translations[parentLang]) {
                translations[parentLang] = translations[result.lang];
            }
        });
        delete config.loading;
    }).catch(function (error) {
        console.log("Loading translations for namespace '" + config.namespace + "' failed: " + error);
    });

    actions.select = function (lang) {
        var self = this.model;
        if ( config.loading ) {
            // If we are still loading, delay selection until we are done.
            config.loading.then(function() {
                self.select(lang);
            });
            return undefined;
        }
        lang = lang || config.defaultLang;
        var trans = _.chain([lang, _parentLocale(lang), config.defaultLang])
            .reject(function (item) {
                return item == undefined
            })
            .uniq()
            .reduce(function (memo, item) {
                return memo || translations[item];
            }, null)
            .value();
        if (!trans) {
            trans = {};
        }
        return trans;
    };


    return new Model(actions);
};


    return Translation;
}));
