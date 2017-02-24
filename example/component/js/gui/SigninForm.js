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
						BrowserLanguage.subscribe(_.bind(instance.refresh, instance));
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