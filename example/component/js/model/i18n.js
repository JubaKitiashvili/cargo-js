define(['cargo.Translation'], function (Translation) {
	var instance;
	return {
		get: function () {
			if (instance) {
				return Promise.resolve(instance);
			}
			instance = new Translation({
				baseURI: 'locales'
			});
			return instance.setNamespace('nav').then(function() {
				return instance;
			});
		}
	};
});