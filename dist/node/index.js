var template = require('./cargo-template');
var component = require('./cargo-component');
var templateCompiler = require('./gulp-template-compiler');
var model = require('./cargo-model');
var translation = require('./cargo-translation');

module.exports = {
	
	Template: template,
	templateCompiler: templateCompiler,
	Component: component,
	Model: model,
	Translation: translation
	
};
