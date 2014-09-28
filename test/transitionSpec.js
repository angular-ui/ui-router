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
      var p = parent;
      while (p !== undefined) {
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

  beforeEach(inject(function ($transition) {
    matcher = new StateMatcher(statesMap);
    $transition.init(statesMap[""], {}, function (ref, options) {
      return matcher.find(ref, options.relative);
    });
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

          $transition.init(statesMap.first, {}, function(ref, options) {
            return matcher.find(ref, options.relative);
          });

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

      xdescribe('.entering()', function() {
        it('should not inject $state$', inject(function($transition, $q) {
          transitionProvider.on({ from: "A", to: "D" }, function() {
            throw new Error("transition failed");
          });

          // todo: set up a helper init fn to prep transitions
//          var transition = $transition.start("first");
//          var result = new PromiseResult(transition.promise);
//          transition.run(); $q.flush();
//
//          expect(result.called()).toEqual({ resolve: false, reject: true, complete: true });
//          expect(result.get().reject.message).toContain("Unknown provider: $state$");
        }));

      });
    });
  });

  describe('instance', function() {
    describe('is', function() {
      it('should match rules', inject(function($transition) {
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
    });
  });

});