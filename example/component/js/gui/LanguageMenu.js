define(['cargo.Component', 'model/BrowserLanguage'], function (Component, BrowserLanguage) {
	var instance;

	return {
		initialize: function () {
			if (instance) return Promise.resolve(instance);
			new Component("templates/LanguageMenu.html")
				.attach('#language-menu')
				.then(function (renderer) {
					instance = renderer;
					return renderer.render({}).then(function() {
						instance.select = function (lang) {
							if (!lang) return;
							BrowserLanguage.select(lang);
						};
						return instance;
					});
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