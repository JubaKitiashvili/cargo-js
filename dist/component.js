;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['Handlebars', 'morphdom', 'superagent', 'underscore'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('Handlebars'), require('morphdom'), require('superagent'), require('underscore'));
    } else {
        root.cargo = root.cargo || {};
        root.cargo.Component = factory(root.Handlebars, root.morphdom, root.superagent, root.underscore);
    }
}(this, function(Handlebars, morphdom, superagent, _) {
var Component = function (options) {
	'use strict';
	
	if (!Promise) throw new Error("Promise API is required.");
	if (!morphdom) throw new Error("morphdom is required. (https://github.com/patrick-steele-idem/morphdom)");
	if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
	if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");
	
	var $ = window.$;
	
	options = options || {};
	
	var templateFn = options.template || function (state) {
			return "<pre>" + JSON.stringify(state, undefined, ' ') + "</pre>";
		};
	
	var attachFn = options.attach || function () {
		};
	var updateFn = options.update || function () {
		};
	var detachFn = options.detach || function () {
		};
	
	this.attach = function (selector) {
		if (!selector) {
			throw new Error('Need a jquery selector as first argument to attach().');
		}
		var nodes = $(selector);
		var originalNodes = {};
		if (!nodes || nodes.length == 0) {
			throw new Error('Selector ' + selector + ' does not select any actual DOM nodes.');
		}
		nodes.each(function (idx, node) {
			var $node = $(node);
			var id = $node.attr('x-cargo-id');
			if (id) {
				throw new Error('Node ' + node.toString() + ' selected by ' + selector + ' has already been attached to a component.');
			}
			var cargoId = _.uniqueId();
			$node.attr('x-cargo-id', cargoId);
			originalNodes[cargoId] = node;
		});
		return new Renderer(selector, originalNodes, templateFn, attachFn, updateFn, detachFn);
	};
	
	return this;
};

Component.prototype.constructor = Component;

Component.load = function (templateURL, handlebars) {
	handlebars = handlebars || Handlebars;
	return new Promise(function (resolve, reject) {
		superagent.get(templateURL).end(function (err, response) {
			if (err) {
				reject(new Error("Unable to load template from '" + templateURL + "': " + err));
				return;
			}
			var templateFn;
			try {
				var parser = new DOMParser();
				var dom = parser.parseFromString(response.text, "text/html");
				var template = $(dom).find('template').first();
				if (!template || !template.length) {
					reject(new Error("Template '" + templateURL + "' does not contain a <template> element in body."));
					return;
				}
				template = template.html().trim();
				templateFn = handlebars.compile(template);
			} catch (e) {
				reject(new Error("Unable to compile rendering function from template '" + templateURL + "': " + e));
				return;
			}
			
			var options = {};
			options.template = templateFn;
			var fnNames = ['attach', 'update', 'detach'];
			for (var idx = 0; idx < fnNames.length; idx++) {
				var fnName = fnNames[idx];
				try {
					var fnNode = $(dom).find("script." + fnName).first();
					if (fnNode.length > 0) {
						var scriptContent = fnNode.text();
						options[fnName] = new Function("node", scriptContent);
					}
				} catch (e) {
					reject(new Error("Unable to install '" + fnName + "' function from template '" + templateURL + "': " + e));
					return;
				}
			}
			resolve(new Component(options));
		})
	});
	
};

Component.compile = function (dom, options) {
	
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
		'"template":' + template + ", " +
		'"attach":' + scripts['attach'] + "," +
		'"update":' + scripts['update'] + "," +
		'"detach":' + scripts['detach'] +
		"}";
};

var Renderer = function (selector, originalNodes, template, attach, update, detach) {
	
	var target = $();
	var firstRender = true;
	
	this.detach = function () {
		_.each(originalNodes, function (orig, cargoId) {
			orig.removeAttribute('x-cargo-id');
			if (target && target.length) {
				target.each(function () {
					if (this.getAttribute('x-cargo-id') === cargoId) {
						try {
							detach && detach(this);
						} catch (e) {
						}
						$(this).replaceWith(orig);
					}
				});
			}
		});
		originalNodes = {};
		target = $();
		firstRender = true;
	};
	
	this.render = function (state) {
		if (state === undefined) {
			return Promise.resolve(state);
		}
		
		if (state instanceof Error) {
			return Promise.reject(state);
		}
		if (!selector || !_.keys(originalNodes).length) {
			// If we have no selector, the component has not been attached yet or
			// was recently detached.
			// If there are no target elements, there were no matching DOM elements when attaching.
			// In any of these cases, Skip rendering and just return a resolving promise.
			return Promise.resolve(state);
		}
		if (state.toJS && typeof state.toJS === 'function') {
			state = state.toJS();
		}
		var html = template(state);
		if (!html) {
			// If no html is returned, skip rendering and just return a resolving promise.
			return Promise.resolve(state);
		}
		
		if (firstRender) {
			// First rendering. Render new nodes, save and replace old nodes.
			firstRender = false;
			_.each(originalNodes, function (oldNode, cargoId) {
				var $nodes = $.parseHTML(html);
				if (!$nodes || !$nodes.length) return;
				var newNode = $nodes[0];
				var $oldNode = $(oldNode);
				try {
					var id = $oldNode.prop('id');
					if (id) {
						newNode.id = id;
					}
					newNode.setAttribute('x-cargo-id', cargoId);
					$oldNode.replaceWith(newNode);
					attach.call(this, newNode);
					target = target.add(newNode);
				} catch (e) {
					console.log("Error while calling attach() on component with selector: " + selector + ": " + e);
				}
				try {
					update.call(this, newNode);
				} catch (e) {
					console.log("Error while calling update() on component with selector: " + selector + ": " + e);
				}
			}, this);
		} else {
			target.each(function () {
				var id = this.id;
				var cargoId = this.getAttribute('x-cargo-id');
				morphdom(this, html);
				this.id = id;
				this.setAttribute('x-cargo-id', cargoId);
				try {
					update.call(this);
				} catch (e) {
					console.log("Error while calling update() on component with selector: " + selector + ": " + e);
				}
			});
		}
		return Promise.resolve(state);
	};
	
};
Renderer.prototype.constructor = Renderer;

Component.Renderer = Renderer;
    return Component;
}));
