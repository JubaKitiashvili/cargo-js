describe("Component.js", function () {
	
	describe("Constructor", function () {
		
		it("returns a Component instance", function () {
			var comp = new Component("templates/TestComponent.html");
			expect(comp).to.be.defined;
			expect(comp).to.be.an.instanceOf(Component);
		});
		
		it("returns a Component instance with an attach() method.", function () {
			var comp = new Component("templates/TestComponent.html");
			expect(comp.attach).to.be.defined;
			expect(comp.attach).to.be.a('function');
		});
		
	});
	
	describe("Component.attach()", function () {
		it("returns a promise resolving with a Renderer instance.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach('#test').then(function (renderer) {
				expect(renderer).to.be.defined;
				expect(renderer).to.be.an.instanceOf(Component.Renderer);
				done();
			}).catch(function (e) {
				done(e);
			}).finally(function () {
				$('#test').removeAttr('x-cargo-id');
			});
		});
		
		it("the Renderer instance has a 'detach' property which is a function.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach('#test').then(function (renderer) {
				expect(renderer.detach).to.be.defined;
				expect(renderer.detach).to.be.a('function');
				done();
			}).catch(function (e) {
				done(e);
			}).finally(function () {
				$('#test').removeAttr('x-cargo-id');
			});
		});
		
		it("the Renderer instance  has a 'render' property which is a function.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach('#test').then(function (renderer) {
				expect(renderer.render).to.be.defined;
				expect(renderer.render).to.be.a('function');
				done();
			}).catch(function (e) {
				done(e);
			}).finally(function () {
				$('#test').removeAttr('x-cargo-id');
			});
		});
		
		it("the Renderer instance  has a 'refresh' property which is a function.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach('#test').then(function (renderer) {
				expect(renderer.refresh).to.be.defined;
				expect(renderer.refresh).to.be.a('function');
				done();
			}).catch(function (e) {
				done(e);
			}).finally(function () {
				$('#test').removeAttr('x-cargo-id');
			});
		});
		
		it("must not work without a selector.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach().then(function (renderFn) {
				done(new Error('Promise was fulfilled unexpectedly.'));
			}).catch(function (e) {
				expect(e).to.be.an.instanceOf(Error);
				done();
			}).catch(function(e) {
				done(e);
			});
		});
		
		it("returns promise that is rejected if there are no nodes selected.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach('#test2').then(function (renderFn) {
				done(new Error('Promise was fulfilled unexpectedly.'));
			}).catch(function (e) {
				expect(e).to.be.defined;
				expect(e).to.be.an.instanceOf(Error);
				done();
			}).catch(function(e) {
				done(e);
			});
		});
		
		it("returns promise that is rejected if there are nodes selected that are already attached to a component.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			$('#test').attr('x-cargo-id', _.uniqueId());
			comp.attach('#test').then(function (renderFn) {
				done(new Error('Promise was fulfilled unexpectedly.'));
			}).catch(function(e) {
				expect(e).to.be.defined;
				expect(e).to.be.an.instanceOf(Error);
				done();
			}).catch(function(e) {
				done(e);
			}).finally(function () {
				$('#test').removeAttr('x-cargo-id');
			});
		});
		
		it("is rejected when the template could not be loaded.", function (done) {
			var comp = new Component("component/templates/TestComponent.html2");
			comp.attach('#test').then(function (renderFn) {
				done(new Error('Promise was fulfilled unexpectedly.'));
			}).catch(function (e) {
				expect(e).to.be.defined;
				expect(e).to.be.an.instanceOf(Error);
				done();
			}).catch(function(e) {
				done(e);
			}).finally(function () {
				$('#test').removeAttr('x-cargo-id');
			});
		});
		
	});
	
	describe("Renderer.detach()", function () {
		
		it("removes the x-cargo-id from target elements.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			comp.attach('#test').then(function (renderer) {
				expect($('#test').attr('x-cargo-id')).to.be.defined;
				renderer.detach();
				expect($('#test').attr('x-cargo-id')).not.to.be.defined;
				done();
			}).catch(function (e) {
				done(e);
			});
		});
		
	});
	
	describe("Renderer.render()", function () {
		
		var translation;
		
		beforeEach(function (done) {
			translation = new Translation({
				baseURI: 'component/locales'
			});
			translation.setNamespace('test').then(function (result) {
				done();
			}).catch(function (err) {
				fail(err);
				done();
			});
		});
		
		it("with english translation renders the component with the english heading.", function (done) {
			var helper = translation.createHandlebarsHelper();
			var handlebars = Handlebars.create();
			var renderer;
			handlebars.registerHelper('i18n', helper);
			var comp = new Component("component/templates/TestComponent.html", {
				handlebars: handlebars
			});
			translation.select('en').then(function () {
				return comp.attach('#test');
			}).then(function (result) {
				renderer = result;
				return renderer.render({});
			}).then(function (state) {
				var html = $('#test').html().trim();
				expect(html).to.be.equal('<h1>Test Component</h1>');
				renderer.detach();
				done();
			}).catch(function (err) {
				done(err);
			}).finally(function() {
				renderer.detach();
			});
		});
		
		it("with german translation renders the component with the english heading.", function (done) {
			var helper = translation.createHandlebarsHelper();
			var handlebars = Handlebars.create();
			var renderer;
			handlebars.registerHelper('i18n', helper);
			var comp = new Component("component/templates/TestComponent.html", {
				handlebars: handlebars
			});
			translation.select('de').then(function () {
				return comp.attach('#test');
			}).then(function (result) {
				renderer = result;
				return renderer.render({});
			}).then(function (state) {
				var html = $('#test').html().trim();
				expect(html).to.be.equal('<h1>Test Komponente</h1>');
				done();
			}).catch(function (err) {
				done(err);
			}).finally(function(){
				renderer.detach();
			});
		});
		
	});
	
	
});