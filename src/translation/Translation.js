var Translation = function (options) {
	
	'use strict';
	if (!Promise) throw new Error("Promise API is required.");
	if (!Promise.all) throw new Error("Promise API with support for Promise.all() is required. (https://github.com/tildeio/rsvp.js/)");
	if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
	if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");
	
	var config = {};
	options = options || {};
	
	// Base URI is the locales sub directory relative to the current file.
	// It is assumed that if the current location matches "PATH/*.*",
	// the base URI resolves to "PATH/locales". Otherwise, "/locales" is
	// appended to the URI path.
	var baseURI = options.baseURI;
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
	config.baseURI = baseURI;
	
	
	config.namespaces = options.namespaces || (options.defaultNamespace ? [options.defaultNamespace] : ['translation']);
	config.defaultLang = options.defaultLang || 'en';
	config.lang = config.defaultLang;
	config.caching = options.caching || true;
	
	var translateFn = function (key, namespace) {
		if (!namespace || config.namespaces.length <= 1) {
			return key;
		}
		return namespace + "." + key;
	};
	
	var cache = {};
	
	var _cache = function (lang, ns, translation) {
		if (!config.caching) {
			return;
		}
		var t = {};
		cache[lang] = cache[lang] || {};
		cache[lang][ns] = translation;
	};
	
	var _parentLocale = function (lang) {
		var re = new RegExp("(.+)_.+");
		var matches = re.exec(lang);
		return matches ? matches[1] : undefined;
	};
	
	var _createLoader = function (lang, namespace) {
		if (cache[lang] && cache[lang][namespace]) {
			return new Promise(function (resolve) {
				resolve({lang: lang, namespace: namespace, translation: cache[lang][namespace]});
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
		var lang = config.lang;
		var parentLang = _parentLocale(lang) || lang;
		var defaultLang = config.defaultLang;
		var defaultNamespace = config.namespaces[0];
		return function (key, namespace) {
			namespace = namespace || defaultNamespace;
			var val = _.chain([lang, parentLang, defaultLang])
				.uniq()
				.reduce(function (result, lang) {
					if (!result) {
						if (translation[lang] && translation[lang][namespace]) {
							result = translation[lang][namespace][key];
						}
					}
					return result;
				}, undefined)
				.value();
			return val || key;
		};
	};
	
	var _load = function (config) {
		var lang = config.lang;
		var namespaces = config.namespaces;
		var languages = _.uniq([lang, _parentLocale(lang) || lang, config.defaultLang]);
		var loaders = [];
		_.each(languages, function (l) {
			_.each(namespaces, function (ns) {
				loaders.push(_createLoader(l, ns));
			});
		});
		var p = Promise.all(loaders).then(function (results) {
			var translation = {};
			_.each(results, function (result) {
				translation[result.lang] = translation[result.lang] || {};
				translation[result.lang][result.namespace] = result.translation;
				_cache(result.lang, result.namespace, result.translation);
			});
			translateFn = _createTranslator(config, translation);
			return Promise.resolve(translateFn);
		});
		p.catch(function (e) {
			console.log(e && e.stack ? e.stack : e);
		});
		return p;
	};
	
	this.setDefaultLanguage = function (lang) {
		config.defaultLang = lang;
		return _load(config);
	};
	
	this.setNamespace = function (namespace) {
		var namespaces = !_.isArray(namespace) ? [namespace] : namespace;
		config.namespaces = namespaces;
		return _load(config);
	};
	
	this.addNamespace = function (namespace) {
		if (!_.contains(config.namespaces, namespace)) {
			config.namespaces.push(namespace);
		}
		return _load(config);
	};
	
	this.select = function (lang) {
		config.lang = lang;
		return _load(config);
	};
	
	this.translate = function (key, namespace) {
		return translateFn(key, namespace);
	};
	
	this.i18n = function () {
		return translateFn;
	};
	
	this.createHandlebarsHelper = function () {
		var helper = _.bind(function () {
			var _t = this.i18n();
			var key, namespace;
			switch (arguments.length) {
				case 0:
				case 1:
					return "";
				case 2:
					key = arguments[0];
					namespace = config.namespaces[0];
					break;
				case 3:
					key = arguments[0];
					namespace = arguments[1];
					break;
			}
			return _t(key, namespace);
		}, this);
		helper._t = _.bind(function () {
			return this.i18n();
		}, this);
		return helper;
	};
	
};

