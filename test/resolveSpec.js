var module = angular.mock.module;
var uiRouter = require("ui-router");

var common = uiRouter.common,
  omit = common.omit,
  map = common.map,
  pick = common.pick;

var resolve = uiRouter.resolve,
  Resolvable = resolve.Resolvable,
  Path = resolve.Path,
  PathElement = resolve.PathElement;

///////////////////////////////////////////////

var statesTree, statesMap = {};
var emptyPath;
var counts, expectCounts;
var asyncCount;

beforeEach(function () {
  counts = { _J: 0, _J2: 0, _K: 0, _L: 0, _M: 0};
  expectCounts = angular.copy(counts);
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
    statesMap[name] = thisState;
    return thisState;
  }
//    console.log(map(makePath([ "A", "B", "C" ]), function(s) { return s.name; }));
});

function makePath(names) {
  return new Path(map(names, function(name) { return statesMap[name]; }));
}

function getResolvedData(pathContext) {
  return map(pathContext.getResolvables(), function(r) { return r.data; });
}

describe('Resolvables system:', function () {
  beforeEach(inject(function ($transition, $injector) {
    uiRouter.angular1.runtime.setRuntimeInjector($injector);
    emptyPath = new Path([]);
    asyncCount = 0;
  }));

  describe('PathElement.resolvePathElement()', function () {
    it('should resolve all resolves in a PathElement', inject(function ($q) {
      var path = makePath([ "A" ]);
      var promise = path.elements[0].resolvePathElement(path); // A
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({ _A: "A", _A2: "A2" });
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should not resolve non-dep parent PathElements', inject(function ($q) {
      var path = makePath([ "A", "B" ]);
      var promise = path.elements[1].resolvePathElement(path); // B
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({_B: "B", _B2: "B2" });
        expect(path.getResolvables()._A).toBeDefined();
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only eager resolves when run with "eager" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.elements[1].resolvePathElement(path, { resolvePolicy: "eager" });
      promise.then(function () {
        var results = map(path.getResolvables(), function(r) { return r.data; });
        expect(results).toEqualData({_J: "J", _N: "JN" });
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only eager and lazy resolves in PathElement when run with "lazy" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.elements[1].resolvePathElement(path, { resolvePolicy: "lazy" });
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({ _J: "J", _N: "JN", _N2: "JN2" });
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('Path.getResolvables', function () {
    it('should return Resolvables from the deepest element and all ancestors', inject(function ($q) {
      var path = makePath([ "A", "B", "C" ]);
      var resolvableLocals = path.getResolvables("C");
      var keys = Object.keys(resolvableLocals).sort();
      expect(keys).toEqual( ["_A", "_A2", "_B", "_B2", "_C", "_C2" ] );
    }));
  });

  describe('Path.resolvePath()', function () {
    it('should resolve all resolves in a Path', inject(function ($q) {
      var path = makePath([ "A", "B" ]);
      var promise = path.resolvePath();
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({ _A: "A", _A2: "A2", _B: "B", _B2: "B2" });
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only eager resolves when run with "eager" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.resolvePath({ resolvePolicy: "eager" });
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({ _J: "J", _N: "JN" });
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only lazy and eager resolves when run with "lazy" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.resolvePath({ resolvePolicy: "lazy" });
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({ _J: "J", _N: "JN", _N2: "JN2"});
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('Resolvable.resolveResolvable()', function () {
    it('should resolve one Resolvable, and its deps', inject(function ($q) {
      var path = makePath([ "A", "B", "C" ]);
      var promise = path.getResolvables()._C.resolveResolvable(path);
      promise.then(function () {
        expect(getResolvedData(path)).toEqualData({ _A: "A", _B: "B",_C: "ABC" });
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('PathElement.invokeLater()', function () {
    it('should resolve only the required deps, then inject the fn', inject(function ($q) {
      var path = makePath([ "A", "B", "C", "D" ]);
      var cPathElement = path.elements[2];

      var result;

      var onEnter1 = function (_C2) { result = _C2; };
      var promise = cPathElement.invokeLater(onEnter1, {}, path);
      promise.then(function (data) {
        expect(result).toBe("C2");
        expect(getResolvedData(path)).toEqualData({_C2: "C2"});
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('PathElement.invokeLater()', function () {
    it('should resolve the required deps on demand', inject(function ($q) {
      var path = makePath([ "A", "B", "C", "D" ]);
      var cPathElement = path.elements[2];

      var result;

      var cOnEnter1 = function (_C2) { result = _C2; };
      var promise = cPathElement.invokeLater(cOnEnter1, {}, path);
      promise.then(function (data) {
        expect(result).toBe("C2");
        expect(getResolvedData(path)).toEqualData({_C2: "C2"})
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);

      var cOnEnter2 = function (_C) { result = _C; };
      promise = cPathElement.invokeLater(cOnEnter2, {}, path);
      promise.then(function (data) {
        expect(result).toBe("ABC");
        expect(getResolvedData(path)).toEqualData({_A: "A", _B: "B", _C: "ABC", _C2: "C2"})
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(2);
    }));
  });

  describe('invokeLater', function () {
    it('should Error if the onEnter dependency cannot be injected', inject(function ($q) {
      var path = makePath([ "A", "B", "C", "D" ]);
      var cPathElement = path.elements[2];

      var cOnEnter = function (_D) {  };
      var caught;
      var promise = cPathElement.invokeLater(cOnEnter, {}, path);
      promise.catch(function (err) {
        caught = err;
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
      expect(caught.message).toContain("Unknown provider: _DProvider");
    }));
  });


  describe('Resolvables', function () {
    it('should be able to inject deps from the same PathElement', inject(function ($q) {
      var path = makePath([ "A", "B", "C", "D" ]);
      var dPathElement = path.elements[3];

      var result;
      var dOnEnter = function (_D) {
        result = _D;
      };

      var promise = dPathElement.invokeLater(dOnEnter, {}, path);
      promise.then(function () {
        expect(result).toBe("D1D2");
        expect(getResolvedData(path)).toEqualData({_D: "D1D2", _D2: "D2"})
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('Resolvables', function () {
    it('should allow PathElement to override parent deps Resolvables of the same name', inject(function ($q) {
      var path = makePath([ "A", "E", "F" ]);
      var fPathElement = path.elements[2];

      var result;
      var fOnEnter = function (_F) {
        result = _F;
      };

      var promise = fPathElement.invokeLater(fOnEnter, {}, path);
      promise.then(function () {
        expect(result).toBe("_EF");
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  // State H has a resolve named _G which takes _G as an injected parameter. injected _G should come from state "G"
  // It also has a resolve named _H which takes _G as an injected parameter. injected _G should come from state "H"
  describe('Resolvables', function () {
    it('of a particular name should be injected from the parent PathElements for their own name', inject(function ($q) {
      var path = makePath([ "A", "G", "H" ]);

      var resolvable_G = path.getResolvables()._G;
      var promise = resolvable_G.get(path);
      promise.then(function (data) {
        expect(data).toBe("G_G");
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);

      var result;
      var hOnEnter = function (_H) {
        result = _H;
      };

      var hPathElement = path.elements[2];
      promise = hPathElement.invokeLater(hOnEnter, {}, path);
      promise.then(function (data) {
        expect(result).toBe("G_GH");
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(2);
    }));
  });

  describe('Resolvables', function () {
    it('should fail to inject same-name deps to self if no parent PathElement contains the name.', inject(function ($q) {
      var path = makePath([ "A", "I" ]);

      var iPathElement = path.elements[1];
      var iOnEnter = function (_I) {  };
      var caught;
      var promise = iPathElement.invokeLater(iOnEnter, {}, path);
      promise.catch(function (err) {
        caught = err;
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
      expect(caught.message).toContain("[$injector:unpr] Unknown provider: _IProvider ");
    }));
  });

  xdescribe('Resolvables', function () {
    it('should fail to inject circular dependency', inject(function ($q) {
      var path = makePath([ "O" ]);

      var iPathElement = path.elements[0];
      var iOnEnter = function (_O) {  };
      var caught;
      var promise = iPathElement.invokeLater(iOnEnter, {}, path);
      promise.catch(function (err) {
        caught = err;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
      expect(caught.message).toContain("[$injector:unpr] Unknown provider: _IProvider ");
    }));
  });

  describe('Resolvables', function () {
    it('should not re-resolve', inject(function ($q) {
      var path = makePath([ "J", "K" ]);

      var kPathElement = path.elements[1];
      var result;
      function checkCounts() {
        expect(result).toBe("JJ2K");
        expect(counts['_J']).toBe(1);
        expect(counts['_J2']).toBe(1);
        expect(counts['_K']).toBe(1);
      }

      var onEnterCount = 0;
      var kOnEnter = function (_K) {
        result = _K;
        onEnterCount++;
      };
      var promise = kPathElement.invokeLater(kOnEnter, {}, path);
      promise.then(checkCounts);
      $q.flush();
      expect(onEnterCount).toBe(1);

      // invoke again
      promise = kPathElement.invokeLater(kOnEnter, {}, path);
      promise.then(checkCounts);
      $q.flush();
      expect(onEnterCount).toBe(2);
    }));
  });

  describe('Pre-Resolved Path', function () {
    it('from previous resolve operation should be re-useable when used in another resolve operation', inject(function ($q) {
      var path = makePath([ "J", "K" ]);
      var async = 0;

      expect(counts["_J"]).toBe(0);
      expect(counts["_J2"]).toBe(0);

      path.resolvePath().then(function () {
        expect(counts["_J"]).toBe(1);
        expect(counts["_J2"]).toBe(1);
        expect(counts["_K"]).toBe(1);
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);

      var path2 = path.concat(makePath([ "L", "M" ]));
      path2.resolvePath().then(function () {
        expect(counts["_J"]).toBe(1);
        expect(counts["_J2"]).toBe(1);
        expect(counts["_K"]).toBe(1);
        expect(counts["_L"]).toBe(1);
        expect(counts["_M"]).toBe(1);
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(2);
    }));
  });

  describe('Path.slice()', function () {
    it('should create a partial path from an original path', inject(function ($q) {
      var path = makePath([ "J", "K", "L" ]);
      path.resolvePath().then(function () {
        expect(counts["_J"]).toBe(1);
        expect(counts["_J2"]).toBe(1);
        expect(counts["_K"]).toBe(1);
        expect(counts["_L"]).toBe(1);
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);

      var slicedPath = path.slice(0, 2);
      expect(slicedPath.elements.length).toBe(2);
      expect(slicedPath.elements[1]).toBe(path.elements[1]);
      var path2 = path.concat(makePath([ "L", "M" ]));
      path2.resolvePath().then(function () {
        expect(counts["_J"]).toBe(1);
        expect(counts["_J2"]).toBe(1);
        expect(counts["_K"]).toBe(1);
        expect(counts["_L"]).toBe(2);
        expect(counts["_M"]).toBe(1);
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(2);
    }));
  });

  // TODO: test injection of annotated functions
  // TODO: test injection of services
  // TODO: test injection of other locals
  // TODO: Implement and test injection to onEnter/Exit
  // TODO: Implement and test injection into controllers
});

describe("State transitions with resolves", function() {
  beforeEach(module(function($stateProvider) {
    // allow tests to specify controllers after registration
    function controllerProvider(state) {
      return function() {
        return statesMap[state.name].controller || function emptyController() {}
      }
    }

    angular.forEach(statesMap, function(state, key) {
      if (!key) return;
      state.template = "<div ui-view></div> state"+key;
      state.controllerProvider = controllerProvider(state);
      $stateProvider.state(key, state);
    });
  }));

  var $state, $transition, $q, $compile, $rootScope, $scope, $timeout;
  beforeEach(inject(function (_$transition_, _$state_, _$q_, _$compile_, _$rootScope_, _$timeout_, $injector) {
    $state = _$state_;
    $transition = _$transition_;
    $q = _$q_;
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    $scope = $rootScope.$new();
    uiRouter.angular1.runtime.setRuntimeInjector($injector);
    emptyPath = new Path([]);
    asyncCount = 0;
    $compile(angular.element("<div ui-view></div>"))($scope);
  }));

  function flush() {
    $q.flush();
    $timeout.flush();
  }

  function testGo(state, params, options) {
    $state.go(state, params, options);
    $q.flush();
    expect($state.current).toBe($state.get(state));
  }

  it("should not resolve jit resolves that are not injected anywhere", inject(function() {
    testGo("J");
    expect(counts).toEqualData(expectCounts);
    testGo("K");
    expect(counts).toEqualData(expectCounts);
  }));

  it("should invoke jit resolves when they are injected", inject(function() {
    statesMap.J.controller = function JController(_J) { };

    testGo("J");
    expectCounts._J++;
    expect(counts).toEqualData(expectCounts);
  }));

  it("should invoke jit resolves only when injected", inject(function() {
    statesMap.K.controller = function KController(_K) { };

    testGo("J");
    expect(counts).toEqualData(expectCounts);

    testGo("K");
    expectCounts._K++;
    expectCounts._J++;
    expectCounts._J2++;
    expect(counts).toEqualData(expectCounts);
  }));

  it("should not re-invoke jit resolves", inject(function() {
    statesMap.J.controller = function JController(_J) { };
    statesMap.K.controller = function KController(_K) { };
    testGo("J");
    expectCounts._J++;
    expect(counts).toEqualData(expectCounts);

    testGo("K");

    expectCounts._K++;
    expectCounts._J2++;
    expect(counts).toEqualData(expectCounts);
  }));

  it("should invoke jit resolves during a transition that are injected in a hook like onEnter", inject(function() {
    statesMap.J.onEnter = function onEnter(_J) {};
    testGo("J");
    expectCounts._J++;
    expect(counts).toEqualData(expectCounts);
  }));
});
