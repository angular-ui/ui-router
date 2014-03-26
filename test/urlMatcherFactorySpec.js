describe("UrlMatcher", function () {

  it("shoudl match static URLs", function () {
    expect(new UrlMatcher('/hello/world').exec('/hello/world')).toEqual({});
  });

  it("should match static case insensitive URLs", function () {
    expect(new UrlMatcher('/hello/world', true).exec('/heLLo/World')).toEqual({});
  });

  it("should match against the entire path", function () {
    var matcher = new UrlMatcher('/hello/world');
    expect(matcher.exec('/hello/world/')).toBeNull();
    expect(matcher.exec('/hello/world/suffix')).toBeNull();
  });

  it("shoudl parse parameter placeholders", function () {
    var matcher = new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
    var params = matcher.parameters();
    expect(params.length).toBe(5);
    expect(params).toContain('id');
    expect(params).toContain('type');
    expect(params).toContain('repeat');
    expect(params).toContain('from');
    expect(params).toContain('to');
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

    var custom = { format: angular.noop, exec: angular.noop, concat: angular.noop };
    expect($umf.isMatcher(custom)).toBe(true);
  });

  it("should handle case sensitive URL by default", function () {
    expect($umf.compile('/hello/world').exec('/heLLo/WORLD')).toBeNull();
  });

  it("should handle case insensistive URL", function () {
    $umf.caseInsensitiveMatch(true);
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

    it("should match built-in types", function () {
      var m = new UrlMatcher("/{foo:int}/{flag:bool}");
      expect(m.exec("/1138/1")).toEqual({ foo: 1138, flag: true });
      expect(m.format({ foo: 5, flag: true })).toBe("/5/1");
    });
  });
});
