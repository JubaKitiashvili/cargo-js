.. highlight:: js

Module: Promise
===============

A promise in Javascript provides a simple way to deal with asynchronous code and to prevent
"rightward drift" in nested callbacks.

Specifically, it is a tiny implementation of Promises/A+ from https://promisesaplus.com

Promises
--------

This quote from the Promises/A+ specification catches the meaning of promises quite well:

    A promise represents the eventual result of an asynchronous operation. The primary
    way of interacting with a promise is through its then method, which registers callbacks
    to receive either a promise’s eventual value or the reason why the promise
    cannot be fulfilled.

Basic Usage
-----------

.. code-block:: js

    var promise = new Promise(function(resolve, reject) {
        // succeed
        resolve(value);
        // or reject
        reject(error);
    });

    promise.then(function(value) {
        // success
    }, function(value) {
        // failure
    });

Once a promise has been resolved or rejected, it cannot be resolved or
rejected again.

Here is an example of a simple Ajax call with superagent using Promise::

  var url = "http://datenwelt.io/some-api";

  var promise = new Promise(function(resolve, reject){
    superagent.get(url)
        .end(function(err, result) {
            if ( err ) {
                reject(err);
            } else {
                resolve(result.text);
            }
        });
  });

  promise.then(function(json) {
    // continue
  }, function(error) {
    // handle errors
  });


Chaining
--------

One of the really awesome features of Promises/A+ promises are that they
can be chained together. In other words, the return value of the first
resolve handler will be passed to the second resolve handler.

If you return a regular value, it will be passed, as is, to the next
handler::

    promise.then(function(json) {
        return json.post;
    }).then(function(post) {
        // proceed
    });

The really awesome part comes when you return a promise from the first
handler::

    promise.then(function(post) {
        // save off post
        return new Promise(function() {...});
    }).then(function(comments) {
        // proceed with access to post and comments
    });

This allows you to flatten out nested callbacks, and is the main feature
of promises that prevents "rightward drift" in programs with a lot of
asynchronous code.

Errors also propagate::

    promise.then(function(posts) {

    }).catch(function(error) {
        // since no rejection handler was passed to the
        // first `.then`, the error propagates.
    });

You can use this to emulate `try/catch` logic in synchronous code.
Simply chain as many resolve callbacks as a you want, and add a failure
handler at the end to catch errors::

    promise.then(function(post) {
        return new Promise(...);
    }).then(function(comments) {
        // proceed with access to posts and comments
    }).catch(function(error) {
        // handle errors in either of the two requests
    });

You can also use ``catch`` for error handling, which is a shortcut for
``then(null, rejection)``, like so::

    promise.then(function(post) {
        return new Promise(...);
    }).catch(function(error) {
        // handle errors
    });

Finally
-------

``finally`` will be invoked regardless of the promise's fate, just as native
try/catch/finally behaves::

    findAuthor().catch(function(reason){
        return findOtherAuthor();
    }).finally(function(){
        // author was either found, or not
    });


Arrays of promises
------------------

Sometimes you might want to work with many promises at once. If you
pass an array of promises to the ``when()`` method it will return a new
promise that will be fulfilled when all of the promises in the array
have been fulfilled; or rejected immediately if any promise in the array
is rejected.::

    var promises = [2, 3, 5, 7, 11, 13].map(function(id){
        return new Promise(function(resolve, reject) {
            resolve(id);
        });
    });

    Promise.when(promises).then(function(posts) {
        // posts contains an array of results for the given promises
    }).catch(function(reason){
        // if any of the promises fails.
    });

The other useful function is ``race()`` which takes an array of promises as input similar
to ``when()`` but fulfills with the first resolved promise from the array and fails early
with the first rejected promise::

    var promises = [2, 3, 5, 7, 11, 13].map(function(id){
        return new Promise(function(resolve, reject) {
            resolve(id);
        });
    });

    Promise.race(promises).then(function(p) {
        // p is the resolved value of the first promise from the array.
    }).catch(function(reason){
        // if any of the promises fails.
    });

