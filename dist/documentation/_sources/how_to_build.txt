How to Build
############

The modules are build by the use of "gulp" tasks and deployed to the `dist` directory. When
available a minified and a normal version of the modules are created. All modules have an
UMD-style wrapper which supports the use of the modules with AMD-loaders (like requirejs),
commonjs loaders and usage as globals.

Node.js is required to get the build process started, however the modules do not depend on
Node.js at runtime. To install Node.js on your system, check this page:

https://nodejs.org/en/download/package-manager/

Clone the git repository to your working directory::

    # git clone https://github.com/datenwelt/cargo-js.git
    ...

Change to the project directory::

    # cd cargo-js

Install bower and gulp as global commands::

    # npm install bower -G
    ...
    # npm install gulp -G

Install the required node modules and library dependencies with npm and bower (this can take a while to finish)::

    # npm install
    ...
    # bower install
    ...

Now start the build process by::

    # gulp build

After the build process finished, the compiled sources are in the `dist` directory and can be used as
depedency in your projects.

The documentation can be build using the sphinx documentation generator from http://www.sphinx-doc.org and
the appropriate gulp task::

    # gulp doc

The resulting HTML documentation can be found under the directory ``doc``.





