import {StateBuilder, StateMatcher, ng1ViewsBuilder, extend} from "../src/index";
import {Resolvable} from "ui-router-core";
declare var inject;

describe('Ng1 StateBuilder', function() {
  var parent = { name: "" };
  var builder, matcher, urlMatcherFactoryProvider: any = {
    compile: function() {},
    isMatcher: function() {}
  };

  beforeEach(function() {
    matcher = new StateMatcher({});
    builder = new StateBuilder(matcher, urlMatcherFactoryProvider);
    builder.builder('views', ng1ViewsBuilder);
  });

  it('should return a new views object, and copy keys from state def, if no `views` is defined in the state def', function() {
    var config = { url: "/foo", templateUrl: "/foo.html", controller: "FooController", parent: parent };
    var built = builder.builder('views')(config);

    expect(built.$default).not.toEqualData(config);
    expect(built.$default).toEqualData({ templateUrl: "/foo.html", controller: "FooController", resolveAs: '$resolve' });
  });

  it("should return modified view config object if `views` is defined in the state def", function() {
    var config = { a: { foo: "bar", controller: "FooController" } };
    expect(builder.builder('views')({ parent: parent, views: config })).toEqual(config);
  });

  it("should not allow a view config with both component and template keys", inject(function($injector) {
    var config = { name: "foo", url: "/foo", template: "<h1>hey</h1>", controller: "FooController", parent: parent };
    expect(() => builder.builder('views')(config)).not.toThrow();
    expect(() => builder.builder('views')(extend({ component: 'fooComponent' }, config))).toThrow();
    expect(() => builder.builder('views')(extend({ componentProvider: () => 'fooComponent' }, config))).toThrow();
    expect(() => builder.builder('views')(extend({ bindings: {}}, config))).toThrow();
  }));

  it("should replace a resolve: string value with a function that injects the service of the same name", inject(function($injector) {
    var config = { resolve: { foo: "bar" } };
    expect(builder.builder('resolvables')).toBeDefined();
    var built: Resolvable[] = builder.builder('resolvables')(config);
    expect(built[0].deps).toEqual(["bar"]);
  }));
});
