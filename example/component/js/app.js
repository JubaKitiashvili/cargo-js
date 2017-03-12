requirejs.config({
	baseUrl: 'js',
	paths: {
		'cookie': '../../../bower_components/js-cookie/src/js.cookie',
		'domReady': '../../../bower_components/domReady/domReady',
		'morphdom': '../../../bower_components/morphdom/dist/morphdom-umd',
		'Handlebars': '../../../dist/dependencies/handlebars',
		'html2hscript': '../../../dist/dependencies/html2hscript',
		'superagent': '../../../dist/dependencies/superagent',
		'underscore': '../../../dist/dependencies/underscore',
		'virtualDom': '../../../dist/dependencies/virtual-dom',
		'Model': '../../../dist/model',
		'Translation': '../../../dist/translation',
		'Component': '../../../dist/component',
		'Template': '../../../dist/template.handlebars'
	},
	map: {
		'*': {
			'handlebars.runtime': 'Handlebars'
		}
	}
});

requirejs(['domReady',
	'model/BrowserLanguage', 'model/Router',
	'gui/LanguageMenu', 'gui/MainMenu',
	'gui/SignupForm', 'gui/SigninForm'
], main);

function main(domReady,
			  BrowserLanguage, Router,
			  LanguageMenu, MainMenu,
			  SignupForm, SigninForm) {
	domReady(function () {
		Promise.all([
			/* Initialize model */
			BrowserLanguage.initialize(),
			Router.initialize()
		]).then(function () {
			/* Initialize GUI components */
			return Promise.all([
				LanguageMenu.initialize(),
				MainMenu.initialize(),
				SignupForm.initialize(),
				SigninForm.initialize()
			]);
		}).catch(function (err) {
			console.log(err);
		});
	});
}