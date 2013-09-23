describe("UrlMatcher", function () {

  it("matches static URLs", function () {
    expect(new UrlMatcher('/hello/world').exec('/hello/world')).toEqual({});
  });

  it("matches against the entire path", function () {
    var matcher = new UrlMatcher('/hello/world');
    expect(matcher.exec('/hello/world/')).toBeNull();
    expect(matcher.exec('/hello/world/suffix')).toBeNull();
  });

  it("parses parameter placeholders", function () {
    var matcher = new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to');
    var params = matcher.parameters();
    expect(params.length).toBe(5);
    expect(params).toContain('id');
    expect(params).toContain('type');
    expect(params).toContain('repeat');
    expect(params).toContain('from');
    expect(params).toContain('to');
  });

  it("parses parameters with types", function () {
    var matcher = new UrlMatcher('/users/{id:type}');
    var params = matcher.parameters();
    expect(params).toContain('id');
  });

  it("handles proper snake case parameter names", function(){
    var matcher = new UrlMatcher('/users/?from&to&snake-case&snake-case-triple');
    var params = matcher.parameters();
    expect(params.length).toBe(4);
    expect(params).toContain('from');
    expect(params).toContain('to');
    expect(params).toContain('snake-case');
    expect(params).toContain('snake-case-triple');
  });

    it("handles invalid snake case parameter names", function(){
        expect(function() { new UrlMatcher('/users/?from&to&-snake'); }).toThrow(
            "Invalid parameter name '-snake' in pattern '/users/?from&to&-snake'"
        );

        expect(function() { new UrlMatcher('/users/?from&to&snake-'); }).toThrow(
            "Invalid parameter name 'snake-' in pattern '/users/?from&to&snake-'"
        );
    });

  it(".exec() captures parameter values", function () {
    expect(
      new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to')
        .exec('/users/123/details//0', {}))
      .toEqual({ id:'123', type:'', repeat:'0' });
  });

  it(".exec() captures typed parameter values", function () {
    expect(
      new UrlMatcher('/users/{id:boolean}')
        .exec('/users/false', {}))
      .toEqual({ id: false });
    expect(
      new UrlMatcher('/users/{id:boolean}')
        .exec('/users/123', {}))
      .toBeNull();
  });

  it(".exec() returns null if matched param is not correct type", function () {
    expect(
      new UrlMatcher('/users/{id:integer}')
        .exec('/users/badid', {}))
      .toEqual(null);
  });

  it(".exec() captures catch-all parameters", function () {
    var m = new UrlMatcher('/document/*path');
    expect(m.exec('/document/a/b/c', {})).toEqual({ path: 'a/b/c' });
    expect(m.exec('/document/', {})).toEqual({ path: '' });
  });

  it(".exec() uses the optional regexp with curly brace placeholders", function () {
    expect(
      new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to')
        .exec('/users/123/details/what/thisShouldBeDigits', {}))
      .toBeNull();
  });

  it(".exec() treats the URL as already decoded and does not decode it further", function () {
    expect(new UrlMatcher('/users/:id').exec('/users/100%25', {})).toEqual({ id: '100%25'});
  });

  it('.exec() throws on unbalanced capture list', function () {
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

  it(".format() reconstitutes the URL", function () {
    expect(
      new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from')
        .format({ id:'123', type:'default', repeat:444, ignored:'value', from:'1970' }))
      .toEqual('/users/123/details/default/444?from=1970');
  });

  it(".format() encodes URL parameters", function () {
    expect(new UrlMatcher('/users/:id').format({ id:'100%'})).toEqual('/users/100%25');
  });

  it(".format() encode typed URL parameters", function () {
    expect(new UrlMatcher('/users/{id:integer}').format({ id: 55 })).toEqual('/users/55');
    expect(new UrlMatcher('/users/{id:boolean}').format({ id: false })).toEqual('/users/false');
    expect(new UrlMatcher('/users/{id:boolean}').format({ id: "something" })).toEqual('/users/');
  });

  it(".concat() concatenates matchers", function () {
    var matcher = new UrlMatcher('/users/:id/details/{type}?from').concat('/{repeat:[0-9]+}?to');
    var params = matcher.parameters();
    expect(params.length).toBe(5);
    expect(params).toContain('id');
    expect(params).toContain('type');
    expect(params).toContain('repeat');
    expect(params).toContain('from');
    expect(params).toContain('to');
  });

  it(".concat() returns a new matcher", function () {
    var base = new UrlMatcher('/users/:id/details/{type}?from');
    var matcher = base.concat('/{repeat:[0-9]+}?to');
    expect(matcher).toNotBe(base);
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
  });

  it("defines builtin boolean type", function () {
    var booleanHandler = $umf.type("boolean");
    expect(booleanHandler.equals(true, true)).toBe(true);
    expect(booleanHandler.equals(true, "blue")).toBe(false);
    expect(booleanHandler.is(false)).toBe(true);
    expect(booleanHandler.is(456)).toBe(false);
    expect(booleanHandler.encode(false)).toBe("false");
    expect(booleanHandler.decode("False")).toBe(false);
    expect(booleanHandler.decode("purple")).toBe(undefined);
  });

  it("defines builtin integer type", function () {
    var integerHandler = $umf.type("integer");
    expect(integerHandler.equals(5, 5)).toBe(true);
    expect(integerHandler.equals(5, "blue")).toBe(false);
    expect(integerHandler.is(67)).toBe(true);
    expect(integerHandler.is(45.2)).toBe(false);
    expect(integerHandler.is({})).toBe(false);
    expect(integerHandler.encode(342)).toBe("342");
    expect(integerHandler.decode("5563")).toBe(5563);
  });

  it("registers minimal custom types", function () {
    $umf.type("test", {
      encode: function (typeObj) { return typeObj.value; },
      decode: function (value) { return { value: value }; }
    });
    var typeHandler = $umf.type("test");
    expect(typeHandler.equals({ value: "one" }, { value: "one" })).toBe(true);
    expect(typeHandler.equals({ value: "one" }, { value: "two" })).toBe(false);
    expect(typeHandler.is({ value: "one" })).toBe(true);
    expect(typeHandler.is(456)).toBe(false);
  });

  it("registers complete custom types", function () {
    $umf.type("test", {
      encode: function (typeObj) { return typeObj.value; },
      decode: function (value) { return { value: value }; },
      is: function (typeObj) { return (isObject(typeObj) && !!typeObj.value); },
      equals: function (typeObj, otherObj) { return (typeObj.value === otherObj.value && typeObj.value !== undefined); }
    });
    var typeHandler = $umf.type("test");
    expect(typeHandler.equals({ value: "one" }, { value: "one" })).toBe(true);
    expect(typeHandler.equals({ value: "one" }, { value: "two" })).toBe(false);
    expect(typeHandler.is({ value: "one" })).toBe(true);
    expect(typeHandler.is(456)).toBe(false);
  });

  xit("registers injectable handler types", function () {
    $umf.type("test", function($location) {
      return {
        encode: function (typeObj) { return $location; },
        decode: function (value) { return $location; }
      };
    });
    var typeHandler = $umf.type("test");
    expect(typeHandler.encode()).toBeDefined();
  });
});
