define(['cargo.Model'], function (Model) {
	var instance;
	
	return {
		initialize: function () {
			if (instance) {
				return Promise.resolve(instance);
			}
			window.addEventListener("popstate", function() {
				var state = window.history.state;
				instance.select(window.location.hash);
			});
			instance = new Model({
				initialState: function () {
					return {target: window.location.hash};
				},
				select: function (target) {
					target = target || "sign-up";
					if ( target.startsWith('#') ) {
						target = target.substring(1);
					}
					return this.state().put("target", target);
				}
			});
			return Promise.resolve(instance);
		},
		get: function () {
			return instance;
		}
	};
	
});