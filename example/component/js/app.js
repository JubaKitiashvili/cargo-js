requirejs.config({
	baseUrl: 'js',
	paths: {
		'domReady': '../../../bower_components/domReady/domReady',
		'handlebars': '../../../dist/dependencies/handlebars',
		'superagent': '../../../dist/dependencies/superagent',
		'underscore': '../../../dist/dependencies/underscore',
		'cargo.Model': '../../../dist/model',
		'cargo.Translation': '../../../dist/translation'
	}
});

requirejs(['domReady', 'model/browserLanguage', 'model/i18n'], function (domReady, BrowserLanguage, i18n) {
	domReady(function() {
		var appState = {};
		appState.browserLanguage = BrowserLanguage.get();
		i18n.get().then(function(translation) {
			appState.translation = translation;
			appState.browserLanguage(function(state) {
				appState.translation.setLanguage(state.lang);
			});
			console.log('Ready.');
		});
	});
});
