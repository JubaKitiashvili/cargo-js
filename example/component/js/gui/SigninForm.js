define(['cargo.Component', 'cargo.Model',
		'Handlebars',
		'model/BrowserLanguage', 'model/Router',
		'../../templates/Signin', '../../templates/Signin.template'],
	function (Component, Model,
			  Handlebars,
			  BrowserLanguage, Router,
			  options) {
		
		var instance;
		var state = Model.state({
			hide: ''
		});
		
		return {
			
			initialize: function () {
				if (instance) return Promise.resolve(instance);
				options.template = Handlebars.templates['Signin.template.html'];
				var comp = new Component(options);
				instance = comp.attach('#sign-in');
				instance.submit = function () {
					var form = $('#sign-in-form')[0];
					// Validate form input and store content in local storage (e.g. cookie)
					// for later use in sign in form.
					var username = $("input[name=sign-in-username]", form).val();
					username = (username || "").trim();
					
					var password = $("input[name=sign-in-password]", form).val();
					password = (password || "").trim();
					
					state = state.put('username', username).put('password', password);
					
					if (!username || username === '') {
						state = state.put('error', 'ERR_USERNAME_EMPTY').remove('success');
						instance.render(state);
						return false;
					}
					if (!password || password === '') {
						state = state.put('error', 'ERR_PASSWORD_EMPTY').remove('success');
						instance.render(state);
						return false;
					}
					if (window.sessionStorage.getItem('username') !== username
						|| window.sessionStorage.getItem('password') !== password) {
						state = state.put('error', "ERR_LOGIN_FAILED").remove('success');
						instance.render(state);
						return false;
					}
					
					state = state.put('success', true).remove('error');
					instance.render(state);
					return false;
				};
				BrowserLanguage.subscribe(function () {
					instance.render(state);
				});
				Router.subscribe(function (routerState) {
					if (routerState.get('target') === 'sign-in') {
						state = state.put('hide', '');
					} else {
						state = state.put('hide', 'hide');
					}
					instance.render(state);
				});
				return Promise.resolve(instance);
			}
		};
		
		
	});