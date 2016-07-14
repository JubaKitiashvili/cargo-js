var Component = function (selector, template, actions, options) {
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
    actions = actions || {};

    if (!actions.changeLanguage && options.translation) {
        actions.changeLanguage = function (translation) {
            return this.state({translation: translation});
        };
    }

    var translation = options.translation;

    var templateLoader = _loadTemplate(template);

    var model = new Model(actions);
    var renderFn = _createRenderFn(selector, model, templateLoader, translation);
    model(renderFn);

    this.getModel = function () {
        return model;
    };

    this.hide = function () {
        model.hide();
        return this;
    };
    this.show = function () {
        model.show();
        return this;
    };

    return model;

    function _registerTranslatorFn(handlebars, translation) {
        var translatorFn = function (input) {
            return translation && translation[input] ? translation[input] : input;
        };
        handlebars.unregisterHelper('i18n');
        handlebars.registerHelper('i18n', translatorFn);
    }

    function _loadTemplate(templateURL) {
        return new Promise(function (resolve, reject) {
            superagent.get(templateURL).end(function (err, response) {
                var handlebars = Handlebars.create();
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
                    template = template.html().trim();
                    template = handlebars.compile(template);
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
                            result[fnName] = new Function("node", scriptContent);
                        } else {
                            result[fnName] = new Function("");
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

    function _createRenderFn(selector, model, templateLoader, translation) {
        var template = undefined;
        var attach = undefined;
        var update = undefined;
        var detach = undefined;
        var handlebars = undefined;

        var isDestroyed = false;
        var target = undefined;
        var tree = undefined;
        var originalNodes = [];

        templateLoader.then(function (result) {
            template = result.template;
            attach = result.attach;
            update = result.update;
            detach = result.detach;
            handlebars = result.handlebars;
            if (translation && handlebars) {
                translation(function (state) {
                    _registerTranslatorFn(handlebars, state);
                    model.changeLanguage(state);
                });
            }
        });

        var renderFn = function (state) {
            if (state === undefined || isDestroyed) {
                // If there is no state or model is in dead state, skip rendering.
                return;
            }
            if (state instanceof Error) {
                // We just entered dead state, cleanup and skip rendering.
                if (target) {
                    target.each(function (idx) {
                        try {
                            detach(this);
                        } catch (e) {
                        }
                        var orig = originalNodes[idx];
                        $(this).replaceWith(orig);
                    });
                }
                isDestroyed = true;
                return;
            }
            if (target && !target.length) {
                // We have tried to attach but there were no target elements. Skip rendering.
                return;
            }
            if (!template) {
                // Defer rendering if template is still loading.
                templateLoader.then(function () {
                    renderFn(state);
                });
                return;
            }
            var html = template(state);
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
            if (tree === undefined) {
                // First rendering. Render new nodes, save and replace old nodes.
                var selection = $();
                target = $(selector);
                target.each(function () {
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
        };
        renderFn = renderFn.bind(model);
        return renderFn;
    }

};
