describe('transition', function () {

  var transitionProvider, matcher, statesMap = {};

  beforeEach(module('ui.router', function ($transitionProvider) {
    transitionProvider = $transitionProvider;
    var stateTree = {
      first: {},
      second: {},
      third: {},
      A: {
        B: {
          C: {
            D: {
            }
          },
          E: {
            F: {
            }
          }
        },
        G: {
          H: {
            I: {
            }
          }
        }
      }
    };

    var stateProps = ["resolve", "resolvePolicy", "data", "template", "templateUrl", "url", "name"];
    loadStates(undefined, stateTree, '');

    function loadStates(parent, state, name) {
      var substates = omit.apply(null, [state].concat(stateProps));
      var thisState = pick.apply(null, [state].concat(stateProps));
      extend(thisState, { name: name, parent: parent, data: { children: [] }});
      thisState.path = [];
      var p = thisState;
      while (p !== undefined && p.name !== "") {
        thisState.path.push(p);
        p = p.parent;
      }
      thisState.path.reverse();
      angular.forEach(substates, function (value, key) {
        thisState.data.children.push(loadStates(thisState, value, key));
      });
      statesMap[name] = thisState;
      return thisState;
    }
  }));

  var initialState = angular.noop;
  beforeEach(inject(function ($transition) {
    matcher = new StateMatcher(statesMap);
    initialState = function initialState(state) {
      if (angular.isString(state)) state = matcher.find(state);
      $transition.init(state, {}, function(ref, options) {
        return matcher.find(ref, options.relative);
      });
    };

    initialState("");
  }));

  describe('provider', function() {
    describe('async event hooks:', function() {
      function PromiseResult(promise) {
        var self = this, _promise;
        var resolve, reject, complete;

        this.setPromise = function(promise) {
          if (_promise) throw new Error("Already have with'd a promise.");
          _promise = promise;
          _promise.
            then(function (data) { resolve = data || true; })
            .catch(function (err) { reject = err || true; })
            .finally(function () { complete = true; });
        };
        this.get = function() { return { resolve: resolve, reject: reject, complete: complete }; };
        this.called = function() { return map(self.get(), function(val, key) { return val !== undefined }); };

        if (promise) this.setPromise(promise);
      }

      it('$transition$.promise should resolve on success', inject(function($transition, $q) {
        var result = new PromiseResult();
        transitionProvider.on({ from: "*", to: "second" }, function($transition$) {
          result.setPromise($transition$.promise);
        });

        $transition.start("second").run(); $q.flush();
        expect(result.called()).toEqual({ resolve: true, reject: false, complete: true });
      }));

      it('$transition$.promise should reject on error', inject(function($transition, $q) {
        var result = new PromiseResult();
        transitionProvider.on({ from: "*", to: "third" }, function($transition$) {
          result.setPromise($transition$.promise);
          throw new Error("transition failed");
        });

        $transition.start("third").run(); $q.flush();
        expect(result.called()).toEqual({ resolve: false, reject: true, complete: true });
        expect(result.get().reject.message).toEqual("transition failed");
      }));

      it('should inject $transition$', inject(function($transition, $q) {
        var t = null;

        transitionProvider.on({ from: "*", to: "second" }, function($transition$) {
          t = $transition$;
        });

        var tsecond = $transition.start("second");
        tsecond.run(); $q.flush();
        expect(t).toBe(tsecond);
      }));

      describe('.on()', function() {
        it('should fire matching events when transition starts', inject(function($transition, $q) {
          var t = null;
          transitionProvider.on({ from: "first", to: "second" }, function($transition$) {
            t = $transition$;
          });
          initialState(statesMap.first);

          $transition.start("third").run(); $q.flush();
          expect(t).toBeNull();

          $transition.start("second").run(); $q.flush();
          expect(t).not.toBeNull();
        }));

        it('should not inject $state$', inject(function($transition, $q) {
          transitionProvider.on({ from: "*", to: "third" }, function($state$) {
            var foo = $state$;
          });

          var transition = $transition.start("third");
          var result = new PromiseResult(transition.promise);
          transition.run(); $q.flush();

          expect(result.called()).toEqual({ resolve: false, reject: true, complete: true });
          expect(result.get().reject.message).toContain("Unknown provider: $state$");
        }));
      });

      describe('.entering()', function() {
        it('should inject $state$', inject(function($transition, $q) {
          var states = [];
          transitionProvider.entering({ from: "*", to: "*" }, function($state$) {
            states.push($state$);
          });

          $transition.start("D").run(); $q.flush();

          expect(pluck(states, 'name')).toEqual([ 'A', 'B', 'C', 'D' ]);
        }));

        it('should be called on only states being entered', inject(function($transition, $q) {
          transitionProvider.entering({ from: "*", to: "*" }, function($state$) { states.push($state$); });

          var states = [];
          initialState("B");
          $transition.start("D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'C', 'D' ]);

          states = [];
          initialState("H");
          $transition.start("D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'B', 'C', 'D' ]);
        }));

        it('should enter be called only when to and from match', inject(function($transition, $q) {
          transitionProvider.entering({ from: "*", to: "C" }, function($state$) { states.push($state$); });
          transitionProvider.entering({ from: "B", to: "C" }, function($state$) { states2.push($state$); });

          var states = [], states2 = [];
          initialState("A");
          $transition.start("D").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'C' ]);
          expect(pluck(states2, 'name')).toEqual([ ]);

          states = []; states2 = [];
          initialState("B");
          $transition.start("C").run(); $q.flush();
          expect(pluck(states, 'name')).toEqual([ 'C' ]);
          expect(pluck(states2, 'name')).toEqual([ 'C' ]);
        }));
      });

      // TODO: exiting, onSuccess/onError

      it("return value of 'false' should reject the transition with ABORT status", inject(function($transition, $q) {
        var states = [], rejection, transition = $transition.start("D");
        transitionProvider.entering({ from: "*", to: "*" }, function($state$) { states.push($state$); });
        transitionProvider.entering({ from: "*", to: "C" }, function() { return false; });

        transition.promise.catch(function(err) { rejection = err; });
        transition.run(); $q.flush();
        expect(pluck(states, 'name')).toEqual([ 'A', 'B', 'C' ]);
        expect(rejection.type).toEqual(transition.ABORTED);
      }));

      it("return value of type Transition should abort the transition with SUPERSEDED status", inject(function($transition, $q) {
        initialState("A");
        var states = [], rejection, transition = $transition.start("D");
        transitionProvider.entering({ from: "*", to: "*" }, function($state$) { states.push($state$); });
        transitionProvider.entering({ from: "*", to: "C" }, function($transition$) { return $transition$.redirect("B"); });
        transition.promise.catch(function(err) { rejection = err; });

        transition.run(); $q.flush();

        expect(pluck(states, 'name')).toEqual([ 'B', 'C' ]);
        expect(rejection.type).toEqual(transition.SUPERSEDED);
        expect(rejection.object.to().name).toEqual("B");
        expect(rejection.object.from().name).toEqual("A");
        expect(rejection.flags.redirected).toEqual(true);
      }));

      it("hooks which start a new transition should cause the old transition to be rejected.", inject(function($transition, $q) {
        initialState("A");
        var states = [], rejection, transition = $transition.start("D"), transition2, transition2success;
        transitionProvider.entering({ from: "*", to: "*" }, function($state$) { states.push($state$); });
        transitionProvider.entering({ from: "A", to: "C" }, function() {
          transition2 = $transition.start("G"); // similar to using $state.go() in a controller, etc.
          transition2.run();
        });
        transition.promise.catch(function(err) { rejection = err; });
        transition.run();
        $q.flush();

        // .entering() from A->C should have set transition2.
        transition2.promise.then(function() { transition2success = true; });
        $q.flush();

        expect(pluck(states, 'name')).toEqual([ 'B', 'C', 'G' ]);
        expect(rejection instanceof TransitionRejection).toBe(true);
        expect(rejection.type).toEqual(transition.SUPERSEDED);
        expect(rejection.object.to().name).toEqual("G");
        expect(rejection.object.from().name).toEqual("A");
        expect(rejection.flags.redirected).toBeUndefined();

        expect(transition2success).toBe(true);
      }));
    });
  });

  describe('Transition() instance', function() {
    describe('.entering', function() {
      it('should return the path elements being entered', inject(function($transition) {
        var t = $transition.start("A");
        expect(pluck(t.entering(), 'name')).toEqual([ "A" ]);

        t = $transition.start("D");
        expect(pluck(t.entering(), 'name')).toEqual([ "A", "B", "C", "D" ]);
      }));

      it('should not include already entered elements', inject(function($transition) {
        initialState("B");
        t = $transition.start("D");
        expect(pluck(t.entering(), 'name')).toEqual([ "C", "D" ]);
      }));
    });

    // TODO: .exiting

    describe('.is', function() {
      it('should match globs', inject(function($transition) {
        var t = $transition.start("first");

        expect(t.is({ to: "first" })).toBe(true);
        expect(t.is({ from: "" })).toBe(true);
        expect(t.is({ to: "first", from: "" })).toBe(true);

        expect(t.is({ to: ["first", "second"] })).toBe(true);
        expect(t.is({ to: ["first", "second"], from: ["", "third"] })).toBe(true);
        expect(t.is({ to: "first", from: "**" })).toBe(true);

        expect(t.is({ to: "second" })).toBe(false);
        expect(t.is({ from: "first" })).toBe(false);
        expect(t.is({ to: "first", from: "second" })).toBe(false);

        expect(t.is({ to: ["", "third"] })).toBe(false);
        expect(t.is({ to: "**", from: "first" })).toBe(false);
      }));

      it('should match using functions', inject(function($transition) {
        var t = $transition.start("first");

        expect(t.is({ to: function(state) { return state.name === "first"; } })).toBe(true);
        expect(t.is({ from: function(state) { return state.name === ""; } })).toBe(true);
        expect(t.is({
          to: function(state) { return state.name === "first"; },
          from: function(state) { return state.name === ""; }
        })).toBe(true);

        expect(t.is({
          to: function(state) { return state.name === "first"; },
          from: "**"
        })).toBe(true);

        expect(t.is({ to: function(state) { return state.name === "second"; } })).toBe(false);
        expect(t.is({ from: function(state) { return state.name === "first"; } })).toBe(false);
        expect(t.is({
          to: function(state) { return state.name === "first"; },
          from: function(state) { return state.name === "second"; }
        })).toBe(false);

//        expect(t.is({ to: ["", "third"] })).toBe(false);
//        expect(t.is({ to: "**", from: "first" })).toBe(false);
      }));
    });
  });

});