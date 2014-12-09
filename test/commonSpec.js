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
    it('should properly compact arrays', function() {
      expect(filter([0, 1, 0, 2, 0, 3, 4], function(v) { return !!v; })).toEqual([1, 2, 3, 4]);
    });
  });
});
