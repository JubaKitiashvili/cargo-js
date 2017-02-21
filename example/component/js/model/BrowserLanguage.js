define(['cargo.Model', 'cookie'], function (Model, cookie) {
	var instance;

	var cookieName = 'cargo-js-example-lang';
	
	var actions = {
		initialState: function () {
			var lang = cookie.get(cookieName) || "en";
			cookie.set(cookieName, lang);
			return {lang: lang};
		},
		select: function (lang) {
			if ( !lang ) return undefined;
			cookie.set(cookieName, lang);
			return {lang: lang};
		}
	};

	var promise = new Promise(function(resolve) {
		instance = new Model(actions);
		instance.initialState();
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