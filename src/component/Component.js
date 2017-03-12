var Component = function (template) {
	'use strict';
	
	if (!Promise) throw new Error("Promise API is required.");
	if (!morphdom) throw new Error("morphdom is required. (https://github.com/patrick-steele-idem/morphdom)");

	var $ = window.$;
	
	template = template || {};
	
	var renderFn = template.renderState || function (state) {
			return "<pre>" + JSON.stringify(state, undefined, ' ') + "</pre>";
		};
	
	var attachFn = template.onAttach || function () {
		};
	var updateFn = template.onUpdate || function () {
		};
	var detachFn = template.onDetach || function () {
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
		return new Renderer(selector, originalNodes, renderFn, attachFn, updateFn, detachFn);
	};
	
	return this;
};

Component.prototype.constructor = Component;

var Renderer = function (selector, originalNodes, renderFn, onAttach, onUpdate, onDetach) {
	
	var target = $();
	var firstRender = true;
	
	this.detach = function () {
		_.each(originalNodes, function (orig, cargoId) {
			orig.removeAttribute('x-cargo-id');
			if (target && target.length) {
				target.each(function () {
					if (this.getAttribute('x-cargo-id') === cargoId) {
						try {
							onDetach && onDetach(this);
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
		var html = renderFn(state);
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
					onAttach.call(this, newNode);
					target = target.add(newNode);
				} catch (e) {
					console.log("Error while calling attach() on component with selector: " + selector + ": " + e);
				}
				try {
					onUpdate.call(this, newNode);
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
					onUpdate.call(this);
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