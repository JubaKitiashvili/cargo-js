var Component = function(templateURI, options) {
	'use strict';
	
	if (!Promise) throw new Error("Promise API is required.");
	if (!Model) throw new Error("cargo.Model API is required.");
	if (!Translation) throw new Error("cargo.Translation API is required.");
	if (!virtualDom) throw new Error("Virtual DOM required. (https://github.com/Matt-Esch/virtual-dom)");
	if (!html2hscript) throw new Error("Module html2hscript required.");
	if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
	if (!Handlebars) throw new Error("Handlebars is required. (https://github.com/wycats/handlebars.js/)");
	if (!_) throw new Error("underscore is required. (https://github.com/jashkenas/underscore)");
	
	var $ = window.$;
	
	options = options || {};
	
	var handlebars = options.handlebars || Handlebars;
	
	var templateCache = undefined;
	
	this.attach = function (selector) {
		if (!selector) {
			return Promise.reject(new Error('Need a jquery selector as first argument to attach().'));
		}
		var nodes = $(selector);
		var originalNodes = {};
		if (!nodes || nodes.length == 0) {
			return Promise.reject(new Error('Selector ' + selector + ' does not select any actual DOM nodes.'));
		}
		try {
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
		} catch (e) {
			return Promise.reject(e);
		}
		return _loadTemplate(templateURI, handlebars)
			.then(function (template) {
				var renderer = new Renderer(selector, originalNodes, template);
				return Promise.resolve(renderer)
			});
	};
	
	return this;
	
	function _loadTemplate(templateURL, handlebars) {
		if (templateCache) {
			return new Promise(function (resolve) {
				var result = {};
				result.template = handlebars.compile(templateCache.template);
				result.handlebars = handlebars;
				var fnNames = ['attach', 'update', 'detach'];
				_.each(fnNames, function (fnName) {
					result[fnName] = templateCache[fnName];
				});
				resolve(result);
			});
		}
		return new Promise(function (resolve, reject) {
			superagent.get(templateURL).end(function (err, response) {
				if (err) {
					reject(new Error("Unable to load template from '" + templateURL + "': " + err));
					return;
				}
				var template;
				try {
					var parser = new DOMParser();
					var dom = parser.parseFromString(response.text, "text/html");
					template = $(dom).find('template').first();
					if (!template || !template.length) {
						reject(new Error("Template '" + templateURL + "' does not contain a <template> element in body."));
						return;
					}
					templateCache = {};
					templateCache.template = template.html().trim();
					template = handlebars.compile(templateCache.template);
				} catch (e) {
					reject(new Error("Unable to compile rendering function from template '" + templateURL + "': " + e));
					return;
				}
				var result = {};
				result.template = template;
				result.handlebars = handlebars;
				var fnNames = ['attach', 'update', 'detach'];
				for (var idx = 0; idx < fnNames.length; idx++) {
					var fnName = fnNames[idx];
					try {
						var fnNode = $(dom).find("script." + fnName).first();
						if (fnNode.length > 0) {
							var scriptContent = fnNode.text();
							templateCache[fnName] = result[fnName] = new Function("node", scriptContent);
						} else {
							templateCache[fnName] = result[fnName] = new Function("");
						}
					} catch (e) {
						reject(new Error("Unable to install '" + fnName + "' function from template '" + templateURL + "': " + e));
						return;
					}
				}
				resolve(result);
			});
		});
	}
	
};
Component.prototype.constructor = Component;

var Renderer = function(selector, originalNodes, template) {
	var h = virtualDom.h;
	
	var target = $();
	var tree = undefined;
	
	var templateFn = template.template;
	var attach = template.attach;
	var update = template.update;
	var detach = template.detach;
	
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
		tree = undefined;
	};
	
	this.render = function (state) {
		state = Model.state(state);
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
		this.state = state.toJS();
		var html = templateFn(this.state);
		if (!html) {
			// If no html is returned, skip rendering and just return a resolving promise.
			return Promise.resolve(state);
		}
		
		var newTree = undefined;
		html2hscript(html, function (err, hscript) {
			newTree = eval(hscript);
			if (err) console.log("Rendering error: " + err);
		});
		if (!newTree) console.log("Rendering did not return a result.");
		if (tree === undefined) {
			// First rendering. Render new nodes, save and replace old nodes.
			_.each(originalNodes, function (oldNode, cargoId) {
				var newNode = virtualDom.create(newTree);
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
					console.log("Error while calling attach() on component with selector: " + self.selector);
				}
				try {
					update.call(this, newNode);
				} catch (e) {
					console.log("Error while calling update() on component with selector: " + self.selector);
				}
			}, this);
		} else {
			target.each(function () {
				var patches = virtualDom.diff(tree, newTree);
				virtualDom.patch(this, patches);
				try {
					update.call(this);
				} catch (e) {
					console.log("Error while calling update() on component with selector: " + self.selector);
				}
			});
		}
		tree = newTree;
		return Promise.resolve(state);
	};
	
	this.refresh = function() {
		return this.render(this.state);
	};
};
Renderer.prototype.constructor = Renderer;
Component.Renderer = Renderer;