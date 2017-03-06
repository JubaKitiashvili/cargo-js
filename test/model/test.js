describe('Model.js', function () {
	describe("Basic model functions include", function () {
		var currentState = undefined;
		var exposedThis = undefined;
		
		var testState = {
			initialState: function () {
				return {stage: "initial"};
			},
			state1: function () {
				return {stage: "state2"};
			},
			keepState: function () {
				return this.state();
			},
			returnsUndefined: function () {
				return undefined;
			},
			returnsNull: function () {
				return null;
			},
			mergeState: function (newState) {
				return this.state().merge(newState);
			},
			replaceState: function (newState) {
				return newState;
			},
			deepMergeState: function (newState) {
				return this.state().merge(newState);
			},
			moreThanOneArgument: function (arg1, arg2) {
				return {arg1: arg1, arg2: arg2};
			},
			exposeThis: function () {
				var state = {
					stage: "exposeThis",
					exposedThis: this
				};
				exposedThis = this;
				return state;
			},
			nestedState1: function () {
				var state = {
					stage: "nestedState1"
				};
				this.model.nestedState2();
				return state;
			},
			nestedState2: function () {
				return {
					stage: "nestedState2"
				};
			},
			finalState: function () {
				return {stage: "final"};
			},
			deadState1: function () {
				return new Error("This model has been destroyed by an Error.");
			},
			deadState2: function () {
				return "This model has been destroyed with a silent notification.";
			}
		};
		
		beforeEach(function () {
			currentState = undefined;
			exposedThis = undefined;
		});
		
		var subscriber = function (state) {
			currentState = state;
		};
		
		it("a constructor returning a function", function () {
			var model = new Model(testState);
			expect(model).to.be.defined;
			expect(model).to.be.a('function');
		});
		
		it("subscribing to a model returns a function", function () {
			var model = new Model(testState);
			var unsubscribe = model(subscriber);
			expect(unsubscribe).to.be.defined;
			expect(unsubscribe).to.be.a('function');
		});
		
		it("subscribing to a model sends the current state to new subscribers.", function (done) {
			var model = new Model(testState);
			expect(model).to.be.defined;
			var subscriber = function (state) {
				expect(state).to.be.an.instanceof(State);
				if (state.get('stage') !== "initial") {
					done(new Error("State is not initialized."));
				} else {
					done();
				}
			};
			model.initialState();
			model(subscriber);
		});
		
		it("the model exporting each action as a function", function () {
			var model = new Model(testState);
			expect(model).to.be.defined;
			for (var action in testState) {
				expect(model[action]).to.be.defined;
				expect(model[action]).to.be.a('function');
			}
		});
		
		it("calling an action returns a promise", function () {
			var model = new Model(testState);
			var promise = model.initialState();
			expect(promise).to.be.defined;
			expect(promise.then).to.be.a('function');
			expect(promise.catch).to.be.a('function');
		});
		
		it("actions can have an arbitrary number of arguments", function (done) {
			var model = new Model(testState);
			expect(model).to.be.defined;
			model(subscriber);
			model.initialState().then(function () {
				return model.moreThanOneArgument(1, 2);
			}).then(function () {
				expect(currentState.get('arg1')).to.equal(1);
				expect(currentState.get('arg2')).to.equal(2);
				done();
			});
		});
		
		it("the model changing state when calling an action", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				expect(currentState).to.be.defined;
				expect(currentState).to.be.an.instanceof(State);
				expect(currentState.get('stage')).to.equal("initial");
				done();
			});
		});
		
		it("an action not changing state when returning undefined", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				expect(currentState.get('stage')).to.equal("initial");
				return model.returnsUndefined();
			}).then(function () {
				expect(currentState.get('stage')).to.equal("initial");
				done();
			});
		});
		
		it("an action clearing the state when returning null", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				expect(currentState).to.be.defined;
				expect(currentState).to.be.an('object');
				return model.returnsNull();
			}).then(function () {
				expect(currentState).to.be.an('object');
				expect(currentState.stage).not.to.be.defined;
				done();
			});
		});
		
		it("'this' keyword exposing a state() function within actions", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				return model.exposeThis();
			}).then(function () {
				expect(currentState.get('stage')).to.equal("exposeThis");
				expect(exposedThis).to.be.defined;
				expect(currentState.get('exposedThis')).to.be.an('object');
				var currentThis = exposedThis;
				expect(currentThis).to.be.defined;
				expect(currentThis.state).to.be.defined;
				expect(currentThis.state).to.be.an('function');
				done();
			});
		});
		
		it("the state() function within actions returns current state", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				return model.keepState();
			}).then(function () {
				expect(currentState).to.be.defined;
				expect(currentState).to.be.an('object');
				expect(currentState.get('stage')).to.equal("initial");
				done();
			});
		});
		
		it("the state() function within actions merging states when called with an argument", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				return model.mergeState({merge: 'ok'});
			}).then(function () {
				expect(currentState).to.be.defined;
				expect(currentState).to.be.an('object');
				var s = currentState.toJS();
				expect(currentState.get('stage')).to.equal("initial");
				expect(currentState.get('merge')).to.equal("ok");
				done();
			});
		});
		
		xit("the state() function within actions deep merging states when called with an argument", function (done) {
			// Deep merging not supported anymore.
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			var state1 = {
				stage: "setState",
				deep: {a: "a", b: "b"}
			};
			var state2 = {
				stage: "deepMerge",
				deep: {c: "c", d: "d"}
			};
			model.replaceState(state1).then(function () {
				return model.deepMergeState(state2);
				
			}).then(function () {
				expect(currentState).to.be.defined;
				expect(typeof currentState === 'object').to.be.true;
				expect(currentState.get('stage')).to.be.equal("deepMerge");
				expect(currentState.get('deep')).to.be.defined;
				var subState = currentState.get('deep');
				expect(subState instanceof State).to.be.true;
				expect(subState.$Map).to.be.true;
				var keys = ['a', 'b', 'c', 'd'];
				for (var i = 0; i < keys.length; i++) {
					var key = keys[i];
					expect(subState.get(key)).to.be.equal(key);
				}
				done();
			});
		});
		
		it("'this' keyword exposing a model property within actions", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.initialState().then(function () {
				return model.exposeThis();
			}).then(function () {
				expect(currentState).to.be.defined;
				expect(currentState).to.be.an('object');
				expect(currentState.get('stage')).to.equal("exposeThis");
				expect(currentState.get('exposedThis')).to.be.defined;
				expect(exposedThis).to.be.an('object');
				var currentThis = exposedThis;
				expect(currentThis).to.be.defined;
				expect(currentThis.model).not.to.be.defined;
				expect(currentThis.model).to.be.a('function');
				for (var action in currentThis.model) {
					expect(currentThis.model[action]).to.be.defined;
					expect(currentThis.model[action]).to.be.a('function');
				}
				done();
			});
		});
		
		it("actions within another action are executed after the action finished", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.nestedState1().then(function () {
				expect(currentState).to.be.defined;
				expect(currentState.get('stage')).to.equal("nestedState1");
				done();
			});
		});
		
		it("model being destroyed when an action returns an Error", function (done) {
			var model = new Model(testState);
			model(subscriber);
			expect(currentState).not.to.be.defined;
			model.deadState1().then(function (state) {
				done(new Error("Model is in dead state and should not get resolved."));
			}).catch(function (error) {
				expect(error).to.be.an.instanceof(Error);
				model.initialState().then(function () {
					done(new Error("Model is in dead state and should reject further actions."));
				}).catch(function (error) {
					expect(error).to.be.an.instanceof(Error);
					done();
				});
			});
		});
		
	});
	
	describe("Stream API", function () {
		var model1, model2;
		beforeEach(function () {
			model1 = new Model({
				initialState: function (number) {
					return {sum: number};
				},
				add: function (number) {
					var state = this.state().toJS();
					state.sum = state.sum + number;
					return state;
				}
			});
			model2 = new Model({
				initialState: function (number) {
					return {sum: number};
				},
				sub: function (number) {
					var state = this.state().toJS();
					state.sum = state.sum - number;
					return state;
				}
			});
		});
		
		it("initializes a stream from model.", function () {
			var stream = Model.stream(model1);
			expect(stream).not.to.be.defined;
			expect(stream).to.be.an('object');
			expect(stream).to.be.an.instanceof(Stream);
			expect(stream.in).to.be.defined;
			var methods = ['in', 'filter', 'out'];
			_.each(methods, function (method) {
				expect(stream[method]).to.be.defined;
				expect(stream[method]).to.be.a('function');
			});
		});
		
		it("defines a stream connected to model.", function (done) {
			var stream = Model.stream(model1);
			model1.initialState(9)
				.then(function (state) {
					expect(state).to.be.an.instanceOf(State);
					var modelState = state.toJS();
					var streamState = stream.out();
					expect(streamState).to.be.an.instanceOf(State);
					streamState = streamState.toJS();
					expect(modelState).to.eql(streamState);
					done();
				})
				.catch(function (e) {
					done(e);
				});
		});
		
		it("defines a stream independent from model.", function (done) {
			var stream = Model.stream(model1);
			model1.initialState(9)
				.then(function (state) {
					var modelState = state.toJS();
					var streamState = stream.out().toJS();
					expect(modelState).to.eql({sum: 9});
					expect(streamState).to.eql({sum: 10});
					done();
				})
				.catch(function (e) {
					done(e);
				});
			stream.in({sum: 10});
		});
		
		it("defines a filter()-method filtering the stream input.", function (done) {
			var stream = Model.stream(model1);
			expect(stream.filter).to.be.defined;
			expect(stream.filter).to.be.a('function');
			var filteredStream = stream.filter(function (input) {
				return {filtered: input};
			});
			model1.initialState(10)
				.then(function (state) {
					var modelState = state;
					var streamState = filteredStream.out();
					expect(modelState.toJS()).to.eql({sum: 10});
					expect(streamState.toJS()).to.eql({filtered: {sum: 10}});
					done();
				})
				.catch(function (e) {
					done(e);
				});
		});
		
		it("defines a merge()-method merging a new model into the stream.", function (done) {
			var stream = Model.stream(model1);
			expect(stream.merge).to.be.defined;
			expect(typeof stream.merge).to.equal('function');
			model1.initialState(1);
			model2.initialState(3);
			var mergedStream = stream.merge(model2, function (s1, s2) {
				return {s1: s1, s2: s2};
			});
			model2.sub(1).then(function () {
				var state = mergedStream.out().toJS();
				expect(state).to.eql({
					s1: {sum: 1},
					s2: {sum: 2}
				});
				done();
			});
			
		});
		
	});
	
	describe("State API", function () {
		
		it("defines a Model.state()-function.", function () {
			expect(Model.state).to.be.defined;
			expect(typeof Model.state).to.equal("function");
		});
		
		it("calling Model.state() returns immutables of the input.", function () {
			var map = Model.state({'a': 1, 'b': 2});
			expect(map).to.be.defined;
			expect(map instanceof State).to.be.true;
			
			map = Model.state(map);
			expect(map instanceof State).to.be.true;
			var js = map.toJS();
			
			var list = Model.state([1, 2, 3, 4, 5, 6]);
			expect(list).to.be.defined;
			expect(map instanceof State).to.be.true;
			
			var number = Model.state(1);
			expect(_.isNumber(number)).to.be.true;
			
			var string = Model.state('abcdef');
			expect(_.isString(string)).to.be.true;
			
			var bool = Model.state(true);
			expect(_.isBoolean(bool)).to.be.true;
			
			var undef = Model.state(undefined);
			expect(_.isUndefined(undef)).to.be.true;
			
			var _null = Model.state(null);
			expect(_.isNull(_null)).to.be.true;
			
			var _fun = Model.state(function () {
			});
			expect(_.isUndefined(_fun)).to.be.true;
			
		});
		
		describe("provides a Map model", function () {
			
			it("that initializes from an object.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				expect(map).to.be.defined;
				expect(map.$Map).to.be.true;
				expect(map.$List).not.to.be.true;
				expect(map.type()).to.be.equal('MAP');
			});
			
			it("with get(key) returning the stored value.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				expect(map.get("a")).to.be.equal(1);
				expect(map.get("b")).to.be.equal(2);
				expect(map.get("c")).to.be.equal(3);
			});
			
			it("with put(key, value) returning a new instance containing the new value.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				var newMap = map.put("d", 4);
				expect(newMap.$Map).to.be.true;
				expect(newMap.get("a")).to.be.equal(1);
				expect(newMap.get("b")).to.be.equal(2);
				expect(newMap.get("c")).to.be.equal(3);
				expect(newMap.get("d")).to.be.equal(4);
				expect(map.get("d")).not.to.be.defined;
			});
			
			it("with put(key, undefined) returning a new instance with the key removed.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				var newMap = map.put("c", undefined);
				expect(newMap.$Map).to.be.true;
				expect(newMap.get("a")).to.be.equal(1);
				expect(newMap.get("b")).to.be.equal(2);
				expect(newMap.get("c")).not.to.be.defined;
				expect(newMap.has("c")).not.to.be.true;
			});
			
			it("with put(key, {object}) returning a new instance containing the new value as immutable.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				map = map.put("d", {da: 1, db: 2});
				expect(map.get("d")).to.be.defined;
				var subMap = map.get("d");
				expect(subMap.$Map).to.be.true;
			});
			
			it("with merge({object}) returning a new instance merging two objects.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				var newMap = map.merge({b: 'b', d: 'd'});
				expect(newMap instanceof State).to.be.true;
				expect(newMap.get('a')).to.be.equal(1);
				expect(newMap.get('b')).to.be.equal('b');
				expect(newMap.get('c')).to.be.equal(3);
				expect(newMap.get('d')).to.be.equal('d');
			});
			
			it("with deepMerge({object}) returning a new instance deeply merging two objects.", function () {
				this.skip('Deep merging not supported any more');
				return;
				var map = Model.state({a: 1, b: 2, c: {c1: 3, c2: 4}});
				var newMap = map.deepMerge({b: {b1: 1, b2: 2}, c: {c3: 3}, d: 'd'});
				var m = newMap.toJS();
				expect(newMap instanceof State).to.be.true;
				expect(newMap.get('a')).to.be.equal(1);
				expect(newMap.get('b').toJS()).to.be.eql({b1: 1, b2: 2});
				expect(newMap.get('c').toJS()).to.be.eql({c1: 3, c2: 4, c3: 3});
				expect(newMap.get('d')).to.be.equal('d');
			});
			
			it("with remove(key) returning a new instance without the removed value.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				var newMap = map.remove("b");
				expect(newMap.$Map).to.be.true;
				expect(newMap.get("a")).to.be.equal(1);
				expect(newMap.get("b")).not.to.be.defined;
				expect(newMap.get("c")).to.be.equal(3);
				expect(map.get("b")).to.be.equal(2);
			});
			
			it("with keys() returning all object keys.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				var keys = map.keys();
				expect(keys).to.be.eql(['a', 'b', 'c']);
			});
			
			it("with has(key) returning true for all object keys only.", function () {
				var map = Model.state({a: 1, b: 2, c: 3});
				expect(map.has("a")).to.be.true;
				expect(map.has("b")).to.be.true;
				expect(map.has("c")).to.be.true;
				expect(map.has("d")).not.to.be.true;
			});
			
			it("with toJS() returning the Javascript object.", function () {
				var source = {a: 1, b: 2, c: 3};
				var result = Model.state(source).toJS();
				expect(result).to.be.eql(source);
				source['d'] = 4;
				expect(result['d']).not.to.be.defined;
			});
			
		});
		
		describe("provides a List model", function () {
			
			it("that initializes from an array.", function () {
				var list = Model.state([1, 2, 3, 4]);
				expect(list).to.be.defined;
				expect(list.$Map).not.to.be.true;
				expect(list.$List).to.be.true;
				expect(list.type()).to.be.equal('LIST');
			});
			
			it("with get(index) returning the stored value.", function () {
				var list = Model.state([1, 2, 3, 4]);
				expect(list.get(0)).to.be.equal(1);
				expect(list.get(1)).to.be.equal(2);
				expect(list.get(2)).to.be.equal(3);
				expect(list.get(3)).to.be.equal(4);
				expect(list.get(4)).not.to.be.defined;
				expect(list.get(-1)).not.to.be.defined;
				expect(list.get("jshdjh")).not.to.be.defined;
			});
			
			it("with size() to return the number of elements.", function () {
				var list = Model.state([1, 2, 3, 4]);
				expect(list.size()).to.be.equal(4);
			});
			
			it("with add(item) to return a new list with the new value as last element.", function () {
				var list = Model.state([1, 2, 3, 4]);
				var newList = list.add(5);
				expect(newList.get(4)).to.be.equal(5);
				expect(list.get(4)).not.to.be.defined;
			});
			
			it("with remove(index) to return a new list without the removed element.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.remove(2);
				expect(newList.size()).to.be.equal(3);
				expect(newList.get(0)).to.be.equal(1);
				expect(newList.get(1)).to.be.equal(2);
				expect(newList.get(2)).to.be.equal(4);
				expect(list.size()).to.be.equal(4);
				expect(list.get(0)).to.be.equal(1);
				expect(list.get(1)).to.be.equal(2);
				expect(list.get(2)).to.be.equal(3);
				expect(list.get(3)).to.be.equal(4);
			});
			
			it("with remove(index) to return the same list, if no element has been removed.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.remove(10);
				expect(newList.size()).to.be.equal(4);
				expect(newList.get(0)).to.be.equal(1);
				expect(newList.get(1)).to.be.equal(2);
				expect(newList.get(2)).to.be.equal(3);
				expect(newList.get(3)).to.be.equal(4);
				expect(list.size()).to.be.equal(4);
				expect(list.get(0)).to.be.equal(1);
				expect(list.get(1)).to.be.equal(2);
				expect(list.get(2)).to.be.equal(3);
				expect(list.get(3)).to.be.equal(4);
			});
			
			it("with insert(0, item) to return a list with the item at first position.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.insert(0, 5);
				expect(newList.get(0)).to.be.equal(5);
				expect(newList.get(1)).to.be.equal(1);
				expect(list.size()).to.be.equal(4);
			});
			
			it("with insert(size(), item) to return a list with the item at last position.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.insert(list.size(), 5);
				expect(newList.get(0)).to.be.equal(1);
				expect(newList.get(4)).to.be.equal(5);
				expect(list.size()).to.be.equal(4);
			});
			
			it("with push(item) to return a list with the item at last position.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.push(5);
				expect(newList.get(0)).to.be.equal(1);
				expect(newList.get(4)).to.be.equal(5);
				expect(list.size()).to.be.equal(4);
				
			});
			
			it("with pop() to return a list with the last item removed.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.pop();
				expect(newList.get(0)).to.be.equal(1);
				expect(newList.get(1)).to.be.equal(2);
				expect(newList.get(2)).to.be.equal(3);
				expect(newList.get(3)).not.to.be.defined;
				expect(list.size()).to.be.equal(4);
				
			});
			
			it("with unshift(item) to return a list with the item at first position.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.unshift(5);
				expect(newList.get(0)).to.be.equal(5);
				expect(newList.get(1)).to.be.equal(1);
				expect(list.size()).to.be.equal(4);
			});
			
			it("with shift() to return a list with the first item removed.", function () {
				var list = new Model.state([1, 2, 3, 4]);
				var newList = list.shift();
				expect(newList.get(0)).to.be.equal(2);
				expect(newList.get(1)).to.be.equal(3);
				expect(newList.get(2)).to.be.equal(4);
				expect(newList.get(3)).not.to.be.defined;
				expect(list.size()).to.be.equal(4);
				
			});
			
			it("with toJS() returning an array equal to the original array.", function () {
				var source = [1, 2, 3, 4];
				var list = new Model.state(source);
				var actual = list.toJS();
				expect(actual).to.be.eql(source);
			});
		});
		
	});
});