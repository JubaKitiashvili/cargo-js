define(['cargo.Component', 'cargo.Model',
	'model/BrowserLanguage', 'model/Router'],
	function(Component, Model, BrowserLanguage, Router) {
	
	var instance;
	var state = Model.state({
		hide: ''
	});
	
	return {
		initialize: function() {
			if ( instance ) return Promise.resolve(instance);
			return new Component("templates/Signup.html").attach("#sign-up").then(function(result) {
				instance = result;
				BrowserLanguage.subscribe(function() {
					instance.render(state);
				});
				Router.subscribe(function(routerState) {
					if ( routerState.get('target') === 'sign-up' ) {
						state = state.put('hide', '');
						instance.render(state);
					}
					if ( routerState.get('target') === 'sign-in' ) {
						state = state.put('hide', 'hide');
						instance.render(state);
					}
				});
				return instance;
			});
		}
	};
	
});