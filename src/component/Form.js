function CompForm() {
    var builder = new Component();
    builder.options.validations = {};
    builder.addValidation = (function (id, callback) {
        this.options.validations[id] = callback;
        return this;
    }).bind(builder);
    builder.addAction('initialState', function () {
        return {};
    });
    builder.addAction('checkInput', function (id, value) {
        if (builder.options.validations[id]) {
            var cb = builder.options.validations[id];
            try {
                cb(id, value);
                return {};
            } catch (e) {
                // Show error;
                var errors = {};
                errors[id] = e.message;
                return {errors: errors};
            }
        }
    });

    var _build = builder.build.bind(builder);
    builder.build = function (id) {
        var _attach = builder.options.template.attach;
        builder.options.template.attach = function (node) {
            var self = this;
            var inputHandler = function(event) {
                var id = $(event.target).attr('id');
                var value = $(event.target).val();
                self.checkInput(id, value);
            };
            $('.input-field').on('input', inputHandler);
            _attach(node);
        };
        return _build(id);
    };

    return builder;


    /*        builder.addAction('initial', function (inputs) {

     return {
     loading: false,
     errors: []
     };
     });
     builder.addAction('send', function (inputs) {
     window.STATE.formState.sending(inputs);
     return {
     loading: true,
     errors: []
     };
     });

     builder.addAction('showErrors', function (errors) {
     return {
     loading: false,
     errors: errors
     };
     });

     builder.addAction('checkInput', function (id, value) {

     var errors = {};

     if (value === "")
     errors[id] = "Please insert your " + id;

     switch (id) {

     case 'email':

     var re = /\S+@\S+\.\S+/;
     var match = re.exec(value);
     if (!match)
     errors[id] = "Invalid email address\n please enter your email address in the format:" +
     "****@***.**";
     break;
     //Contain invalid characters
     // Too short
     //Too long

     }
     return {
     loading: true,
     errors: errors
     };


     }
     );

     builder.subscribe(window.STATE.formState, function (state) {
     if (state.success) {

     }
     else {
     this.showErrors(state.errors);
     }
     });

     builder.withTemplate(template);
     return builder.build(id);*/
};

return CompForm;
