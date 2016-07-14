/* Copyright 2016 Jan Obladen <obladen@datenwelt.net>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

 See the License for the specific language governing permissions and
 limitations under the License.
 */
/**
 * Constructor method for Flux data models. "Model" maintains a "state" and provides a simple publish / subscribe pattern
 * for state changes. State changes are performed through "actions".
 *
 * The constructor must be called with an object defining the actions as named properties. Each action must be
 * defined as a function that returns the new state.
 *
 * var actions = {
 *      initialState: function() { return state0; },
 *      action1: function() { return state1; },
 *      actions: function(x) { return { val: x } }
 *      ...
 * };
 * var m = new Model(actions);
 *
 * var subscriber = function(newState) {
 *  console.log(newState);
 * }
 *
 * var unsubscribe = m(subscriber);
 * ...
 * unsubscribe();
 *
 * @param actions
 * @returns {Model}
 * @constructor
 */
var Model = function (actions) {
    'use strict';

    if (!Promise) throw new Error("cargo.Promise API is required.");

    var self = this;
    var state = undefined;

    var lastId = 1;
    var subscribers = {};
    self = function (subscriber) {
        var subscriberId = lastId++;
        if (!subscriber || typeof subscriber !== 'function') {
            return;
        }
        subscribers[subscriberId] = {subscriber: subscriber};
        var unsubscribe = function (subscriberId) {
            delete subscribers[subscriberId];
        };
        new Promise(function (resolve, reject) {
            if (state !== undefined && !(state instanceof Error)) {
                try {
                    var stateCopy = JSON.parse(JSON.stringify(state));
                    subscriber.call(undefined, stateCopy);
                    resolve();
                } catch (e) {
                    console.log("Error in new subscriber: " + e);
                    reject();
                }
            }
        });
        return unsubscribe.bind(self, subscriberId);
    };


    function _merge(target, src) {
        var dst;
        if (src.length !== undefined) {
            dst = [];
            for (var idx = 0; idx < src.length; idx++) {
                if (typeof src[idx] === 'object' || typeof src[idx] === 'array') {
                    dst[idx] = _merge(target[idx], src[idx]);
                } else {
                    dst[idx] = src[idx];
                }
            }
            return dst;
        }
        dst = target || {};
        var key;
        if (target && typeof target === 'object') {
            for (key in target) {
                if (!target.hasOwnProperty(key)) continue;
                dst[key] = target[key];
            }
        }
        for (key in src) {
            if (!src.hasOwnProperty(key)) continue;
            if (typeof src[key] !== 'object' || !src[key]) {
                dst[key] = src[key];
            }
            else {
                if (!target[key]) {
                    dst[key] = src[key];
                } else {
                    dst[key] = _merge(target[key], src[key]);
                }
            }
        }
        return dst;
    }


    for (var action in actions) {
        if (!actions.hasOwnProperty(action)) {
            continue;
        }
        var actionFn = actions[action];
        if (typeof actionFn !== 'function') {
            continue;
        }
        var actionCtx = {
            state: function (newState) {
                if (state === undefined) {
                    return {};
                } else if (newState === undefined) {
                    return _merge({}, state);
                } else if (newState instanceof Error) {
                    return newState;
                } else {
                    return _merge(state, newState);
                }
            },
            model: self
        };
        var exportedFn = function () {
            var actionCtx = this.actionCtx;
            var actionFn = this.actionFn;
            var args = [];
            for (var idx = 0; idx < arguments.length; idx++) {
                args.push(arguments[idx]);
            }
            var _deferredAction = function (resolve, reject) {
                if (state instanceof Error) {
                    reject(state);
                    return;
                }

                var newState;
                try {
                    newState = actionFn.apply(actionCtx, args);
                } catch (e) {
                    reject(e);
                }
                var mustDestroy = newState instanceof Error;
                if (newState !== undefined) {
                    if (newState === null) {
                        newState = {};
                    }
                    state = newState;
                    for (var id in subscribers) {
                        if (!subscribers.hasOwnProperty(id)) {
                            continue;
                        }
                        var subscriber = subscribers[id].subscriber;
                        try {
                            var stateCopy = mustDestroy ? state : JSON.parse(JSON.stringify(state));
                            subscriber.call(undefined, stateCopy);
                        } catch (e) {
                            console.log("Error in subscriber: " + e);
                            console.trace(e);
                        }
                    }
                    if (mustDestroy) {
                        subscribers = [];
                    }
                }
                if (newState instanceof Error) {
                    reject(newState);
                } else {
                    resolve(newState);

                }

            };
            _deferredAction = _deferredAction.bind(this);
            return new Promise(_deferredAction);
        };

        var ctx = {
            actionCtx: actionCtx,
            actionFn: actionFn
        };
        self[action] = exportedFn.bind(ctx);
    }

    return self;

};

var Stream = function (model) {

    var streamState;

    var streamModel = new Model({
        in: function (input) {
            streamState = input;
            return input;
        }
    });

    model(function (s) {
        streamModel.in(s);
    });

    this.in = function (state) {
        streamModel.in(state);
    };

    this.subscribe = function (subscriberFn) {
        return streamModel(subscriberFn);
    };

    this.out = function () {
        return streamState ? JSON.parse(JSON.stringify(streamState)) : undefined;
    };

    this.filter = function (filterFn) {

        var filterModel = new Model({filter: filterFn});
        streamModel(function (s) {
            filterModel.filter(s)
        });
        return new Stream(filterModel);

    };

    this.merge = function (model, mergerFn) {

        var ourState;
        var theirState;

        mergerFn = mergeFn || function (s1, s2) {
                var state = _.extendOwn({}, s1, s2);
            };

        var mergedModel = new Model({
            updateOurs: function (s) {
                theirState = s;
                return mergeFn(ourState, s);
            },
            updateTheirs: function (s) {
                ourState = s;
                return mergeFn(s, theirState);
            }
        });

        model(function (s) {
            mergedModel.updateTheirs(s);
        });
        streamModel(function (s) {
            mergedModel.updateOurs(s);
        });
        return new Stream(mergedModel);

    };

    return this;
};

/**
 * Syntactic sugar for model(subscriber).
 *
 * @param model the model to subscribe to.
 * @param subscriber the subscriber callback
 * @returns {*} an unsubscribe method.
 */
Model.subscribe = function (model, subscriber) {
    return model(subscriber);
};

/**
 * Merges two models and returns the two as new model
 * combining them. The new model provides all actions of
 * both models. If both models have an identical action,
 * the latter model overwrites the former.
 * The state of the model is a comibination of both states
 * whith the latter state overwriting the former in case
 * of collisions.
 *
 * @param model1 the first model to merge
 * @param model2 the second model to merge
 * @param merger an optional function that merges both model when one of the states changes. If this paramerter is
 *              omitted, both states are merged into one object whith the second overwriting the first.
 * @return {*} the combined new model
 */
Model.merge = function (model1, model2, merger) {

    merger = merger || function (state1, state2) {
            var state = {};
            state = _.extendOwn(state, state1, state2);
            return state;
        };
    var names = Object.getOwnPropertyNames(model1);
    var actions = _.reduce(names, function (memo, name) {
        var action = model1[name];
        if (typeof action !== 'function') {
            return memo;
        }
        memo[name] = function () {
            return action.apply(model1, arguments);
        };
        return memo;
    }, {});

    names = Object.getOwnPropertyNames(model2);
    actions = _.reduce(names, function (memo, name) {
        var action = model2[name];
        if (typeof action !== 'function') {
            return memo;
        }
        memo[name] = function () {
            return action.apply(model2, arguments);
        };
        return memo;
    }, actions);

    actions._update = function (state) {
        return state;
    };
    var model = new Model(actions);
    var state1;
    var state2;
    model1(function (state) {
        state1 = state;
        var mergedState = merger(state1, state2);
        model._update(mergedState);
    });
    model2(function (state) {
        state2 = state;
        var mergedState = merger(state1, state2);
        model._update(mergedState);
    });

    return model;
};

Model.stream = function (model) {
    return new Stream(model);
};
