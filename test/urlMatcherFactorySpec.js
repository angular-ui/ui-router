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

  it(".exec() captures parameter values", function () {
    expect(
      new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from&to')
        .exec('/users/123/details//0', {}))
      .toEqual({ id:'123', type:'', repeat:'0' });
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

  it(".format() reconstitutes the URL", function () {
    expect(
      new UrlMatcher('/users/:id/details/{type}/{repeat:[0-9]+}?from')
        .format({ id:'123', type:'default', repeat:444, ignored:'value', from:'1970' }))
      .toEqual('/users/123/details/default/444?from=1970');
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

  beforeEach(module('ui.util'));
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
});
