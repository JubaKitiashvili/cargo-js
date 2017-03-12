define(['Component', 'Template', 'model/BrowserLanguage', 'underscore'],
	function (Component, Template, BrowserLanguage, _) {
		
		var instance;
		var renderers = [];
		
		return {
			initialize: function () {
				if (instance) {
					return Promise.resolve(instance);
				}
				var promises = [
					Template.load("templates/MainMenuDesktop.html"),
					Template.load("templates/MainMenuMobile.html")
				];
				return Promise.all(promises).then(function (templates) {
					var i = 0;
					renderers.push(new Component(templates[i++]).attach('#main-menu-desktop'));
					renderers.push(new Component(templates[i++]).attach('#main-menu-mobile'));
					
					instance = {
						render: function (state) {
							return Promise.all(_.map(renderers, function (r) {
								return r.render(state);
							}));
						},
						detach: function () {
							_.each(renderers, function (r) {
								r.detach();
							});
						}
					};
					
					BrowserLanguage.subscribe(_.bind(instance.render, instance));
					instance.render({});
					return Promise.resolve(instance);
				});
			},
			show: function () {
				return instance.render({});
			}
		};
		
	});