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
var Component = function(selector, template, actions) {
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

    actions = actions || {};

    var templateLoader = _loadTemplate(template);

    var model =  new Model(actions);
    var renderFn = _createRenderFn(model, templateLoader);
    Model.subscribe(model, renderFn);
    return model;

    function _loadTemplate(templateURL) {
        return new Promise(function(resolve, reject) {
            superagent.get(templateURL).end(function (err, response) {
                var _handlebars = Handlebars.create();
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
                    template = _handlebars.compile(template);
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

    function _createRenderFn(selector, templateLoader) {
        var template = undefined;
        var attach = undefined;
        var update = undefined;
        var detach = undefined;

        templateLoader.then(function(result) {
            template = result.template;
            attach = result.attach;
            update = result.update;
            detach = result.detach;
        });

        var renderFn = function(state) {
            if (state === undefined || state instanceof e) return;
            if ( !template ) {
                // Defer rendering if template is still loading.
                templateLoader.then(function() {
                    console.log("Deferring state rendering: " + JSON.stringify(state));
                    renderFn(state);
                });
                return;
            }
            console.log("Rendering state: " + JSON.stringify(state));
        };
        return renderFn;
    }

};

    return Component;
}));
