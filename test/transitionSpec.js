describe('transition', function () {

  var transitionProvider, root = { name: "", path: [] }, matcher, matchStates = {
    "": root,
    "first": {  name: "first",  path: [root], data: { foo: true } },
    "second": { name: "second", path: [root], data: { bar: true } },
    "third": {  name: "third",  path: [root] }
  };

  describe('provider', function() {

    beforeEach(module('ui.router', function($transitionProvider) {
      transitionProvider = $transitionProvider;
    }));

    beforeEach(inject(function($transition) {
      matcher = new StateMatcher(matchStates);
      $transition.init(root, {}, function(ref, options) {
        return matcher.find(ref, options.relative);
      });
    }));

    describe('events:', function() {
      describe('.on()', function() {
        it('should fire matching events when transition starts', inject(function($transition, $q) {
          var t = null;
          transitionProvider.on({ from: "first", to: "second" }, function($transition$) {
            t = $transition$;
          });

          $transition.init(matchStates.first, {}, function(ref, options) {
            return matcher.find(ref, options.relative);
          });

          $transition.start("third").run();
          $q.flush();
          expect(t).toBeNull();

          $transition.start("second").run();
          $q.flush();
          expect(t).not.toBeNull();
        }));

        it('should inject $transition$', inject(function($transition, $q) {
          var t = null;
          var tsecond = $transition.start("second");

          transitionProvider.on({ from: "*", to: "second" }, function($transition$) {
            t = $transition$;
          });

          tsecond.run();
          $q.flush();
          expect(t).toBe(tsecond);
        }));

        it('$transition$.promise should resolve on success', inject(function($transition, $q) {
          var success, failure, completed;
          transitionProvider.on({ from: "**", to: "second" }, function($transition$) {
            $transition$.promise
              .then(function () { success = true; })
              .catch(function () { failure = true; })
              .finally(function () { completed = true; });
          });

          $transition.start("second").run();
          $q.flush();
          expect(success).toBe(true);
          expect(failure).toBeUndefined();
          expect(completed).toBe(true);
        }));

        it('$transition$.promise should reject on error', inject(function($transition, $q) {
          var success, failure, completed;
          transitionProvider.on({ from: "**", to: "third" }, function($transition$) {
            $transition$.promise
              .then(function () { success = true; })
              .catch(function (err) { failure = err; })
              .finally(function () { completed = true; });
            throw new Error("transition failed");
          });

          $transition.start("third").run();
          $q.flush();
          expect(success).toBeUndefined();
          expect(failure.message).toBe("transition failed");
          expect(completed).toBe(true);
        }));

//        it('should not inject $state$', inject(function($transition, $q) {
//          var t = null;
//          transitionProvider.on({ from: "*", to: "second" }, function($transition$, $state$) {
//            t = $transition$;
//          });
//          transitionProvider.onError({ from: "*", to: "second" }, function(error) {
//            t = error;
//          });
//
//          $transition.start("second").run();
//          $q.flush();
//          expect(t).toBeNull()
//        }));
      });

      it('should fire matching "on" events regardless of outcome', inject(function($transition, $q) {
        var t = null;

        transitionProvider.on({ from: "first", to: "second" }, function($transition$) {
          t = $transition$;
        });

        $transition.init(matchStates.first, {}, function(ref, options) {
          return matcher.find(ref, options.relative);
        });

        $transition.start("third").run();
        $q.flush();
        expect(t).toBeNull();

        $transition.start("second").run();
        $q.flush();
        expect(t).not.toBeNull();
      }));

    });
  });


  var statesTree, statesMap = {};
  var emptyPath;
  var counts;
  var asyncCount;

  beforeEach(module('ui.router', function($stateProvider, $locationProvider) {
    locationProvider = $locationProvider;
    $locationProvider.html5Mode(false);
  }));


  beforeEach(module(function ($stateProvider, $provide) {
    counts = { _J: 0, _J2: 0, _K: 0, _L: 0, _M: 0};
    states = {
      A: { resolve: { _A: function () { return "A"; }, _A2: function() { return "A2"; }},
        B: { resolve: { _B: function () { return "B"; }, _B2: function() { return "B2"; }},
          C: { resolve: { _C: function (_A, _B) { return _A + _B + "C"; }, _C2: function() { return "C2"; }},
            D: { resolve: { _D: function (_D2) { return "D1" + _D2; }, _D2: function () { return "D2"; }} }
          }
        },
        E: { resolve: { _E: function() { return "E"; } },
          F: { resolve: { _E: function() { return "_E"; }, _F: function(_E) { return _E + "F"; }} }
        },
        G: { resolve: { _G: function() { return "G"; } },
          H: { resolve: { _G: function(_G) { return _G + "_G"; }, _H: function(_G) { return _G + "H"; } } }
        },
        I: { resolve: { _I: function(_I) { return "I"; } } }
      },
      J: { resolve: { _J: function() { counts['_J']++; return "J"; }, _J2: function(_J) { counts['_J2']++; return _J + "J2"; } },
        K: { resolve: { _K: function(_J2) { counts['_K']++; return _J2 + "K"; }},
          L: { resolve: { _L: function(_K) { counts['_L']++; return _K + "L"; }},
            M: { resolve: { _M: function(_L) { counts['_M']++; return _L + "M"; }} }
          }
        },
        N: {
          resolve: { _N: function(_J) { return _J + "N"; }, _N2: function(_J) { return _J + "N2"; }, _N3: function(_J) { return _J + "N3"; } },
          resolvePolicy: { _N: "eager", _N2: "lazy", _N3: "jit" }
        }
      },
      O: { resolve: { _O: function(_O2) { return _O2 + "O"; }, _O2: function(_O) { return _O + "O2"; } }
      }
    };

    var stateProps = ["resolve", "resolvePolicy"];
    statesTree = loadStates({}, states, '');

    function loadStates(parent, state, name) {
      var thisState = pick.apply(null, [state].concat(stateProps));
      var substates = omit.apply(null, [state].concat(stateProps));

      thisState.name = name;
      thisState.parent = parent.name;
      thisState.data = { children: [] };

      angular.forEach(substates, function (value, key) {
        thisState.data.children.push(loadStates(thisState, value, key));
      });
      if (name)
        statesMap[name] = thisState;
      return thisState;
    }

    angular.forEach(statesMap, function(state, name) {
      $stateProvider.state(state);
    });

//    console.log(map(makePath([ "A", "B", "C" ]), function(s) { return s.name; }));
  }));

  function makePath(names) {
    return new Path(map(names, function(name) { return statesMap[name]; }));
  }

  describe('instance', function() {
    beforeEach(inject(function($transition) {
      matcher = new StateMatcher(matchStates);

      $transition.init(root, {}, function(ref, options) {
        return matcher.find(ref, options.relative);
      });
    }));

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

    describe('runAsync', function () {
      it('should resolve all resolves in a PathElement', inject(function ($q, $state) {
        $state.go("B");
        $q.flush();
      }));
    });
  });

});