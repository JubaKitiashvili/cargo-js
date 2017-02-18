define(['cargo.Model'], function (Model) {
	var actions = {};
	actions.initialState = function () {
		return {lang: 'en'};
	};
	actions.select = function (lang) {
		return {lang: lang};
	};
	var instance = new Model(actions);
	return {
		get: function () {
			return instance;
		}
	}
});