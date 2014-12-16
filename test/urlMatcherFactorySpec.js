describe("UrlMatcher", function () {
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

  describe("provider", function () {
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

  it("should encode and decode slashes in parameter values", function () {
    var matcher = new UrlMatcher('/:foo');
    expect(matcher.format({ foo: "/" })).toBe('/%252F');
    expect(matcher.format({ foo: "//" })).toBe('/%252F%252F');
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

    it("should respect $urlMatcherFactoryProvider.strictMode", function() {
      var m = new UrlMatcher('/');
      provider.strictMode(false);
      m = m.concat("foo");
      expect(m.exec("/foo")).toEqual({});
      expect(m.exec("/foo/")).toEqual({})
    });

    it("should respect $urlMatcherFactoryProvider.caseInsensitive", function() {
      var m = new UrlMatcher('/');
      provider.caseInsensitive(true);
      m = m.concat("foo");
      expect(m.exec("/foo")).toEqual({});
      expect(m.exec("/FOO")).toEqual({});
    });

    it("should generate/match params in the proper order", function() {
      var m = new UrlMatcher('/foo?queryparam');
      m = m.concat("/bar/:pathparam");
      expect(m.exec("/foo/bar/pathval", { queryparam: "queryval" })).toEqual({ pathparam: "pathval", queryparam: "queryval"});
    });
  });


  describe("multivalue-query-parameters", function() {
    it("should handle .is() for an array of values", inject(function($location) {
      var m = new UrlMatcher('/foo?{param1:int}');
      expect(m.params.param1.type.is([1, 2, 3])).toBe(true);
      expect(m.params.param1.type.is([1, "2", 3])).toBe(false);
    }));

    it("should handle .equals() for two arrays of values", inject(function($location) {
      var m = new UrlMatcher('/foo?{param1:int}&{param2:date}');
      expect(m.params.param1.type.equals([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(m.params.param1.type.equals([1, 2, 3], [1, 2 ])).toBe(false);
      expect(m.params.param2.type.equals(
        [new Date(2014, 11, 15), new Date(2014, 10, 15)],
        [new Date(2014, 11, 15), new Date(2014, 10, 15)])
      ).toBe(true);
      expect(m.params.param2.type.equals(
        [new Date(2014, 11, 15), new Date(2014, 9, 15)],
        [new Date(2014, 11, 15), new Date(2014, 10, 15)])
      ).toBe(false);
    }));

    it("should conditionally be wrapped in an array by default", inject(function($location) {
      var m = new UrlMatcher('/foo?param1');

      // empty array [] is treated like "undefined"
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: [] })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: "1" })).toBe("/foo?param1=1");
      expect(m.format({ param1: [ "1" ] })).toBe("/foo?param1=1");
      expect(m.format({ param1: [ "1", "2" ] })).toBe("/foo?param1=1&param1=2");

      expect(m.exec("/foo")).toEqual({ param1: undefined });
      expect(m.exec("/foo", {})).toEqual({ param1: undefined });
      expect(m.exec("/foo", {param1: ""})).toEqual({ param1: undefined });
      expect(m.exec("/foo", {param1: "1"})).toEqual({ param1: "1" }); // auto unwrap single values
      expect(m.exec("/foo", {param1: [ "1", "2" ]})).toEqual({ param1: [ "1", "2" ] });

      $location.url("/foo");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: undefined } );
      $location.url("/foo?param1=bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: 'bar' } ); // auto unwrap
      $location.url("/foo?param1=bar&param1=baz");
      if (angular.isArray($location.search())) // conditional for angular 1.0.8
        expect(m.exec($location.path(), $location.search())).toEqual( { param1: ['bar', 'baz'] } );

      expect(m.format({ })).toBe("/foo");
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: 'bar' })).toBe("/foo?param1=bar");
      expect(m.format({ param1: [ 'bar' ] })).toBe("/foo?param1=bar");
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo?param1=bar&param1=baz");

    }));

    it("should be wrapped in an array if array: true", inject(function($location) {
      var m = new UrlMatcher('/foo?param1', { params: { param1: { array: true } } });

      // empty array [] is treated like "undefined"
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: [] })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: "1" })).toBe("/foo?param1=1");
      expect(m.format({ param1: [ "1" ] })).toBe("/foo?param1=1");
      expect(m.format({ param1: [ "1", "2" ] })).toBe("/foo?param1=1&param1=2");

      expect(m.exec("/foo")).toEqual({ param1: undefined });
      expect(m.exec("/foo", {})).toEqual({ param1: undefined });
      expect(m.exec("/foo", {param1: ""})).toEqual({ param1: undefined });
      expect(m.exec("/foo", {param1: "1"})).toEqual({ param1: [ "1" ] });
      expect(m.exec("/foo", {param1: [ "1", "2" ]})).toEqual({ param1: [ "1", "2" ] });

      $location.url("/foo");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: undefined } );
      $location.url("/foo?param1=bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: [ 'bar' ] } );
      $location.url("/foo?param1=bar&param1=baz");
      if (angular.isArray($location.search())) // conditional for angular 1.0.8
        expect(m.exec($location.path(), $location.search())).toEqual( { param1: ['bar', 'baz'] } );

      expect(m.format({ })).toBe("/foo");
      expect(m.format({ param1: undefined })).toBe("/foo");
      expect(m.format({ param1: "" })).toBe("/foo");
      expect(m.format({ param1: 'bar' })).toBe("/foo?param1=bar");
      expect(m.format({ param1: [ 'bar' ] })).toBe("/foo?param1=bar");
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo?param1=bar&param1=baz");
    }));

    it("should be wrapped in an array if paramname looks like param[]", inject(function($location) {
      var m = new UrlMatcher('/foo?param1[]');

      expect(m.exec("/foo")).toEqual({});

      $location.url("/foo?param1[]=bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": [ 'bar' ] } );
      expect(m.format({ "param1[]": 'bar' })).toBe("/foo?param1[]=bar");
      expect(m.format({ "param1[]": [ 'bar' ] })).toBe("/foo?param1[]=bar");

      $location.url("/foo?param1[]=bar&param1[]=baz");
      if (angular.isArray($location.search())) // conditional for angular 1.0.8
        expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": ['bar', 'baz'] } );
      expect(m.format({ "param1[]": ['bar', 'baz'] })).toBe("/foo?param1[]=bar&param1[]=baz");
    }));

    it("should not be wrapped by ui-router into an array if array: false", inject(function($location) {
      var m = new UrlMatcher('/foo?param1', { params: { param1: { array: false } } });

      expect(m.exec("/foo")).toEqual({});

      $location.url("/foo?param1=bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { param1: 'bar' } );
      expect(m.format({ param1: 'bar' })).toBe("/foo?param1=bar");
      expect(m.format({ param1: [ 'bar' ] })).toBe("/foo?param1=bar");

      $location.url("/foo?param1=bar&param1=baz");
      if (angular.isArray($location.search())) // conditional for angular 1.0.8
        expect(m.exec($location.path(), $location.search())).toEqual( { param1: 'bar,baz' } ); // coerced to string
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo?param1=bar%2Cbaz"); // coerced to string
    }));
  });

  describe("multivalue-path-parameters", function() {
    it("should behave as a single-value by default", inject(function($location) {
      var m = new UrlMatcher('/foo/:param1');

      expect(m.exec("/foo/")).toEqual({ param1: ""});

      expect(m.exec("/foo/bar")).toEqual( { param1: 'bar' } );
      expect(m.format({ param1: 'bar' })).toBe("/foo/bar");
      expect(m.format({ param1: ['bar', 'baz'] })).toBe("/foo/bar%2Cbaz"); // coerced to string
    }));

    it("should be split on - in url and wrapped in an array if array: true", inject(function($location) {
      var m = new UrlMatcher('/foo/:param1', { params: { param1: { array: true } } });

      expect(m.exec("/foo/")).toEqual({ param1: undefined });
      expect(m.exec("/foo/bar")).toEqual({ param1: [ "bar" ] });
      $location.url("/foo/bar-baz");
      expect(m.exec($location.url())).toEqual({ param1: [ "bar", "baz" ] });

      expect(m.format({ param1: [] })).toEqual("/foo/");
      expect(m.format({ param1: [ 'bar' ] })).toEqual("/foo/bar");
      expect(m.format({ param1: [ 'bar', 'baz' ] })).toEqual("/foo/bar-baz");
    }));

    it("should behave similar to multi-value query params", inject(function($location) {
      var m = new UrlMatcher('/foo/:param1[]');

      // empty array [] is treated like "undefined"
      expect(m.format({ "param1[]": undefined })).toBe("/foo/");
      expect(m.format({ "param1[]": [] })).toBe("/foo/");
      expect(m.format({ "param1[]": "" })).toBe("/foo/");
      expect(m.format({ "param1[]": "1" })).toBe("/foo/1");
      expect(m.format({ "param1[]": [ "1" ] })).toBe("/foo/1");
      expect(m.format({ "param1[]": [ "1", "2" ] })).toBe("/foo/1-2");

      expect(m.exec("/foo/")).toEqual({ "param1[]": undefined });
      expect(m.exec("/foo/1")).toEqual({ "param1[]": [ "1" ] });
      expect(m.exec("/foo/1-2")).toEqual({ "param1[]": [ "1", "2" ] });

      $location.url("/foo/");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": undefined } );
      $location.url("/foo/bar");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": [ 'bar' ] } );
      $location.url("/foo/bar-baz");
      expect(m.exec($location.path(), $location.search())).toEqual( { "param1[]": ['bar', 'baz'] } );

      expect(m.format({ })).toBe("/foo/");
      expect(m.format({ "param1[]": undefined })).toBe("/foo/");
      expect(m.format({ "param1[]": "" })).toBe("/foo/");
      expect(m.format({ "param1[]": 'bar' })).toBe("/foo/bar");
      expect(m.format({ "param1[]": [ 'bar' ] })).toBe("/foo/bar");
      expect(m.format({ "param1[]": ['bar', 'baz'] })).toBe("/foo/bar-baz");
    }));

    it("should be split on - in url and wrapped in an array if paramname looks like param[]", inject(function($location) {
      var m = new UrlMatcher('/foo/:param1[]');

      expect(m.exec("/foo/")).toEqual({ "param1[]": undefined });
      expect(m.exec("/foo/bar")).toEqual({ "param1[]": [ "bar" ] });
      expect(m.exec("/foo/bar-baz")).toEqual({ "param1[]": [ "bar", "baz" ] });

      expect(m.format({ "param1[]": [] })).toEqual("/foo/");
      expect(m.format({ "param1[]": [ 'bar' ] })).toEqual("/foo/bar");
      expect(m.format({ "param1[]": [ 'bar', 'baz' ] })).toEqual("/foo/bar-baz");
    }));

    it("should allow path param arrays with '-' in the values", inject(function($location) {
      var m = new UrlMatcher('/foo/:param1[]');

      expect(m.exec("/foo/")).toEqual({ "param1[]": undefined });
      expect(m.exec("/foo/bar\\-")).toEqual({ "param1[]": [ "bar-" ] });
      expect(m.exec("/foo/bar\\--\\-baz")).toEqual({ "param1[]": [ "bar-", "-baz" ] });

      expect(m.format({ "param1[]": [] })).toEqual("/foo/");
      expect(m.format({ "param1[]": [ 'bar-' ] })).toEqual("/foo/bar%5C%2D");
      expect(m.format({ "param1[]": [ 'bar-', '-baz' ] })).toEqual("/foo/bar%5C%2D-%5C%2Dbaz");

      // check that we handle $location.url decodes correctly
      $location.url(m.format({ "param1[]": [ 'bar-', '-baz' ] }));
      expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": [ 'bar-', '-baz' ] });

      // check that pre-encoded values are passed correctly
      $location.url(m.format({ "param1[]": [ '%2C%20%5C%2C', '-baz' ] }));
      expect(m.exec($location.path(), $location.search())).toEqual({ "param1[]": [ '%2C%20%5C%2C', '-baz' ] });
    }));
  });
});

describe("urlMatcherFactoryProvider", function () {
  describe(".type()", function () {
    var m;
    beforeEach(module('ui.router.util', function($urlMatcherFactoryProvider) {
      $urlMatcherFactoryProvider.type("myType", {}, function() {
          return { decode: function() { return 'decoded'; }
        };
      });
      m = new UrlMatcher("/test?{foo:myType}");
    }));

    it("should handle arrays properly with config-time custom type definitions", inject(function ($stateParams) {
      expect(m.exec("/test", {foo: '1'})).toEqual({ foo: 'decoded' });
      expect(m.exec("/test", {foo: ['1', '2']})).toEqual({ foo: ['decoded', 'decoded'] });
    }));
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
      $umf.type("myType", {}, function($stateParams) {
        return {
          decode: function() {
            return $stateParams;
          }
        };
      });
      expect($umf.type("myType").decode()).toBe($stateParams);
    }));

    it("should accept annotated function definitions", inject(function ($stateParams) {
      $umf.type("myAnnotatedType", {},['$stateParams', function(s) {
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
      var date = new Date(2014, 2, 26);

      expect(result.date instanceof Date).toBe(true);
      expect(result.date.toUTCString()).toEqual(date.toUTCString());
      expect(m.format({ date: date })).toBe("/calendar/2014-03-26");
    });

    it("should encode/decode arbitrary objects to json", function () {
      var m = new UrlMatcher("/state/{param1:json}/{param2:json}");

      var params = {
        param1: { foo: 'huh', count: 3 },
        param2: { foo: 'wha', count: 5 }
      };

      var json1 = '{"foo":"huh","count":3}';
      var json2 = '{"foo":"wha","count":5}';

      expect(m.format(params)).toBe("/state/" + encodeURIComponent(json1) + "/" + encodeURIComponent(json2));
      expect(m.exec("/state/" + json1 + "/" + json2)).toEqual(params);
    });

    it("should not match invalid typed parameter values", function() {
      var m = new UrlMatcher('/users/{id:int}');

      expect(m.exec('/users/1138').id).toBe(1138);
      expect(m.exec('/users/alpha')).toBeNull();

      expect(m.format({ id: 1138 })).toBe("/users/1138");
      expect(m.format({ id: "alpha" })).toBeNull();
    });

    it("should automatically handle multiple search param values", inject(function($location) {
      var m = new UrlMatcher("/foo/{fooid:int}?{bar:int}");

      $location.url("/foo/5?bar=1");
      expect(m.exec($location.path(), $location.search())).toEqual( { fooid: 5, bar: 1 } );
      expect(m.format({ fooid: 5, bar: 1 })).toEqual("/foo/5?bar=1");

      $location.url("/foo/5?bar=1&bar=2&bar=3");
      if (angular.isArray($location.search())) // conditional for angular 1.0.8
        expect(m.exec($location.path(), $location.search())).toEqual( { fooid: 5, bar: [ 1, 2, 3 ] } );
      expect(m.format({ fooid: 5, bar: [ 1, 2, 3 ] })).toEqual("/foo/5?bar=1&bar=2&bar=3");

      m.format()
    }));

    it("should allow custom types to handle multiple search param values manually", inject(function($location) {
      $umf.type("custArray", {
        encode: function(array)  { return array.join("-"); },
        decode: function(val) { return angular.isArray(val) ? val : val.split(/-/); },
        equals: angular.equals,
        is: angular.isArray
      });

      var m = new UrlMatcher("/foo?{bar:custArray}", { params: { bar: { array: false } } } );

      $location.url("/foo?bar=fox");
      expect(m.exec($location.path(), $location.search())).toEqual( { bar: [ 'fox' ] } );
      expect(m.format({ bar: [ 'fox' ] })).toEqual("/foo?bar=fox");

      $location.url("/foo?bar=quick-brown-fox");
      expect(m.exec($location.path(), $location.search())).toEqual( { bar: [ 'quick', 'brown', 'fox' ] } );
      expect(m.format({ bar: [ 'quick', 'brown', 'fox' ] })).toEqual("/foo?bar=quick-brown-fox");
    }));
  });

  describe("optional parameters", function() {
    it("should match with or without values", function () {
      var m = new UrlMatcher('/users/{id:int}', {
        params: { id: { value: null, squash: true } }
      });
      expect(m.exec('/users/1138')).toEqual({ id: 1138 });
      expect(m.exec('/users/').id).toBeNull();
      expect(m.exec('/users').id).toBeNull();
    });

    it("should correctly match multiple", function() {
      var m = new UrlMatcher('/users/{id:int}/{state:[A-Z]+}', {
        params: { id: { value: null, squash: true }, state: { value: null, squash: true } }
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
        params: { id: { value: null, squash: true }, state: { value: null, squash: true } }
      });

      expect(m.format()).toBe("/users/");
      expect(m.format({ id: 1138 })).toBe("/users/1138/");
      expect(m.format({ state: "NY" })).toBe("/users/NY");
      expect(m.format({ id: 1138, state: "NY" })).toBe("/users/1138/NY");
    });

    it("should match in between static segments", function() {
      var m = new UrlMatcher('/users/{user:int}/photos', {
        params: { user: { value: 5, squash: true } }
      });
      expect(m.exec('/users/photos').user).toBe(5);
      expect(m.exec('/users/6/photos').user).toBe(6);
      expect(m.format()).toBe("/users/photos");
      expect(m.format({ user: 1138 })).toBe("/users/1138/photos");
    });

    it("should correctly format with an optional followed by a required parameter", function() {
      var m = new UrlMatcher('/home/:user/gallery/photos/:photo', {
        params: { 
          user: {value: null, squash: true},
          photo: undefined
        }
      });
      expect(m.format({ photo: 12 })).toBe("/home/gallery/photos/12");
      expect(m.format({ user: 1138, photo: 13 })).toBe("/home/1138/gallery/photos/13");
    });

    describe("default values", function() {
      it("should populate if not supplied in URL", function() {
        var m = new UrlMatcher('/users/{id:int}/{test}', {
          params: { id: { value: 0, squash: true }, test: { value: "foo", squash: true } }
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
        expect(m.exec("/foo/")).toEqual({ foo: "bar" });
      });

      it("should populate query params", function() {
        var defaults = { order: "name", limit: 25, page: 1 };
        var m = new UrlMatcher('/foo?order&limit&page', {
          params: defaults
        });
        expect(m.exec("/foo")).toEqual(defaults);
      });

      it("should allow function-calculated values", function() {
        function barFn() { return "Value from bar()"; }
        var m = new UrlMatcher('/foo/:bar', {
          params: { bar: barFn }
        });
        expect(m.exec('/foo/').bar).toBe("Value from bar()");

        m = new UrlMatcher('/foo/:bar', {
          params: { bar: { value: barFn, squash: true } }
        });
        expect(m.exec('/foo').bar).toBe("Value from bar()");

        m = new UrlMatcher('/foo?bar', {
          params: { bar: barFn }
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
        expect(m.exec('/users/').user).toBe(user);
      }));

      describe("squash policy", function() {
        var Session = { username: "loggedinuser" };
        function getMatcher(squash) {
          return new UrlMatcher('/user/:userid/gallery/:galleryid/photo/:photoid', {
            params: {
              userid: { squash: squash, value: function () { return Session.username; } },
              galleryid: { squash: squash, value: "favorites" }
            }
          });
        }

        it(": true should squash the default value and one slash", inject(function($stateParams) {
          var m = getMatcher(true);

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123'};
          expect(m.exec('/user/gallery/photo/123')).toEqual(defaultParams);
          expect(m.exec('/user//gallery//photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user/gallery/photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987'};
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        }));

        it(": false should not squash default values", inject(function($stateParams) {
          var m = getMatcher(false);

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123'};
          expect(m.exec('/user/loggedinuser/gallery/favorites/photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user/loggedinuser/gallery/favorites/photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987'};
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        }));

        it(": '' should squash the default value to an empty string", inject(function($stateParams) {
          var m = getMatcher("");

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123'};
          expect(m.exec('/user//gallery//photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user//gallery//photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987'};
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        }));

        it(": '~' should squash the default value and replace it with '~'", inject(function($stateParams) {
          var m = getMatcher("~");

          var defaultParams = { userid: 'loggedinuser', galleryid: 'favorites', photoid: '123'};
          expect(m.exec('/user//gallery//photo/123')).toEqual(defaultParams);
          expect(m.exec('/user/~/gallery/~/photo/123')).toEqual(defaultParams);
          expect(m.format(defaultParams)).toBe('/user/~/gallery/~/photo/123');

          var nonDefaultParams = { userid: 'otheruser', galleryid: 'travel', photoid: '987'};
          expect(m.exec('/user/otheruser/gallery/travel/photo/987')).toEqual(nonDefaultParams);
          expect(m.format(nonDefaultParams)).toBe('/user/otheruser/gallery/travel/photo/987');
        }));
      });
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
