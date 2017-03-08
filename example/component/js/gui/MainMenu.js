define(['cargo.Component', 'model/BrowserLanguage', 'underscore'], function(Component, BrowserLanguage, _) {
	
	var instance;
	var renderers = [];
	
	return {
		initialize: function() {
			if ( instance ) {
				return Promise.resolve(instance);
			}
			var promises = [
				Component.load("templates/MainMenuDesktop.html"),
				Component.load("templates/MainMenuMobile.html")
			];
			return Promise.all(promises).then(function(components) {
				var i=0;
				renderers.push(components[i++].attach('#main-menu-desktop'));
				renderers.push(components[i++].attach('#main-menu-mobile'));
				
				instance = {
					render: function(state) {
						return Promise.all(_.map(renderers, function(r) {
							return r.render(state);
						}));
					},
					detach: function() {
						_.each(renderers, function(r) {
							r.detach();
						});
					}
				};
				
				BrowserLanguage.subscribe(_.bind(instance.render, instance));
				instance.render({});
				return Promise.resolve(instance);
			});
		},
		show: function() {
			return instance.render({});
		}
	};
	
});