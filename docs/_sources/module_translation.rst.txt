Module: Translation
===================

.. highlight:: js
   :linenothreshold: 5

Overview
--------

This module provides I18N features and automates loading translations from language
files. The translation is organized as a directory tree under a configurable base URI. Translation files are loaded
upfront and guaranteed to be ready before the first translation happens.

.. code-block:: js

    var trans = new Translation();
    trans.select("en");

The example above loads the translation from ``locales/en/translation.json`` relative to the current HTML file. The
translation file should be a file with a JSON object.

.. code-block:: js

    { "GREETING": "Hello World!" }

All methods are asynchronous operations and return a ``Promise`` which resolves with a translation function. The translation
function can be used to translate keywords to a phrase in the according language.

.. code-block:: js

    trans.select("en").then(function(_t) {
        var str = _t("GREETING"); // "Hello World!"
    ));

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
superagent      https://github.com/visionmedia/superagent           superagent
underscore      https://github.com/jashkenas/underscore             _
=============== =================================================== ==================

All dependencies are provided in the ``dist`` directory at https://github.com/datenwelt/cargo-js.git. Additionally
:doc:`module_translation` depends on a Promise/A+ implementation with an implementation of the ``Promise.all`` method.

API
---

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

    A new translation instance with the following methods.

The translation function
^^^^^^^^^^^^^^^^^^^^^^^^

All methods changing the configuration of the translation instance return a Promise which resolves with the **translation
function**. The translation function receives the key as a mandatory argument selecting the phrase from the JSON object
within the translation files. The second parameter is an optional namespace which maps to the name of the corresponding
JSON file holding that JSON object. If the second parameter is omitted, the default namespace ``translation`` is used.

.. code-block:: js

    var trans = new Translation( { /* ... */ });
    trans.select('en').then(function(_t) {
        var str = _t("submit", "login");
    });

In this example the language "en" is selected and the Promise resolves with the translation function ``_t()``. That
function is called with the key ``"submit"`` from the namespace ``"login"``. The corresponding JSON object is loaded from
the file ``./locales/en/login.json`` and the value of its property ``"submit"`` is used as the translated phrase.

Method: select(lang)
^^^^^^^^^^^^^^^^^^^^

``trans.select(lang)``

Selects a language. If the language is a specific variant like "en_US" or "de_AT" the next unspecific variant is
tried ("en" or "de"). If the unspecific variant is unavailable, the default language is used. If the default
language is unavailable, an empty translation is used.


**Parameters**

``lang``

A string with the language code like "en" or "en_us".

**Return value**

A promise which resolves with a translation function.

trans.select(lang)
^^^^^^^^^^^^^^^^^^

``trans.select(lang)``

Selects a language. If the language is a specific variant like "en_US" or "de_AT" the next unspecific variant is
tried ("en" or "de"). If the unspecific variant is unavailable, the default language is used. If the default
language is unavailable, an empty translation is used.


**Parameters**

``lang``

A string with the language code like "en" or "en_us".

**Return value**

A promise which resolves with a translation function.

trans.setDefaultLanguage(lang)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``trans.setDefaultLanguage(lang)``

Sets the default language to be used if there is neither a translation available for the selected language nor for its
more general language variant (as "en" is for "en_us").

**Parameters**

``lang``

A string with the language code like "en" or "en_us".

**Return value**

A promise which resolves with a translation function.

trans.setNamespace(namespace)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``trans.setNamespace(namespace)``

Sets the namespace to be used for translations. Translations can be split up into different translation files
where each file holds one namespace. All previously loaded namespaces are removed leaving ``namespace`` as the
only (and default) namespace.

**Parameters**

``namespace``

The namespace to set.

**Return value**

A promise which resolves with a translation function.

trans.addNamespace(namespace)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``trans.addNamespace(namespace)``

Adds a namespace to be used for translations. Translations can be split up into different translation files
where each file holds one namespace.

**Parameters**

``namespace``

The namespace to add.

**Return value**

A promise which resolves with a translation function.

trans.translate(key, namespace)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

``var str = trans.translate(key, namespace)``

Uses the currently selected language and returns the phrase corresponding to ``key`` from ``namespace``.

**Parameters**

``key``

The key of the phrase within the namespace.

``namespace`` (optional)

The namespace to load the phrase from. If omitted, the default namespace is used.

**Return value**

The phrase belonging to ``key`` in the namespace ``namespace``.

trans.i18n()
^^^^^^^^^^^^

``var _t = trans.i18n()``

Returns the translation function for the currently selected language.

**Parameters**

This function does not have any parameters.

**Return value**

The current translation function.

trans.createHandlebarsHelper()
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: js

    var helper = trans.createHandlebarsHelper();
    Handlebars.registerHelper("i18n", helper);

Can be used in handlebars templates to inject phrases from the translation.

.. code-block:: html

    <h1>{{i18n GREETING LOGIN}}</h1>

Creates a function that can be registered as a helper in your Handlebars environment. The helper is automatically
updated with the current translation function for the selected language. Whenever the language changes, the handlebars
helper renders the text in the new language. The helper receives the same parameters as the translation function (``key`` and
optionally ``namespace``).

Note that this method does not depend directly on Handlebars. It just creates a function that is compliant with the
Handlebars API. You may use the function in any other appropriate templating engine or in any other context.

**Parameters**

This function does not have any parameters.

**Return value**

A handlebars compatible helper function which can be registered in your Handlebars environment.