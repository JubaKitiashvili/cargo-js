Module: Translation
===================

.. highlight:: js
   :linenothreshold: 5

Overview
--------

This module provides I18N features as a :doc:`module_model` instance and automates loading translations from language
files. The translation is organized as a directory tree under a configurable base URI. Translation files are loaded
upfront and guaranteed to be ready before the first state transition happens.

.. code-block:: js

    var trans = new Translation();
    trans.select("en");

The example above loads the translation from ``locales/en/translation.json`` relative to the current HTML file. The
translation file should be a file with a JSON object.

.. code-block::js

    { "GREETING": "Hello World!" }

Because ``trans`` is an instance of :doc:`module_model` and its state is the selected translation, the translation
can be subscribed to:

.. code-block:: js

    var unsubscribe = trans(function(t) {
        console.log(t.GREETING);
    });

Translation files
^^^^^^^^^^^^^^^^^

Organize your translation files in a hierarchical manner under ``locales``. Each languages should go into a separate
directory. Each translation can go by a unique filename called a ``namespace``. Default namespace is ``translation``.

.. code-block:: none

   locales/
        en/
            translation.js
            login.js
        en_us/
            login.js
        de/
            translation.js
            login.js

In this example we have two namespaces - "translation" and "login" - and three languages "en", "en_us" and "de". The language
"en_us" is a more specific version of the language "en". Note that there is no file for the "translation" namespace for
US English. That's ok because :doc:`module_translation` uses the less specific variant if there is no suitable language file.
If "en_us" is selected for the "translation" namespace, "en" is used instead. Additionally, if a non-existent or unimplemented language
is selected the default language is selected.

Namespaces, base URI and default languages are configurable through the constructor.

Dependencies
------------

This module uses the following libraries and modules:

=============== =================================================== ==================
Module          Repository                                          AMD module alias
=============== =================================================== ==================
Promise         https://github.com/datenwelt/cargo-js.git           cargo.Promise
Model           https://github.com/datenwelt/cargo-js.git           cargo.Model
superagent      https://github.com/visionmedia/superagent           superagent
underscore      https://github.com/jashkenas/underscore             _
=============== =================================================== ==================

All dependencies are provided in the ``dist`` directory at https://github.com/datenwelt/cargo-js.git.

API documentation
-----------------

Constructor
^^^^^^^^^^^

``var trans = new Translation(options)``

**Parameters**

``options``

    An object which configures the current instance of the translation. The following options are supported:

.. code-block:: js

    {
        baseURI: 'locales/',
        namespace: 'translation',
        languages: ['en'],
        defaultLang: 'en',
    }


options.baseURI (string)
""""""""""""""""""""""""

The base URI where the translation files are located. The default location is "locales/" relative
to the current HTML file. If the current document location ends with a file extension (like .html
.php) it is assumed that the current location is a file and the corresponding folder is used as
base for the "locales/" folder. Example: ``http://localhost/index.html`` resolves to ``http://localhost/locales/``.

options.namespace (string)
""""""""""""""""""""""""""

Determines the filename for the translation files. A namespace of "login" would result in translation files
to be expected at ``{baseURI}/{lang}/login.json``.

options.languages (array)
"""""""""""""""""""""""""

An array with languages to load. Languages can be unspecific like "en" or more specific like "en_us". The latter
form describes the language English in its US American variant. If there is no unspecific variant for a language,
the first specific variant takes its place. Note that this module does not fail if one or more of the languages
don't load. The best guess is used in place which is the unspecific language if a specific variant is missing and
the default language if the unspecific variant is missing too. If the default language fails to load, the resulting
translation object is empty.

options.defaultLang (string)
""""""""""""""""""""""""""""

The default language to use when loading or selecting a language fails and no unspecific variant is available.

**Return value**

    A new translation instance which is an instance of :doc:`module_model`. The state of the model is the currently
    selected translation.

Method: select(lang)
^^^^^^^^^^^^^^^^^^^^

``trans.select(lang)``

Selects a language. If the language is a specific variant like "en_US" or "de_AT" the next unspecific variant is
tried ("en" or "de"). If the unspecific variant is unavailable, the default language is used. If the default
language is unavailable, an empty translation is used. Since this module is an instance of :doc:`module_model`,
calling this method triggers a state transition.

Loading the translations is an asynchronous process which may not be completed before ``select()`` is called. If
``select()`` is called before loading has finished, the language selection is deferred until the loading completes. No
state transition is triggered before the loading finishes.

**Parameters**

``lang``

A string with the language code like "en" or "en_us".

**Return value**

A promise which resolves with the new state after the state transition.

