define(['cargo.Translation'], function (Translation) {
	var instance;
	return {
		initialize: function() {
			if ( instance ) {
				return Promise.resolve(instance);
			}
			instance = new Translation({
				baseURI: 'locales'
			});
			return instance.setNamespace('nav').then(function(x) {
				return instance;
			});
		},
		get: function () {
			return instance;
		}
	};
});