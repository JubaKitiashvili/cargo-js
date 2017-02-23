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
	}
});

requirejs(['domReady',
	'model/BrowserLanguage', 'model/Router',
	'gui/LanguageMenu', 'gui/MainMenu',
	'gui/SignupForm'
], main);

function main(domReady,
			  BrowserLanguage, Router,
			  LanguageMenu, MainMenu,
			  SignupForm) {
	domReady(function () {
		Promise.all([
			/* Initialize model */
			BrowserLanguage.initialize(),
			Router.initialize()
		]).then(function () {
			/* Initialize components */
			return Promise.all([
				LanguageMenu.initialize(),
				MainMenu.initialize(),
				SignupForm.initialize()
			]);
		}).then(function () {
			/* Initial rendering */
			return Promise.all([
				LanguageMenu.show(),
				MainMenu.show(),
				SignupForm.show()
			])
		}).then(function(){
			/* Wire up Router */
			Router.get()(function(state) {
				var target = state.get('target') || 'sign-up';
				if ( target === 'sign-up') {
					SignupForm.show();
				} else {
					SignupForm.hide();
				}
			});
		}).then(function () {
			console.log('Ready.');
		}).catch(function (err) {
			console.log(err);
		});
	});
}