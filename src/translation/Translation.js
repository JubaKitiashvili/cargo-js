var Translation = function () {

    'use strict';
    if (!Model) throw new Error("cargo.Model API is required.");
    if (!Promise) throw new Error("cargo.Promise API is required.");
    if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
    if (!Cookies) throw new Error("js-cookies is required. (https://github.com/js-cookie/js-cookie)");
    if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");

    var actions = {};
    var config = {};

    var translations = {};

    var _parentLocale = function (lang) {
        var re = new RegExp("(.+)_.+");
        var matches =re.exec(lang);
        return  matches ? matches[1] : undefined;
    };

    var _loader = function (lang) {
        var url = config.baseURI + "/" + lang + "/" + config.namespace + ".json";
        return new Promise(function (resolve, reject) {
            superagent.get(url).end(function (err, response) {
                if (response.ok) {
                    resolve({lang: lang, translation: response.body});
                    return;
                }
                var parentLang = _parentLocale(lang);
                if ( !parentLang ) {
                    reject("Error loading translation from " + url + ": " + err);
                    return;
                }
                console.log("Unable to load translation from " + url + ": " + err);
                console.log("Falling back to locale: " + parentLang);
                _loader(parentLang)
                    .then(function(translation) {
                        translation.lang = lang;
                        resolve(translation);
                    })
                    .catch(function(error) {
                        reject(error);
                    });
            });
        });
    };

    actions.initialState = function (options) {
        var self = this.model;
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
                var pos = uri.lastIndexOf("/");
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

        // Cookie name defaults to "cargo.lang".
        config.cookie = options.cookie ||"cargo.lang";

        var languages = options.languages || [];
        languages.push(config.defaultLang);
        var loaders = _.chain(languages)
            .uniq(true)
            .map(function (lang) {
                return lang.toLowerCase();
            })
            .map(function (lang) {
                return _loader(lang);
            })
            .value();
        Promise.when(loaders).then(function (results) {
            _.each(results, function(result) {
                translations[result.lang] = result.translation;
                var parentLang = _parentLocale(result.lang);
                if ( parentLang && !translations[parentLang] ) {
                    translations[parentLang] = translations[result.lang];
                }
            });
            var browserLang = Cookies.get(config.cookie);
            if ( !browserLang ) {
                browserLang = config.defaultLang;
            }
            self.select(browserLang);
        }).catch(function (error) {
            self.select(config.defaultLang);
        });
        return {};
    };

    actions.select = function (lang) {
        lang = lang || config.defaultLang;
        Cookies.set(config.cookie, lang);
        var trans = _.chain([ lang, _parentLocale(lang), config.defaultLang ])
            .reject(function(item) { return item == undefined })
            .uniq()
            .reduce(function(memo, item) {
                return memo || translations[item];
            }, null)
            .value();
        if ( !trans ) {
            console.log("Unable to load translation for language '" + lang + "'.");
            trans = {};
        }
        return trans;
    };


    return new Model(actions);
};

