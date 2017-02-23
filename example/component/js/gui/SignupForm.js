define(['cargo.Component', 'cargo.Model'], function(Component, Model) {
	
	var instance;
	var state = Model.state({
		hide: ''
	});
	
	return {
		initialize: function() {
			if ( instance ) return Promise.resolve(instance);
			return new Component("templates/Signup.html").attach("#sign-up").then(function(result) {
				instance = result;
				return instance;
			});
		},
		get: function() {
			return instance;
		},
		show: function() {
			instance.render(state.put('hide', ''));
		},
		hide: function() {
			instance.render(state.put('hide', 'hide'));
		},
		refresh: function() {
			instance.refresh();
		}
	};
	
});