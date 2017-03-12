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
    root['Languagemenu'] = factory(root["Handlebars"]);
  }
}(this, function (Handlebars) {

return { "renderState":Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<ul class=\"dropdown-content blue-grey white-text\">\n        <li class=\"divider\"></li>\n        <li><a lang=\"en\" href=\"javascript:false;\" class=\"white-text\">English / English</a></li>\n        <li><a lang=\"de\" href=\"javascript:false;\" class=\"white-text\">German / Deutsch</a></li>\n    </ul>";
},"useData":true}), "onAttach":function(node) { $('.dropdown-button').filter('[data-activates="language-menu"]').dropdown();
    $(node).on('click', function(e) {
    	var lang = $(e.target).attr('lang');
    	if ( lang ) this.select(lang);
    }.bind(this));},"onUpdate":undefined,"onDetach":undefined};

}));
