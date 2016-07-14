'use strict';
if (!Component) throw new Error("cargo.Component API is required.");

var FormInput = {
    create: function (id, template, validator) {

        var createError = function(errorCode, translation) {
            errorCode = errorCode instanceof Error ? errorCode.message : errorCode;
            var error = { code: errorCode, msg: errorCode };
            if ( translation && translation[errorCode] ) {
                error.msg = translation[errorCode];
            }
            return error;
        };

        var builder = new Component();
        validator = validator || function (value) {
                return value;
            };
        builder.addAction('initialState', function(value) {
            return {
                enabled: true,
                value: value || "",
                error: undefined,
                translation: {}
            };
        });
        builder.addAction('setError', function (error) {
            var state = this.state();
            state.error = createError(error, state.translation);
            return state;
        });
        builder.addAction('clearError', function () {
            return this.state({error: undefined});
        });
        builder.addAction('setValue', function (value) {
            var state = this.state();
            if (validator !== undefined) {
                try {
                    var newValue = validator.call(this, value);
                    state.error = undefined;
                    state.value = newValue === undefined ? value : newValue;
                } catch (e) {
                    state.error = createError(e, state.translation);
                    state.value = value;
                }
            }
            return state;
        });
        builder.addAction('changeLanguage', function (translation) {
            return this.state({translation: translation});
        });
        builder.addAction('enable', function() {
            return this.state({enabled: true});
        });
        builder.addAction('disable', function() {
            return this.state({enabled: false});
        });

        builder.withTemplate(template);
        return builder.build(id);
    }
};
