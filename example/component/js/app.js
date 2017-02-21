requirejs.config({
	baseUrl: 'js',
	paths: {
		'cookie': '../../../bower_components/js-cookie/src/js.cookie',
		'domReady': '../../../bower_components/domReady/domReady',
		'Handlebars': '../../../dist/dependencies/handlebars',
		'html2hscript': '../../../dist/dependencies/html2hscript',
		'superagent': '../../../dist/dependencies/superagent',
		'underscore': '../../../dist/dependencies/underscore',
		'virtualDom': '../../../dist/dependencies/virtual-dom',
		'cargo.Model': '../../../dist/model',
		'cargo.Translation': '../../../dist/translation',
		'cargo.Component': '../../../dist/component'
	},
});

requirejs(['domReady',
	'model/BrowserLanguage', 'model/Translation',
	'model/Router',
		'gui/LanguageMenu', 'gui/MainMenu'], main);

function main(domReady, BrowserLanguage, Translation,
			  Router,
			  LanguageMenu, MainMenu) {
	domReady(function () {
		Promise.all([
			/* Initialize model */
			BrowserLanguage.initialize(),
			Translation.initialize(),
			Router.initialize()
		]).then(function () {
			Router.get()(function(state) {
				console.log(JSON.stringify(state.toJS()));
			});
			/* Initialize components */
			return Promise.all([
				LanguageMenu.initialize(),
				MainMenu.initialize()
			]);
		}).then(function() {
			/* Initial rendering */
			return Promise.all([
				LanguageMenu.get().render({}),
				MainMenu.get().render({})
			])
		}).then(function () {
			/* Wire up I18N support. */
			BrowserLanguage.get()(function(state) {
				var lang = state.get('lang');
				Translation.get().select(lang).then(function() {
					LanguageMenu.get().refresh();
					MainMenu.get().refresh();
				});
			});
			console.log('Ready.');
		}).catch(function (err) {
			console.log(err);
		});
	});
}