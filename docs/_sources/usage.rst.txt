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
libraries - e.g. for Model.js it's "cargo.Model".

Here is a sample path config for requirejs assuming the modules are stored in a sub directory
``lib/``::

    require.config({
        paths: {
            // ...
            'cargo.Model': 'lib/model'
            // ...
        }
    });

And later in one of your modules::

    define(['cargo.Model'], function(Model) {

        var model = new Model({ /* ... */ });

        // ...
    });

Usage as browser globals
------------------------

When used in a global context, the modules are installed in a separate namespace called ``cargo``. Make
sure to load the Javascript files and all dependencies in your HTML

.. code-block:: html

    <html>
    <body>
        <script type="text/javascript" src="js/model.js"></script>
        <script type=text/javascript">

            var model = new cargo.Model({ /* ... */ });

            //...

        </script>
    </body>
    </html>

Usage in Node.js
----------------

When used in Node.js, the most convenient way is to ``npm install`` from the Github repository and ``require`` the project.
All modules are exported in one object with each module in a separate property::

    npm install https://github.com/datenwelt/cargo-js

The project is about to be published on NPM and can be installed through ``npm install cargo-js`` later.

Here is how to use the modules in your source:

.. code-block:: js

    var cargo = require('cargo-js');

    var Model = cargo.Model;
    var Component = cargo.Component;
    var Template = cargo.Template;
    var Translation = cargo.Translation;

Dependencies
------------

Some modules depend on third-party libraries like jQuery or underscore. All required third-party modules are
provided in the ``dist/dependencies`` directory but you are highly encouraged to maintain your own dependency tree
(for instance with bower) and use the modules from there.

All modules fail early if dependencies are missing on initialization. So when in doubt which dependencies to
provide, just try to use the module and read the errors. Additionally dependencies are documented in the
respective module documentation.

