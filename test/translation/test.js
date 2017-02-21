describe("Translation.js", function () {
	
	describe("Constructor", function () {
		it("returning a translation instance.", function () {
			var trans = new Translation();
			expect(trans).to.be.defined;
			expect(trans instanceof Translation).to.be.true;
		});
	});
	
	describe("Loading", function () {
		
		it(" the default translation without any options.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.select('en').then(function (t) {
				expect(t('GREETING')).to.equal("Hello World!");
				expect(t('READY')).to.equal("ready");
				done();
			}).catch(function(e) {
				done(e);
			});
		});
		
		it(" the default translation when selecting an unknown language.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.select('fr').then(function (t) {
				expect(t('GREETING')).to.equal("Hello World!");
				expect(t('READY')).to.equal("ready");
				done();
			});
		});
		
		it(" no translation when selecting a non-existent namespace.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.addNamespace('missing');
			trans.select('en').then(function (t) {
				expect(t('GREETING', 'missing')).to.equal('GREETING');
				done();
			}).catch(function(err) {
				done(err);
			});
		});
		
		it(" no translation when selecting a non-existent base URI.", function (done) {
			var trans = new Translation({baseURI: 'missing', namespaces: ['missing']});
			trans.select('en').then(function (t) {
				var p = t('GREETING');
				expect(t('GREETING')).to.equal('GREETING');
				done();
			});
		});
		
	});
	
	describe("Selecting ", function () {
		
		it("a language returns a promise which fulfills with a translation function when loading finishes.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('en');
			expect(p instanceof Promise).to.be.true;
			p.then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hello World!');
				done();
			}).catch(function (e) {
				console.log(e && e.stack ? e.stack : e);
			});
		});
		
		it("the same language again returns a promise which fulfills with a translation function.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('en').then(function (t) {
				trans.select('en').then(function (t) {
					expect(typeof t).to.equal('function');
					expect(t('GREETING')).to.equal('Hello World!');
					done();
				});
			});
		});
		
		it("another language returns a promise which fulfills with a translation function for the selected language.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('en').then(function (t) {
				trans.select('de').then(function (t) {
					expect(typeof t).to.equal('function');
					expect(t('GREETING')).to.equal('Hallo Welt!');
					done();
				});
			});
		});
		
		it("a language translates correctly.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('de');
			expect(p instanceof Promise).to.be.true;
			p.then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hallo Welt!');
				done();
			}).catch(function (e) {
				console.log(e && e.stack ? e.stack : e);
			});
		});
		
		it("a non-existent language translates to the default language.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('fr');
			expect(p instanceof Promise).to.be.true;
			p.then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hello World!');
				done();
			}).catch(function (e) {
				console.log(e && e.stack ? e.stack : e);
				done();
			});
		});
		
		it("a non-existent locale translates to the parent language if it exists (part 1).", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('en_US');
			expect(p instanceof Promise).to.be.true;
			p.then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hello World!');
				done();
			}).catch(function (e) {
				console.log(e && e.stack ? e.stack : e);
			});
		});
		
		it("a non-existent locale translates to the parent language if it exists (part 2).", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var p = trans.select('de_AT');
			expect(p instanceof Promise).to.be.true;
			p.then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hallo Welt!');
				done();
			}).catch(function (e) {
				console.log(e && e.stack ? e.stack : e);
			});
		});
		
		it("a language after selecting another language returns two independent translation functions (part 1).", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var loaded = 0;
			trans.select('en').then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hello World!');
				loaded++;
				if (loaded == 2) {
					done();
				}
			});
			trans.select('de').then(function (t) {
				expect(typeof t).to.equal('function');
				expect(t('GREETING')).to.equal('Hallo Welt!');
				loaded++;
				if (loaded == 2) {
					done();
				}
			});
		});
		
		it("a language after selecting another language returns two independent translation functions (part 2).", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var t_en;
			trans.select('en').then(function (t) {
				t_en = t;
				trans.select('de').then(function (t) {
					expect(typeof t).to.equal('function');
					expect(t('GREETING')).to.equal('Hallo Welt!');
					expect(typeof t_en).to.equal('function');
					expect(t_en('GREETING')).to.equal('Hello World!');
					done();
				});
			});
		});
		
	});
	
	describe('Handlebars support from Translation', function () {
		
		it("provides an i18n helper", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			var handlebars = Handlebars.create();
			var template = handlebars.compile("{{i18n 'GREETING'}}");
			var helper = trans.createHandlebarsHelper();
			expect(typeof helper).to.equal('function');
			handlebars.registerHelper('i18n', helper);
			var rendered = template({});
			expect(rendered).to.equal('GREETING');
			done();
		});
		
		it("provides an i18n helper that replaces keys with translation.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.select('en').then(function () {
				var handlebars = Handlebars.create();
				var template = handlebars.compile("{{i18n 'GREETING'}}");
				var helper = trans.createHandlebarsHelper();
				expect(typeof helper).to.equal('function');
				handlebars.registerHelper('i18n', helper);
				var rendered = template({});
				expect(rendered).to.equal('Hello World!');
				done();
			});
		});
		
		it("provides an i18n helper that replaces keys with translation after selecting a language.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.select('de').then(function () {
				var handlebars = Handlebars.create();
				var template = handlebars.compile("{{i18n 'GREETING'}}");
				var helper = trans.createHandlebarsHelper();
				expect(typeof helper).to.equal('function');
				handlebars.registerHelper('i18n', helper);
				var rendered = template({});
				expect(rendered).to.equal('Hallo Welt!');
				done();
			});
		});
		
		it("provides an i18n helper that replaces keys with translation after re-selecting a different language.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.select('en').then(function () {
				trans.select('de').then(function () {
					var handlebars = Handlebars.create();
					var template = handlebars.compile("{{i18n 'GREETING'}}");
					var helper = trans.createHandlebarsHelper();
					expect(typeof helper).to.equal('function');
					handlebars.registerHelper('i18n', helper);
					var rendered = template({});
					expect(rendered).to.equal('Hallo Welt!');
					done();
				});
			});
		});
		
		it("provides an i18n helper that replaces keys from namespaces with translation after re-selecting a different language.", function (done) {
			var trans = new Translation({baseURI:"translation/locales"});
			trans.select('en').then(function () {
				trans.select('de').then(function () {
					var handlebars = Handlebars.create();
					var template = handlebars.compile("{{i18n 'GREETING' 'translation'}}");
					var helper = trans.createHandlebarsHelper();
					expect(typeof helper).to.equal('function');
					handlebars.registerHelper('i18n', helper);
					var rendered = template({});
					expect(rendered).to.equal('Hallo Welt!');
					done();
				});
			});
		});
		
	});
	
});
