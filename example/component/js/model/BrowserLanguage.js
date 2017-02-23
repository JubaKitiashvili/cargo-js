define(['cargo.Model', 'cookie'], function (Model, cookie) {
	var instance;

	var cookieName = 'cargo-js-example-lang';
	var cookieExpires = 7;
	
	var actions = {
		initialState: function () {
			var lang = cookie.get(cookieName);
			cookie.set(cookieName, lang, { expires: cookieExpires });
			return {lang: lang};
		},
		select: function (lang) {
			if ( !lang ) return undefined;
			cookie.set(cookieName, lang, { expires: cookieExpires });
			return {lang: lang};
		}
	};

	return {
		initialize: function () {
			if ( instance ) { return Promise.resolve(instance); }
			return new Promise(function(resolve) {
				instance = new Model(actions);
				instance.initialState();
				resolve(instance);
			});
		},
		get: function () {
			return instance;
		}
	}
});