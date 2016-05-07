import {StateBuilder, StateMatcher, ng1ResolveBuilder, ng1ViewsBuilder} from "../../src/ng1";

describe('Ng1 StateBuilder', function() {
  var builder, matcher, urlMatcherFactoryProvider: any = {
    compile: function() {},
    isMatcher: function() {}
  };

  beforeEach(function() {
    matcher = new StateMatcher({});
    builder = new StateBuilder(matcher, urlMatcherFactoryProvider);
    builder.builder('views', ng1ViewsBuilder);
    builder.builder('resolve', ng1ResolveBuilder);
  });

  it('should return a new views object, and copy keys from state def, if no `views` is defined in the state def', function() {
    var parent = { name: "" };
    var config = { url: "/foo", templateUrl: "/foo.html", controller: "FooController", parent: parent };
    var built = builder.builder('views')(config);

    expect(built.$default).not.toEqualData(config);
    expect(built.$default).toEqualData({ templateUrl: "/foo.html", controller: "FooController", resolveAs: '$resolve' });
  });

  it("should return modified view config object if `views` is defined in the state def", function() {
    var parent = { name: "" };
    var config = { a: { foo: "bar", controller: "FooController" } };
    expect(builder.builder('views')({ parent: parent, views: config })).toEqual(config);
  });

  it("should replace a resolve: string value with a function that injects the service of the same name", inject(function($injector) {
    var config = { resolve: { foo: "bar" } };
    var locals = { "bar": 123 };
    expect(builder.builder('resolve')).toBeDefined();
    var built = builder.builder('resolve')(config);
    expect($injector.invoke(built.foo, null, locals)).toBe(123);
  }));
});
