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
'use strict';
/**
 * Constructor function for a promise. It takes an action (=a function) as an argument which
 * is executed asynchronously and receives a "resolve" and a "reject" function
 * as arguments.
 *
 * If the resolve function is called within that action, the promise is considered "fulfilled"
 * (or "resolved"). If the reject function is called instead, the promise is considered
 * "rejected". As long as neither of them is called, the promise is "pending".
 *
 * Use then(), catch() and finally() to get notification on the outcome of the promise.
 *
 * This implementation follows the Promise/A+ specification from https://promiseaplus.com.
 *
 * @param action
 * @constructor
 */
var Promise = function (action) {


    var self = this;

    var _state = 'pending';
    var _result = undefined;
    var _subscribers = [];

    /**
     * Returns an object representing the current state of the promise.
     * "state" can be "fulfilled", "rejected" or "pending". "result" contains
     * the actual value of the promise which is "undefined" if the promise is
     * pending, the value which fulfills the promise or the reason which the
     * promise was rejected with.
     *
     * @returns {{state: string, result: object}}
     */
    self.state = function () {
        return {
            state: _state,
            result: _result
        };
    };

    /**
     * Resolve the current promise with value 'x' by applying the resolving algorithm from
     * https://promisesaplus.com to value x.
     *
     * @param x
     */
    self.resolve = function (x) {
        setTimeout(function () {
            _resolve(x);
        }, 0);
    };


    /**
     * Reject the current promise with a reason.
     *
     * @param reason
     */
    self.reject = function (reason) {
        setTimeout(function () {
            _changeState('rejected', reason);
            _notifySubscribers();
        }, 0);
    };

    var _isPromise = function (x) {
        var iface = ['state', 'then', 'reject', 'resolve'];
        if (!x) {
            return false;
        }
        for (var idx = 0; idx < iface.length; idx++) {
            var fn = iface[idx];
            if (!x[fn] || typeof x[fn] !== 'function') {
                return false;
            }
        }
        return true;
    };

    /**
     * Changes the state of the promise if it is still pending. If the promise has been settled
     * already this method does nothing.
     *
     * @param state the new state of the promise
     * @param result the result of the promise
     */
    var _changeState = function (state, result) {
        // 2.1. Promise States
        //      A promise must be in one of three states: pending, fulfilled, or rejected.
        //      2.1.1 When pending, a promise:
        //      2.1.1.1 may transition to either the fulfilled or rejected state.
        //      2.1.2 When fulfilled, a promise:
        //      2.1.2.1 must not transition to any other state.
        //      2.1.2.2 must have a value, which must not change.
        //      2.1.3 When rejected, a promise:
        //      2.1.3.1 must not transition to any other state.
        //      2.1.3.2 must have a reason, which must not change.
        if (state == 'pending' || state == 'fulfilled' || state == 'rejected') {
            if (_state == 'pending' && state != 'pending') {
                _state = state;
                _result = result;
            }
        }
    };

    /**
     * Provides a way to notify subscribers of the current state of the promise. If the state of
     * the promise is "pending", nothing happens.
     *
     * A "subscriber" is a triple of an onFulfilled callback, an onRejected callback and
     * a chained promise "promise2" which is settled with the results from the callback.
     *
     * This method is primarily meant for internal use but other uses are not discouraged.
     */
    var _notifySubscribers = function () {
        // This is the second half of the then() method which is called asynchronously according to 2.2.4. It
        // notifies all waiting callbacks as soon as the promise completes.
        if (_state == 'pending') {
            return;
        }
        while (_subscribers.length > 0) {
            var returnValue;
            var subscriber = _subscribers.shift();
            var promise2 = subscriber.promise2;
            if (_state === 'fulfilled') {
                // 2.2.1.1 If onFulfilled is not a function, it must be ignored.
                if (typeof subscriber.onFulfilled === 'function') {
                    try {
                        // 2.2.5 onFulfilled and onRejected must be called as functions (i.e. with no this value).
                        // 2.2.2. If onFulfilled is a function, it must be called after promise is fulfilled, with
                        //        promise’s value as its first argument.
                        returnValue = subscriber.onFulfilled.call(undefined, _result);
                        // 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution
                        //         Procedure [[Resolve]](promise2, x).
                        promise2.resolve(returnValue);
                    } catch (error) {
                        // 2.2.7.2 If either onFulfilled or onRejected throws an exception e, promise2 must be
                        //         rejected with e as the reason.
                        promise2.reject(error);
                    }
                } else {
                    // 2.2.7.3 If onFulfilled is not a function and promise1 is fulfilled, promise2 must be
                    //         fulfilled with the same value as promise1.
                    promise2.resolve(_result);
                }
            }
            if (_state === 'rejected') {
                // 2.2.1.2 If onRejected is not a function, it must be ignored.
                if (typeof subscriber.onRejected === 'function') {
                    try {
                        // 2.2.5 onFulfilled and onRejected must be called as functions (i.e. with no this value).
                        // 2.2.3 If onRejected is a function, it must be called after promise is rejected, with
                        //       promise’s reason as its first argument.
                        returnValue = subscriber.onRejected.call(undefined, _result);
                        // 2.2.7.1 If either onFulfilled or onRejected returns a value x, run the Promise Resolution
                        //         Procedure [[Resolve]](promise2, x).
                        promise2.resolve(returnValue);
                    } catch (e) {
                        // 2.2.7.2 If either onFulfilled or onRejected throws an exception e, promise2 must be
                        //         rejected with e as the reason.
                        promise2.reject(e);
                    }
                } else {
                    // 2.2.7.4 If onRejected is not a function and promise1 is rejected, promise2 must be
                    //         rejected with the same value as promise1.
                    promise2.reject(_result);
                }
            }
        }
    };

    /**
     * This is the promise resolution procedure from section 2.3 of the Promise/A+ spec. It takes
     * a function as an arguments and resolves the promise depending on its outcome.
     * @param x
     */
    var _resolve = function (x) {
        // 2.3 The Promise Resolution Procedure
        //     To run [[Resolve]](promise, x), perform the following steps:
        if (_state != 'pending') {
            // If state is not pending any more, the promise has been resolved already.
            // Notify subscribers and leave.
            _notifySubscribers();
            return;
        }
        if (self === x) {
            // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
            throw new TypeError("Promise cannot be resolved with itself as result.");
        }
        else if (_isPromise(x)) {
            // TODO: Is x.state() really necessary?
            //       Couldn't x.then() be used even if x isn't pending any more?
            //       And if so, do we need to check for "state()" in _isPromise(x)? If not, duck typing promises
            //       would be more compliant to the standard.
            // 2.3.2 If x is a promise, adopt its state [3.4]:
            if (x.state().state != 'pending') {
                // 2.3.2.1 If x is a promise, adopt its state [3.4]:
                // 2.3.2.2 If/when x is fulfilled, fulfill promise with the same value.
                // 2.3.2.3 If/when x is rejected, reject promise with the same reason.
                //         NOTE: Only if it is not pending. Otherwise push an subscriber stack, to wait on
                //               promise to finish.
                _changeState(x.state().state, x.state().result);
                _notifySubscribers();
            } else {
                // If x is pending, link this promise (self) to x's completion.
                x.then(function (result) {
                    self.resolve(result);
                }, function (reason) {
                    self.reject(reason);
                });
            }
        }
        else if (typeof x === 'function') {
            // 2.3.3 Otherwise, if x is an object or function...
            //       NOTE: We do not support objects (yet).
            // 2.3.3.3 If x is a function, call it with x as this, first argument
            //         resolvePromise, and second argument rejectPromise, where:
            // 2.3.3.3.1 If/when resolvePromise is called with a value y, run [[Resolve]](promise, y).
            // 2.3.3.3.2 If/when rejectPromise is called with a reason r, reject promise with r.
            var resolvePromise = function (result) {
                // 2.3.3.3.3 If both resolvePromise and rejectPromise are called, or multiple calls to the same
                //          argument are made, the first call takes precedence, and any further calls
                //          are ignored.
                _changeState('fulfilled', result);
                _notifySubscribers();
            };
            var rejectPromise = function (reason) {
                // 2.3.3.3.3 If both resolvePromise and rejectPromise are called, or multiple calls to the same
                //          argument are made, the first call takes precedence, and any further calls
                //          are ignored.
                _changeState('rejected', reason);
                _notifySubscribers();
            };
            try {
                // 2.3.3.3 If x is a function, call it with x as this, first argument
                //         resolvePromise, and second argument rejectPromise, where:
                x.call(x, resolvePromise, rejectPromise);
            } catch (e) {
                // 2.3.3.3.4 If calling then throws an exception e,
                // 2.3.3.3.4.2 Otherwise, reject promise with e as the reason.
                _changeState('rejected', e);
            }
        } else {
            // 2.3.4 If x is not an object or function, fulfill promise with x.
            //       NOTE: Objects not supported (yet).
            _changeState('fulfilled', x);
        }
        // Notify subscribers about the state change.
        _notifySubscribers();
    };

    /**
     * This method provides a way to get notification when the promise has been settled.
     * It takes two callbacks as arguments. The first is called when the promise is fulfilled,
     * the second is called when the promise is rejected.
     *
     * then() returns another promise (= promise2) which is settled with the outcome of the callback. If the callback
     * returns a normal value promise2 is fulfilled with that value. If the callback
     * throws an exception, promise2 is rejected with the thrown error.
     *
     * If the callback returns another promise, promise2 is settled with the outcome of
     * the new promise. This provides a way of chaining promises one after another like:
     *
     * promise.then().then().then()...
     *
     * @param onFulfilled a callback to call when the promise is fulfilled.
     * @param onRejected a callback to call when the promise is rejected.
     * @returns {Promise} a second promise to settle with the outcome of the callbacks.
     */
    self.then = function (onFulfilled, onRejected) {
        // 2.2 A promise must provide a then method to access its current or eventual value or reason.
        //     A promise’s then method accepts two arguments:
        //     promise.then(onFulfilled, onRejected)
        var promise2 = new Promise("INSIDE PROMISE2");
        // 2.2.4 onFulfilled or onRejected must not be called until the execution context stack
        //       contains only platform code.
        //       => This is accomplished by pushing the callbacks and promise2 on a subscriber stack.
        //          The stack is worked through as soon as promise1 is either fulfilled or rejected.
        //          see _notifySubscribers()
        _subscribers.push({onFulfilled: onFulfilled, onRejected: onRejected, promise2: promise2});
        if (_state != 'pending') {
            // Notify subscribers if promise is not pending any more. Leave the asynchronous
            // behavior of then() by using setTimeout(..., 0).
            window.setTimeout(function () {
                _notifySubscribers();
            }, 0);
        }
        // 2.2.7 then() must return a promise [3.3].
        //       promise2 = promise1.then(onFulfilled, onRejected);
        return promise2;
    };

    /**
     * Similar to then() but takes just one argument as a callback which is called,
     * when the promise is rejected. It provides a way to catch errors in chained callbacks like:
     *
     * promise.then().then().catch()
     *
     * Note that an error which occurs somewhere in the chain "falls through" to the first catch()
     * skipping all then()'s which come after the rejected promise.
     *
     * @param onRejected
     * @returns {Promise}
     */
    self.catch = function (onRejected) {
        var promise2 = new Promise();
        _subscribers.push({onFulfilled: undefined, onRejected: onRejected, promise2: promise2});
        if (_state != 'pending') {
            // Notify subscribers if promise is not pending any more. Leave the asynchronous
            // behavior of catch() by using setTimeout(..., 0).
            window.setTimeout(function () {
                _notifySubscribers();
            }, 0);
        }
        return promise2;
    };

    /**
     * Similar to then() and catch() but receives a callback which is called in any case
     * (fulfilled or rejected). Use finally at the end of the promise chain to execute code
     * that does not depend on the outcome of the promises.
     *
     * promise.then().catch().finally()
     *
     * @param callback
     * @returns {Promise}
     */
    self.finally = function (callback) {
        var promise2 = new Promise();
        _subscribers.push({onFulfilled: callback, onRejected: callback, promise2: promise2});
        if (_state != 'pending') {
            // Notify subscribers if promise is not pending any more. Leave the asynchronous
            // behavior of finally() by using setTimeout(..., 0).
            window.setTimeout(function () {
                _notifySubscribers();
            }, 0);
        }
        return promise2;
    };

    if (typeof action === 'function') {
        setTimeout(function () {
            _resolve(action)
        }, 0);
    }

};

/**
 * This method provides a way to execute a set of promises (=array) simultaneously and
 * wait for all of them to complete.
 *
 * It returns a new promise which is fulfilled if/when all promises from
 * the set have been fulfilled. It fulfills with an array of the
 * results of all promises in the same order as the promises in the set.
 *
 * If one of the promises is rejected, this promise is rejected immediately with the
 * reason of the rejected promise.
 *
 * @param promises an array of promises to settle at once.
 * @returns {Promise} a new promise to receive the outcome of the promises.
 */
Promise.when = function (promises) {
    return new Promise(function (resolver, reject) {
            var returnValues = [];
            var pending = promises.length;
            for (var idx = 0; idx < promises.length; idx++) {
                var thenFn = function (result, num) {
                    returnValues[this.idx] = result;
                    pending--;
                    if (pending == 0) {
                        resolver(returnValues);
                    }
                };
                thenFn = thenFn.bind({idx: idx});
                promises[idx]
                    .then(thenFn)
                    .catch(function (reason) {
                        reject(reason)
                    });
            }
        }
    );
};

/**
 * Returns a new promise which is fulfilled immediately with value 'x'.
 * If x is a promise, the returned promise follows 'x' adopting its eventual
 * state.
 *
 * @param x
 * @returns {Promise}
 */
Promise.resolve = function (x) {
    return new Promise().resolve(x);
};

/**
 * Returns a new promise which is immediately rejected with reason 'x'.
 *
 * @param x
 */
Promise.reject = function (x) {
    return new Promise().reject(x);
};

/**
 * Alias for Promise.when().
 * @type {Function|*}
 */
Promise.all = Promise.when;

Promise.race = function (promises) {
    return new Promise(function (resolver, reject) {
            for (var idx = 0; idx < promises.length; idx++) {
                promises[idx]
                    .then(function (result) {
                        resolver(result);

                    })
                    .catch(function (reason) {
                        reject(reason)
                    });
            }
        }
    );

};

