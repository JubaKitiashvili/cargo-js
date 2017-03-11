'use strict';

var Stream = require('stream');
var jsdom = require('jsdom');
var Handlebars = require('Handlebars');
var path = require('path');
var camelcase = require('uppercamelcase');
var umdify = require('libumd');

function compile(umdOptions) {
	
	umdOptions = umdOptions || {};
	
	var stream = new Stream.Transform({objectMode: true});
	var Component = umdOptions.Component || require('cargo.Component');
	
	stream._transform = function (file, _unused_, callback) {
		
		var contents;
		if (file.isStream()) {
			contents = "";
			var chunk;
			while ((chunk = file.contents.read()) != null) {
				contents += chunk.toString();
			}
		} else if (file.isBuffer()) {
			contents = file.contents.toString();
		} else {
			contents = "<html></html>";
		}
		jsdom.env(contents, function (err, window) {
			if (err) {
				return callback(new Error('Unable to compile cargo template from ' + file.path + ': ' + err), null);
			}
			try {
				var compileOptions = {};
				compileOptions.handlebars = Handlebars;
				var compiled = Component.compile(window.document, compileOptions);
				var parts = path.parse(file.path);
				umdOptions.globalAlias = umdOptions.globalAlias || camelcase(parts.name) || "";
				compiled = "return " + compiled + ";";
				compiled = umdify(compiled, umdOptions);
				file.contents = Buffer.from(compiled);
				return callback(null, file);
			} catch (err) {
				console.log(err);
				return callback(new Error('Unable to compile cargo template from ' + file.path + ': ' + err), null);
			}
		});
		
	};
	
	stream._flush = function (callback) {
		callback();
	};
	return stream;
}

module.exports = compile;