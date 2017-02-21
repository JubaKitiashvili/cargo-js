requirejs.config({
	baseUrl: 'js',
	paths: {
		'domReady': '../../../bower_components/domReady/domReady',
		'Handlebars': '../../../dist/dependencies/handlebars',
		'html2hscript': '../../../dist/dependencies/html2hscript',
		'superagent': '../../../dist/dependencies/superagent',
		'underscore': '../../../dist/dependencies/underscore',
		'virtualDom': '../../../dist/dependencies/virtual-dom',
		'cargo.Model': '../../../dist/model',
		'cargo.Translation': '../../../dist/translation',
		'cargo.Component': '../../../dist/component'
	}
});

requirejs(['domReady',
	'model/BrowserLanguage', 'model/Translation',
		'gui/LanguageMenu'], main);

function main(domReady, BrowserLanguage, Translation,
			  LanguageMenu) {
	domReady(function () {
		Promise.all([
			/* Initialize model */
			BrowserLanguage.initialize(),
			Translation.initialize()
		]).then(function () {
			/* Initialize components */
			return Promise.all([
				LanguageMenu.initialize()
			]);
		}).then(function () {
			/* Wire up I18N support. */
			BrowserLanguage.get()(function(state) {
				var lang = state.get('lang');
				Translation.get().select(lang).then(function() {
					LanguageMenu.get().refresh();
				});
			});
			console.log('Ready.');
		}).catch(function (err) {
			console.log(err);
		});
	});
}