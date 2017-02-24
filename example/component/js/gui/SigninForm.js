define(['cargo.Component', 'cargo.Model', 'model/BrowserLanguage', '../../templates/Signin', '../../templates/Signin.template'], function (Component, Model, BrowserLanguage, options) {
	
	var instance;
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
					return resolve(instance);
				});
		},
		show: function () {
			if (instance)
				instance.render(state.put('hide', ''));
		},
		hide: function () {
			if (instance)
				instance.render(state.put('hide', 'hide'));
		}
		
		
	};
	
	
});