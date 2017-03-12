(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["Handlebars"], function (a0) {
      return (factory(a0));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("Handlebars"));
  } else {
    root['Signin'] = factory(root["Handlebars"]);
  }
}(this, function (Handlebars) {

return { "renderState":Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "                            <div class=\"row\">\n                                <div class=\"center red-text text-darken-4\">"
    + container.escapeExpression((helpers.i18n || (depth0 && depth0.i18n) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.error : depth0),"signin",{"name":"i18n","hash":{},"data":data}))
    + "</div>\n                            </div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "                            <div class=\"row\">\n                                <div class=\"center green-text text-darken-4\">"
    + container.escapeExpression((helpers.i18n || (depth0 && depth0.i18n) || helpers.helperMissing).call(depth0 != null ? depth0 : {},"SUCCESS","signin",{"name":"i18n","hash":{},"data":data}))
    + "</div>\n                            </div>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<div class=\"container "
    + alias4(((helper = (helper = helpers.hide || (depth0 != null ? depth0.hide : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"hide","hash":{},"data":data}) : helper)))
    + "\">\n        <div class=\"row hide-on-med-and-down\"></div>\n        <div class=\"row hide-on-small-only\"></div>\n        <div class=\"row hide-on-small-only\"></div>\n        <div class=\"row\">\n            <div class=\"col s12 m10 offset-m1 l8 offset-l2\">\n                <div class=\"card hoverable\">\n                    <div class=\"card-content\">\n                        <span class=\" card-title\">"
    + alias4((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"TITLE","signin",{"name":"i18n","hash":{},"data":data}))
    + "</span>\n                        <div class=\"row\">\n                            <div class=\"divider\"></div>\n                        </div>\n                        <div class=\"row\">\n                            <div class=\"col s12\">\n                                "
    + alias4((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"INTRO","signin",{"name":"i18n","hash":{},"data":data}))
    + "\n                            </div>\n                        </div>\n                        <form id=\"sign-in-form\">\n                            <div class=\"row\">\n                                <div class=\"input-field col s12\">\n                                    <i class=\"material-icons prefix\">account_circle</i>\n                                    <input id=\"sign-in-username\" name=\"sign-in-username\" type=\"text\" value=\""
    + alias4(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"username","hash":{},"data":data}) : helper)))
    + "\">\n                                    <label for=\"sign-in-username\">"
    + alias4((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"USERNAME","signin",{"name":"i18n","hash":{},"data":data}))
    + "</label>\n                                </div>\n                            </div>\n                            <div class=\"row\">\n                                <div class=\"input-field col s12\">\n                                    <i class=\"material-icons prefix\">lock</i>\n                                    <input id=\"sign-in-password\" name=\"sign-in-password\" type=\"password\" value=\""
    + alias4(((helper = (helper = helpers.password || (depth0 != null ? depth0.password : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"password","hash":{},"data":data}) : helper)))
    + "\">\n                                    <label for=\"sign-in-password\">"
    + alias4((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"PASSWORD","signin",{"name":"i18n","hash":{},"data":data}))
    + "</label>\n                                </div>\n                            </div>\n                            <div class=\"row\">\n                                <div class=\"divider\"></div>\n                            </div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.error : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.success : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "                            <div class=\"row\">\n                                <div class=\"center\">\n                                    <button type=\"submit\" class=\"waves-effect waves-light btn blue-grey\" value=\"\">\n                                        "
    + alias4((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"SUBMIT","signin",{"name":"i18n","hash":{},"data":data}))
    + "\n                                        <i class=\"material-icons right\">send</i>\n                                    </button>\n                                </div>\n                            </div>\n                        </form>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>";
},"useData":true}), "onAttach":function(node) { var form = $(node).find('form');
	var renderer = this;
	form.on('submit',  function() {
		return renderer.submit();
	});},"onUpdate":function(node) { Materialize.updateTextFields();},"onDetach":undefined};

}));
