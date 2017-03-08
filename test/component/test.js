describe("Component.js", function () {
	
	describe("Constructor", function () {
		
		it("returns a Component instance", function () {
			var comp = new Component("templates/TestComponent.html");
			expect(comp).to.exist;
			expect(comp).to.be.an.instanceOf(Component);
		});
		
		it("returns a Component instance with an attach() method.", function () {
			var comp = new Component("templates/TestComponent.html");
			expect(comp.attach).to.exist;
			expect(comp.attach).to.be.a('function');
		});
		
	});
	
	describe("Component.attach()", function () {
		it("returns a Renderer instance.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			var renderer = comp.attach('#test');
			expect(renderer).to.exist;
			expect(renderer).to.be.an.instanceOf(Component.Renderer);
			done();
			$('#test').removeAttr('x-cargo-id');
		});
		
		it("the Renderer instance has a 'detach' property which is a function.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			var renderer = comp.attach('#test');
			expect(renderer.detach).to.exist;
			expect(renderer.detach).to.be.a('function');
			done();
			$('#test').removeAttr('x-cargo-id');
		});
		
		it("the Renderer instance  has a 'render' property which is a function.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			var renderer = comp.attach('#test');
			expect(renderer.render).to.exist;
			expect(renderer.render).to.be.a('function');
			done();
			$('#test').removeAttr('x-cargo-id');
		});
		
		it("must not work without a selector.", function (done) {
			try {
				var comp = new Component("component/templates/TestComponent.html");
				comp.attach();
				done(new Error('Promise was fulfilled unexpectedly.'));
			} catch (e) {
				expect(e).to.be.an.instanceOf(Error);
				done();
			}
		});
		
		it("throws exception if there are no nodes selected.", function (done) {
			try {
				var comp = new Component("component/templates/TestComponent.html");
				comp.attach('#test2');
				done(new Error('Promise was fulfilled unexpectedly.'));
			} catch (e) {
				expect(e).to.exist;
				expect(e).to.be.an.instanceOf(Error);
				done();
			}
		});
		
		it("throws exception if there are nodes selected that are already attached to a component.", function (done) {
			try {
				var comp = new Component("component/templates/TestComponent.html");
				$('#test').attr('x-cargo-id', _.uniqueId());
				comp.attach('#test');
				done(new Error('Promise was fulfilled unexpectedly.'));
			} catch (e) {
				expect(e).to.exist;
				expect(e).to.be.an.instanceOf(Error);
				done();
			} finally {
				$('#test').removeAttr('x-cargo-id');
			}
		});
		
	});
	
	describe("Renderer.detach()", function () {
		
		it("removes the x-cargo-id from target elements.", function (done) {
			var comp = new Component("component/templates/TestComponent.html");
			var renderer = comp.attach('#test');
			expect($('#test').attr('x-cargo-id')).to.exist;
			renderer.detach();
			expect($('#test').attr('x-cargo-id')).not.to.exist;
			done();
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
				done(err);
			});
		});
		
		it("renders the state to the target node as JSON text within a <pre> element if no template is loaded.", function (done) {
			var comp = new Component();
			var renderer = comp.attach('#test-heading');
			renderer.render({heading: "TEST"}).then(function () {
				var targetNode = $('#test-heading')[0];
				expect(targetNode.nodeName).to.equal('PRE');
				expect(targetNode.innerHTML).to.equal('{\n "heading": "TEST"\n}');
				done();
			}).catch(function (e) {
				done(e);
			}).finally(function () {
				renderer.detach();
			});
			
		});
		
		it("updates the state in the target node", function (done) {
			var comp = new Component();
			var renderer = comp.attach('#test-heading');
			renderer.render({heading: "TEST"}).then(function () {
				return renderer.render({heading: "TEST2"});
			}).then(function () {
				var targetNode = $('#test-heading')[0];
				expect(targetNode.nodeName).to.equal('PRE');
				expect(targetNode.innerHTML).to.equal('{\n "heading": "TEST2"\n}');
				done();
			}).catch(function (e) {
				done(e);
			}).finally(function () {
				renderer.detach();
			});
		});
		
		describe('using handlebars support', function () {
			
			it("with english translation renders the component with the english heading.", function (done) {
				var helper = translation.createHandlebarsHelper();
				var handlebars = Handlebars.create();
				var comp, renderer;
				handlebars.registerHelper('i18n', helper);
				Component.load("component/templates/TestComponent.html", handlebars).then(function (result) {
					comp = result;
					return translation.select('en');
				}).then(function () {
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
				}).finally(function () {
					renderer.detach();
				});
			});
			
			it("with german translation renders the component with the english heading.", function (done) {
				var helper = translation.createHandlebarsHelper();
				var handlebars = Handlebars.create();
				var comp, renderer;
				handlebars.registerHelper('i18n', helper);
				Component.load("component/templates/TestComponent.html", handlebars).then(function (result) {
					comp = result;
					return translation.select('de');
				}).then(function () {
					return comp.attach('#test');
				}).then(function (result) {
					renderer = result;
					return renderer.render({});
				}).then(function (state) {
					var html = $('#test').html().trim();
					expect(html).to.be.equal('<h1>Test Komponente</h1>');
					renderer.detach();
					done();
				}).catch(function (err) {
					done(err);
				}).finally(function () {
					renderer.detach();
				});
			});
			
			it("is rejected when the handlebars template could not be loaded.", function (done) {
				Component.load("component/templates/TestComponent.html2").then(function() {
					done(new Error('Promise was fulfilled unexpectedly.'));
				}).catch(function (e) {
					expect(e).to.exist;
					expect(e).to.be.an.instanceOf(Error);
					done();
				}).catch(function (e) {
					done(e);
				}).finally(function () {
					$('#test').removeAttr('x-cargo-id');
				});
			});
		});
		
	});
	
});