import { StateBuilder, StateMatcher, ng1ViewsBuilder, extend } from '../src/index';
import { Resolvable } from '@uirouter/core';
declare var inject;

describe('Ng1 StateBuilder', function() {
  const parent = { name: '' };
  let builder,
    matcher,
    urlMatcherFactoryProvider: any = {
      compile: function() {},
      isMatcher: function() {},
    };

  beforeEach(function() {
    matcher = new StateMatcher({});
    builder = new StateBuilder(matcher, urlMatcherFactoryProvider);
    builder.builder('views', ng1ViewsBuilder);
  });

  it('should use the state object to build a default view, when no `views` property is found', function() {
    const config = { url: '/foo', templateUrl: '/foo.html', controller: 'FooController', parent: parent };
    const built = builder.builder('views')(config);

    expect(built.$default).not.toEqualData(config);
    expect(built.$default).toEqualData({
      templateUrl: '/foo.html',
      controller: 'FooController',
      resolveAs: '$resolve',
    });
  });

  it('It should use the views object to build views, when defined', function() {
    const config = { a: { foo: 'bar', controller: 'FooController' } };
    const builtViews = builder.builder('views')({ parent: parent, views: config });
    expect(builtViews.a.foo).toEqualData(config.a.foo);
    expect(builtViews.a.controller).toEqualData(config.a.controller);
  });

  it('should not allow a view config with both component and template keys', inject(function($injector) {
    const config = {
      name: 'foo',
      url: '/foo',
      template: '<h1>hey</h1>',
      controller: 'FooController',
      parent: parent,
    };
    expect(() => builder.builder('views')(config)).not.toThrow();
    expect(() => builder.builder('views')(extend({ component: 'fooComponent' }, config))).toThrow();
    expect(() => builder.builder('views')(extend({ componentProvider: () => 'fooComponent' }, config))).toThrow();
    expect(() => builder.builder('views')(extend({ bindings: {} }, config))).toThrow();
  }));

  it('should replace a resolve: string value with a function that injects the service of the same name', inject(function(
    $injector
  ) {
    const config = { resolve: { foo: 'bar' } };
    expect(builder.builder('resolvables')).toBeDefined();
    const built: Resolvable[] = builder.builder('resolvables')(config);
    expect(built[0].deps).toEqual(['bar']);
  }));
});
