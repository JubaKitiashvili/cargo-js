define(['cargo.Component', 'cargo.Model',
		'model/BrowserLanguage', 'model/Router',
		'../../templates/Signin', '../../templates/Signin.template'],
	function (Component, Model,
			  BrowserLanguage, Router,
			  options) {
		
		var instance;
		var state = Model.state({
			hide: ''
		});
		
		return {
			
			initialize: function () {
				if (instance) return Promise.resolve(instance);
				new Component("Signin.template.html", options).attach('#sign-in')
					.then(function (result) {
						instance = result;
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
						return resolve(instance);
					});
			}
		};
		
		
	});