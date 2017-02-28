define([], function(){
	return {
		attach: function(node) {
			var form = $(node).find('form');
			var renderer = this;
			form.on('submit',  function() {
				return renderer.submit();
			});
		},
		update: function() {
			Materialize.updateTextFields();
		}
	};
});