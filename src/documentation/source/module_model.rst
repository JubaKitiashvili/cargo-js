.. highlight:: js

Module: Model
=============

Overview
--------

This module provides a very simple Flux implementation with a lightweight publish / subscribe pattern. Flux is a design
pattern for application data models created by Facebook.

The basic idea of Flux is that in an application the data model should not be accessed directly. In Flux the data model
defines the current state of the application. Only well-defined access methods ("actions") change the application state.
Subscribers get notifications of state changes and can react on the new state.

See this page for a better understanding of Flux: https://facebook.github.io/flux/

There are two APIs available in this Module which are complementary to each other - State and Model.

Introduction to State-API
-------------------------

“State” stores the application state in an immutable manner. It contains data structures which replace
both traditional javascript collections: objects are replaced with a “Map” data structure and arrays are
replaced with a “List” data structure.

Since application state should not be subject to side effects, these collections are immutable. Every time
the collection is altered a new instance is created and the old instance is left unchanged. E.g. the
Map data structure has a method to add new items which returns a new instance of Map which contains the
added item::


   var map = new State({});
   var map2 = map.put("id", 1);

   console.log(map.toJSON());  // map => {}, i.e. it stays the same after put().
   console.log(map2.toJSON()); // map2 => { "id": 1 }

Lists follow the same idea::

   var list = new State([]);
   var list2 = list.add(1);

   console.log(list.toJSON());  // list => []
   console.log(list2.toJSON()); // list2 => [ 1 ];

Immutable data structures can be shared between different Model instances without having one model interfere with
the other. If an action in one model changes a shared state the new state is "forked" off from the other models.

Introduction to Model-API
-------------------------

The "Model" data structure implements a publish/subscribe pattern for instances of ``State``. ``Model`` stores and manages
one specific instance of ``State`` and defines a set of well known actions (= functions) which alter this state.
To prevent side effects there is no other way to alter the state than through this set of actions.

As an example we implement the general idea of a form within a web page that disables the submit button when
the form has been submitted. For simplification, we retrieve the form and the submit button through
the jQuery selector API and do not care about the HTML and CSS details.

.. code-block:: js

	var form = $('form');
	var submitButton = $('input [type="submit"]');


Define actions to change the state
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``Model`` exposes a constructor which receives an object with one callback for each action. The callbacks are named
after the corresponding action and must return the new state which is desired as the outcome of the action.

If we wanted to define a model which represents a financial transaction and an action which marks the transaction as "paid"
we would define a callback ``pay`` within an object and pass that object to the ``Model`` constructor.

.. code-block:: js

	var actions = {
		pay: function() { return new State({ paid: true }); }
	};

	var model = new Model(actions);
	model.pay();

The constructor returns a new ``Model`` instance which exposes the actions through corresponding methods.

In the "form example" from above we define a ``Model`` with an action ``initalState``.
In ``initialState`` the form is defined as "not submitted yet" by returning a new ``State`` instance.
The action is called to initialize the model.

.. code-block:: js
	:linenos:

	var model = new Model({
		initialState: function() {
			return new State({ submitted: false});
		},

		submitted: function(isSubmitted) {
			return { submitted: isSubmitted };
		}
	});

	model.initialState();

An additional action ``submitted`` is defined in lines 6-8. This action changes the submit state to ``true`` or ``false``
depending on an input parameter. The return value is a plain Javascript object which converts to a new ``State`` instance
automatically for convenience.

Subscribe to state changes
^^^^^^^^^^^^^^^^^^^^^^^^^^

Subscribers can subscribe to state changes and get notifications about the new state whenever an action has been called.

.. code-block:: js

	var model = new Model({
		// ...
	});

	model.initialState();

	var subscriber = function(state) {
		var disabled = state.get('submitted');
		$('input [type=submit]').prop('disabled', disabled);
	};
	model(subscriber);

Whenever the state of the model changes, the subscriber is called with the current state (which is an instance of ``State``).
In this example the submit button is disabled or enabled if the form has been submitted. To connect the model to the form
we need to add an event handler that calls the ``submitted`` action.

.. code-block:: js
	:linenos:

	var model = new Model({
		initialState: function() {
			return new State({ submitted: false});
		},

		submitted: function(isSubmitted) {
			return { submitted: isSubmitted };
		}
	});

	model.initialState();

	var subscriber = function(state) {
		var disabled = state.get('submitted');
		$('input [type=submit]').prop('disabled', disabled);
	};
	model(subscriber);

	form.on('submit', function() {
		model.submitted(true);
	});

Unsubscribe later
^^^^^^^^^^^^^^^^^

Subscribing to a model returns an unsubscribe function to be used later for unsubscribing. In our form example we
use that function to prevent the submit button to be activated again once the form has been submitted.

.. code-block:: js

   // ...

   var unsubscribe;
   var subscriber = function(state) {
         var disabled = state.get('submitted');
         $('input [type=submit]').prop('disabled', disabled);
         unsubscribe();
   };
   unsubscribe = model(subscriber);

   form.on('submit', function() {
      model.submitted(true);
   });

Use current state within the action callbacks
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Within the action callbacks the ``this`` context exposes the current state through a ``state()`` method. The current
state can be used to preserve data which is not effected be the current action. If we had a form validation action which
stores a ``valid`` attribute in the state, we would have to preserve this attribute in the ``submitted`` action somehow.
That's what the ``this.state()`` method is for.

.. code-block:: js


   var model = new Model({

      initialState: function() {
         return new State({ submitted: false, valid: true });
      },

      validate: function() {
         // ...
      },

      submitted: function(isSubmitted) {
         var state = this.state();

         // Before: { submitted: false, valid: true }
         state = state.put('submitted', isSubmitted);

         // After: { submitted: false/true, valid: true }
         // The "valid" property is still there.
         return state;
      }

   });

Actions are asynchronous and can be combined
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Note that there is a difference between the action callbacks you provide to the constructor and the actions exposed
through the instance created by the constructor.

.. code-block:: js

   var actionCallback = function() { ... };
   var model = new Model({

         action: actionCallback

   });

   model.action();

   model.action !== actionCallback; // true

When the action is executed by calling the method from the ``Model`` instance, a wrapper is called which creates the
``this`` context, executes the callback and stores its return value as the current state of the ``Model`` instance.

The callback is called as an asynchronous task inside a Promise which resolves with the current state after the
callback returned a value.

.. code-block:: js

   // ...

   var promise = model.action();
   promise.then(function(state) {
      console.log("Current state is: " + state.toJSON());
   });


You can chain actions by chaining their promises:

.. code-block:: js

   // ...

   model.action1().then(function(state) {
      return model.action2();
   }).then(function(state) {
      return model.action3();
   }).then(function(state) {
      // ...
   });

The Promises present an alternative to the subscriber API and both APIs can be combined as well. Furthermore, there is
a third way to combine actions.

In addition to ``this.state()`` the ``this`` context contains a second method ``this.model()``. It is the model
instance itself providing a way to call one action from another action.


.. code-block:: js

   var model = new Model({

      action1: function() {
         var model = this.model();
         model.action2();
         return new State({ ... });
      },

      action2: function() {
         // ...
      }
   });



Special case: An undefined state
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If an action does not return a value (i.e. ``undefined``), the current state is left unchanged. This is helpful
when chaining actions conditionally or when an input changes the state only under certain conditions.

.. code-block:: js

   var model = new Model({

      action1: function(input) {
         if ( input === 'OK' ) {
            return new State({ valid: true });
         }
         return; // If input is not "OK", the state is the same.
      },

      action2: function(input) {
         if ( input === 'OK' ) {
            this.model().action1(input);
            return;
         }
         return new State({ /*...*/ });
      }

   });

In ``action1`` the state is only changed if the input is the string ``"OK"``. In ``action2``
another action is only called if the input has a certain value. In that case the state is left
unchanged and altered within ``action1``. If the value is not ``"OK"``, the state is changed in place.

Special case: Throwing an exception in an action callback
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If an exception occurs within an action callback, the action's promise is rejected with that exception. No
subscriber is notified and the state is left unchanged.


.. code-block:: js

   var model = new Model({

      action: function() {
         throw new Error('Error within action.');
      }

   });

   model.action().catch(function(error) {
      console.log(error);  // 'Error: Error within action.'
   });

Special case: Dead state
^^^^^^^^^^^^^^^^^^^^^^^^

If an ``Error`` instance is returned as the new state, the model goes into the "dead state". If a model enters the "dead state",
it cannot leave that state and will reject every action call with the ``Error`` instance. Additionally all subscribers are
unsubscribed and are never notified again.

.. code-block:: js

   var model = new Model({

      action: function() {
         return {};
      },

      kill: function() {
         return new Error('Model entered dead state at ' + new Date() + '.');
      }

   });

   model.kill();

   // Later...
   model.action().catch(function(err) {
      console.log(err); // 'Model entered dead state at 2017-03-05T22:30:33Z.'
   });


Note that this is slightly different than `throwing` an exception within an action callback. If an exception
is thrown (or just **occurs**), the model rejects the action but is not in the "dead state". Further actions execute
as if nothing happened, while once in "dead state" the model does not "react" to state
changes any more. This subtle difference has been introduced to prevent the model from being sent into dead state
by accident. Returning an error is an intentional decision by the developer while exceptions can be thrown for
various reason including accidental error conditions.

Dependencies
------------

This module has no dependencies except a Promise/A+ implementation which is provided by Node.js and most modern browsers.

API
---

State
^^^^^

constructor: new State()
````````````````````````

.. code-block:: js

   new State( { /* ... */ };  // => Map()

   new State( [ /* ... * / }; // => List()

   if ( state instanceof State)
         new State( state );  // => state

   new State( literal );      // => undefined

   new State();               // => undefined

The ``State()`` constructor creates a new instance of ``State`` depending on the input parameter. If the parameter is
an object, a ``Map`` instance is returned. If the parameter is an array, a ``List`` instance is created. If the paramter
is a ``List`` or a ``Map``, the input is returned as is. In any other case the constructor returns ``undefined``.

The constructor creates state instances recursively for each object property and each array element.

state.$Map / state.$List
````````````````````````````````````````````

.. code-block:: js

   state.$Map === true;  // if the instance is a Map.
   state.$List === true;  // if the instance is a List.

Since all state instances share a common constructor regardless of the state type, the type cannot be determined using
``instanceof``. The ``$Map`` and the ``$List`` properties can be used instead to retrieve the type of the state instance.

state.type()
``````````````````````

.. code-block:: js

   var type = state.type(); // 'LIST' or 'MAP'

Returns either 'LIST' or 'MAP' depending on the type of the state instance.

state.toJS()
``````````````````````

.. code-block:: js

   var array = list.toJS(); // an array which represents the List instance.
   var object = map.toJS(); // an object which represents the Map instance.

Converts the current instance to a plain javascript object or array from either a List or a Map respectively. The
conversion is recursive, resulting in a full Javascript copy of the current state. Note that this is only a copy
of the state, which stays immutable.


state.toJSON(indent)
``````````````````````````````

.. code-block:: js

   var json = state.toJSON(); // a JSON string representing the current state.
   state.toJSON(' '); // 1 space for indentation

Returns a JSON string representing the current instance. This method is mostly for debugging purposes. The indent
parameter is copied to ``JSON.stringify(obj, undefined, indent)``.

List: state.get(index)
``````````````````````

.. code-block:: js

   var el = list.get(3); // Returns the fourth element in the list.

Returns the list element at the specified numerical index ``index``. Indices start at 0.
If the list element is a state instance itself, this instance is returned. Just like with plain arrays, accessing
an index greater than the list size returns ``undefined``.


List: state.size()
``````````````````

.. code-block:: js

   var size = list.size(); // Returns the number of elements in the list.

Returns the size of the list which is the containing number of elements as a Number.

List: state.add(element)
````````````````````````

.. code-block:: js

   var newList = list.add(1); // Creates a new list with an additional element "1".

Creates a new list from this instance with the element added at its end. The current instance is unchanged. If ``element``
is an array or an object, it is converted to a state instance and this instance is added to the new list.


List: state.remove(index)
`````````````````````````

.. code-block:: js

   var newList = list.remove(3); // Creates a new list with the fourth element removed.

Creates a new list from this instance with the element at ``index`` removed. The current instance is unchanged.

List: state.insert(element, index)
``````````````````````````````````

.. code-block:: js

   var newList = list.insert("INSERT_ME", 3); // Creates a new list with "INSERT_ME" at the fourth position.

Creates a new list from this instance with ``element`` inserted at ``index`` and moving all following
elements by one position towards the end. The current instance is unchanged. If ``element``
is an array or an object, it is converted to a state instance and this instance is inserted into the new list. If index is
negativ ``element`` is inserted at the first list position.

List: state.push(element)
`````````````````````````

.. code-block:: js

   var newList = list.push("END"); // Creates a new list with an additional element "END" at the end.

Creates a new list from this instance with ``element`` added to the list. The current instance is unchanged. If ``element``
is an array or an object, it is converted to a state instance and this instance is inserted into the new list.

List: state.pop()
`````````````````

.. code-block:: js

   var newList = list.pop(); // Creates a new list with the last element removed.

Creates a new list from this instance with the last element removed. The current instance is unchanged.


List: state.shift()
```````````````````

.. code-block:: js

   var newList = list.shift(); // Creates a new list with the first element removed.

Creates a new list from this instance with the first element removed. The current instance is unchanged.


List: state.unshift(element)
````````````````````````````

.. code-block:: js

   var newList = list.unshift('START'); // Creates a new list 'START' added at the beginning.

Creates a new list from this instance with the ``element`` added at the beginning. The current instance is unchanged.
If ``element`` is an array or an object, it is converted to a state instance and this instance is added to the new list.

Map: state.get(key)
```````````````````

.. code-block:: js

   var value = map.get('a'); // Gets the value of element 'a' from the map.

Retrieves value of element ``key`` from the map. If the map does not have an element ``key``, ``undefined`` is returned.

Map: state.keys()
`````````````````

.. code-block:: js

   var size = map.keys(); // Gets the keys of the map.

Returns keys of all elements in the map as an array.

Map: state.has(key)
```````````````````

.. code-block:: js

   map.has('a'); // True if the map has an element "a".

Returns ``true`` if the map has an element ``key``, ``false`` otherwise.

Map: state.put(key, value)
``````````````````````````

.. code-block:: js

   var newMap = map.put('a', 'OK'); // Returns a new map with element 'a' set to 'OK'.

Returns a new map with an element ``key`` set to ``value``. The current instance of the map is unchanged.

If ``value`` is an array or an object, it is converted to a ``State`` instance recursively and that instance
is added instead.

Map: state.remove(key)
``````````````````````

.. code-block:: js

   var newMap = map.remove('a'); // Returns a new map with element 'a' removed.

Returns a new map with element ``key`` removed. The current instance of the map is unchanged.

Map: state.merge(object)
````````````````````````

.. code-block:: js

   var newMap = map.merge( { 'b': 2 } ); // Returns a new map the object merged into the current map.

Returns a new map with ``object`` merged into the current state. If ``object`` contains any properties
already present in the current state, the present properties are replaced with the properties from
``object``. All other properties are identical (i.e. the same instances) in the new and the old state.

``object`` is converted recursively to state instances before merging. Note that this is a "shallow" merge simply
replacing all properties at the "upper" level of the object removing any ramification under the present properties.

Model
^^^^^

constructor: new Model()
````````````````````````

.. code-block:: js

   var actions = {

      action1: function() { /* ... */ },

      action2: function() { /* ... */ }

      /* ... */

   };

   var model = new Model(actions);

   model.action1();

   var promise = model.action2();
   promise.then(function(state) {
      /* ... */
   });


   var subscriber = function(state) { /* ... */ };
   var unsubscribe = model(subscriber);
   unsubscribe();

Creates a new instance of ``Model``. The constructor takes a Javascript object as its single argument which consists of
name / value pairs of action callbacks. The action callbacks are wrapped in methods of the instance returned by the
constructor. Their method names correspond to the names of the name / value pairs from the Javascript object.
Whenever such a method is called the callback is executed and its return value is stored as the new state
of the model. The methods return a promise which resolves with the new state.

The ``Model`` instance can be used as a function to subscribe to state changes by passing a subscriber function. On state
changes the subscriber function is called with the new state as its first argument. The state is passed as an instance
of ``State`` and is immutable.

Calling the ``Model`` instance as a function (i.e. subscribing) returns an unsubscribe function which can be used to
unsubscribe from the model later.

Inside the action callback
``````````````````````````

.. code-block:: js
   :linenos:

   var actions = {

      action1: function(id) {
         var state = this.state();
         return state.put('id', id);
      };

      action2: function() {
         this.model().action1(2001);
      }

   };

   var model = new Model(actions);
   model.action2();

The action callbacks - ``action1`` and ``action2`` in the example above - are called whenever an action is called
on the model (line 15). They are expected to return a ``State`` instance but for simplicity literals, objects and arrays
are accepted as valid return values and converted conveniently to ``State`` instances. The return value is stored as the new state
of the model.

For partial state changes the former state is provided through the method ``this.state()`` within the callback function
context. The former state can be used to built a new state from and to be returned by the callback.

Other actions can trigger from within the action through the ``this.model()`` method which exposes the current model
instance.

If an action callback returns ``undefined`` (or returns nothing), the current state is left unchanged and no subscriber's
are notified.

If the return value is an instance of ``Error``, the model is sent into the "dead state". In "dead state" any further
calls of actions are rejected with the ``Error`` instance and all subscribers are unsubscribed immediately. They
do not receive a notification about a state change. Note that this is different from **throwing** an exception
within the callback.

When an exception is thrown during the action callback execution, the action's promise is rejected and the state
is unchanged. Hence, no subscriber is notified about any state changes.

Subscribers are only notified about *valid* state changes ensuring that the state is in a expectable format. The difference
between returning an ``Error`` instance through ``return new Error()`` and throwing an exception ``throw new Error()``
prevents the model from entering the "dead state" by accident. Returning an error is a thoughtful act by the developer
while exception may happen by various reasons like mistakes or unexpected input values.

Model.state(arg)
````````````````

.. code-block:: js

   var state = Model.state( { a: 1 } );

Creates a new ``State`` instance from anything. If an object or an array is passed, it is converted recursively to an
instance of ``State`` - a map or a list. If a ``State`` instance is passed, it is returned as is. If a literal is passed,
the literal is returned as is while everything else resolves to ``undefined`` (including ``undefined`` itself).

Model.subscribe(model, subscriber)
``````````````````````````````````

.. code-block:: js

   var model = new Model( /* ... */ );
   var subscriber = function(state) { /* ... */ };

   var unsubscribe = Model.subscribe(model, subscriber);
   unsubscribe();

Syntactic sugar for calling the ``Model`` instance as a function. It expects a function as its second argument
and adds it as a subscriber to state changes of the model from the first argument. It returns an unsubscribe
function to call later for unsubscribing.

