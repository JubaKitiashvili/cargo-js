Module: Component
=================

.. highlight:: js
   :linenothreshold: 5

Overview
--------

This module provides a GUI Component programming model for web application. It is inspired by Facebook's
React (https://facebook.github.io/react/) and uses a Virtual DOM implementation for its rendering engine. While it follows the general ideas
of React, it does some things very differently.

A Component represents a GUI element. It is conceived of a current state and its visual representation.
Let's assume a GUI element for a navigation menu. The navigation menu contains some menu items which
direct the user to different parts of the web application. Additionally it contains a "Change language"
dropdown that let's the user choose a translation for the web application. If she switches to another language,
the navigation menu itself shows in the new language according to the entire web application.

In this example, the current state of the navigation menu consists of at least all the menu items and the currently selected
language to highlight in the language dropdown. Furthermore, the current translation of the
navigation menu is also part of its current state.

Thus, the current state of the navigation menu component is represented by:

* the menu items
* the currently selected language
* all available languages

In Javascript the current state could be collected in a simple object like this::

    var state = {
        language: {
            selected: 'en',
            available: ['de','en']
        },
        menu: {
            about: 'http://...',
            contact: 'http://...',
            register: 'http://...',
            login: 'http://...'
        },
        translation: {
            about: 'About',
            contact: 'Contact',
            register: 'Sign up',
            login: 'Login'
        }
    };

The visual representation of this state could be something like this:

.. code-block:: html

    <div class="main-navigation">
        <ul class="menu">
            <li><a href="#!">About</a></li>
            <li><a href="#!">Contact</a></li>
            <li><a href="#!">Sign up</a></li>
            <li><a href="#!">Login</a></li>
        </ul>
        <ul class="language">
            <li class="active"><a href="#!">English</a></li>
            <li lang="de"><a href="#!">Deutsch</a></li>
        </ul>
    </div>

In mathematical terms the visual representation is a function of the state:

    F(state) = HTML

If the current state changes, its visual representation changes accordingly. Let's say the
user selects another language. This should change the state to:

.. code-block:: js
   :linenos:
   :emphasize-lines: 3,13-16

    var state = {
        language: {
            selected: 'de',
            available: ['de','en']
        },
        menu: {
            about: 'http://...',
            contact: 'http://...',
            register: 'http://...',
            login: 'http://...'}
        },
        translation: {
            about: 'Über uns',
            contact: 'Kontakt',
            register: 'Registrieren',
            login: 'Login'
        }
    };

The new state renders to a new visual representation:

.. code-block:: html
   :linenos:
   :emphasize-lines: 3-6,10

    <div class="main-navigation">
        <ul class="menu">
            <li><a href="#!">Über uns</a></li>
            <li><a href="#!">Kontakt</a></li>
            <li><a href="#!">Registrieren</a></li>
            <li><a href="#!">Login</a></li>
        </ul>
        <ul class="language">
            <li><a href="#!">English</a></li>
            <li lang="de" class="active"><a href="#!">Deutsch</a></li>
        </ul>
    </div>

Because state changes automatically lead to a change of their visual representation, the visual
representation is never altered directly by e.g. manipulating the DOM tree. Instead state changes are
triggered through a well-defined set of **state transitions** and the automatical process of
transforming the state to its visual representation is triggered whenever a state transition occurs.

In practical terms, the Component exposes a set of functions - one for each possible state transition.
Whenever one of the functions - which are called **"actions"** - is called, the according state transition
is triggered and the component is rendered automatically:

.. code-block:: none

    current state -> action() -> new state -> render() -> new HTML

In this programming model a Component is perfectly defined by:

1. A set of actions to define the possible state transitions.
2. A template which renders the HTML from the current state.

Both are surprisingly easy to code and it is very easy to start once you get the basic idea, see the code
example below to learn how to write your own components.

Dependencies
------------

This module uses the following libraries and modules:

=============== =================================================== ==================
Module          Repository                                          AMD module alias
=============== =================================================== ==================
Promise         https://github.com/datenwelt/cargo-js.git           cargo.Promise
Model           https://github.com/datenwelt/cargo-js.git           cargo.Model
virtualDom      https://github.com/Matt-Esch/virtual-dom            virtualDom
html2hscript    https://github.com/twilson63/html2hscript           html2hscript
superagent      https://github.com/visionmedia/superagent           superagent
Handlebarsjs    https://github.com/wycats/handlebars.js/            Handlebars
jQuery          https://jquery.com                                  $
=============== =================================================== ==================

All dependencies are provided in the ``dist`` directory at https://github.com/datenwelt/cargo-js.git.

The module `html2hscript` in the source repository at https://github.com/twilson63 is not useable
in AMD environments. Just take the version from our repository.

Code example
------------

As a practical example, the navigation menu component from above is built from scratch with
requirejs for dependency management. Let's start with an empty HTML page and a placeholder
for the nav menu. This is pretty much requirejs boilerplate.

Project structure
^^^^^^^^^^^^^^^^^

The overall project structure is:

.. code-block:: none

    index.html
        js/app.js

        js/lib/component.js
        js/lib/model.js
        js/lib/promise.js

        js/lib/third-party/jquery.js
        js/lib/third-party/handlebars.amd.js
        js/lib/third-party/html2hscript.js
        js/lib/third-party/requirejs.js
        js/lib/third-party/superagent.js
        js/lib/third-party/virtualDom.js

        html/nav.html

The file ``index.html`` is the web page which loads ``app.js`` via requirejs. The files in
``js/lib`` come from the cargo repository, everything under ``js/lib/third-party`` comes
from third party vendors.

The file ``html/nav.html`` is an empty HTML-file for now and will carry the HTML template of
the navigation menu later.

We do not use any CSS or other styling for clarity. You can add it later if you want.

Setting up the boilerplate
^^^^^^^^^^^^^^^^^^^^^^^^^^

Within ``index.html`` we define an element which later receives the rendered navigation menu. Note that
we load jQuery as a global and not by requirejs. Technically, this is not necessary but as most HTML frameworks require
jQuery it is needed as a global anyways.

``index.html``

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Component.js - example project</title>
    </head>
    <body>

    <nav id="nav" />

    <script type="text/javascript" src="js/lib/third-party/jquery.js"></script>
    <script type="text/javascript" data-main="js/app.js" src="js/lib/third-party/require.js"></script>

    </body>
    </html>

In ``js/app.js`` we load all required dependencies and provide a starting point.

``js/app.js``

.. code-block:: js
    :linenos:

    require.config({
        paths: {
            'cargo.Component': 'lib/component',
            'cargo.Model': 'lib/model',
            'cargo.Promise': 'lib/promise',
            'virtualDom': 'lib/third-party/virtual-dom',
            'Handlebars': 'lib/third-party/handlebars.amd',
            'html2hscript': 'lib/third-party/html2hscript',
            'superagent': 'lib/third-party/superagent'
        }
    });

    require(['cargo.Component'], function(Component) {

    });

Next we define a global object ``TRANSLATIONS`` containing the English and German translations to
have them at hand when needed.

``js/app.js``

.. code-block:: js
    :linenos:
    :lineno-start: 13

    require(['cargo.Component'], function(Component) {

        var TRANSLATIONS = {
            'de': {
                about: 'Über uns',
                contact: 'Kontakt',
                register: 'Registrieren',
                login: 'Login'
            },
            'en': {
                about: 'About',
                contact: 'Contact',
                register: 'Sign up',
                login: 'Login'
            }
        }

    });

Defining and attaching a component
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Let's define the navigation menu component and attach it to the ``<nav>`` element in the web page. The
``cargo.Component`` module provides a builder to achieve this. Additionally we need a first action,
that constitutes the initial state of the component.

``js/app.js``

.. code-block:: js
    :linenos:
    :lineno-start: 29

    ...

        var builder = new Component();

        builder.addAction('initialState', function () {
            var state = {
                language: {
                    selected: 'en',
                    available: ['de', 'en']
                },
                menu: {
                    about: '#about',
                    contact: '#contact',
                    register: '#register',
                    login: '#login'
                },
                translation: TRANSLATIONS['en']
            };
            return state;
        });

        var nav = builder.build('#nav');
        nav.initialState();
    });

In line 50-51 we attach the component to the ``<nav id="nav">`` element and call the initial state action
to initalize the component.

If we run this example, we should see the current state as a JSON representation at the place where the placeholder
``<nav>`` element was. That is the default behaviour of a component when it is not tied to a template yet.

Visualizing state changes
^^^^^^^^^^^^^^^^^^^^^^^^^

But let's try something else before we connect the component to a template. We need another action
to switch the language - let's call it ``changeLanguage()`` and define a function for it right after the
``initialState()`` function.

``js/app.js``

.. code-block:: js
    :linenos:
    :lineno-start: 50

    ...

        builder.addAction('changeLanguage', function (lang) {
            var state = {
                language: {
                    selected: lang,
                    available: ['de', 'en']
                },
                menu: {
                    about: '#about',
                    contact: '#contact',
                    register: '#register',
                    login: '#login'
                },
                translation: TRANSLATIONS[lang]
            };
            return state;
        });

        var nav = builder.build('#nav');
        nav.initialState();

        var currentLanguage = 'en';
        window.setInterval(function() {
            currentLanguage = currentLanguage == 'en' ? 'de' : 'en';
            nav.changeLanguage(currentLanguage);
        }, 3000);

    });

If we run this example, the component should change the language from English to German back and forth every
3 seconds. A timer triggers the action "changeLanguage()" with  different inputs altering the state of
the component from one state to the other. Accordingly the visual representation changes as well. Note that,
this happens without any further DOM manipulation by the developer.

Adding an HTML template
^^^^^^^^^^^^^^^^^^^^^^^

Let's connect an HTML template to have a real visual representation for the navigation menu. First we define
the template in a separate HTML file and load this file later.

``html/nav.html``

.. code-block:: html
    :linenos:

    <!DOCTYPE html>
    <html>
    <body>
    <template>
        <div class="main-navigation">
            <ul class="menu">
                <li><a href="{{menu.about}}">{{translation.about}}</a></li>
                <li><a href="{{menu.contact}}">{{translation.contact}}</a></li>
                <li><a href="{{menu.register}}">{{translation.register}}</a></li>
                <li><a href="{{menu.login}}">{{translation.login}}</a></li>
            </ul>
            <ul class="language">
                <li><a href="#!" lang="en">English</a></li>
                <li><a href="#!" lang="de">Deutsch</a></li>
            </ul>
        </div>
    </template>
    </body>
    </html>

Compnent.js uses the Handlebars template engine (s. http://handlebarsjs.com) and applies the current
state as context to the template. In short, there are placeholders which are enclosed in moustache like
braces which correspond to the properties of the state object. For instance, the state object holds
a property ``menu`` which is an object itself. The ``menu`` object contains the properties ``about``, ``contact``
etc. which hold the link targets for the menu item. In the template these link targets are referenced
by the placeholders ``{{menu.about}}``  and ``{{menu.contact}}``.

Let's load the template into a variable and pass it to the builder. This connects the template
to the component. In the following code block we show the complete file ``js/app.js`` omitting some
details for brevity and a better overview.

``js/app.js``

.. code-block:: js
    :linenos:

    require.config({
        paths: {
            ...
        }
    });

    require(['cargo.Component'], function (Component) {

        ...

        Component.template("html/nav.html").then(function(template) {
            var builder = new Component();

            builder.addAction('initialState', function () {
                ...
            });

            builder.addAction('changeLanguage', function (lang) {
                ...
            });
            builder.withTemplate(template);
            var nav = builder.build('#nav');
            nav.initialState();

            var currentLanguage = 'en';
            window.setInterval(function() {
                currentLanguage = currentLanguage == 'en' ? 'de' : 'en';
                nav.changeLanguage(currentLanguage);
            }, 3000);
        });

    });

Component.js has a function ``template()`` which receives an URL as argument. The function
loads and compiles the file from the URL. Because loading the file is an asynchronous operation,
the function returns a Promise (see :doc:`module_promise`) which is fulfilled with the compiled template.
The compiled template is then passed to the builder by ``withTemplate()`` and used by the component
to render the visual representation.

If we run the code so far, a (rather unstyled) HTML representation of the navigation menu should
be displayed in the web page. It consists of two unnumbered lists - one for the menu itself and
another for the language options. The language should change every 3 seconds from English to German
back and forth all over again as the state of the component is changed via the action ``changeLanguage()``.

Adding interactivity
^^^^^^^^^^^^^^^^^^^^

To add some interactivity, lets remove the timer and add a click handler to the language menu instead.
We could add the click handler in ``js/app.js`` as soon as the component has rendered but there are
two problems with this approach. First, we have no way to determine when the HTML finishes rendering and
cannot register the event handler before the respective elements have been attached to the DOM.

The second problem may be even more important. Adding event handlers outside of the template, loses us
some flexibility. The event handler has to be attached to some specific element defined in the template.
If we reference this element **outside** of the template, we cannot change the template without
at least paying attention to the HTML code and checking back the references.

The cleaner approach would be not to reference the component's DOM within its Javascript code at all.
That's why we provide a way to define event handlers and DOM related stuff **in the HTML template**. Let's
see it in our example template:

``html/nav.html``

.. code-block:: html
    :linenos:
    :emphasize-lines: 18-24

        <!DOCTYPE html>
        <html>
        <body>
        <template>
            <div class="main-navigation">
                <ul class="menu">
                    <li><a href="{{menu.about}}">{{translation.about}}</a></li>
                    <li><a href="{{menu.contact}}">{{translation.contact}}</a></li>
                    <li><a href="{{menu.register}}">{{translation.register}}</a></li>
                    <li><a href="{{menu.login}}">{{translation.login}}</a></li>
                </ul>
                <ul class="language">
                    <li><a href="#!" lang="en">English</a></li>
                    <li><a href="#!" lang="de">Deutsch</a></li>
                </ul>
            </div>
        </template>
        <script class="attach">
            var component = this;
            $(node).find("ul.language li a[lang]").on('click', function() {
                var lang = $(this).attr('lang');
                component.changeLanguage(lang);
            });
        </script>
        </body>
        </html>

There is a ``script`` tag in the body of the template with the class ``attach``. This script
is executed **once** when the component is attached to the DOM. It is the right place to
setup event handlers and other DOM related things that need to be executed before the
component is used. There are two more script classes  - ``update`` and ``detach``. ``update``
is executed whenever the component is re-rendered on state changes and ``detach`` is called
once when the component is destroyed.

In the execution context of these scripts, ``this`` is defined as a reference to the component and
a special variable ``node`` is defined as a reference to the DOM node of the component. You
can use ``this`` to access all actions of the component and trigger some interactive behaviour.

Conclusion
^^^^^^^^^^

By separating the component's behaviour from its visual appearance and by accessing the
behaviour through *actions* as a well-defined interface, we think that we provided a
solution for writing large GUI applications in a more comprehensive and more concise manner.

We use modern concept's from the Javascript world like Promises, Flux and React-style
application architecture to provide a clear data flow between the applications model
and it's visual representation and try to avoid the syntactical overhead of JSX.

Our approach is very close to the up-coming "Web components" technology and may easily we
transformed into a programming model making use of them.

Please feel free to check the API documentation for a more in-depth look at our technology.

API documentation
-----------------

The Builder
^^^^^^^^^^^

With Component.js components are build from a builder. The builder configures the component
and provides a ``build()`` function to actually construct an instance of the component. The same
builder can be re-used to construct different instances.

Constructor
"""""""""""

``var builder = new Component(options)``

Creates a builder instance.

**Parameters**

``options``

    Object which represents the configuration of the builder. All configuration options can
    be set with a corresponding configuration method (s. below). Using configuration
    methods is more verbose and more concise.

.. code-block:: js

    {
        template: ...,
        actions: ...,
        subscriptions: ...,
    }
..

    See the configuration methods ``withTemplate()`` and ``withActions()``. The option
    ``subscription`` takes an array of callbacks and models for the component to subscribe to. See
    ``subscribe`` for a detailed description about the array items.

Example options:

.. code-block:: js

    {
        template: function(state) { /* ... */  return html; },

        actions: { action1: function() {
                            /* ... */
                            return newState;
                        }
        },

        subscriptions: [
            { model: model1, callback: function() { /* ... */ } }
        ]

    }



**Return value**

    A new builder instance.

Method: withTemplate(templateFn)
""""""""""""""""""""""""""""""""

``builder.withTemplate(templateFn)``

Sets a template function which transforms a state object into the HTML representation of the component.
If no template function is configured, the component renders a JSON representation of its current state
into an empty ``<pre class="_componentState">`` element.

**Parameters**

``templateFn``

    Usually the result of ``Component.template(URL)`` but basically any function that transforms the current state
    into its visual representation can be used:

    ``var html = templateFn(state);``

    The template function takes the current component state as input parameter and returns the HTML
    representation of the component. Additionally some special callbacks can be attached to the template
    function as properties (see below for details).

.. code-block:: js

    var templateFn = function(state) {
        /*...*/
        return html;
    };

    templateFn.attach = function(node) {
        /* ... */
    };

    templateFn.update = function(node) {
        /* ... */
    };

    templateFn.detach = function(node) {
        /* ... */
    };

    builder.withTemplate(templateFn);
..

    The template function may optionally have the properties ``attach``, ``update`` and ``detach``. If these
    properties are defined as functions, they are executed on certain events in the life-cycle
    of the component.

    attach(node)
        This method is called once when the component has been attached to the DOM. The ``node`` parameter
        receives the current DOM node of the component. The ``this`` context is set to the current
        instance of the component and exposes the component's actions.

    update(node)
        This method is called after the component is re-rendered. This usually takes place,
        when the state of the component changes. The ``node`` parameter
        receives the current DOM node of the component. The ``this`` context is set to the current
        instance of the component and exposes the component's actions.

    detach(node)
        This method is called before the component is removed from the DOM. This usually takes place,
        when the state of the component enters the dead state (see :doc:`module_model`). The ``node``
        parameter receives the current DOM node of the component. The ``this`` context is set to the
        current instance of the component and exposes the component's actions.

**Return value**

This builder instance for method chaining.

Method: addAction(name, action)
"""""""""""""""""""""""""""""""

``builder.addAction(name, actionFn)``

Adds an action to the component's state model. The component exposes **actions** to the outside
world as the only means of interaction. For instance, if the component is an unnumbered list of items,
it would expose actions for adding new items and removing items to the outside world. No further
interaction with the component is possible than by the defined actions. The actions are exposed in the
form of functions in an object:

.. code-block:: js
    :linenos:
    :emphasize-lines: 2,9

    var builder = new Component();
    builder.addAction("addItem", function(item) {
        ...
        items.push(item);
        return items;
    });

    var component = builder.build("#list");
    component.addItem("Item 1");
..

**Parameters**

``name``

    The name of the action.

``actionFn``

    The action function which returns the new state of the component after the action has been performed.

    The ``this`` context bears a function ``state()`` which returns the current state of the component.
    Additionally it holds a ``model`` property which is set to the current instance of the component allowing
    to trigger other actions of the same component.

    The return value of the action function is the new state of the component.

.. code-block:: js
    :emphasize-lines: 2,8

    var initalState = function() {
        return { items: [] };
    };

    var addItem = function(item) {
        var state = this.state();
        state.items.push(item);
        return state;
    };

    var builder = new Component();
    builder.addAction("initialState", initialState);
    builder.addAction("addItem", addItem);

    var component = builder.build("#list");
    component.initialState();
    component.addItem("Item 1");
    component.addItem("Item 2");
..

**Return value**

This builder instance for method chaining.

Method: withActions(actions)
""""""""""""""""""""""""""""

``builder.withActions(actions)``

Sets and replaces the configured actions of this builder instance.

**Parameters**

``actions``

An object containing all actions for the component at once. This method is
the equivalent of repeatingly calling ``addAction(name, actionFn)`` with
different actions. The keys of the ``actions`` object are `the `name`` parameters
and the values of the object are the ``actionFn`` parameters.

**Return values**

This builder instance for method chaining.

Method: subscribe(model, callback)
""""""""""""""""""""""""""""""""""

Subscribes this component to another model (see :doc:`module_model`) which influences the
state of this component from the outside. The ``subscribe()`` method provides a way
to "connect" components with each other. An example could be a navigation menu which
reacts on language selections from a settings menu.

**Parameters**

``model``

    Another model to subscribe to receive updates on its state changes.

``callback``

    A method which receives the new state of ``model`` as input. It is meat to react
    on changes of the ``model`` by calling actions of this component.

    The ``this`` context within the callback is the instance of the current component.

**Return value**

This builder instance for method chaining.

Method: build(selector)
"""""""""""""""""""""""

``var component = builder.build('#element');``

Creates an instance of the component which was previously configured by the methods
described above. The instance is attached to the DOM to the elements described by
``selector``.

The ``build()`` instance can be called more than once to create different instances
of the component with the same configuration.

**Parameters**

``selector``

    A jQuery selector which defines the elements to which the component is attached. If
    more than one element is selected by the selector all of them are replaced in the DOM.
    Usually only one element should be replaced.

Static Functions
^^^^^^^^^^^^^^^^

Component.template(URL)
"""""""""""""""""""""""

Loads and compiles an HTML file from the specified URL. The result is meant to be
used as an argument to the method ``builder.withTemplate()``. Note that this is
an asynchronous operation which does not return the result directly. Instead
a promise (see :doc:`module_promise`) is returned which is fulfilled with the compiled
template.

**Parameters**

``URL``

The URL of an HTML template file. The template file must carry a ``<template>`` element containing
the actual HTML code of the component in the documents body. Handlebars (see http://www.handlebarsjs.com) is used
as template engine.

Additionally the ``<body>`` element can contain optional ``<script>`` tags with the classes ``attach``,
``update`` and ``detach``. See the ``templateFn`` parameter of the ``builder.withTemplate()`` method
for details.

Example:

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <body>
        <template>
            <div class="main-navigation">
                <ul class="menu">
                    <li><a href="{{menu.about}}">{{translation.about}}</a></li>
                    <li><a href="{{menu.contact}}">{{translation.contact}}</a></li>
                    <li><a href="{{menu.register}}">{{translation.register}}</a></li>
                    <li><a href="{{menu.login}}">{{translation.login}}</a></li>
                </ul>
                <ul class="language">
                    <li><a href="#!" lang="en">English</a></li>
                    <li><a href="#!" lang="de">Deutsch</a></li>
                </ul>
            </div>
        </template>
        <script class="attach">
            var component = this;
            $(node).find("ul.language li a[lang]").on('click', function() {
                var lang = $(this).attr('lang');
                component.changeLanguage(lang);
            });
        </script>
        <script class="update">
            /* ... */
        </script>
        <script class="detach">
            /* ... */
        </script>
    </body>
    </html>

**Return value**

A promise which is fulfilled with the compiled template function to be used with ``withTemplate()`` method
of the builder. If an error occurs during the load process or if the template file cannot be parsed,
the promise is rejected with a meaningful error message.

The Component instance
^^^^^^^^^^^^^^^^^^^^^^

The ``build()`` method of the builder creates an instance of the component defined by
the builder configuration. The instances is a model of the type described in :doc:`module_model`.

Accordingly it exposes all defined actions as methods to the outside world.
Example:

.. code-block:: js

    var navMenu = new Component()
        .withTemplate(/* ... */)
        .addAction("init", function() { /* ... */ return state; })
        .build('#nav');

    navMenu.init();
..

Furthermore it can be subscribed to by using the instance as a function.

.. code-block:: js

    var subscriber = function(navMenuState) { /* ... */ };
    var unsubscribe = navMenu(subscriber);
    /* ... */
    unsubscribe();

The instance of the component is an instance of :doc:`module_model`. Details about
Model.js can be found there.

