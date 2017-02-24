define(['handlebars.runtime'], function(Handlebars) {
  Handlebars = Handlebars["default"];  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
return templates['Signin.template.html'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "<div class=\"container "
    + alias3(((helper = (helper = helpers.hide || (depth0 != null ? depth0.hide : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"hide","hash":{},"data":data}) : helper)))
    + "\">\n    <div class=\"row hide-on-med-and-down\"></div>\n    <div class=\"row hide-on-small-only\"></div>\n    <div class=\"row hide-on-small-only\"></div>\n    <div class=\"row\">\n        <div class=\"col s12 m10 offset-m1 l8 offset-l2\">\n            <div class=\"card hoverable\">\n                <div class=\"card-content\">\n                    <span class=\" card-title\">"
    + alias3((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"TITLE","signin",{"name":"i18n","hash":{},"data":data}))
    + "</span>\n                    <div class=\"row\">\n                        <div class=\"divider\"></div>\n                    </div>\n                    <div class=\"row\">\n                        <div class=\"col s12\">\n                            "
    + alias3((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"INTRO","signin",{"name":"i18n","hash":{},"data":data}))
    + "\n                        </div>\n                    </div>\n                    <form id=\"sign-up-form\">\n                        <div class=\"row\">\n                            <div class=\"input-field col s12\">\n                                <i class=\"material-icons prefix\">account_circle</i>\n                                <input id=\"sign-in-username\" type=\"text\">\n                                <label for=\"sign-in-username\">"
    + alias3((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"USERNAME","signin",{"name":"i18n","hash":{},"data":data}))
    + "</label>\n                            </div>\n                        </div>\n                        <div class=\"row\">\n                            <div class=\"input-field col s12\">\n                                <i class=\"material-icons prefix\">lock</i>\n                                <input id=\"sign-in-password\" type=\"password\">\n                                <label for=\"sign-in-password\">"
    + alias3((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"PASSWORD","signin",{"name":"i18n","hash":{},"data":data}))
    + "</label>\n                            </div>\n                        </div>\n                        <div class=\"row\">\n                            <div class=\"divider\"></div>\n                        </div>\n                        <div class=\"row\">\n                            <div class=\"center\">\n                                <a class=\"waves-effect waves-light btn blue-grey\">"
    + alias3((helpers.i18n || (depth0 && depth0.i18n) || alias2).call(alias1,"SUBMIT","signin",{"name":"i18n","hash":{},"data":data}))
    + "</a>\n                            </div>\n                        </div>\n                    </form>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>";
},"useData":true});
});