import {StateMatcher, StateBuilder, UrlMatcher, TargetState, extend} from "../../src/core";

describe('state helpers', function() {

  var states;

  beforeEach(function() {
    states = {};
    states[''] = { name: '', parent: null };
    states['home'] = { name: 'home', parent: states[''] };
    states['home.about'] = { name: 'home.about', parent: states['home'] };
    states['home.about.people'] = { name: 'home.about.people', parent: states['home.about'] };
    states['home.about.people.person'] = { name: 'home.about.people.person', parent: states['home.about.people'] };
    states['home.about.company'] = { name: 'home.about.company', parent: states['home.about'] };
    states['other'] = { name: 'other', parent: states[''] };
    states['other.foo'] = { name: 'other.foo', parent: states['other'] };
    states['other.foo.bar'] = { name: 'other.foo.bar' };

    states['home.withData'] = {
      name: 'home.withData',
      data: { val1: "foo", val2: "bar" },
      parent: states['home']
    };
    states['home.withData.child'] = {
      name: 'home.withData.child',
      data: { val2: "baz" },
      parent: states['home.withData']
    };
  });

  describe('StateMatcher', function() {
    it('should find states by name', function() {
      var states = {}, matcher = new StateMatcher(states), home = { name: 'home' };
      expect(matcher.find('home')).toBeUndefined();

      states['home'] = home;
      expect(matcher.find('home')).toBe(home);
      expect(matcher.find(home)).toBe(home);

      expect(matcher.find('home.about')).toBeUndefined();

      states['home.about'] = { name: 'home.about' };
      expect(matcher.find('home.about')).toEqual({ name: 'home.about' });

      expect(matcher.find(undefined)).toBeUndefined();
      expect(matcher.find('')).toBeUndefined();
      expect(matcher.find(null)).toBeUndefined();
    });

    it('should determine whether a path is relative', function() {
      var matcher = new StateMatcher({});
      expect(matcher.isRelative('.')).toBe(true);
      expect(matcher.isRelative('.foo')).toBe(true);
      expect(matcher.isRelative('^')).toBe(true);
      expect(matcher.isRelative('^foo')).toBe(true);
      expect(matcher.isRelative('^.foo')).toBe(true);
      expect(matcher.isRelative('foo')).toBe(false);
    });

    it('should resolve relative paths', function() {
      var matcher = new StateMatcher(states);

      expect(matcher.find('^', states['home.about'])).toBe(states.home);
      expect(matcher.find('^.company', states['home.about.people'])).toBe(states['home.about.company']);
      expect(matcher.find('^.^.company', states['home.about.people.person'])).toBe(states['home.about.company']);
      expect(matcher.find('^.foo', states.home)).toBeUndefined();
      expect(matcher.find('^.other.foo', states.home)).toBe(states['other.foo']);
      expect(function() { matcher.find('^.^', states.home); }).toThrowError(Error, "Path '^.^' not valid for state 'home'");
    });
  });

  describe('StateBuilder', function() {
    var builder, matcher, urlMatcherFactoryProvider: any = {
      compile: function() {},
      isMatcher: function() {}
    };

    beforeEach(function() {
      matcher = new StateMatcher(states);
      builder = new StateBuilder(matcher, urlMatcherFactoryProvider);
      builder.builder('views', (state, parent) => { return state.views || { $default: {} }; });
      // builder.builder('resolve', uiRouter.ng1ResolveBuilder);
    });

    describe('interface', function() {
      describe('name()', function() {
        it('should return dot-separated paths', function() {
          expect(builder.name(states['home.about.people'])).toBe('home.about.people');
          expect(builder.name(states['home.about'])).toBe('home.about');
          expect(builder.name(states['home'])).toBe('home');
        });

        it('should concatenate parent names', function() {
          expect(builder.name({ name: "bar", parent: "foo" })).toBe("foo.bar");
          expect(builder.name({ name: "bar", parent: { name: "foo" } })).toBe("foo.bar");
        });
      });

      describe('parentName()', function() {
        it('should parse dot-separated paths', function() {
          expect(builder.parentName(states['other.foo.bar'])).toBe('other.foo');
        });
        it('should always return parent name as string', function() {
          expect(builder.parentName(states['other.foo'])).toBe('other');
        });
        it('should return empty string if state has no parent', function() {
          expect(builder.parentName(states[''])).toBe("");
        });
      });
    });

    describe('state building', function() {
      it('should build parent property', function() {
        expect(builder.builder('parent')({ name: 'home.about' })).toBe(states['home']);
      });

      it('should inherit parent data', function() {
        var state = extend(states['home.withData.child'], { self: {} });
        expect(builder.builder('data')(state)).toEqualData({ val1: "foo", val2: "baz" });

        state = extend(states['home.withData'], { self: {} });
        expect(builder.builder('data')(state)).toEqualData({ val1: "foo", val2: "bar" });
      });

      it('should compile a UrlMatcher for ^ URLs', function() {
        var url = new UrlMatcher('/', {});
        spyOn(urlMatcherFactoryProvider, 'compile').and.returnValue(url);
        spyOn(urlMatcherFactoryProvider, 'isMatcher').and.returnValue(true);

        expect(builder.builder('url')({ url: "^/foo" })).toBe(url);
        expect(urlMatcherFactoryProvider.compile).toHaveBeenCalledWith("/foo", {
          params: {},
          paramMap: jasmine.any(Function)
        });
        expect(urlMatcherFactoryProvider.isMatcher).toHaveBeenCalledWith(url);
      });

      it('should concatenate URLs from root', function() {
        var root = states[''] = { url: { append: function() {} } }, url = {};
        spyOn(root.url, 'append').and.returnValue(url);
        spyOn(urlMatcherFactoryProvider, 'isMatcher').and.returnValue(true);
        spyOn(urlMatcherFactoryProvider, 'compile').and.returnValue(url);

        expect(builder.builder('url')({ url: "/foo" })).toBe(url);
        expect(root.url.append).toHaveBeenCalledWith(url);
      });

      it('should pass through empty URLs', function() {
        expect(builder.builder('url')({ url: null })).toBeNull();
      });

      it('should pass through custom UrlMatchers', function() {
        var root = states[''] = { url: { append: function() {} } };
        var url = new UrlMatcher("/", {});
        spyOn(urlMatcherFactoryProvider, 'isMatcher').and.returnValue(true);
        spyOn(root.url, 'append').and.returnValue(url);
        expect(builder.builder('url')({ url: url })).toBe(url);
        expect(urlMatcherFactoryProvider.isMatcher).toHaveBeenCalledWith(url);
        expect(root.url.append).toHaveBeenCalledWith(url);
      });

      it('should throw on invalid UrlMatchers', function() {
        spyOn(urlMatcherFactoryProvider, 'isMatcher').and.returnValue(false);

        expect(function() {
          builder.builder('url')({ toString: function() { return "foo"; }, url: { foo: "bar" } });
        }).toThrowError(Error, "Invalid url '[object Object]' in state 'foo'");

        expect(urlMatcherFactoryProvider.isMatcher).toHaveBeenCalledWith({ foo: "bar" });
      });
    });
  });

  describe('TargetState', function () {
    it('should be callable and return the correct values', function() {
      var state: any = { name: "foo.bar" }, ref = new TargetState(state.name, state, {});
      expect(ref.identifier()).toBe("foo.bar");
      expect(ref.$state()).toBe(state);
      expect(ref.params()).toEqual({});
    });

    it('should validate state definition', function() {
      var ref = new TargetState("foo", null, {}, { relative: {} });
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("Could not resolve 'foo' from state '[object Object]'");

      ref = new TargetState("foo");
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("No such state 'foo'");

      ref = new TargetState("foo", <any> { name: "foo" });
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("State 'foo' has an invalid definition");
    });
  });
});
