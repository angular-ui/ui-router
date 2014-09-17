describe("UrlMatcher", function () {

  describe("provider", function () {

    var provider;

    beforeEach(function() {
      angular.module('ui.router.router.test', function() {}).config(function ($urlMatcherFactoryProvider) {
        provider = $urlMatcherFactoryProvider;
      });

      module('ui.router.router', 'ui.router.router.test');

      inject(function($injector) {
        $injector.invoke(provider.$get);
      });
    });

    it("should factory matchers with correct configuration", function () {
      provider.caseInsensitive(false);
      expect(provider.compile('/hello').exec('/HELLO')).toBeNull();

      provider.caseInsensitive(true);
      expect(provider.compile('/hello').exec('/HELLO')).toEqual({});

      provider.strictMode(true);
      expect(provider.compile('/hello').exec('/hello/')).toBeNull();

      provider.strictMode(false);
      expect(provider.compile('/hello').exec('/hello/')).toEqual({});
    });

    it("should correctly validate UrlMatcher interface", function () {
      var m = new UrlMatcher("/");
      expect(provider.isMatcher(m)).toBe(true);

      m.validates = null;
      expect(provider.isMatcher(m)).toBe(false);
    });
  });

  it("should match static URLs", function () {
    expect(new UrlMatcher('/hello/world').exec('/hello/world')).toEqual({});
  });

  it("should match static case insensitive URLs", function () {
    expect(new UrlMatcher('/hello/world', { caseInsensitive: true }).exec('/heLLo/World')).toEqual({});
  });

  it("should match against the entire path", function () {
    var matcher = new UrlMatcher('/hello/world');
    expect(matcher.exec('/hello/world/')).toBeNull();
    expect(matcher.exec('/hello/world/suffix')).toBeNull();
  });

  it("should parse parameter placeholders", function () {
    var matcher = new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
    expect(matcher.parameters()).toEqual(['id', 'type', 'repeat', 'from', 'to']);
  });

  it("should encode and decode duplicate query string values as array", function () {
    var matcher = new UrlMatcher('/?foo'), array = { foo: ["bar", "baz"] };
    expect(matcher.exec('/', array)).toEqual(array);
    expect(matcher.format(array)).toBe('/?foo=bar&foo=baz');
  });

  describe("snake-case parameters", function() {
    it("should match if properly formatted", function() {
      var matcher = new UrlMatcher('/users/?from&to&snake-case&snake-case-triple');
      var params = matcher.parameters();

      expect(params.length).toBe(4);
      expect(params).toContain('from');
      expect(params).toContain('to');
      expect(params).toContain('snake-case');
      expect(params).toContain('snake-case-triple');
    });

    it("should not match if invalid", function() {
      var err = "Invalid parameter name '-snake' in pattern '/users/?from&to&-snake'";
      expect(function() { new UrlMatcher('/users/?from&to&-snake'); }).toThrow(err);

      err = "Invalid parameter name 'snake-' in pattern '/users/?from&to&snake-'";
      expect(function() { new UrlMatcher('/users/?from&to&snake-'); }).toThrow(err);
    });
  });

  describe(".exec()", function() {
    it("should capture parameter values", function () {
      var m = new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
      expect(m.exec('/users/123/details//0', {})).toEqual({ id:'123', type:'', repeat:'0' });
    });

    it("should capture catch-all parameters", function () {
      var m = new UrlMatcher('/document/*path');
      expect(m.exec('/document/a/b/c', {})).toEqual({ path: 'a/b/c' });
      expect(m.exec('/document/', {})).toEqual({ path: '' });
    });

    it("should use the optional regexp with curly brace placeholders", function () {
      var m = new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
      expect(m.exec('/users/123/details/what/thisShouldBeDigits', {})).toBeNull();
    });

    it("should treat the URL as already decoded and does not decode it further", function () {
      expect(new UrlMatcher('/users/:id').exec('/users/100%25', {})).toEqual({ id: '100%25'});
    });

    it('should throw on unbalanced capture list', function () {
      var shouldThrow = {
        "/url/{matchedParam:([a-z]+)}/child/{childParam}": '/url/someword/child/childParam',
        "/url/{matchedParam:([a-z]+)}/child/{childParam}?foo": '/url/someword/child/childParam'
      };

      angular.forEach(shouldThrow, function(url, route) {
        expect(function() { new UrlMatcher(route).exec(url, {}); }).toThrow(
          "Unbalanced capture group in route '" + route + "'"
        );
      });

      var shouldPass = {
        "/url/{matchedParam:[a-z]+}/child/{childParam}": '/url/someword/child/childParam',
        "/url/{matchedParam:[a-z]+}/child/{childParam}?foo": '/url/someword/child/childParam'
      };

      angular.forEach(shouldPass, function(url, route) {
        expect(function() { new UrlMatcher(route).exec(url, {}); }).not.toThrow();
      });
    });
  });

  describe(".format()", function() {
    it("should reconstitute the URL", function () {
      var m = new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from'),
          params = { id:'123', type:'default', repeat:444, ignored:'value', from:'1970' };

      expect(m.format(params)).toEqual('/users/123/details/default/444?from=1970');
    });

    it("should encode URL parameters", function () {
      expect(new UrlMatcher('/users/:id').format({ id:'100%'})).toEqual('/users/100%25');
    });

    it("encodes URL parameters with hashes", function () {
      var m = new UrlMatcher('/users/:id#:section'),
          params = { id: 'bob', section: 'contact-details' };
      expect(m.format(params)).toEqual('/users/bob#contact-details');
    });
  });

  describe(".concat()", function() {
    it("should concatenate matchers", function () {
      var matcher = new UrlMatcher('/users/:id/details/{type}?from').concat('/{repeat:[0-9]+}?to');
      var params = matcher.parameters();
      expect(params.length).toBe(5);
      expect(params).toContain('id');
      expect(params).toContain('type');
      expect(params).toContain('repeat');
      expect(params).toContain('from');
      expect(params).toContain('to');
    });

    it("should return a new matcher", function () {
      var base = new UrlMatcher('/users/:id/details/{type}?from');
      var matcher = base.concat('/{repeat:[0-9]+}?to');
      expect(matcher).toNotBe(base);
    });
  });
});

describe("urlMatcherFactory", function () {
  
  var $umf;

  beforeEach(module('ui.router.util'));
  beforeEach(inject(function($urlMatcherFactory) {
    $umf = $urlMatcherFactory;
  }));

  it("compiles patterns", function () {
    var matcher = $umf.compile('/hello/world');
    expect(matcher instanceof UrlMatcher).toBe(true);
  });

  it("recognizes matchers", function () {
    expect($umf.isMatcher(new UrlMatcher('/'))).toBe(true);

    var custom = {
      format:     angular.noop,
      exec:       angular.noop,
      concat:     angular.noop,
      validates:  angular.noop,
      parameters: angular.noop
    };
    expect($umf.isMatcher(custom)).toBe(true);
  });

  it("should handle case sensitive URL by default", function () {
    expect($umf.compile('/hello/world').exec('/heLLo/WORLD')).toBeNull();
  });

  it("should handle case insensistive URL", function () {
    $umf.caseInsensitive(true);
    expect($umf.compile('/hello/world').exec('/heLLo/WORLD')).toEqual({});
  });

  describe("typed parameters", function() {
    it("should accept object definitions", function () {
      var type = { encode: function() {}, decode: function() {} };
      $umf.type("myType", type);
      expect($umf.type("myType").encode).toBe(type.encode);
    });

    it("should reject duplicate definitions", function () {
      $umf.type("myType", { encode: function () {}, decode: function () {} });
      expect(function() { $umf.type("myType", {}); }).toThrow("A type named 'myType' has already been defined.");
    });

    it("should accept injected function definitions", inject(function ($stateParams) {
      $umf.type("myType", function($stateParams) {
        return {
          decode: function() {
            return $stateParams;
          }
        };
      });
      expect($umf.type("myType").decode()).toBe($stateParams);
    }));

    it("should accept annotated function definitions", inject(function ($stateParams) {
      $umf.type("myAnnotatedType", ['$stateParams', function(s) {
        return {
          decode: function() {
            return s;
          }
        };
      }]);
      expect($umf.type("myAnnotatedType").decode()).toBe($stateParams);
    }));

    it("should match built-in types", function () {
      var m = new UrlMatcher("/{foo:int}/{flag:bool}");
      expect(m.exec("/1138/1")).toEqual({ foo: 1138, flag: true });
      expect(m.format({ foo: 5, flag: true })).toBe("/5/1");
    });

    it("should encode/decode dates", function () {
      var m = new UrlMatcher("/calendar/{date:date}"),
          result = m.exec("/calendar/2014-03-26");

      expect(result.date instanceof Date).toBe(true);
      expect(result.date.toUTCString()).toEqual('Wed, 26 Mar 2014 00:00:00 GMT');
      expect(m.format({ date: new Date(2014, 2, 26) })).toBe("/calendar/2014-03-26");
    });

    it("should not match invalid typed parameter values", function() {
      var m = new UrlMatcher('/users/{id:int}');

      expect(m.exec('/users/1138').id).toBe(1138);
      expect(m.exec('/users/alpha')).toBeNull();

      expect(m.format({ id: 1138 })).toBe("/users/1138");
      expect(m.format({ id: "alpha" })).toBeNull();
    });
  });

  describe("optional parameters", function() {
    it("should match with or without values", function () {
      var m = new UrlMatcher('/users/{id:int}', {
        params: { id: { value: null } }
      });
      expect(m.exec('/users/1138')).toEqual({ id: 1138 });
      expect(m.exec('/users/').id).toBeNull();
      expect(m.exec('/users').id).toBeNull();
    });

    it("should correctly match multiple", function() {
      var m = new UrlMatcher('/users/{id:int}/{state:[A-Z]+}', {
        params: { id: { value: null }, state: { value: null } }
      });
      expect(m.exec('/users/1138')).toEqual({ id: 1138, state: null });
      expect(m.exec('/users/1138/NY')).toEqual({ id: 1138, state: "NY" });

      expect(m.exec('/users/').id).toBeNull();
      expect(m.exec('/users/').state).toBeNull();

      expect(m.exec('/users').id).toBeNull();
      expect(m.exec('/users').state).toBeNull();

      expect(m.exec('/users/NY').state).toBe("NY");
      expect(m.exec('/users/NY').id).toBeNull();
    });

    it("should correctly format with or without values", function() {
      var m = new UrlMatcher('/users/{id:int}', {
        params: { id: { value: null } }
      });
      expect(m.format()).toBe('/users/');
      expect(m.format({ id: 1138 })).toBe('/users/1138');
    });

    it("should correctly format multiple", function() {
      var m = new UrlMatcher('/users/{id:int}/{state:[A-Z]+}', {
        params: { id: { value: null }, state: { value: null } }
      });

      expect(m.format()).toBe("/users/");
      expect(m.format({ id: 1138 })).toBe("/users/1138/");
      expect(m.format({ state: "NY" })).toBe("/users/NY");
      expect(m.format({ id: 1138, state: "NY" })).toBe("/users/1138/NY");
    });

    it("should match in between static segments", function() {
      var m = new UrlMatcher('/users/{user:int}/photos', {
        params: { user: 5 }
      });
      expect(m.exec('/users/photos').user).toBe(5);
      expect(m.exec('/users/6/photos').user).toBe(6);
      expect(m.format()).toBe("/users/photos");
      expect(m.format({ user: 1138 })).toBe("/users/1138/photos");
    });

    it("should correctly format with an optional followed by a required parameter", function() {
      var m = new UrlMatcher('/:user/gallery/photos/:photo', {
        params: { 
          user: {value: null},
          photo: {} 
        }
      });
      expect(m.format({ photo: 12 })).toBe("/gallery/photos/12");
      expect(m.format({ user: 1138, photo: 13 })).toBe("/1138/gallery/photos/13");
    });

    describe("default values", function() {
      it("should populate if not supplied in URL", function() {
        var m = new UrlMatcher('/users/{id:int}/{test}', {
          params: { id: { value: 0 }, test: { value: "foo" } }
        });
        expect(m.exec('/users')).toEqual({ id: 0, test: "foo" });
        expect(m.exec('/users/2')).toEqual({ id: 2, test: "foo" });
        expect(m.exec('/users/bar')).toEqual({ id: 0, test: "bar" });
        expect(m.exec('/users/2/bar')).toEqual({ id: 2, test: "bar" });
        expect(m.exec('/users/bar/2')).toBeNull();
      });

      it("should allow shorthand definitions", function() {
        var m = new UrlMatcher('/foo/:foo', {
          params: { foo: "bar" }
        });
        expect(m.exec("/foo")).toEqual({ foo: "bar" });
      });

      it("should populate query params", function() {
        var defaults = { order: "name", limit: 25, page: 1 };
        var m = new UrlMatcher('/foo?order&limit&page', {
          params: defaults
        });
        expect(m.exec("/foo")).toEqual(defaults);
      });

      it("should allow function-calculated values", function() {
        var m = new UrlMatcher('/foo/:bar', {
          params: {
            bar: function() {
              return "Value from bar()";
            }
          }
        });
        expect(m.exec('/foo').bar).toBe("Value from bar()");

        var m = new UrlMatcher('/foo?bar', {
          params: {
            bar: function() {
              return "Value from bar()";
            }
          }
        });
        expect(m.exec('/foo').bar).toBe("Value from bar()");
      });

      it("should allow injectable functions", inject(function($stateParams) {
        var m = new UrlMatcher('/users/:user', {
          params: {
            user: function($stateParams) {
              return $stateParams.user;
            }
          }
        });
        var user = { name: "Bob" };

        $stateParams.user = user;
        expect(m.exec('/users').user).toBe(user);
      }));
    });
  });

  describe("strict matching", function() {
    it("should match with or without trailing slash", function() {
      var m = new UrlMatcher('/users', { strict: false });
      expect(m.exec('/users')).toEqual({});
      expect(m.exec('/users/')).toEqual({});
    });

    it("should not match multiple trailing slashes", function() {
      var m = new UrlMatcher('/users', { strict: false });
      expect(m.exec('/users//')).toBeNull();
    });

    it("should match when defined with parameters", function() {
      var m = new UrlMatcher('/users/{name}', { strict: false, params: {
        name: { value: null }
      }});
      expect(m.exec('/users/')).toEqual({ name: null });
      expect(m.exec('/users/bob')).toEqual({ name: "bob" });
      expect(m.exec('/users/bob/')).toEqual({ name: "bob" });
      expect(m.exec('/users/bob//')).toBeNull();
    });
  });
});
