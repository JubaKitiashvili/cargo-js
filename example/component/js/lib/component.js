;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['cargo.Promise', 'cargo.Model', 'virtualDom', 'html2hscript', 'Handlebars', 'superagent'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('cargo.Promise'), require('cargo.Model'), require('virtualDom'), require('html2hscript'), require('Handlebars'), require('superagent'));
    } else {
        root.cargo = root.cargo || {};
        root.cargo.Component = factory(root.cargo.Promise, root.cargo.Model, root.virtualDom, root.html2hscript, root.Handlebars, root.superagent);
    }
}(this, function(Promise, Model, virtualDom, html2hscript, Handlebars, superagent) {
/**
 * Defines a constructor function for a Component builder instance. The builder instance
 * collect the configuration of the component and finally creates an instance of the component.
 *
 * Options is an object and optional. All options are availble through corresponding builder
 * configuration methods.
 *
 * Available options are:
 *
 * actions - Defines actions that can be performed on the component (see cargo.Model.js)
 * subscriptions - An array of objects { model: ..., callback: ... }
 * template - An object of { template: ..., attach: ..., update: ..., detach: ... }
 *
 * @param options
 * @constructor
 *
 */
var Component = function (options) {
    'use strict';
    var $ = window.$;

    if (!Promise) throw new Error("cargo.Promise API is required.");
    if (!Model) throw new Error("cargo.Model API is required.");
    if (!virtualDom) throw new Error("Virtual DOM required. (https://github.com/Matt-Esch/virtual-dom)");
    if (!html2hscript) throw new Error("Module html2hscript required.");
    if (!superagent) throw new Error("superagent is required. (https://github.com/visionmedia/superagent)");
    if (!Handlebars) throw new Error("Handlebars is required. (https://github.com/wycats/handlebars.js/)");

    var h = virtualDom.h;

    var Renderer = function (selector, model, innerFns, subscriptions) {
        this.selector = selector;
        this.attach = innerFns.attach.bind(model);
        this.update = innerFns.update.bind(model);
        this.detach = innerFns.detach.bind(model);
        this.template = innerFns.template;

        this.isDestroyed = false;
        this.target = undefined;
        this.originalNodes = [];

        this.tree = undefined;
        var render = function (state) {
            var self = this;
            if ( self.isDestroyed ) {
                // Component is in dead state. Skip rendering.
                return;
            }
            if (self.target && !self.target.length) {
                // We have tried to attach but there were no target elements. Skip rendering.
                return;
            }
            if ( state instanceof Error ) {
                // Component just entered the dead state. Destroy and skip rendering.
                self.destroy();
                return;
            }
            var html = self.template(state);
            if (!html) {
                // If no html is returned, leave everything untouched. Maybe later...
                return;
            }

            var newTree = undefined;
            html2hscript(html, function (err, hscript) {
                newTree = eval(hscript);
                if (err) console.log("Rendering error: " + err);

            });
            if (!newTree) console.log("Rendering did not return a result.");
            if (self.tree === undefined) {
                // First rendering. Render new nodes, save and replace old nodes.
                var selection = $();
                self.target = $(selector);
                self.target.each(function () {
                    var newNode = virtualDom.create(newTree);
                    var oldNode = $(this);
                    try {
                        var id = oldNode.prop('id');
                        if (id) {
                            newNode.id = id;
                        }
                        self.originalNodes.push(oldNode);
                        oldNode.replaceWith(newNode);
                        self.attach(newNode);
                        selection = selection.add(newNode);
                    } catch (e) {
                        console.log("Error while calling attach() on component with selector: " + self.selector);
                    }
                    self.target = selection;
                    try {
                        self.update(this);
                    } catch (e) {
                        console.log("Error while calling update() on component with selector: " + self.selector);
                    }
                });
            } else if (self.target) {
                self.target.each(function () {
                    var patches = virtualDom.diff(self.tree, newTree);
                    virtualDom.patch(this, patches);
                    try {
                        self.update(this);
                    } catch (e) {
                        console.log("Error while calling update() on component with selector: " + self.selector);
                    }
                });
            }
            self.tree = newTree;
        };
        render = render.bind(this);
        this.unsubscribes = [];
        this.unsubscribes.push(model(render));
        for (var idx = 0; idx < subscriptions.length; idx++) {
            var subscr = subscriptions[idx];
            var stateFn = subscr.callback.bind(model);
            this.unsubscribes.push(subscr.model(stateFn));
        }
        this.destroy = (function() {
            var self = this;
            self.isDestroyed = true;
            var unsubscribes = self.unsubscribes || [];
            for ( var idx=0; idx<unsubscribes.length; idx++) {
                try {
                    unsubscribes[idx]();
                } catch (e) {}
            }
            self.target.each(function(idx) {
                try {
                    self.detach(this);
                } catch (e) {}
                var orig = self.originalNodes[idx];
                $(this).replaceWith(orig);
            });
        }).bind(this);
    };

    var _defaultTemplate = {
        attach: function () {
        },
        detach: function () {
        },
        update: function () {
        },
        template: function (state) {
            return '<pre class="_componentState">' + JSON.stringify(state, null, '  ') + '</pre>';
        }
    };

    var defaults = {
        template: _defaultTemplate,
        actions: {},
        subscriptions: []
    };
    options = options || {};
    this.options = {};
    for (var prop in defaults) {
        if (!defaults.hasOwnProperty(prop)) {
            continue;
        }
        this.options[prop] = options.hasOwnProperty(prop) ? options[prop] : defaults[prop];
    }

    /**
     *
     * Defines the template rendering function. Can either be a function or an HTML-String.
     * If a function is passed, the function is called on state changes with the current
     * component state as first argument.
     *
     * @param templateFn
     * @returns {Component}
     */
    this.withTemplate = function (templateFn) {
        var t = {};
        for (var fn in _defaultTemplate) {
            if (!_defaultTemplate.hasOwnProperty(fn))
                continue;
            t[fn] = _defaultTemplate[fn];
        }
        if (!templateFn) {
            this.options.template = t;
        } else if (typeof templateFn === 'function') {
            t.template = templateFn;
            var callbacks = ['attach', 'update', 'detach'];
            for (var idx = 0; idx < callbacks.length; idx++) {
                var fnName = callbacks[idx];
                if (!templateFn.hasOwnProperty(fnName) || typeof templateFn[fnName] !== 'function')
                    continue;
                t[fnName] = templateFn[fnName];
            }
        }
        else if (templateFn.toString().trim().charAt(0) == '<') {
            var html = templateFn.toString().trim();
            t.template = function () {
                return html;
            };
        }
        this.options.template = t;
        return this;
    };

    /**
     * Subscribes this component to a model. The callback is called on state changes of the model with the new
     * state as the first argument. The callback must return the current state of the component which is then
     * used for rendering with the template function.
     *
     * @param model
     * @param callback
     * @returns {Component}
     */
    this.subscribe = function (model, callback) {
        if (!model || typeof model !== 'function')
            throw new Error("Parameter #1 (model) is required and needs to be a function.");

        if (!callback) {
            callback = function (state) {
                return state;
            };
        } else if (typeof callback !== 'function') {
            throw new Error("Parameter #2 (callback) needs to be a function.");
        }
        this.options.subscriptions.push({callback: callback, model: model});
        return this;
    };

    /**
     * Defines a model for the component. Parameter "actions" is an object containing actions that
     * can be performed an the component.
     *
     * @param actions
     * @returns {Component}
     */
    this.withActions = function (actions) {
        if (!actions) {
            throw new Error("Parameter #1 (actions) is required.");
        }
        for (var name in actions) {
            if (!actions.hasOwnProperty(name)) continue;
            this.options.actions[name] = actions[name];
        }
        return this;
    };

    /**
     * Adds a new action to the component's model.
     *
     * @param name
     * @param action
     * @returns {Component}
     */
    this.addAction = function (name, action) {
        if (!name) {
            throw new Error("Parameter #1 (name) is required.");
        }
        if (!action) {
            return;
        }
        if (typeof action !== 'function') {
            throw new Error("Parameter #2 (action) needs to be a function.");
        }
        this.options.actions[name] = action;
        return this;
    };

    /**
     * The actual builder function. The selector parameter is a jquery selector which selects the target
     * element in the DOM tree.
     *
     * @param selector
     * @returns {Model}
     */
    this.build = function (selector) {
        var builder = this;
        var model = new Model(builder.options.actions);
        var instance = new Renderer(selector, model, builder.options.template, builder.options.subscriptions);
        model._detach = (function() {
            this.destroy();
            console.log('x');
        }).bind(instance);
        return model;
    };
    return this;
};

/**
 * Loads a template from an URL and compiles the template as a Handlebars template. Returns a promise
 * which is fulfilled with a template function representing the Handlebars template and can be used
 * with the builder method ".withTemplate()".
 *
 * @param templateURL
 * @returns {Promise}
 */
Component.template = function (templateURL) {
    return new Promise(function (resolve, reject) {
        superagent.get(templateURL).end(function (err, response) {
            if (err) {
                reject("Unable to load template from '" + templateURL + "': " + err);
                return;
            }
            try {
                var parser = new DOMParser();
                var dom = parser.parseFromString(response.text, "text/html");
                var template = $(dom).find('template').first();
                if (!template || !template.length) {
                    reject("Template '" + templateURL + "' does not contain a <template> element in body.");
                    return;
                }
                template = template.html().trim();
                template = Handlebars.compile(template);
            } catch (e) {
                reject("Unable to install renderer from template '" + templateURL + "': " + e);
                return;
            }
            var innerFns = {};
            innerFns.template = template;
            var fnNames = ['attach', 'update', 'detach'];
            for (var idx = 0; idx < fnNames.length; idx++) {
                var fnName = fnNames[idx];
                try {
                    var fnNode = $(dom).find("script." + fnName).first();
                    if (fnNode.length > 0) {
                        var scriptContent = fnNode.text();
                        innerFns[fnName] = new Function("node", scriptContent);
                        template[fnName] = new Function("node", scriptContent);
                    } else {
                        innerFns[fnName] = new Function("");
                        template[fnName] = new Function("");
                    }
                } catch (e) {
                    reject("Unable to install '" + fnName + "' function from template '" + templateURL + "': " + e);
                    return;
                }
            }
            resolve(template);
        });
    });
};


    return Component;
}));
