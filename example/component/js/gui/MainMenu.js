define(['cargo.Component', 'model/BrowserLanguage', 'underscore'], function(Component, BrowserLanguage, _) {
	
	var instance;
	
	return {
		initialize: function() {
			if ( instance ) {
				return Promise.resolve(instance);
			}
			var promises = [
				new Component("templates/MainMenuDesktop.html").attach('#main-menu-desktop'),
				new Component("templates/MainMenuMobile.html").attach('#main-menu-mobile')
			];
			return Promise.all(promises).then(function(renderers) {
				instance = {
					render: function(state) {
						return Promise.all(_.map(renderers, function(r) {
							return r.render(state);
						}));
					},
					refresh: function() {
						return Promise.all(_.map(renderers, function(r) {
							return r.refresh();
						}));
					},
					detach: function() {
						_.each(renderers, function(r) {
							r.detach();
						});
					}
				};
				BrowserLanguage.subscribe(_.bind(instance.refresh, instance));
				instance.render({});
				return Promise.resolve(instance);
			});
		},
		show: function() {
			return instance.render({});
		}
	};
	
});