describe('$transition:', function () {
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

  describe('Transition().runAsync', function () {
    it('should resolve all resolves in a PathElement', inject(function ($q, $state) {
      $state.go("B");
      $q.flush();
    }));
  });
});