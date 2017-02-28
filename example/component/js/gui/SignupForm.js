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
				instance.submit = function() {
					var form = $('#sign-up-form')[0];
					// Validate form input and store content in local storage (e.g. cookie)
					// for later use in sign in form.
					var username = $("input[name=sign-up-username]", form).val();
					username = (username || "").trim();
					
					var password = $("input[name=sign-up-password]", form).val();
					password = (password || "").trim();

					var password2 = $("input[name=sign-up-password-confirm]", form).val();
					password2 = (password2 || "").trim();
					
					state = state.put('username', username).put('password', password).put('password2', password2);
					
					if ( !username || username === '') {
						state = state.put('error', 'ERR_USERNAME_EMPTY');
						instance.render(state);
						return false;
					}
					if ( !password || password === '') {
						state = state.put('error', 'ERR_PASSWORD_EMPTY');
						instance.render(state);
						return false;
					}
					if ( password.length < 6 ) {
						state = state.put('error', 'ERR_PASSWORD_INVALID');
						instance.render(state);
						return false;
					}
					if ( password !== password2 ) {
						state = state.put('error', 'ERR_PASSWORD_MISMATCH');
						instance.render(state);
						return false;
					}
					window.sessionStorage.setItem('username', username);
					window.sessionStorage.setItem('password', password);
					window.location = '#sign-in';
					return false;
				};
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