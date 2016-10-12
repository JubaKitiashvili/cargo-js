;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['cargo.Promise'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('cargo.Promise'));
    } else {
        root.cargo = root.cargo || {};
        root.cargo.Model = factory(root.cargo.Promise);
    }
}(this, function(Promise) {
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
                    subscriber.call(undefined, state);
                    resolve();
                } catch (e) {
                    console.log("Error in new subscriber: " + e);
                    reject();
                }
            }
        });
        return unsubscribe.bind(self, subscriberId);
    };

    for (var action in actions) {
        if (!actions.hasOwnProperty(action)) {
            continue;
        }
        var actionFn = actions[action];
        if (typeof actionFn !== 'function') {
            continue;
        }
        var actionCtx = {
            state: function () {
                return state != undefined ? state : Model.state({});
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
                        newState = Model.state({});
                    } else if (!mustDestroy) {
                        newState = Model.state(newState);
                    }
                    state = newState;
                    for (var id in subscribers) {
                        if (!subscribers.hasOwnProperty(id)) {
                            continue;
                        }
                        var subscriber = subscribers[id].subscriber;
                        try {
                            subscriber.call(undefined, state);
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

Model.stream = function (model) {
    return new Stream(model);
};

var Stream = function (model) {

    var streamState;
    var unsubscribe;

    var streamModel = new Model({
        in: function (input) {
            streamState = input;
            return input;
        }
    });

    model(function (s) {
        unsubscribe = streamModel.in(s);
    });

    this.in = function (state) {
        streamModel.in(Model.state(state));
    };

    this.disconnect = function() {
        if ( unsubscribe ) {
            unsubscribe();
            unsubscribe = undefined;
        }
    };

    this.subscribe = function (subscriberFn) {
        return streamModel(subscriberFn);
    };

    this.out = function () {
        return streamState;
    };

    this.filter = function (filterFn) {

        var filterModel = new Model({filter: filterFn});
        streamModel(function (s) {
            filterModel.filter(s)
        });
        return new Stream(filterModel);

    };

    this.pipe = function() {
        return new Stream(streamModel);
    };

    this.merge = function (model, mergeFn) {

        var ourState;
        var theirState;

        mergeFn = mergeFn || function (s1, s2) {
                var state = _.extendOwn({}, s1, s2);
            };

        var mergedModel = new Model({
            updateOurs: function (s) {
                ourState = s;
                return mergeFn(ourState, theirState);
            },
            updateTheirs: function (s) {
                theirState = s;
                return mergeFn(ourState, theirState);
            }
        });

        if ( model instanceof Stream) {
            model.subscribe(function(s) {
                mergedModel.updateTheirs(s);
            });
        } else {
            model(function (s) {
                mergedModel.updateTheirs(s);
            });
        }
        streamModel(function (s) {
            mergedModel.updateOurs(s);
        });
        return new Stream(mergedModel);

    };

    return this;
};

var State = function (input) {

    var List = function (input) {
        if (!_.isArray(input) && !_.isArguments()) {
            throw new TypeError("Unable to initialize State.List from other data types than arrays.");
        }

        var _clone = function () {
            return _data.slice();
        };

        var _data = _.map(_.toArray(input), function (item) {
            return Model.state(item);
        });

        this.$Map = false;
        this.$List = true;

        this.type = function () {
            return 'LIST';
        };

        this.get = function (index) {
            return _data[index];
        };

        this.size = function () {
            return _data.length;
        };

        this.add = function (item) {
            return this.insert(this.size() + 1, item);
        };

        this.remove = function (index) {
            if (this.size() == 0 || index > this.size()) {
                return this;
            }
            var arr = _clone();
            arr.splice(index, 1);
            return Model.state(arr);
        };

        this.insert = function (index, item) {
            var arr = _clone();
            var item = Model.state(item);
            if (index < 0) {
                index = 0;
            } else if (index > this.size()) {
                index = this.size();
            }
            arr.splice(index, 0, item);
            return Model.state(arr);
        };

        this.push = function (item) {
            return this.insert(this.size(), item);
        };

        this.pop = function () {
            return this.remove(0);
        };

        this.shift = function () {
            return this.remove(this.size() - 1);
        };

        this.unshift = function (item) {
            return this.insert(0, item);
        };

        this.toJS = function () {
            return _.map(_data, function (item) {
                return item instanceof State ? item.toJS() : item;
            });
        };

    };

    var Map = function (input) {
        if (!_.isObject(input)) {
            throw new TypeError("Unable to initialize State.Map from other data types than objects.");
        }

        var _data = {};

        var _clone = function () {
            return _.extendOwn({}, _data);
        };

        _.each(Object.getOwnPropertyNames(input), function (prop) {
            _data[prop] = Model.state(input[prop]);
        });

        this.$Map = true;

        this.$List = false;

        this.type = function () {
            return 'MAP';
        };

        this.get = function (key) {
            return _data[key];
        };

        this.put = function (key, value) {
            if ( value === undefined ) {
                return this.remove(key);
            }
            var m = _.extend({}, _data);
            m[key] = Model.state(value);
            return Model.state(m);
        };

        this.remove = function (key) {
            if (!_.has(_data, key)) {
                return this;
            } else {
                var me = _.extendOwn({}, _data);
                delete me[key];
                return Model.state(me);
            }
        };

        this.has = function (key) {
            return _.has(_data, key);
        };

        this.keys = function () {
            return _.keys(_data);
        };

        this.merge = function (obj) {
            var s = Model.state(obj);
            if (!s instanceof State || !s.$Map) {
                return this;
            }
            var merged = _.extendOwn({}, _data, obj);
            return Model.state(merged);
        };

        this.deepMerge = function (obj) {
            obj = Model.state(obj);
            if (!obj || !obj instanceof State || !obj.$Map) {
                throw new TypeError("Unable to deep merge state objects other than maps.");
            }
            var merged = _clone();
            _.each(obj.keys(), function(key) {
                var newVal = obj.get(key);
                if ( newVal instanceof State && newVal.$Map ) {
                    var curVal = merged[key];
                    if ( curVal && curVal instanceof State && curVal.$Map ) {
                        newVal = curVal.deepMerge(newVal);
                    }
                }
                merged[key] = newVal;
            });
            return Model.state(merged);
        };

        this.toJS = function () {
            var js = {};
            return _.chain(_data)
                .keys()
                .reduce(function (memo, key) {
                    var val = _data[key];
                    if (val instanceof State) {
                        val = val.toJS();
                    }
                    memo[key] = val;
                    return memo;
                }, {})
                .value();
        };

        return this;
    };
    if (_.isArray(input)) {
        _.extend(this, new List(input));
        return this;
    } else if (_.isObject(input)) {
        _.extend(this, new Map(input));
        return this;
    } else {
        return undefined;
    }
};

Model.state = function (input) {
    return input instanceof State
        ? input
        : _.isNumber(input) || _.isBoolean(input) || _.isString(input) || _.isNull(input) || _.isUndefined(input)
        ? input
        : _.isFunction(input)
        ? undefined
        : _.isArray(input) || _.isObject(input)
        ? new State(input)
        : undefined;
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


    return Model;
}));
