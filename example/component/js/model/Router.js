define(['cargo.Model'], function (Model) {
	var instance;
	
	function _normalize(target) {
		target = target || "sign-up";
		if ( target.startsWith('#') ) {
			target = target.substring(1);
		}
		return target;
	}
	
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
					return {target: _normalize(window.location.hash)};
				},
				select: function (target) {
					return this.state().put("target", _normalize(target));
				}
			});
			instance.initialState();
			return Promise.resolve(instance);
		},
		subscribe: function(subscriber) {
			return instance(subscriber);
		}
	};
	
});