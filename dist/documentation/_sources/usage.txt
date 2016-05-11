.. highlight:: js

General Usage
=============

All modules are provided with an UMD-style wrapper and can be used as AMD modules (like with
requirejs) and as browser globals. When used as globals the modules are installed into a specific namespace
to not collide with other libraries.

Usage with requirejs
--------------------

The modules can be used like any other module with requirejs. They are dependent on each other
and expected to go by the alias "cargo.MODULENAME" to avoid name collision with other
libraries - e.g. for Promise.js it's "cargo.Promise".

Here is a sample path config for requirejs assuming the modules are stored in a sub directory
``lib/``::

    require.config({
        paths: {
            // ...
            'cargo.Promise': 'lib/promise',
            'cargo.Model': 'lib/model'
            // ...
        }
    });

And later in one of your modules::

    define(['cargo.Promise', 'cargo.Model'], function(Promise, Model) {

        var model = new Model({ /* ... */ });
        var p = new Promise(function(resolve, reject) { /* ... */ });

        // ...
    });

Usage as browser globals
------------------------

When used in a global context, the modules are installed in a separate namespace called ``cargo``. Make
sure to load the Javascript files and all dependencies in your HTML

.. code-block:: html

    <html>
    <body>
        <script type="text/javascript" src="js/promise.js"></script>
        <script type="text/javascript" src="js/model.js"></script>
        <script type=text/javascript">

            var model = new cargo.Model({ /* ... */ });
            var p = new cargo.Promise(function(resolve, reject) { /* ... */ });

            //...

        </script>
    </body>
    </html>

Dependencies
------------

Some modules depend on third-party libraries like jQuery or underscore. All required third-party modules are
provided in the ``dist/dependencies`` directory but you are highly encouraged to maintain your own dependency tree (for instance
with bower or/and npm) and use the modules from there.

All modules fail early if a dependency is missing on initialization. So when in doubt which dependencies to
provide, just try to use the module and read the errors. Additionally dependencies are documented in the
respective module documentation.

