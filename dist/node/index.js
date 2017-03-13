var template = require('./cargo-template');
var component = require('./cargo-component');
var compileTemplate = require('./gulp-compile-template');
var model = require('./cargo-model');
var translation = require('./cargo-translation');

module.exports = {
	
	Template: template,
	compileTemplate: compileTemplate,
	Component: component,
	Model: model,
	Translation: translation
	
};
