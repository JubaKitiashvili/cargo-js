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
                    if ( state === undefined ) {
                        return {};
                    } else if  (newState === undefined) {
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
                }
                ;

            var ctx = {
                actionCtx: actionCtx,
                actionFn: actionFn
            };
            self[action] = exportedFn.bind(ctx);
        }

        return self;

    }
    ;
