describe('Resolvables system:', function () {
  var statesTree, statesMap = {};
  var emptyPath;
  var counts;
  var asyncCount;

  beforeEach(inject(function ($transition) {
    emptyPath = new Path([]);
    asyncCount = 0;
  }));

  beforeEach(function () {
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
      statesMap[name] = thisState;
      return thisState;
    }
//    console.log(map(makePath([ "A", "B", "C" ]), function(s) { return s.name; }));
  });

  function makePath(names) {
    return new Path(map(names, function(name) { return statesMap[name]; }));
  }

  describe('PathElement.resolve()', function () {
    it('should resolve all resolves in a PathElement', inject(function ($q) {
      var path = makePath([ "A" ]);
      var promise = path.elements[0].resolve(new ResolveContext(path)); // A
      promise.then(function () {
        expect(path.elements[0].resolvables['_A']).toBeDefined();
        expect(path.elements[0].resolvables['_A'].data).toBe("A");
        expect(path.elements[0].resolvables['_A2'].data).toBe("A2");
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should not resolve non-dep parent PathElements', inject(function ($q) {
      var path = makePath([ "A", "B" ]);
      var promise = path.elements[1].resolve(new ResolveContext(path)); // B
      promise.then(function () {
        expect(path.elements[0].resolvables['_A']).toBeDefined();
        expect(path.elements[0].resolvables['_A'].data).toBeUndefined();
        expect(path.elements[0].resolvables['_A2'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_B'].data).toBe("B");
        expect(path.elements[1].resolvables['_B2'].data).toBe("B2");
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only eager resolves when run with "eager" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.elements[1].resolve(new ResolveContext(path), { policy: "eager" });
      promise.then(function () {
        expect(path.elements[0].resolvables['_J'].data).toBe("J");
        expect(path.elements[0].resolvables['_J2'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_N'].data).toBe("JN");
        expect(path.elements[1].resolvables['_N2'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_N3'].data).toBeUndefined();
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only eager and lazy resolves in PathElement when run with "lazy" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.elements[1].resolve(new ResolveContext(path), { policy: "lazy" });
      promise.then(function () {
        expect(path.elements[0].resolvables['_J'].data).toBe("J");
        expect(path.elements[0].resolvables['_J2'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_N'].data).toBe("JN");
        expect(path.elements[1].resolvables['_N2'].data).toBe("JN2");
        expect(path.elements[1].resolvables['_N3'].data).toBeUndefined();
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('ResolveContext.getResolvableLocals', function () {
    it('should return Resolvables from itself and all parents', inject(function ($q) {
      var path = makePath([ "A", "B", "C" ]);
      var resolveContext = new ResolveContext(path);
      var resolvableLocals = resolveContext.getResolvableLocals("C", { flatten: true } );
      var keys = Object.keys(resolvableLocals).sort();
      expect(keys).toEqual( ["_A", "_A2", "_B", "_B2", "_C", "_C2" ] );
    }));
  });

  describe('Path.resolve()', function () {
    it('should resolve all resolves in a Path', inject(function ($q) {
      var path = makePath([ "A", "B" ]);
      var promise = path.resolve(new ResolveContext(path));
      promise.then(function () {
        expect(path.elements[0].resolvables['_A'].data).toBe("A");
        expect(path.elements[0].resolvables['_A2'].data).toBe("A2");
        expect(path.elements[1].resolvables['_B'].data).toBe("B");
        expect(path.elements[1].resolvables['_B2'].data).toBe("B2");
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only eager resolves when run with "eager" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.resolve(new ResolveContext(path), { policy: "eager" });
      promise.then(function () {
        expect(path.elements[0].resolvables['_J'].data).toBe("J");
        expect(path.elements[0].resolvables['_J2'].data).toBe("JJ2");
        expect(path.elements[1].resolvables['_N'].data).toBe("JN");
        expect(path.elements[1].resolvables['_N2'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_N3'].data).toBeUndefined();
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));

    it('should resolve only lazy and eager resolves when run with "lazy" policy', inject(function ($q) {
      var path = makePath([ "J", "N" ]);
      var promise = path.resolve(new ResolveContext(path), { policy: "lazy" });
      promise.then(function () {
        expect(path.elements[0].resolvables['_J'].data).toBe("J");
        expect(path.elements[0].resolvables['_J2'].data).toBe("JJ2");
        expect(path.elements[1].resolvables['_N'].data).toBe("JN");
        expect(path.elements[1].resolvables['_N2'].data).toBe("JN2");
        expect(path.elements[1].resolvables['_N3'].data).toBeUndefined();
        asyncCount++;
      });

      $q.flush();
      expect(asyncCount).toBe(1);
    }));
  });

  describe('Resolvable.resolve()', function () {
    it('should resolve one Resolvable, and its deps', inject(function ($q) {
      var path = makePath([ "A", "B", "C" ]);
      var promise = path.elements[2].resolvables['_C'].resolve(new ResolveContext(path));
      promise.then(function () {
        expect(path.elements[0].resolvables['_A'].data).toBe("A");
        expect(path.elements[0].resolvables['_A2'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_B'].data).toBe("B");
        expect(path.elements[1].resolvables['_B2'].data).toBeUndefined();
        expect(path.elements[2].resolvables['_C'].data).toBe("ABC");
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
      var context = new ResolveContext(path);

      var result;

      var onEnter1 = function (_C2) { result = _C2; };
      var promise = cPathElement.invokeLater(onEnter1, {}, context);
      promise.then(function (data) {
        expect(result).toBe("C2");
        expect(path.elements[0].resolvables['_A'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_B'].data).toBeUndefined();
        expect(path.elements[2].resolvables['_C'].data).toBeUndefined();
        expect(path.elements[2].resolvables['_C2'].data).toBe("C2");
        expect(path.elements[3].resolvables['_D'].data).toBeUndefined();
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
      var context = new ResolveContext(path);

      var result;

      var cOnEnter1 = function (_C2) { result = _C2; };
      var promise = cPathElement.invokeLater(cOnEnter1, {}, context);
      promise.then(function (data) {
        expect(result).toBe("C2");
        expect(path.elements[0].resolvables['_A'].data).toBeUndefined();
        expect(path.elements[1].resolvables['_B'].data).toBeUndefined();
        expect(path.elements[2].resolvables['_C'].data).toBeUndefined();
        expect(path.elements[2].resolvables['_C2'].data).toBe("C2");
        expect(path.elements[3].resolvables['_D'].data).toBeUndefined();
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);

      var cOnEnter2 = function (_C) { result = _C; };
      promise = cPathElement.invokeLater(cOnEnter2, {}, context);
      promise.then(function (data) {
        expect(result).toBe("ABC");
        expect(path.elements[0].resolvables['_A'].data).toBe("A");
        expect(path.elements[1].resolvables['_B'].data).toBe("B");
        expect(path.elements[2].resolvables['_C'].data).toBe("ABC");
        expect(path.elements[2].resolvables['_C2'].data).toBe("C2");
        expect(path.elements[3].resolvables['_D'].data).toBeUndefined();
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
      var context = new ResolveContext(path);

      var cOnEnter = function (_D) {  };
      var caught;
      var promise = cPathElement.invokeLater(cOnEnter, {}, context);
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
    it('should inject deps from the same PathElement', inject(function ($q) {
      var path = makePath([ "A", "B", "C", "D" ]);
      var dPathElement = path.elements[3];
      var context = new ResolveContext(path);

      var result;
      var dOnEnter = function (_D) {
        result = _D;
      };

      var promise = dPathElement.invokeLater(dOnEnter, {}, context);
      promise.then(function () {
        expect(result).toBe("D1D2");
        expect(path.elements[0].resolvables['_A'].data).toBeUndefined();
        expect(path.elements[3].resolvables['_D'].data).toBe("D1D2");
        expect(path.elements[3].resolvables['_D2'].data).toBe("D2");
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
      var context = new ResolveContext(path);

      var result;
      var fOnEnter = function (_F) {
        result = _F;
      };

      var promise = fPathElement.invokeLater(fOnEnter, {}, context);
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
      var context = new ResolveContext(path);

      var resolvable_G = path.elements[2].resolvables._G;
      var promise = resolvable_G.get(context);
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
      promise = hPathElement.invokeLater(hOnEnter, {}, context);
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
      var context = new ResolveContext(path);

      var iPathElement = path.elements[1];
      var iOnEnter = function (_I) {  };
      var caught;
      var promise = iPathElement.invokeLater(iOnEnter, {}, context);
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
      var context = new ResolveContext(path);

      var iPathElement = path.elements[0];
      var iOnEnter = function (_O) {  };
      var caught;
      var promise = iPathElement.invokeLater(iOnEnter, {}, context);
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
      var context = new ResolveContext(path);

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
      var promise = kPathElement.invokeLater(kOnEnter, {}, context);
      promise.then(checkCounts);
      $q.flush();
      expect(onEnterCount).toBe(1);

      // invoke again
      promise = kPathElement.invokeLater(kOnEnter, {}, context);
      promise.then(checkCounts);
      $q.flush();
      expect(onEnterCount).toBe(2);
    }));
  });

  describe('Pre-Resolved Path', function () {
    it('from previous resolve operation should be re-useable when passed to a new ResolveContext', inject(function ($q) {
      var path = makePath([ "J", "K" ]);
      var async = 0;

      expect(counts["_J"]).toBe(0);
      expect(counts["_J2"]).toBe(0);
      path.resolve(new ResolveContext(path)).then(function () {
        expect(counts["_J"]).toBe(1);
        expect(counts["_J2"]).toBe(1);
        expect(counts["_K"]).toBe(1);
        asyncCount++;
      });
      $q.flush();
      expect(asyncCount).toBe(1);

      var path2 = path.concat(makePath([ "L", "M" ]));
      path2.resolve(new ResolveContext(path2)).then(function () {
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
      path.resolve(new ResolveContext(path)).then(function () {
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
      path2.resolve(new ResolveContext(path2)).then(function () {
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

describe("legacy resolve", function () {

  var $r, tick;

  beforeEach(module('ui.router.util'));
  beforeEach(module(function($provide) {
    $provide.factory('Foo', function() {
      return "Working";
    });
  }));

  beforeEach(inject(function($resolve, $q) {
    $r = $resolve;
    tick = $q.flush;
  }));

  describe(".resolve()", function () {
    it("calls injectable functions and returns a promise", function () {
      var fun = jasmine.createSpy('fun').andReturn(42);
      var r = $r.resolve({ fun: [ '$resolve', fun ] });
      expect(r).not.toBeResolved();
      tick();
      expect(resolvedValue(r)).toEqual({ fun: 42 });
      expect(fun).toHaveBeenCalled();
      expect(fun.callCount).toBe(1);
      expect(fun.mostRecentCall.args.length).toBe(1);
      expect(fun.mostRecentCall.args[0]).toBe($r);
    });

    it("resolves promises returned from the functions", inject(function ($q) {
      var d = $q.defer();
      var fun = jasmine.createSpy('fun').andReturn(d.promise);
      var r = $r.resolve({ fun: [ '$resolve', fun ] });
      tick();
      expect(r).not.toBeResolved();
      d.resolve('async');
      tick();
      expect(resolvedValue(r)).toEqual({ fun: 'async' });
    }));

    it("resolves dependencies between functions", function () {
      var a = jasmine.createSpy('a');
      var b = jasmine.createSpy('b').andReturn('bb');
      var r = $r.resolve({ a: [ 'b', a ], b: [ b ] });
      tick();
      expect(a).toHaveBeenCalled();
      expect(a.mostRecentCall.args).toEqual([ 'bb' ]);
      expect(b).toHaveBeenCalled();
    });

    it("resolves dependencies between functions that return promises", inject(function ($q) {
      var ad = $q.defer(), a = jasmine.createSpy('a').andReturn(ad.promise);
      var bd = $q.defer(), b = jasmine.createSpy('b').andReturn(bd.promise);
      var cd = $q.defer(), c = jasmine.createSpy('c').andReturn(cd.promise);

      var r = $r.resolve({ a: [ 'b', 'c', a ], b: [ 'c', b ], c: [ c ] });
      tick();
      expect(r).not.toBeResolved();
      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
      expect(c).toHaveBeenCalled();
      cd.resolve('cc');
      tick();
      expect(r).not.toBeResolved();
      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalled();
      expect(b.mostRecentCall.args).toEqual([ 'cc' ]);
      bd.resolve('bb');
      tick();
      expect(r).not.toBeResolved();
      expect(a).toHaveBeenCalled();
      expect(a.mostRecentCall.args).toEqual([ 'bb', 'cc' ]);
      ad.resolve('aa');
      tick();
      expect(resolvedValue(r)).toEqual({ a: 'aa', b: 'bb', c: 'cc' });
      expect(a.callCount).toBe(1);
      expect(b.callCount).toBe(1);
      expect(c.callCount).toBe(1);
    }));

    it("refuses cyclic dependencies", function () {
      var a = jasmine.createSpy('a');
      var b = jasmine.createSpy('b');
      expect(caught(function () {
        $r.resolve({ a: [ 'b', a ], b: [ 'a', b ] });
      })).toMatch(/cyclic/i);
      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
    });

    it("allows a function to depend on an injector value of the same name", function () {
      var r = $r.resolve({ $resolve: function($resolve) { return $resolve === $r; } });
      tick();
      expect(resolvedValue(r)).toEqual({ $resolve: true });
    });

    it("allows locals to be passed that override the injector", function () {
      var fun = jasmine.createSpy('fun');
      $r.resolve({ fun: [ '$resolve', fun ] }, { $resolve: 42 });
      tick();
      expect(fun).toHaveBeenCalled();
      expect(fun.mostRecentCall.args[0]).toBe(42);
    });

    it("does not call injectables overridden by a local", function () {
      var fun = jasmine.createSpy('fun').andReturn("function");
      var r = $r.resolve({ fun: [ fun ] }, { fun: "local" });
      tick();
      expect(fun).not.toHaveBeenCalled();
      expect(resolvedValue(r)).toEqual({ fun: "local" });
    });

    it("includes locals in the returned values", function () {
      var locals = { foo: 'hi', bar: 'mom' };
      var r = $r.resolve({}, locals);
      tick();
      expect(resolvedValue(r)).toEqual(locals);
    });

    it("allows inheritance from a parent resolve()", function () {
      var r = $r.resolve({ fun: function () { return true; } });
      var s = $r.resolve({ games: function () { return true; } }, r);
      tick();
      expect(r).toBeResolved();
      expect(resolvedValue(s)).toEqual({ fun: true, games: true });
    });

    it("only accepts promises from $resolve as parent", inject(function ($q) {
      expect(caught(function () {
        $r.resolve({}, null, $q.defer().promise);
      })).toMatch(/\$resolve\.resolve/);
    }));

    it("resolves dependencies from a parent resolve()", function () {
      var r = $r.resolve({ a: [ function() { return 'aa' } ] });
      var b = jasmine.createSpy('b');
      var s = $r.resolve({ b: [ 'a', b ] }, r);
      tick();
      expect(b).toHaveBeenCalled();
      expect(b.mostRecentCall.args).toEqual([ 'aa' ]);
    });

    it("allow access to ancestor resolves in descendent resolve blocks", inject(function ($q) {
      var gPromise = $q.defer(),
          gInjectable = jasmine.createSpy('gInjectable').andReturn(gPromise.promise),
          pPromise = $q.defer(),
          pInjectable = jasmine.createSpy('pInjectable').andReturn(pPromise.promise);

      var g = $r.resolve({ gP: [ gInjectable ] }, g);
      
      gPromise.resolve('grandparent');
      tick();

      var s = jasmine.createSpy('s');
      var p = $r.resolve({ p: [ pInjectable ] }, g);
      var c = $r.resolve({ c: [ 'p', 'gP', s ] }, p);
      
      pPromise.resolve('parent');
      tick();
      
      expect(s).toHaveBeenCalled();
      expect(s.mostRecentCall.args).toEqual([ 'parent', 'grandparent' ]);
    }));

    it("allows a function to override a parent value of the same name", function () {
      var r = $r.resolve({ b: function() { return 'B' } });
      var s = $r.resolve({
        a: function (b) { return 'a:' + b },
        b: function (b) { return '(' + b + ')' },
        c: function (b) { return 'c:' + b }
      }, r);
      tick();
      expect(resolvedValue(s)).toEqual({ a: 'a:(B)', b:'(B)', c:'c:(B)' });
    });

    it("allows a function to override a parent value of the same name with a promise", inject(function ($q) {
      var r = $r.resolve({ b: function() { return 'B' } });
      var superb, bd = $q.defer();
      var s = $r.resolve({
        a: function (b) { return 'a:' + b },
        b: function (b) { superb = b; return bd.promise },
        c: function (b) { return 'c:' + b }
      }, r);
      tick();
      bd.resolve('(' + superb + ')');
      tick();
      expect(resolvedValue(s)).toEqual({ a: 'a:(B)', b:'(B)', c:'c:(B)' });
    }));

    it("it only resolves after the parent resolves", inject(function ($q) {
      var bd = $q.defer(), b = jasmine.createSpy('b').andReturn(bd.promise);
      var cd = $q.defer(), c = jasmine.createSpy('c').andReturn(cd.promise);
      var r = $r.resolve({ c: [ c ] });
      var s = $r.resolve({ b: [ b ] }, r);
      bd.resolve('bbb');
      tick();
      expect(r).not.toBeResolved();
      expect(s).not.toBeResolved();
      cd.resolve('ccc');
      tick();
      expect(resolvedValue(r)).toEqual({ c: 'ccc' });
      expect(resolvedValue(s)).toEqual({ b: 'bbb', c: 'ccc' });
    }));

    it("invokes functions as soon as possible", inject(function ($q) {
      var ad = $q.defer(), a = jasmine.createSpy('a').andReturn(ad.promise);
      var bd = $q.defer(), b = jasmine.createSpy('b').andReturn(bd.promise);
      var cd = $q.defer(), c = jasmine.createSpy('c').andReturn(cd.promise);

      var r = $r.resolve({ c: [ c ] });
      var s = $r.resolve({ a: [ a ], b: [ 'c', b ] }, r);
      expect(c).toHaveBeenCalled(); // synchronously
      expect(a).toHaveBeenCalled(); // synchronously
      expect(r).not.toBeResolved();
      expect(s).not.toBeResolved();
      cd.resolve('ccc');
      tick();
      expect(b).toHaveBeenCalled();
      expect(b.mostRecentCall.args).toEqual([ 'ccc' ]);
    }));

    it("passes the specified 'self' argument as 'this'", function () {
      var self = {}, passed;
      $r.resolve({ fun: function () { passed = this; } }, null, null, self);
      tick();
      expect(passed).toBe(self);
    });

    it("rejects missing dependencies but does not fail synchronously", function () {
      var r = $r.resolve({ fun: function (invalid) {} });
      expect(r).not.toBeResolved();
      tick();
      expect(resolvedError(r)).toMatch(/unknown provider/i);
    });

    it("propagates exceptions thrown by the functions as a rejection", function () {
      var r = $r.resolve({ fun: function () { throw "i want cake" } });
      expect(r).not.toBeResolved();
      tick();
      expect(resolvedError(r)).toBe("i want cake");
    });

    it("propagates errors from a parent resolve", function () {
      var error = [ "the cake is a lie" ];
      var r = $r.resolve({ foo: function () { throw error } });
      var s = $r.resolve({ bar: function () { 42 } }, r);
      tick();
      expect(resolvedError(r)).toBe(error);
      expect(resolvedError(s)).toBe(error);
    });

    it("does not invoke any functions if the parent resolve has already failed", function () {
      var r = $r.resolve({ foo: function () { throw "oops" } });
      tick();
      expect(r).toBeResolved();
      var a = jasmine.createSpy('a');
      var s =  $r.resolve({ a: [ a ] }, r);
      tick();
      expect(resolvedError(s)).toBeDefined();
      expect(a).not.toHaveBeenCalled();
    });

    it("does not invoke any more functions after a failure", inject(function ($q) {
      var ad = $q.defer(), a = jasmine.createSpy('a').andReturn(ad.promise);
      var cd = $q.defer(), c = jasmine.createSpy('c').andReturn(cd.promise);
      var dd = $q.defer(), d = jasmine.createSpy('d').andReturn(dd.promise);
      var r = $r.resolve({ a: [ 'c', a ], c: [ c ], d: [ d ] });
      dd.reject('dontlikeit');
      tick();
      expect(resolvedError(r)).toBeDefined();
      cd.resolve('ccc');
      tick();
      expect(a).not.toHaveBeenCalled();
    }));

    it("does not invoke any more functions after a parent failure", inject(function ($q) {
      var ad = $q.defer(), a = jasmine.createSpy('a').andReturn(ad.promise);
      var cd = $q.defer(), c = jasmine.createSpy('c').andReturn(cd.promise);
      var dd = $q.defer(), d = jasmine.createSpy('d').andReturn(dd.promise);
      var r = $r.resolve({ c: [ c ], d: [ d ] });
      var s = $r.resolve({ a: [ 'c', a ] }, r);
      dd.reject('dontlikeit');
      tick();
      expect(resolvedError(r)).toBeDefined();
      expect(resolvedError(s)).toBeDefined();
      cd.resolve('ccc');
      tick();
      expect(a).not.toHaveBeenCalled();
    }));
  });

  describe(".study()", function () {
    it("returns a resolver function", function () {
      expect(typeof $r.study({})).toBe('function');
    });

    it("refuses cyclic dependencies", function () {
      var a = jasmine.createSpy('a');
      var b = jasmine.createSpy('b');
      expect(caught(function () {
        $r.study({ a: [ 'b', a ], b: [ 'a', b ] });
      })).toMatch(/cyclic/i);
      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
    });

    it("does not call the injectables", function () {
      var a = jasmine.createSpy('a');
      var b = jasmine.createSpy('b');
      $r.study({ a: [ 'b', a ], b: [ b ] });
      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
    });

    it("returns a function that can be used multiple times", function () {
      var trace = [];
      var r = $r.study({ a: [ 'what', function (what) { trace.push("a: " + what) } ] });
      r({ what: '1' });
      expect(trace).toEqual([ 'a: 1' ]);
      r({ what: 'hi' });
      expect(trace).toEqual([ 'a: 1', 'a: hi' ]);
    });

    it("resolves values from string factory names", function () {
      var result, r = $r.study({ foo: "Foo" })().then(function(values) {
        result = values['foo'];
      });
      tick();

      expect(result).toBe("Working");
    });
  });
});
