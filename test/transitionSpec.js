describe('transition', function () {
  var states;
  beforeEach(function() {
    states = {};
    states[''] = { name: '', parent: null };
    states['home'] = {
      name: 'home', parent: states['']
      ,resolve: { foo: function () { console.log("foo"); return "foo"; } }
    };
    states['home.about'] = {
      name: 'home.about', parent: states['home']
      ,resolve: { bar: function () { console.log("bar"); return "bar"; } }
    };
    states['home.about.people'] = {
      name: 'home.about.people', parent: states['home.about']
      ,resolve: { baz: function () { console.log("baz"); return "baz"; } }
    };
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

  describe('Path.resolve()', function() {
    it('should resolve on-demand', inject(function($q, $transition) {
      var Path = $transition.Path;
      var PathContext = $transition.PathContext;
      var path = new Path([ states[''], states['home'], states['home.about'], states['home.about.people'] ]);
      var promise = path.resolve(new PathContext(new Path([])));
      expect(promise).toBeDefined();
      expect(promise.then).toBeDefined();

      promise.then(function(data) {
        expect(path.$$elements[1].$$resolvables['foo']).toBeDefined();
        expect(path.$$elements[1].$$resolvables['foo'].data).toBe("foo");
        expect(path.$$elements[2].$$resolvables['bar'].data).toBe("bar");
        expect(path.$$elements[3].$$resolvables['baz'].data).toBe("baz");
        console.log(path.$$elements[2].$$resolvables['bar']);
      });

      $q.flush();
    }));
  });
});