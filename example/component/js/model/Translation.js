define(['cargo.Translation', 'Handlebars'], function (Translation, Handlebars) {
	var instance;
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
				return instance;
			});
			
		}, get: function () {
			return instance;
		}
	};
});