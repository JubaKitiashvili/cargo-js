Module: Component
=================

.. highlight:: js
   :linenothreshold: 5

Overview
--------

This module provides a GUI Component programming model for web application. It is inspired by Facebook's
React (https://facebook.github.io/react/) and uses a Virtual DOM implementation for its rendering engine. While it
follows the general ideas of React, it does some things very differently.

A Component represents a GUI element. It is conceived of a current state and its visual representation.
Let's assume a GUI element for a navigation menu. The navigation menu contains some menu items which
direct the user to different parts of the web application. Additionally it contains a "Change language"
dropdown that let's the user choose a translation for the web application. If the user switches to another language,
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
triggered through a well-defined set of **state transitions** and the automated process of
transforming the state to its visual representation is triggered whenever a state transition occurs.

In practical terms, the Component exposes a render function which receives the current state and creates a
HTML representation. This representation is compared to the current state of the DOM tree which is altered
to match the new representation.

.. code-block:: none

    current state -> render() -> new HTML -> diff'ed to DOM -> patch the DOM


Dependencies
------------

This module uses the following libraries and modules:

=============== =================================================== ==================
Module          Repository                                          AMD module alias
=============== =================================================== ==================
morphdom        https://github.com/patrick-steele-idem/morphdom     morphdom
superagent      https://github.com/visionmedia/superagent           superagent
jQuery          https://jquery.com                                  $
underscore      http://underscorejs.org/                            _
=============== =================================================== ==================

All dependencies are provided in the ``dist`` directory at https://github.com/datenwelt/cargo-js.git. Additionally
an implementation of the Promise/A+ specification is needed (which is provided by all modern browsers).


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

        js/lib/third-party/jquery.js
        js/lib/third-party/morphdom.js
        js/lib/third-party/requirejs.js
        js/lib/third-party/superagent.js
        js/lib/third-party/handlebars.js
        js/lib/third-party/underscore.js

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
			'morphdom': 'lib/third-party/morphdom',
			'Handlebars': 'lib/third-party/handlebars',
			'superagent': 'lib/third-party/superagent'
			'underscore: 'lib/third-party/underscore
		}
	});

	require(['cargo.Component'], function(Component) {

	});

Next we define a global object ``TRANSLATIONS`` containing the English and German translations to
have them at hand when needed.

``js/app.js``

.. code-block:: js
	:linenos:
	:lineno-start: 11

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
	:lineno-start: 28

	/* ... */

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

	var component = new Component();
	var renderer = component.attach('#id');
	renderer.render(state);

In line 50-51 we attach the component to the ``<nav id="nav">`` element. Attaching the component to the DOM
marks the selected nodes - in this case the ``<nav> `` element - as rendering targets for a renderer which is
returned by the ``attach()`` method. This renderer has a method ``render()`` which receives the current state and
renders its HTML representation to the DOM.

If we run this example, we should see the current state as a JSON representation at the place where the placeholder
``<nav>`` element was. That is the default behaviour of a component when it is not tied to a template yet.

Visualizing state changes
^^^^^^^^^^^^^^^^^^^^^^^^^

But let's try something else before we connect the component to a template. We change the state and watch the GUI
update the ``<nav`` element accordingly. We can attach another rendering operation with a different state inside a timer.

``js/app.js``

.. code-block:: js
	:linenos:
	:lineno-start: 46

	/* ... */

	window.setInterval(function() {
		state.language.selected = state.language.selected === 'en' ? 'de' : 'en';
		state.translation = TRANSLATIONS[state.language.selected];
		renderer.render(state);
	}, 3000);

If we run this example, the component should change the language from English to German back and forth every
3 seconds. A timer changes the state within the callback and calls the ``render()`` with the new state. Accordingly the
visual representation changes as well. Note that, this happens without any direct DOM manipulation.

Adding an HTML template
^^^^^^^^^^^^^^^^^^^^^^^

Let's connect an HTML template to have a real visual representation for the navigation menu. First we define
the template in a separate HTML file and load this file.

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

Component.js uses the Handlebars template engine (s. http://handlebarsjs.com) and applies the current
state as context to the template. In short, there are placeholders which are enclosed in moustache like
braces which correspond to the properties of the state object. For instance, the state object holds
a property ``menu`` which is an object itself. The ``menu`` object contains the properties ``about``, ``contact``
etc. which hold the link targets for the menu item. In the template these link targets are referenced
by the placeholders ``{{menu.about}}``  and ``{{menu.contact}}``.

Let's load the template into a variable and pass it to the builder. This connects the template
to the component. In the following code block we show the complete file ``js/app.js`` omitting some
details for brevity and a better overview.

Additionally we add a method to the renderer which changes the language.

``js/app.js``

.. code-block:: js
    :linenos:

	require.config({
		paths: {
			/* ... */
		}
	});

	require(['cargo.Component', 'cargo.Template'], function (Component, Template) {

		/* ... */

		Template.load("html/nav.html").then(function(template) {
            var comp = new Component(template);
			var state = { /* ... */ };
			var renderer = comp.attach('#nav');

			renderer.changeLanguage = function(lang) {
				state.language.selected = lang;
				state.translation = TRANSLATIONS[lang];
				return renderer.render(state);
			};

			window.setInterval(function() {
				var lang = state.language.selected === 'en' ? 'de' : 'en';
				renderer.changeLanguage(lang);
			}, 3000);
		});

	});

The ``Template`` module of Component.js has a static function ``load()`` which receives an URL as argument.
The function loads and compiles the file from the URL. Because loading the file is an asynchronous operation,
the function returns a Promise which is fulfilled with the template instance which can be used as input
to the ``Component`` constructor.

If we run the code so far, a (rather unstyled) HTML representation of the navigation menu should
be displayed in the web page. It consists of two unnumbered lists - one for the menu itself and
another for the language options. The language should change every 3 seconds from English to German
back and forth all over again.

Adding interactivity
^^^^^^^^^^^^^^^^^^^^

To add some interactivity, lets remove the timer and add a click handler to the language menu instead.
We could add the click handler in ``js/app.js`` as soon as the component has rendered but there are
two problems with this approach. First, we have no way to determine when the HTML finishes rendering and
cannot register the event handler before the respective elements have been attached to the DOM.

The second problem may be even more important. Adding event handlers outside of the template, loses us
some flexibility. The event handler has to be attached to some specific element defined in the template.
If we reference this element **outside** of the template, we cannot change the HTML without
at least paying attention to the Javascript code and checking back the references between both files.

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
			var renderer = this;
			$(node).find("ul.language li a[lang]").on('click', function() {
				var lang = $(this).attr('lang');
				renderer.changeLanguage(lang);
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

In the execution context of these scripts, ``this`` is defined as a reference to the renderer and
a special variable ``node`` is defined as a reference to the DOM node of the component. You
can use ``this`` to access all methods of the renderer and trigger some interactive behaviour.

Conclusion
^^^^^^^^^^

By separating the component's behaviour from its visual appearance and by accessing the
behaviour through **state transitions** as a well-defined interface, we think that we provided a
solution for writing large GUI applications in a more comprehensive and more concise manner.

We use modern concept's from the Javascript world like Promises, Flux and React-style
application architecture to provide a clear data flow between the applications model
and it's visual representation and try to avoid the syntactical overhead of JSX.

Our approach is very close to the up-coming "Web components" technology and may easily be
transformed into a programming model making use of them.

Please feel free to check the API documentation for a more in-depth look at our technology.

API
---

constructor: new Component(options)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    var component = new Component(
        {
            renderState: function(state) { return "<h1>...</h1>"; },
            onAttach: function(node) {},
            onUpdate: function(node) {},
            onDetach: function(node) {}
        }
    );

Creates a new instance of ``Component``. The first and only argument to the constructor is an object with the follwing
options.

**Parameter: options**

``options.renderState``

A template function which receives the current state as input and renders an HTML string as return value. Most template
engines e.g. Handlebars provide such a function. The HTML must consist of exactly one element which may contain an
arbitrary number of child nodes. Whitespace before and after this element is removed.

If no ``renderState`` method is provided, the DOM node is rendered as a ``<PRE>`` element containing a JSON representation
of the current state.

``options.onAttach``

A callback function which is called once when the first rendering happened and the original DOM node has been
replaced with the rendered HTML. The ``this`` keyword is the ``Renderer`` instance of the component. The first parameter
to ``onAttach`` is the DOM node which has been rendered. If the CSS selector of the component includes more than one
DOM node, the ``onAttach`` callback is called once for each DOM node.

The ``onAttach`` callback can be used to register event handlers to the DOM node.

``options.onUpdate``

A callback function which is called whenever the component's DOM node has been
rendered and updated within the DOM. This includes the first rendering **after** ``onAttach`` has been called.
The ``this`` keyword is the ``Renderer`` instance of the component. The first parameter to ``onUpdate`` is the DOM node
which has been rendered. If the CSS selector of the component includes more than one DOM node, the ``onUpdate`` callback
is called once for each DOM node whenever the node is updated.

``options.onDetach``

A callback function which is called once when the component's DOM node has removed from the DOM. The ``this`` keyword
is the ``Renderer`` instance of the component. The first parameter to ``onDetach`` is the DOM node which has been
rendered. If the CSS selector of the component includes more than one DOM node, the ``onDetach`` callback is called
once for each DOM node.

The ``onDetach`` callback can be used to remove any event listeners previously registered in the ``onAttach`` callback.

static: Template.load(templateURL, options)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    var handlebars = Handlebars.create();
    handlebars.registerHelper(/*...*/);

    Template.load("template.html", handlebars).then(function(template) {
        var comp = new Component(template);
        comp.attach('#id');
        /* ... */
    });

Loads a template file and creates a Component instance based on it. The template file is an HTML file and should
contain a ``<template id="template">`` element with an Handlebars template enclosed. This template is automatically
compiled using the (optionally provided) Handlebars environment from the second parameter. If this parameter is omitted,
the default environment is used. The resulting template function is used for rendering the state of the component.

Additionally the template file may contain ``<script>`` elements containing an ``attach``, ``update`` or ``detach`` callback.
There must be one ``<script>`` element per callback with a class set to "attach", "update" or "detach" respectively.

.. code-block:: html

    <script class="attach">
        console.log("Attach callback has been called.");
    </script>

Since loading the template file is an asynchronous operation, this function returns a Promise which resolves with
the component instance.

Example template file.

.. code-block:: html

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Title</title>
    </head>
    <body>
    <template id="template">
        <ul class="dropdown-content blue-grey white-text">
            <li class="divider"></li>
            <li><a lang="en" href="javascript:false;" class="white-text">English / English</a></li>
            <li><a lang="de" href="javascript:false;" class="white-text">German / Deutsch</a></li>
        </ul>
    </template>
    <script class="attach">
        $('.dropdown-button').filter('[data-activates="language-menu"]').dropdown();
        $(node).on('click', function(e) {
            var lang = $(e.target).attr('lang');
            if ( lang ) this.select(lang);
        }.bind(this));
    </script>
    <script class="detach">
        $(node).off('click');
    </script>
    </body>
    </html>

**Parameters**

``templateURL``

The URL of the template file which can be absolute or relative to the base URI of the website.

``options`` (optional)

An options object to specify further dependencies and parameters for loading and compliling the template.

``options.handlebars`` (optional)

A Handlebars environment to use for compiling the template section of the file. (A separate environment can be retrieved
from ``Handlebars.create()``.) If this parameter is omitted, the default Handlebars environment is used.


**Return value**

A Promise which resolves with the ``Component``instance, when the template file has been loaded and compiled. If the file
cannot be loaded or fails compiling, the Promise is rejected with an ``Error`` instance.

component.attach(selector)
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    var component = new Component();
    var renderer = component.attach('#id');

Attaches the component to one or more DOM nodes and returns an instance of the rendering engine. The ``selector`` parameter
is an CSS selector which can target one ore more nodes. If more than one node is targeted all nodes are replaced and
rendered with the HTML from the rendering engine. The ``component.attach()`` method does not replace the DOM node
and does no rendering yet. It marks the targeted DOM nodes as rendering targets and prevents them from being used as
targets for other components. The first rendering takes place with the first call of the rendering method by the rendering
engine.

**Parameters**

``selector``

A CSS selector which determines the target nodes of the DOM tree.

**Return value**

A ``Renderer`` instance which holds the ``render(state)`` method to use for the actual rendering.

**Exceptions**

This method throws an ``Error`` instance in one of the following conditions:

1. The CSS selector is missing.
2. The CSS selector does not target any DOM nodes.
3. If one ore more of the targeted nodes are already attached to a component.

Renderer: renderer.render(state)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    var component = new Component(/* ... */);
    var renderer = component.attach('#id');
    renderer.render( { visible: true });

The instance ``renderer`` is the return value of the ``component.attach()`` method and contains a ``render()`` method.
This method renders an HTML representation of the ``state`` input. The input should be a plain Javascript object or
anything else which can be used by the ``template`` function passed to the Component constructor.

If the input is an object with a ``this.toJS()`` method, it is called to convert the input to a native Javascript
data structure. The ``toJS()`` method is available in instances of the ``State`` API from :doc:`module_model` which makes
them a perfect input for the ``render()`` method.

Because rendering to the DOM tree is an asynchronous operations, the return value is a Promise which resolves with the
actual Javascript data structure that has been used for rendering (which may be different from the ``state`` input).

**Parameters**

``state``

The state object to render. If this is an object has a ``toJS()`` method, it is called and the return value is used for
rendering. If ``state`` is omitted or ``undefined``, no rendering takes place. If ``state`` is an instance of ``Error``
no rendering takes place and the Promise is rejected with that error.

**Return value**

A Promise which resolves with the actual state object that has been used for rendering. The Promise is resolved when
the rendering completed.

Renderer: renderer.detach()
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    var component = new Component(/* ... */);
    var renderer = component.attach('#id');

    /* ... */

    renderer.detach();


Destroys the component by replacing the DOM nodes with the original DOM nodes from before the first rendering. No more
rendering takes place after ``detach()`` has been called.

**Parameters**

This method takes no parameters.

**Return value**

This method does not return anything.
