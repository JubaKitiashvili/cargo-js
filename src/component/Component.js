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

    var actions = {
        init: function () {
            return {
                visible: true
            };
        },
        show: function () {
            return this.state().put('visible', true);
        },
        hide: function () {
            return this.state().put('visible', false);
        },
        attach: function (selector) {
            return this.state().put('selector', selector);
        },
        detach: function () {
            return this.state().remove('selector');
        },
        destroy: function (reason) {
            if (e instanceof Error) {
                console.log('Error in component ' + templateURI + ': ' + e.message + "\n" + e.stack);
            } else {
                console.log('Error in component ' + templateURI + ': ' + e);
            }
            return reason instanceof Error ? reason : new Error(reason);
        }
    };

    actions = options.extendModel ? extendModel(actions) : actions;
    var translation = options.translation;
    var handlebars;

    if (translation) {
        handlebars = translation.getHandlebars();
        actions.changeLanguage = function(lang) {
            return this.state().put('lang', lang);
        };
        translation.subscribe(function(state) {
            if (state) {
                model.changeLanguage(state.get('lang'));
            }
        });
    } else {
        handlebars = Handlebars;
        if (!handlebars.helpers.i18n) {
            handlebars.registerHelper('i18n', function () {
                switch (arguments.length) {
                    case 0:
                    case 1:
                        return "";
                    case 2:
                        return arguments[0];
                    default:
                        return arguments[1] + "." + arguments[0];
                }
            });
        }
    }

    var model = new Model(actions);


    var templateLoader = _loadTemplate(templateURI);
    var renderFn = _.bind(_createRenderFn(), this);

    templateLoader.catch(function (e) {
            model.destroy(e);
        });

    this.hide = function () {
        return model.hide().then(function (state) {
            return renderFn(state);
        });
    };

    this.show = function () {
        return model.show().then(function (state) {
            return renderFn(state);
        });
    };

    this.getModel = function () {
        return model;
    };

    this.attach = function (selector) {
        return model.attach(selector).then(function (state) {
            return renderFn(state);
        });
    };

    this.detach = function () {
        return model.detach().then(function(state) {
            return renderFn(state);
        });
    };

    model.init();
    return this;

    function _loadTemplate(templateURL) {
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
                    template = template.html().trim();
                    template = handlebars.compile(template);
                } catch (e) {
                    reject("Unable to compile rendering function from template '" + templateURL + "': " + e);
                    return;
                }
                var result = {};
                result.template = template;
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

    function _createRenderFn() {
        var $selector;

        var target = undefined;
        var tree = undefined;

        var originalNodes = [];

        var template, attach, update, detach;

        var _detach = function () {
            if (target) {
                target.each(function (idx) {
                    try {
                        if ( detach ) {
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

        var renderFn = function (state) {
            var component = this;
            if (!template) {
                // Defer rendering if template is still loading.
                return new Promise(function (resolve) {
                    templateLoader.then(function (result) {
                        template = result.template;
                        attach = result.attach;
                        update = result.update;
                        detach = result.detach;
                        renderFn(state);
                        resolve(state);
                    });
                });
            }
            if (state === undefined) {
                return Promise.resolve(state);
            }

            if (state instanceof Error) {
                // If the model is in dead state, re-attach the old nodes
                // and return a rejecting promise.
                _detach();
                return Promise.reject(state);
            }
            if (state.get('selector') !== $selector) {
                // If the selector has changed, re-attach the old nodes,
                // and reset rendering engine.
                _detach();
                $selector = state.get('selector');
            }
            if ( !$selector || ( target && target.length == 0 )) {
                // If we have no selector, the component has not been attached yet or
                // was recently detached.
                // If there are no target elements, there were no matching DOM elements when attaching.
                // In any of these cases, Skip rendering and just return a resolving promise.
                return Promise.resolve(state);
            }
            var html = template(state.toJS());
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
                $($selector).each(function () {
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
        return renderFn;
    }

    function _mergeTranslationStream() {
        handlebars = translation.getHandlebars();
        var stream = stream.merge(translation.asStream(), function (compState, transState) {
            if (!transState.has('translations') || transState.get('loading')) {
                return undefined;
            }
            var languages = transState.get('locales').toJS();
            var namespaces = transState.get('namespaces').toJS();
            if (!languages || !namespaces) {
                return undefined;
            }
            /* The following flattens all translations to one object with all keys and translation values set to
             * either the translation from the currently selected language, its parent language or the
             * default language.
             */
            var i18n = _.chain(languages)
                .uniq()
                .reduce(function (memo, lang) {
                    if (transState.get('translations').has(lang)) {
                        memo = _.chain(namespaces)
                            .uniq()
                            .reduce(function (memo, ns) {
                                if (transState.get('translations').get(lang).has(ns)) {
                                    var trans = transState.get('translations').get(lang).get(ns);
                                    var keys = trans.keys();
                                    memo = _.chain(keys)
                                        .reduce(function (memo, key) {
                                            if (namespaces.length == 1) {
                                                memo[key] = memo[key] || trans.get(key);
                                            } else {
                                                memo[ns] = memo[ns] || {};
                                                memo[ns][key] = memo[ns][key] || trans.get(key);
                                            }
                                            return memo;
                                        }, memo)
                                        .value();
                                }
                                return memo;
                            }, memo).value();
                    }
                    return memo;
                }, {})
                .value();
            return compState.put('i18n', i18n);
        });
    }

};
