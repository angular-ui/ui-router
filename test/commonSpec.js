/**
 * Because PhantomJS sucks...
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

describe('common', function() {
  describe('GlobBuilder', function() {
    it('should match glob strings', function() {
      expect(GlobBuilder.is('*')).toBe(true);
      expect(GlobBuilder.is('**')).toBe(true);
      expect(GlobBuilder.is('*.*')).toBe(true);

      expect(GlobBuilder.is('')).toBe(false);
      expect(GlobBuilder.is('.')).toBe(false);
    });

    it('should construct glob matchers', function() {
      expect(GlobBuilder.fromString('')).toBeNull();

      var state = 'about.person.item';

      expect(GlobBuilder.fromString('*.person.*').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('*.person.**').matches(state)).toBe(true);

      expect(GlobBuilder.fromString('**.item.*').matches(state)).toBe(false);
      expect(GlobBuilder.fromString('**.item').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('**.stuff.*').matches(state)).toBe(false);
      expect(GlobBuilder.fromString('*.*.*').matches(state)).toBe(true);

      expect(GlobBuilder.fromString('about.*.*').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('about.**').matches(state)).toBe(true);
      expect(GlobBuilder.fromString('*.about.*').matches(state)).toBe(false);
      expect(GlobBuilder.fromString('about.*.*').matches(state)).toBe(true);
    });
  });

  describe('FunctionIterator', function() {
    it('should allow recursive function calling', function() {

      var it = new FunctionIterator([
        function wrap(initial, next)    { return "[" + next() + "]"; },
        function exclaim(initial, next) { return next() + "!"; },
        function greet(initial, next)   { return "Hello " + next(); },
        function name(initial)          { return initial.name; }
      ]);

      expect(it({ name: "Foo" })).toBe('[Hello Foo!]');
    });

    it('should allow short-circuiting the chain', function() {

      var it = new FunctionIterator([
        function top(initial, next) { return next().concat(["Baz"]); },
        function mid(initial, next) { return initial.concat(["Bar"]); },
        function bottom(initial) { throw new Error("This shouldn't happen"); }
      ]);

      expect(it(["Foo"])).toEqual(["Foo", "Bar", "Baz"]);
    });
  });

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
});
