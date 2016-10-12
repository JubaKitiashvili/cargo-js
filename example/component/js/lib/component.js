;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['cargo.Promise', 'cargo.Model', 'cargo.Translation', 'virtualDom', 'html2hscript', 'Handlebars', 'superagent'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('cargo.Promise'), require('cargo.Model'), require('cargo.Translation'), require('virtualDom'), require('html2hscript'), require('Handlebars'), require('superagent'));
    } else {
        root.cargo = root.cargo || {};
        root.cargo.Component = factory(root.cargo.Promise, root.cargo.Model, root.cargo.Translation, root.virtualDom, root.html2hscript, root.Handlebars, root.superagent);
    }
}(this, function(Promise, Model, Translation, virtualDom, html2hscript, Handlebars, superagent) {
var Component = function (templateURI, options) {
    'use strict';

    if (!Promise) throw new Error("cargo.Promise API is required.");
    if (!Model) throw new Error("cargo.Model API is required.");
    if (!Translation) throw new Error("cargo.Translation API is required.");
    if (!virtualDom) throw new Error("Virtual DOM required. (https://github.com/Matt-Esch/virtual-dom)");
    if (!html2hscript) throw new Error("Module html2hscript required.");
    if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
    if (!Handlebars) throw new Error("Handlebars is required. (https://github.com/wycats/handlebars.js/)");

    var $ = window.$;
    var h = virtualDom.h;

    options = options || {};

    var translation = options.translation;
    var handlebars = options.handlebars || Handlebars;

    var templateCache = undefined;

    this.attach = function (selector) {
        return _loadTemplate(templateURI, handlebars)
            .then(function(template) {
                var renderFn = _createRenderFn(selector, template, handlebars, translation);
                return Promise.resolve(renderFn)
            });
    };

    return this;

    function _loadTemplate(templateURL, handlebars) {
        if ( templateCache ) {
            return new Promise(function(resolve) {
                var result = {};
                result.template = handlebars.compile(templateCache.template);
                result.handlebars = handlebars;
                var fnNames = ['attach', 'update', 'detach'];
                _.each(fnNames, function(fnName) {
                    result[fnName] = templateCache[fnName];
                });
                resolve(result);
            });
        }
        return new Promise(function (resolve, reject) {
            superagent.get(templateURL).end(function (err, response) {
                if (err) {
                    reject("Unable to load template from '" + templateURL + "': " + err);
                    return;
                }
                var template;
                try {
                    var parser = new DOMParser();
                    var dom = parser.parseFromString(response.text, "text/html");
                    template = $(dom).find('template').first();
                    if (!template || !template.length) {
                        reject("Template '" + templateURL + "' does not contain a <template> element in body.");
                        return;
                    }
                    templateCache = {};
                    templateCache.template = template.html().trim();
                    template = handlebars.compile(templateCache.template);
                } catch (e) {
                    reject("Unable to compile rendering function from template '" + templateURL + "': " + e);
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
                        reject("Unable to install '" + fnName + "' function from template '" + templateURL + "': " + e);
                        return;
                    }
                }
                resolve(result);
            });
        });
    }

    function _createRenderFn(selector, template, handlebars, translation) {
        var selector;

        var target = undefined;
        var tree = undefined;

        var originalNodes = [];

        var templateFn = template.template;
        var attach = template.attach;
        var update = template.update;
        var detach = template.detach;

        var _detach = function () {
            if (target) {
                target.each(function (idx) {
                    try {
                        if (detach) {
                            detach(this);
                        }
                    } catch (e) {
                        // TODO: Send model into dead state, on errors in detach handler?
                    }
                    var orig = originalNodes[idx];
                    $(this).replaceWith(orig);
                });
                originalNodes = [];
                target = undefined;
                tree = undefined;
            }
        };

        var renderFn = function (state, translate) {
            var component = this;
            state = Model.state(state);
            if (state === undefined) {
                return Promise.resolve(state);
            }

            if (state instanceof Error) {
                // If the model is in dead state, re-attach the old nodes
                // and return a rejecting promise.
                //_detach();
                return Promise.reject(state);
            }
            if (!selector || ( target && target.length == 0 )) {
                // If we have no selector, the component has not been attached yet or
                // was recently detached.
                // If there are no target elements, there were no matching DOM elements when attaching.
                // In any of these cases, Skip rendering and just return a resolving promise.
                return Promise.resolve(state);
            }
            var html = templateFn(state.toJS());
            if (!html) {
                // If no html is returned, skip rendering and just return a resolving promise.
                return Promise.resolve(state);
            }

            var newTree = undefined;
            // TODO: Send the model in dead state on rendering errors?
            html2hscript(html, function (err, hscript) {
                newTree = eval(hscript);
                if (err) console.log("Rendering error: " + err);
            });
            if (!newTree) console.log("Rendering did not return a result.");
            if (tree === undefined) {
                // First rendering. Render new nodes, save and replace old nodes.
                var selection = $();
                originalNodes = [];
                $(selector).each(function () {
                    var newNode = virtualDom.create(newTree);
                    var oldNode = $(this);
                    try {
                        var id = oldNode.prop('id');
                        if (id) {
                            newNode.id = id;
                        }
                        originalNodes.push(oldNode);
                        oldNode.replaceWith(newNode);
                        attach(newNode);
                        selection = selection.add(newNode);
                    } catch (e) {
                        console.log("Error while calling attach() on component with selector: " + self.selector);
                    }
                    target = selection;
                    try {
                        update(this);
                    } catch (e) {
                        console.log("Error while calling update() on component with selector: " + self.selector);
                    }
                });
            } else if (target) {
                target.each(function () {
                    var patches = virtualDom.diff(tree, newTree);
                    virtualDom.patch(this, patches);
                    try {
                        update(this);
                    } catch (e) {
                        console.log("Error while calling update() on component with selector: " + self.selector);
                    }
                });
            }
            tree = newTree;
            return Promise.resolve(state);
        };
        renderFn.detach = _detach;
        return renderFn;
    }

};

    return Component;
}));
