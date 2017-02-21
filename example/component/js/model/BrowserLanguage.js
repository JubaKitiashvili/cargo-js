define(['cargo.Model'], function (Model) {
	var instance;

	var actions = {
		initialState: function () {
			return {lang: 'en'};
		},
		select: function (lang) {
			return {lang: lang};
		}
	};

	var promise = new Promise(function(resolve) {
		instance = new Model(actions);
		resolve(instance);
	});
	return {
		initialize: function () {
			return promise;
		},
		get: function () {
			return instance;
		}
	}
});