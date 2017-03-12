define(['Handlebars', 'Component', 'model/BrowserLanguage', '../../templates/LanguageMenu'],
	function (Handlebars, Component, BrowserLanguage, template) {
		var instance;
		
		return {
			initialize: function () {
				if (instance) return Promise.resolve(instance);
				instance = new Component(template).attach('#language-menu');
				instance.select = function (lang) {
					if (!lang) return;
					BrowserLanguage.select(lang);
				};
				return instance.render({});
			},
			show: function () {
				if (instance)
					instance.render({});
			},
			select: function (lang) {
				if (instance && instance.select)
					instance.select(lang);
			}
		};
	});