define(['cargo.Component', 'model/BrowserLanguage'], function (Component, BrowserLanguage) {
	var instance;
	var initialPromise;
	return {
		initialize: function () {
			if (instance) return Promise.resolve(instance);
			new Component("js/gui/LanguageMenu.html")
				.attach('#language-menu')
				.then(function (renderer) {
					instance = renderer;
					instance.select = function (lang) {
						if (!lang) return;
						BrowserLanguage.get().select(lang);
					};
					return renderer.render({}).then(function() {
						return instance;
					});
				});
		},
		get: function () {
			return instance;
		}
	};
});