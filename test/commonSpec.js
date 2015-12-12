var module = angular.mock.module;
var uiRouter = require("ui-router");
var Glob = uiRouter.state.Glob;
var common = uiRouter.common,
  defaults = common.defaults,
  filter = common.filter,
  is = common.is,
  eq = common.eq,
  not = common.not,
  pattern = common.pattern,
  val = common.val;

describe('common', function() {
  describe('filter', function() {
    it("should filter arrays", function() {
      var input = [ 1, 2, 3, 4, 5 ];
      var filtered = filter(input, function(int) { return int > 2; });
      expect(filtered.length).toBe(3);
      expect(filtered).toEqual([ 3, 4, 5 ]);
    });

    it('should properly compact arrays', function() {
      expect(filter([0, 1, 0, 2, 0, 3, 4], function(v) { return !!v; })).toEqual([1, 2, 3, 4]);
    });

    it("should filter objects", function() {
      var input = { foo: 1, bar: 2, baz: 3, qux: 4 };
      var filtered = filter(input, function(val, key) { return val > 2; });
      expect(Object.keys(filtered).length).toBe(2);
      expect(filtered).toEqual({ baz: 3, qux: 4 });
    });
  });

  describe('defaults', function() {
    it('should do left-associative object merge', function() {
      var options = { param1: "new val" };
      var result = defaults(options, {
        param1: "default val",
        param2: "default val 2"
      });
      expect(result).toEqual({ param1: "new val", param2: "default val 2" });
    });

    it('should whitelist keys present in default values', function() {
      var options = { param1: 1, param2: 2, param3: 3 };
      var result = defaults(options, {
        param1: 0,
        param2: 0
      });
      expect(result).toEqual({ param1: 1, param2: 2 });
    });

    it('should return an object when passed an empty value', function() {
      var vals = { param1: 0, param2: 0 }
      expect(defaults(null, vals)).toEqual(vals);
      expect(defaults(undefined, vals)).toEqual(vals);
    });
  });

  describe('not', function() {
    it('should allow double-negatives', function() {
      function T() { return true; }
      function F() { return false; }
      function empty() { return ""; }

      expect(not(not(T))()).toBe(true);
      expect(not(not(F))()).toBe(false);
      expect(not(not(empty))()).toBe(false);
    });
  });

  describe('val', function() {
    it('should return identity', function() {
      var f = function() {}, foo = {};
      expect(val(f)()).toBe(f);
      expect(val(foo)()).toBe(foo);
      expect(val(true)()).toBe(true);
      expect(val(false)()).toBe(false);
      expect(val(null)()).toBe(null);
    });
  });

  describe('pattern', function() {
    it('should return the result of a paired function when a condition function returns true', function() {
      var typeChecker = pattern([
        [is(Number),  val("number!")],
        [is(String),  val("string!")],
        [is(Boolean), val("boolean!")],
        [eq(null),    val("null!")]
      ]);

      expect(typeChecker(1)).toBe("number!");
      expect(typeChecker("foo!")).toBe("string!");
      expect(typeChecker(true)).toBe("boolean!");
      expect(typeChecker(false)).toBe("boolean!");
      expect(typeChecker(null)).toBe("null!");
      expect(typeChecker(undefined)).toBe(undefined);
    });
  });
});
