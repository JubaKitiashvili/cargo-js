define(['Handlebars', 'cargo.Component', 'model/BrowserLanguage', '../../templates/LanguageMenu'], function (Handlebars, Component, BrowserLanguage, Template) {
	var instance;
	
	return {
		initialize: function () {
			if (instance) return Promise.resolve(instance);
			var options = Template;
			options.template = Handlebars.template(options.template);
			instance = new Component(options).attach('#language-menu');
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