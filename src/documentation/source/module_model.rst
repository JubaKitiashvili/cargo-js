.. highlight:: js

Module: Model
=============

Overview
--------

This module provides a very simple Flux implementation with a lightweight publish / subscribe pattern. Flux is a design
pattern for application data models created by Facebook.

The basic idea of Flux is that in an application the data model should not be accessed directly. In Flux the data model
defines the current state of the application. Only well-defined access methods ("actions") change the application state.
Subscribers get notifications of state changes an can react on the new state.

See this page for a better understanding of Flux: https://facebook.github.io/flux/

Dependencies
------------

This module depends on the Promise module (see :doc:`module_promise`). In AMD-loader scenarios it should go by
the alias "cargo.Promise"::

    require.config({
        paths: { 'cargo.Promise': 'path/to/promise' }
    });

Usage
-----

Define state transitions ("actions") as functions and bundle them in an object
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Model.js exports just one constructor method - ``Model(actions)``. The parameter ``actions`` is an object defining the
actions that change the state. Action are defined as methods returning the new state after the action has been performed.::


    var actions = {

        action1: function() {
            return { state_variable: "..." }; // <- new state
        },

        actions2: function(inputs) {
            var value = ...; // Do something with inputs...
            return { state_variable: value  }; // <- new state
        }

    }

Pass the bundled actions to the constructor method.
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

When called as a constructor it returns an object which exposes the actions as properties. This "thing" is very
similar to the object provided to the constructor. It provides all actions as methods::

    var model = new Model(actions);

Use actions to change the state.
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

   model.action1();
   model.action2("example input");


Subscribe to state changes.
^^^^^^^^^^^^^^^^^^^^^^^^^^^

The methods ``model.action1()``, ``model.actions2()`` do not return the current state directly. The current state can be
accessed by "subscribing" to the model. A "subscriber" is a callback that can be added to the model by calling the model
as a function and passing the callback as a parameter::

    var subscriber = function(newState) {
        console.log(newState);
    };

    model(subscriber);
    ...


Unsubscribe from state changes later.
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The subscription function itself returns another function which can be used to unsubscribe from the model later::

    var unsubscribe = model(subscriber);
    unsubscribe();

Useful helpers.
^^^^^^^^^^^^^^^
Actions are called with a special ``this`` context. ``this`` within actions has a method ``state()`` which provides the
current state.::

    var actions = {
        action1: function() {
            var oldState = this.state();
            var newState = { oldState.x };
            return newState;
        }
    };


When ``state()`` is called with an object as an argument, the provided object is merged with the new state.::

    var actions = {

        // oldState = { a: 'b' }
        action1: function() {
            var newState = this.state({ x: 'y'});
            // newState = { a: 'b', x: 'y' }
            return newState;
        }

    };

The ``this`` context of an action also exposes the current model object within a propety ``model``. This can be handy when
calling another action from within an action.::

    var actions = {

            action1: function() {
                var self = this.model;
                self.action2();
                return { ... };
            }

        };

If an action returns ``undefined``, the current state of the model keeps unchanged.::

    var actions = {

        action1: function() {
            /* Do something... */
            return undefined; // State keeps the same.
        }

    };

Use ``null`` if you want to clear the state. Of course you can use an empty object ``{}`` as well to clear the state.::


    var actions = {

        action1: function() {
            /* Do something... */
            return null; // Clear the state.
        }

    };

Calling an action returns a Promise (see :doc:`module_promise`) which is fulfilled with the new state as the result. If the model is in dead state,
the promise is rejected with the error which was returned before entering the dead state.::

    model.action1()
        .then(function(newState) {
            // ...
        });


Return an error if you want to destroy the model. If a model is destroyed, it enters the "dead state" unsubscribing all
subscribers and rejecting all further action calls. Note that this is different from throwing an error within the action.
Throwing an error within the action rejects the action but does not enter the model into dead state.::

    var model = new Model({ 
        action1: ...,
        destroy: function() { return new Error("I am in dead state now."); }
    });

    model.destroy().catch(function(e) {
        console.log(e); // prints "I am in dead state now."
    });

    ...

    model.action1().catch(function(e) {
        console.log(e); // prints "I am in dead state now."
    });


