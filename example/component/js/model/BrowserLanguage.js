define(['cargo.Translation', 'cargo.Model', 'Handlebars', 'cookie'], function (Translation, Model, Handlebars, cookie) {
	var instance;
	
	var cookieName = 'cargo-js-example-lang';
	var cookieExpires = 7;
	
	var model = new Model({
		initialState: function () {
			var lang = cookie.get(cookieName);
			cookie.set(cookieName, lang, {expires: cookieExpires});
			return {lang: lang};
		},
		select: function (lang) {
			if (!lang) return undefined;
			cookie.set(cookieName, lang, {expires: cookieExpires});
			return {lang: lang};
		}
	});
	return {
		initialize: function () {
			if (instance) {
				return Promise.resolve(instance);
			}
			instance = new Translation({
				baseURI: 'locales'
			});
			return instance.setNamespace('nav').then(function () {
				return instance.addNamespace('signup');
			}).then(function () {
				var helper = instance.createHandlebarsHelper();
				Handlebars.registerHelper('i18n', helper);
				return model.initialState();
			}).then(function(state) {
				return instance.select(state.get('lang'));
			}).then(function() {
				return instance;
			});
		},
		select: function (lang) {
			return instance.select(lang).then(function () {
				return model.select(lang);
			});
		},
		subscribe: function(subscriber) {
			return model(subscriber);
		}
	};
});