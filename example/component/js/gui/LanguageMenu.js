define(['cargo.Component', 'model/BrowserLanguage'], function (Component, BrowserLanguage) {
	var instance;

	return {
		initialize: function () {
			if (instance) return Promise.resolve(instance);
			return Component.load("templates/LanguageMenu.html").then(function(comp) {
				instance = comp.attach('#language-menu');
				instance.select = function (lang) {
					if (!lang) return;
					BrowserLanguage.select(lang);
				};
				return instance.render({});
			});
		},
		show: function() {
			if ( instance )
				instance.render({});
		},
		select: function(lang) {
			if ( instance && instance.select )
				instance.select(lang);
		}
	};
});