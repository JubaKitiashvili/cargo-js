if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");

var Template = {};

Template.load = function (templateURL, handlebars) {
	handlebars = handlebars || Handlebars;
	return new Promise(function (resolve, reject) {
		superagent.get(templateURL).end(function (err, response) {
			if (err) {
				reject(new Error("Unable to load template from '" + templateURL + "': " + err));
				return;
			}
			var renderFn;
			try {
				var parser = new DOMParser();
				var dom = parser.parseFromString(response.text, "text/html");
				var template = $(dom).find('template').first();
				if (!template || !template.length) {
					reject(new Error("Template '" + templateURL + "' does not contain a <template> element in body."));
					return;
				}
				template = template.html().trim();
				renderFn = handlebars.compile(template);
			} catch (e) {
				reject(new Error("Unable to compile rendering function from template '" + templateURL + "': " + e));
				return;
			}
			
			var options = {};
			options.renderState = renderFn;
			var fnNames = ['attach', 'update', 'detach'];
			var callbacks = {};
			for (var idx = 0; idx < fnNames.length; idx++) {
				var fnName = fnNames[idx];
				try {
					var fnNode = $(dom).find("script." + fnName).first();
					if (fnNode.length > 0) {
						var scriptContent = fnNode.text();
						callbacks[fnName] = new Function("node", scriptContent);
					}
				} catch (e) {
					reject(new Error("Unable to install '" + fnName + "' function from template '" + templateURL + "': " + e));
					return;
				}
			}
			options.onAttach = callbacks.attach;
			options.onUpdate = callbacks.update;
			options.onDetach = callbacks.detach;
			resolve(options);
		})
	});
	
};

Template.compile = function (dom, options) {
	
	options = options || {};
	var handlebars = options.handlebars || Handlebars;
	var templateElement = dom.getElementsByTagName('template');
	var template;
	if (templateElement && templateElement.length) {
		templateElement = templateElement[0];
		var templateString = templateElement.innerHTML.trim();
		template = handlebars.precompile(templateString);
		template = "Handlebars.template(" + template + ")";
	} else {
		template = "undefined";
	}
	var scriptNames = ['attach', 'update', 'detach'];
	var scripts = {};
	_.each(scriptNames, function (scriptName) {
		var scriptElements = dom.getElementsByTagName('script');
		scripts[scriptName] = _.reduce(scriptElements, function (memo, scriptElement) {
			if (memo !== 'undefined') return memo;
			if (scriptElement.hasAttribute('class')) {
				var classAttr = scriptElement.getAttribute('class');
				if (_.contains(classAttr.split(/\s+/), scriptName)) {
					var scriptContent = scriptElement.innerHTML.trim();
					return "function(node) { " + scriptContent + "}";
				}
			}
			return memo;
		}, "undefined");
	});
	return "{ " +
		'"renderState":' + template + ", " +
		'"onAttach":' + scripts['attach'] + "," +
		'"onUpdate":' + scripts['update'] + "," +
		'"onDetach":' + scripts['detach'] +
		"}";
};