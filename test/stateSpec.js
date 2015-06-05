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

      expect(matcher.find()).toBeUndefined();
      expect(matcher.find('')).toBeUndefined();
      expect(matcher.find(null)).toBeUndefined();
    });

    it('should determine whether a path is relative', function() {
      var matcher = new StateMatcher();
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
      expect(function() { matcher.find('^.^', states.home); }).toThrow("Path '^.^' not valid for state 'home'");
    });
  });

  describe('StateBuilder', function() {
    var builder, root, matcher, urlMatcherFactoryProvider = {
      compile: function() {},
      isMatcher: function() {}
    };

    beforeEach(function() {
      matcher = new StateMatcher(states);
      builder = new StateBuilder(function() { return root; }, matcher, urlMatcherFactoryProvider);
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
        var state = angular.extend(states['home.withData.child'], { self: {} });
        expect(builder.builder('data')(state)).toEqual({ val1: "foo", val2: "baz" });

        var state = angular.extend(states['home.withData'], { self: {} });
        expect(builder.builder('data')(state)).toEqual({ val1: "foo", val2: "bar" });
      });

      it('should compile a UrlMatcher for ^ URLs', function() {
        var url = {};
        spyOn(urlMatcherFactoryProvider, 'compile').andReturn(url);

        expect(builder.builder('url')({ url: "^/foo" })).toBe(url);
        expect(urlMatcherFactoryProvider.compile).toHaveBeenCalledWith("/foo", { params: {} });
      });

      it('should concatenate URLs from root', function() {
        root = { url: { concat: function() {} } }, url = {};
        spyOn(root.url, 'concat').andReturn(url);

        expect(builder.builder('url')({ url: "/foo" })).toBe(url);
        expect(root.url.concat).toHaveBeenCalledWith("/foo", { params: {} });
      });

      it('should pass through empty URLs', function() {
        expect(builder.builder('url')({ url: null })).toBeNull();
      });

      it('should pass through custom UrlMatchers', function() {
        var url = ["!"];
        spyOn(urlMatcherFactoryProvider, 'isMatcher').andReturn(true);
        expect(builder.builder('url')({ url: url })).toBe(url);
        expect(urlMatcherFactoryProvider.isMatcher).toHaveBeenCalledWith(url);
      });

      it('should throw on invalid UrlMatchers', function() {
        spyOn(urlMatcherFactoryProvider, 'isMatcher').andReturn(false);

        expect(function() {
          builder.builder('url')({ toString: function() { return "foo"; }, url: { foo: "bar" } });
        }).toThrow("Invalid url '[object Object]' in state 'foo'");

        expect(urlMatcherFactoryProvider.isMatcher).toHaveBeenCalledWith({ foo: "bar" });
      });

      it('should return filtered keys if view config is provided', function() {
        var config = { url: "/foo", templateUrl: "/foo.html", controller: "FooController" };
        expect(builder.builder('views')(config)).toEqual({
          $default: { templateUrl: "/foo.html", controller: "FooController" }
        });
      });

      it("should return unmodified view configs if defined", function() {
        var config = { a: { foo: "bar", controller: "FooController" } };
        expect(builder.builder('views')({ views: config })).toEqual(config);
      });
    });
  });

  describe('StateReference', function () {
    it('should be callable and return the correct values', function() {
      var state = { name: "foo.bar" }, ref = new StateReference(state.name, state, {});
      expect(ref.identifier()).toBe("foo.bar");
      expect(ref.$state()).toBe(state);
      expect(ref.params()).toEqual({});
    });

    it('should validate state definition', function() {
      var ref = new StateReference("foo", null, {}, {});
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("Could not resolve 'foo' from state '[object Object]'");

      ref = new StateReference("foo");
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("No such state 'foo'");

      ref = new StateReference("foo", { name: "foo" });
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("State 'foo' has an invalid definition");

      ref = new StateReference("foo", {
        name: "foo", self: { "abstract": true }
      });
      expect(ref.valid()).toBe(false);
      expect(ref.error()).toBe("Cannot transition to abstract state 'foo'");
    });
  });
});

describe('state', function () {

  var stateProvider, locationProvider, templateParams, template, ctrlName;

  beforeEach(module('ui.router', function($locationProvider) {
    locationProvider = $locationProvider;
    $locationProvider.html5Mode(false);
  }));

  var log, logEvents, logEnterExit;
  function callbackLogger(what) {
    return function () {
      if (logEnterExit) log += this.name + '.' + what + ';';
    };
  }

  var A = { data: {}, controller: function() { log += "controller;"; } },
    B = {},
    C = {},
    D = { params: { x: null, y: null } },
    DD = { parent: D, params: { x: null, y: null, z: null } },
    DDDD = { parent: D, controller: function() {}, template: "hey"},
    E = { params: { i: {} } },
    F = { params: { a: '', b: false, c: 0, d: undefined, e: -1 }},
    H = { data: {propA: 'propA', propB: 'propB'} },
    HH = { parent: H },
    HHH = {parent: HH, data: {propA: 'overriddenA', propC: 'propC'} },
    RS = { url: '^/search?term', reloadOnSearch: false },
    dynamicstate = {
      url: '^/dynstate/:path/:pathDyn?search&searchDyn', params: {
        pathDyn: { dynamic: true },
        searchDyn: { dynamic: true }
      }
    },
    OPT = { url: '/opt/:param', params: { param: "100" } },
    OPT2 = { url: '/opt2/:param2/:param3', params: { param3: "300", param4: "400" } },
    AppInjectable = {};

  beforeEach(module(function ($stateProvider, $provide) {
    angular.forEach([ A, B, C, D, DD, E, H, HH, HHH ], function (state) {
      state.onEnter = callbackLogger('onEnter');
      state.onExit = callbackLogger('onExit');
    });
    stateProvider = $stateProvider;

    $stateProvider
      .state('A', A)
      .state('B', B)
      .state('C', C)
      .state('D', D)
      .state('DD', DD)
      .state('E', E)
      .state('F', F)
      .state('H', H)
      .state('HH', HH)
      .state('HHH', HHH)
      .state('RS', RS)
      .state('dynamicstate', dynamicstate)
      .state('OPT', OPT)
      .state('OPT.OPT2', OPT2)
      .state('home', { url: "/" })
      .state('home.item', { url: "front/:id" })
      .state('about', { url: "/about" })
      .state('about.person', { url: "/:person" })
      .state('about.person.item', { url: "/:id" })
      .state('about.sidebar', {})
      .state('about.sidebar.item', {
        url: "/:item",
        templateUrl: function(params) {
          templateParams = params;
          return "/templates/" + params.item + ".html";
        }
      })
      .state('dynamicController', {
        url: "/dynamic/:type",
        template: "test",
        controllerProvider: function($stateParams, foo) {
          ctrlName = $stateParams.type + foo + "Controller";
          return ctrlName;
        },
        resolve: {
          foo: function() { return 'Foo'; }
        }
      })
      .state('dynamicTemplate', {
        url: "/dynamicTemplate/:type",
        templateProvider: function($stateParams, foo) {
          template = $stateParams.type + foo + "Template";
          return template;
        },
        resolve: {
          foo: function() { return 'Foo'; }
        }
      })
      .state('home.redirect', {
        url: "redir",
        onEnter: function($state) {
          $state.transitionTo("about");
        }
      })
      .state('resolveFail', {
        url: "/resolve-fail",
        resolve: {
          badness: function($q) {
            return $q.reject("!");
          }
        }
      })
      .state('resolveTimeout', {
        url: "/:foo",
        resolve: {
          value: function ($timeout) {
            return $timeout(function() { log += "Success!"; }, 1);
          }
        },
        controller: function() { log += "controller;"}
      })
      .state('badParam', {
        url: "/bad/{param:int}"
      })
      .state('badParam2', {
        url: "/bad2/{param:[0-9]{5}}"
      })

      .state('json', { url: '/jsonstate/{param:json}' })

      .state('first', { url: '^/first/subpath' })
      .state('second', { url: '^/second' })

      // State param inheritance tests. param1 is inherited by sub1 & sub2;
      // param2 should not be transferred (unless explicitly set).
      .state('root', { url: '^/root?param1' })
      .state('root.sub1', {url: '/1?param2' })
      .state('logA', {
        url: "/logA",
        template: "<div> <div ui-view/></div>",
        controller: function() {log += "logA;"}
      })
      .state('logA.logB', {
        url: "/logB",
        views:{
          '':{
                template: "<div> <div ui-view/></div>",
                controller: function() {log += "logB;"}
          }
        }
      })
      .state('logA.logB.logC', {
        url: "/logC",
        views:{
          '':{
                template: "<div> <div ui-view/></div>",
                controller: function() {log += "logC;"}
          }
        }
      })
    $stateProvider.state('root.sub2', {url: '/2?param2' });

    $provide.value('AppInjectable', AppInjectable);
  }));

  beforeEach(inject(function ($rootScope) {
    log = '';
    logEvents = logEnterExit = false;
  }));


  function $get(what) {
    return jasmine.getEnv().currentSpec.$injector.get(what);
  }

  function initStateTo(state, params) {
    var $state = $get('$state'), $q = $get('$q');
    $state.transitionTo(state, params || {});
    $q.flush();
    expect($state.current).toBe(state);
  }

  describe('provider', function () {
    it ('should ignore Object properties when registering states', function () {
      expect(function() {
        stateProvider.state('toString', { url: "/to-string" });
      }).not.toThrow();
      expect(function() {
        stateProvider.state('watch', { url: "/watch" });
      }).not.toThrow();
    });
  });

  describe('.transitionTo()', function () {

    var $rootScope, $state, $stateParams, $transition, $q, $location;

    beforeEach(inject(function (_$rootScope_, _$state_, _$stateParams_, _$transition_, _$q_, _$location_) {
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $transition = _$transition_;
      $q = _$q_;
      $location = _$location_;
    }));

    it('returns a promise for the target state', inject(function ($state, $q) {
      var promise = $state.transitionTo(A, {});
      expect(angular.isFunction(promise.then)).toBeTruthy();
      expect(promise.transition.to()).toBe(A);
    }));

    // @todo this should fail:
    // $state.transitionTo('about.person.item', { id: 5 }); $q.flush();

    it('allows transitions by name', inject(function ($state, $q) {
      $state.transitionTo('A', {});
      $q.flush();
      expect($state.current).toBe(A);
    }));

    describe("(dynamic params)", function () {
      var stateChanged;

      beforeEach(inject(function (_$rootScope_, _$state_, _$stateParams_, _$transition_, _$q_, _$location_) {
        $transition.provider.on({}, function () {
          stateChanged = true;
        });

        $q.flush();
      }));


      it('resolves a fully dynamic $state.go() with the current state', function () {
        initStateTo(RS);
        var destState, promise = $state.go(".", {term: "hello"});
        promise.then(function(result) { destState = result; });
        $q.flush();
        expect($state.current).toBe(RS);
        expect(destState).toBe(RS);
      });

      it('rejects a fully dynamic transition.run() with transition.IGNORED', function () {
        initStateTo(RS);
        var promise = $state.go(".", {term: "hello"});
        var caught, transition = promise.transition;
        transition.promise.catch(function (error) {
          caught = error;
        });
        $q.flush();
        expect($state.current).toBe(RS);
        expect(caught.type).toBe(transition.IGNORED);
        expect($location.search()).toEqual({term: 'hello'});
      });

      describe("", function() {
        beforeEach(function () {
          initStateTo(dynamicstate, { path: 'pathfoo', pathDyn: 'pathbar', search: 'searchfoo', searchDyn: 'searchbar' });
          expect(stateChanged).toBeTruthy();
          expect(obj($stateParams)).toEqual({ path: 'pathfoo', pathDyn: 'pathbar', search: 'searchfoo', searchDyn: 'searchbar' });
          expect($location.url()).toEqual("/dynstate/pathfoo/pathbar?search=searchfoo&searchDyn=searchbar");
          stateChanged = false;
        });

        it('triggers state change for non-dynamic search params', function () {
          $state.go(dynamicstate, {search: 'somethingelse'});
          $q.flush();
          expect(stateChanged).toBeTruthy();
          expect(obj($stateParams)).toEqual({ path: 'pathfoo', pathDyn: 'pathbar', search: 'somethingelse', searchDyn: 'searchbar' });
        });

        it('does not trigger state change for dynamic search params', function () {
          $state.go(dynamicstate, {searchDyn: 'somethingelse'});
          $q.flush();
          expect(stateChanged).toBeFalsy();
          expect(obj($stateParams)).toEqual({ path: 'pathfoo', pathDyn: 'pathbar', search: 'searchfoo', searchDyn: 'somethingelse' });
        });

        it('triggers state change for non-dynamic path params', function () {
          $state.go(dynamicstate, {path: 'somethingelse'});
          $q.flush();
          expect(stateChanged).toBeTruthy();
          expect(obj($stateParams)).toEqual({ path: 'somethingelse', pathDyn: 'pathbar', search: 'searchfoo', searchDyn: 'searchbar' });
        });

        it('does not trigger state change for dynamic path params', function () {
          $state.go(dynamicstate, {pathDyn: 'somethingelse'});
          $q.flush();
          expect(stateChanged).toBeFalsy();
          expect(obj($stateParams)).toEqual({ path: 'pathfoo', pathDyn: 'somethingelse', search: 'searchfoo', searchDyn: 'searchbar' });
        });

        it('does not cause state reload when only dynamic params change (triggered via url)', inject(function () {
          $location.search({search: 'searchfoo', searchDyn: 'somethingelse'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();

          expect(stateChanged).toBe(false);
        }));

        it('does not cause state reload when only dynamic params change (triggered via $state transition)', function () {
          $state.go('.', {searchDyn: 'somethingelse'});
          $q.flush();
          expect(stateChanged).toBe(false);
        });

        it('updates $stateParams and $location.search when only dynamic params change (triggered via url)', inject(function () {
          $location.search({search: 'searchfoo', searchDyn: 'somethingelse'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect($stateParams.search).toBe('searchfoo');
          expect($stateParams.searchDyn).toBe('somethingelse');
          expect($location.search()).toEqual({search: 'searchfoo', searchDyn: 'somethingelse'});
        }));

        it('updates $stateParams and $location.search when only dynamic params change (triggered via $state transition)', inject(function () {
          $state.go('.', {searchDyn: 'somethingelse'});
          $q.flush();
          expect($stateParams.search).toBe('searchfoo');
          expect($stateParams.searchDyn).toBe('somethingelse');
          expect($location.search()).toEqual({search: 'searchfoo', searchDyn: 'somethingelse'});
        }));

        it('dynamic param changes can be observed by watching $stateParams', inject(function () {
          var observedParamValue;
          function stateParamsTerm() { return $stateParams.searchDyn; }
          $rootScope.$watch(stateParamsTerm, function (newval, oldval) {
            if (newval === oldval) return;
            observedParamValue = newval;
          });
          $q.flush();

          $location.search({search: 'searchfoo', searchDyn: 'somethingelse'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect(stateChanged).toBe(false);
          expect(observedParamValue).toBe("somethingelse");
        }));

      });
    });

    describe("(with dynamic params because reloadOnSearch=false)", function () {
      describe("and only query params changed", function () {

        var called;
        beforeEach(function() {
          initStateTo(RS);
          $transition.provider.entering({to: 'RS'}, function () {
            called = true
          });
        });

        it('doesn\'t re-enter state (triggered by url change)', function () {
          $location.search({term: 'hello'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect($location.search()).toEqual({term: 'hello'});
          expect(called).toBeFalsy();
        });

        it('doesn\'t re-enter state (triggered by $state transition)', function () {
          initStateTo(RS);
          var promise = $state.go(".", {term: "hello"});
          var caught, transition = promise.transition;
          transition.promise.catch(function (error) {
            caught = error;
          });
          $q.flush();
          expect($state.current).toBe(RS);
          expect(caught.type).toBe(transition.IGNORED);
          expect($location.search()).toEqual({term: 'hello'});
        });

        it('updates $stateParams', function () {
          initStateTo(RS);
          $location.search({term: 'hello'});
          var called;
          $transition.provider.entering({to: 'RS'}, function () {
            called = true
          });
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect(obj($stateParams)).toEqual({term: 'hello'});
          expect(called).toBeFalsy();
        });

        it('updates URL when (triggered by $state transition)', function () {
          initStateTo(RS);
          $state.go(".", {term: 'goodbye'});
          var called;
          $transition.provider.entering({to: 'RS'}, function () {
            called = true
          });
          $q.flush();
          expect(obj($stateParams)).toEqual({term: 'goodbye'});
          expect($location.url()).toEqual("/search?term=goodbye");
          expect(called).toBeFalsy();
        });
      });

    });

    it('ignores non-applicable state parameters', inject(function ($state, $q) {
      $state.transitionTo('A', { w00t: 'hi mom!' });
      $q.flush();
      expect($state.current).toBe(A);
    }));

    it('is a no-op when passing the current state and identical parameters', inject(function ($state, $q) {
      initStateTo(A);
      var promise = $state.transitionTo(A, {}); // no-op
      expect(promise).toBeDefined(); // but we still get a valid promise
      $q.flush();
      expect(resolvedValue(promise)).toBe(A);
      expect($state.current).toBe(A);
      expect(log).toBe('');
    }));

    it('aborts pending transitions (last call wins)', inject(function ($state, $q) {
      initStateTo(A);
      logEvents = true;

      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(C, {});
      $q.flush();
      expect($state.current).toBe(C);
      expect(resolvedError(superseded)).toBeTruthy();
    }));

    it('aborts pending transitions even when going back to the current state', inject(function ($state, $q) {
      initStateTo(A);
      logEvents = true;

      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(A, {});
      $q.flush();
      expect($state.current).toBe(A);
      expect(resolvedError(superseded)).toBeTruthy();
    }));

    it('aborts pending transitions when aborted from callbacks', inject(function ($state, $q) {
      var superseded = $state.transitionTo('home.redirect');
      $q.flush();
      expect($state.current.name).toBe('about');
    }));

    it('triggers onEnter and onExit callbacks', inject(function ($state, $q) {
      initStateTo(A);
      logEnterExit = true;
      $state.transitionTo(D, {}); $q.flush();
      log += $state.current.name + ';';
      $state.transitionTo(DD, {}); $q.flush();
      log += $state.current.name + ';';
      $state.transitionTo(A, {}); $q.flush();
      expect(log).toBe(
        'A.onExit;' +
        'D.onEnter;' +
        'D;' +
        'DD.onEnter;' +
        'DD;' +
        'DD.onExit;' +
        'D.onExit;' +
        'A.onEnter;');
    }));

    it('doesn\'t transition to parent state when child has no URL', inject(function ($state, $q) {
      $state.transitionTo('about.sidebar'); $q.flush();
      expect($state.current.name).toEqual('about.sidebar');
    }));

    it('notifies on failed relative state resolution', inject(function ($state, $q) {
      $state.transitionTo(DD);
      $q.flush();

      var actual, err = "Could not resolve '^.Z' from state 'DD'";
      $state.transitionTo("^.Z", null, { relative: $state.$current }).catch(function(err) {
        actual = err;
      });
      $q.flush();
      expect(actual.message).toEqual(err)
    }));

    it('uses the controllerProvider to get controller dynamically', inject(function ($state, $q) {
      $state.transitionTo('dynamicController', { type: "Acme" });
      $q.flush();
      expect(ctrlName).toEqual("AcmeFooController");
    }));+

    it('uses the templateProvider to get template dynamically', inject(function ($state, $q) {
      $state.transitionTo('dynamicTemplate', { type: "Acme" });
      $q.flush();
      expect(template).toEqual("AcmeFooTemplate");
    }));

    it('updates the location #fragment, if specified', inject(function ($state, $q, $location) {
      // html5mode disabled
      locationProvider.html5Mode(false);
      expect(locationProvider.html5Mode()).toBe(false);
      $state.transitionTo('home.item', {id: 'world', '#': 'frag'});
      $q.flush();
      expect($location.url()).toBe('/front/world#frag');
      expect($location.hash()).toBe('frag');

      // html5mode enabled
      locationProvider.html5Mode(true);
      expect(locationProvider.html5Mode()).toBe(true);
      $state.transitionTo('home.item', {id: 'world', '#': 'frag'});
      $q.flush();
      expect($location.url()).toBe('/front/world#frag');
      expect($location.hash()).toBe('frag');
    }));
  });

  describe('.go()', function () {
    it('transitions to a relative state', inject(function ($state, $q) {
      $state.transitionTo('about.person.item', { person: "bob", id: 5 }); $q.flush();
      $state.go('^.^.sidebar'); $q.flush();
      expect($state.$current.name).toBe('about.sidebar');

      // Transitions to absolute state
      $state.go("home"); $q.flush();
      expect($state.$current.name).toBe('home');


      // Transition to a child state
      $state.go(".item", { id: 5 }); $q.flush();
      expect($state.$current.name).toBe('home.item');

      // Transition to grandparent's sibling through root
      // (Equivalent to absolute transition, assuming the root is known).
      $state.go("^.^.about"); $q.flush();
      expect($state.$current.name).toBe('about');

      // Transition to grandchild
      $state.go(".person.item", { person: "bob", id: 13 }); $q.flush();
      expect($state.$current.name).toBe('about.person.item');

      // Transition to immediate parent
      $state.go("^"); $q.flush();
      expect($state.$current.name).toBe('about.person');

      // Transition to sibling
      $state.go("^.sidebar"); $q.flush();
      expect($state.$current.name).toBe('about.sidebar');
    }));

    it('keeps parameters from common ancestor states', inject(function ($state, $stateParams, $q) {
      $state.transitionTo('about.person', { person: 'bob' });
      $q.flush();

      $state.go('.item', { id: "5" });
      $q.flush();

      expect($state.$current.name).toBe('about.person.item');
      expect(obj($stateParams)).toEqual({ person: 'bob', id: "5" });

      $state.go('^.^.sidebar');
      $q.flush();
      expect($state.$current.name).toBe('about.sidebar');
    }));
  });

  describe('.reload()', function () {
    it('returns a promise for the state transition', inject(function ($state, $q) {
      var promise = $state.transitionTo(A, {}); $q.flush();
      expect($state.current.name).toBe('A');
      expect(angular.isFunction(promise.then)).toBeTruthy();
      expect(promise.transition.to()).toBe(A);

      promise = $state.reload(); $q.flush();
      expect(angular.isFunction(promise.then)).toBeTruthy();
      expect(promise.transition.to()).toBe(A);
    }));

    it('should reload the current state with the current parameters', inject(function ($state, $q, $timeout) {
      $state.transitionTo('resolveTimeout', { foo: "bar" });
      $q.flush();
      expect(log).toBe('');

      $timeout.flush();
      expect(log).toBe('Success!');

      $state.reload();
      $q.flush();
      $timeout.flush();
      expect(log).toBe('Success!Success!');
    }));

    it('should invoke the controller', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/> </div>')($rootScope);
      $state.transitionTo('resolveTimeout', { foo: "bar" });
      $timeout.flush();
      $q.flush();
      expect(log).toBe('Success!controller;');

      $state.reload();
      $timeout.flush();
      $q.flush();
      expect(log).toBe('Success!controller;Success!controller;');
    }));

    it('should invoke the controllers by state when given state name', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      log = '';
      $state.reload('logA');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      log = '';
      $state.reload('logA.logB');
      $q.flush();
      expect(log).toBe('logB;logC;');

      log = '';
      $state.reload('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logC;');
    }));

    it('should reload all states when passing false', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      log = '';
      $state.reload(false);
      $q.flush();
      expect(log).toBe('logA;logB;logC;');
    }));

    it('should reload all states when passing true', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      log = '';
      $state.reload(true);
      $q.flush();
      expect(log).toBe('logA;logB;logC;');
    }));


    it('should invoke the controllers by state when given stateObj', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');

      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      log = '';
      $state.reload($state.current);
      $q.flush();
      expect(log).toBe('logC;');
    }));

    it('should throw an exception for invalid reload state name', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      expect(function(){
          $state.reload('logInvalid')}
        ).toThrow("No such reload state 'logInvalid'");
    }));

    it('should throw an exception for invalid reload state object', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      expect(function(){
          $state.reload({foo:'bar'})}
        ).toThrow("Invalid reload state object");

      expect(function(){
          $state.reload({name:'invalidState'})}
        ).toThrow("No such reload state 'invalidState'");
    }));
  });

  describe('.is()', function () {
    it('should return true when the current state is passed', inject(function ($state, $q) {
      $state.transitionTo(A); $q.flush();
      expect($state.is(A)).toBe(true);
      expect($state.is(A, null)).toBe(true);
      expect($state.is('A')).toBe(true);
      expect($state.is(B)).toBe(false);
    }));

    it('should return undefined when queried state does not exist', inject(function ($state) {
      expect($state.is('Z')).toBeUndefined();
    }));

    it('should return true when the current state is passed with matching parameters', inject(function ($state, $q) {
      $state.transitionTo(D, {x: 'foo', y: 'bar'}); $q.flush();
      expect($state.is(D)).toBe(true);
      expect($state.is(D, {x: 'foo', y: 'bar'})).toBe(true);
      expect($state.is('D', {x: 'foo', y: 'bar'})).toBe(true);
      expect($state.is(D, {x: 'bar', y: 'foo'})).toBe(false);
    }));

    it('should work for relative states', inject(function ($state, $q) {
      var options = { relative: $state.get('about') };
      
      $state.transitionTo('about.person', { person: 'jane' }); $q.flush();
      expect($state.is('.person', undefined, options)).toBe(true);

      $state.transitionTo('about.person', { person: 'bob' }); $q.flush();
      expect($state.is('.person', { person: 'bob' }, options)).toBe(true);
      expect($state.is('.person', { person: 'john' }, options)).toBe(false);

      options.relative = $state.get('about.person.item');
      expect($state.is('^', undefined, options)).toBe(true);
    }));
  });

  describe('.includes()', function () {
    it('should return true when the current state is passed', inject(function ($state, $q) {
      $state.transitionTo(A); $q.flush();
      expect($state.includes(A)).toBe(true);
      expect($state.includes('A')).toBe(true);
      expect($state.includes(B)).toBe(false);
    }));

    it('should return true when the current state\'s parent is passed', inject(function ($state, $q) {
      $state.transitionTo('about.person.item', { person: "bob", id: 5 }); $q.flush();
      expect($state.includes('about')).toBe(true);
      expect($state.includes('about.person')).toBe(true);
      expect($state.includes('about.sidebar')).toBe(false);
    }));

    it('should return undefined when queried state does not exist', inject(function ($state) {
      expect($state.includes('Z')).toBeUndefined();
    }));

    it('should return true when the current state is passed with partial matching parameters', inject(function ($state, $q) {
      $state.transitionTo(D, {x: 'foo', y: 'bar'}); $q.flush();
      expect($state.includes(D, {x: 'foo'})).toBe(true);
      expect($state.includes(D, {y: 'bar'})).toBe(true);
      expect($state.includes('D', {x: 'foo'})).toBe(true);
      expect($state.includes(D, {y: 'foo'})).toBe(false);
    }));

    it('should return true when the current state is passed with partial matching parameters from state\'s parent', inject(function ($state, $q) {
      $state.transitionTo('about.person.item', {person: 'bob', id: 5}); $q.flush();
      expect($state.includes('about.person', {person: 'bob'})).toBe(true);
      expect($state.includes('about.person', {person: 'steve'})).toBe(false);
    }));

    it('should return true when the current state is passed with partial glob patterns', inject(function ($state, $q) {
      $state.transitionTo('about.person.item', {person: 'bob', id: 5}); $q.flush();
      expect($state.includes('*.person.*')).toBe(true);
      expect($state.includes('*.person.**')).toBe(true);
      expect($state.includes('**.item.*')).toBe(false);
      expect($state.includes('**.item')).toBe(true);
      expect($state.includes('**.stuff.*')).toBe(false);
      expect($state.includes('*.*.*')).toBe(true);
      expect($state.includes('about.*.*')).toBe(true);
      expect($state.includes('about.**')).toBe(true);
      expect($state.includes('about.*.**')).toBe(true);
      expect($state.includes('*.about.*')).toBe(false);
      expect($state.includes('about.*.*', {person: 'bob'})).toBe(true);
      expect($state.includes('about.*.*', {person: 'shawn'})).toBe(false);
    }));

    it('should work for relative states', inject(function ($state, $q) {
      $state.transitionTo('about.person.item', { person: 'bob', id: 5 }); $q.flush();

      expect($state.includes('.person', undefined, { relative: 'about' } )).toBe(true);
      expect($state.includes('.person', null, { relative: 'about' } )).toBe(true);

      expect($state.includes('^', undefined, { relative: $state.get('about.person.item') })).toBe(true);

      expect($state.includes('.person', { person: 'bob' }, { relative: $state.get('about') } )).toBe(true);
      expect($state.includes('.person', { person: 'steve' }, { relative: $state.get('about') } )).toBe(false);
    }));
  });

  describe('.current', function () {
    it('is always defined', inject(function ($state) {
      expect($state.current).toBeDefined();
    }));

    it('updates asynchronously as the transitionTo() promise is resolved', inject(function ($state, $q) {
      var trans = $state.transitionTo(A, {});
      expect($state.current).not.toBe(A);
      $q.flush();
      expect($state.current).toBe(A);
    }));
  });

  describe('$current', function () {
    it('is always defined', inject(function ($state) {
      expect($state.$current).toBeDefined();
    }));

    it('wraps the raw state object', inject(function ($state) {
      initStateTo(A);
      expect($state.$current.data).toBe(A.data); // 'data' is reserved for app use
    }));
  });


  describe('.params', function () {
    it('is always defined', inject(function ($state) {
      expect(obj($state.params)).toBeDefined();
      expect(angular.isObject($state.params)).toBe(true);
    }));

    it('contains the parameter values for the current state', inject(function ($state, $q) {
      initStateTo(D, { x: 'x value', z: 'invalid value' });
      expect(obj($state.params)).toEqual({ x: 'x value', y: null });
    }));
  });

  describe('.href()', function () {
    it('aborts on un-navigable states', inject(function ($state) {
      expect($state.href("A")).toBeNull();
      expect($state.href("about.sidebar", null, { lossy: false })).toBeNull();
    }));

    it('generates a parent state URL when lossy is true', inject(function ($state) {
      expect($state.href("about.sidebar", null, { lossy: true })).toEqual("#/about");
    }));

    it('generates a URL without parameters', inject(function ($state) {
      expect($state.href("home")).toEqual("#/");
      expect($state.href("about", {})).toEqual("#/about");
      expect($state.href("about", { foo: "bar" })).toEqual("#/about");
    }));

    it('generates a URL with parameters', inject(function ($state) {
      expect($state.href("about.person", { person: "bob" })).toEqual("#/about/bob");
      expect($state.href("about.person.item", { person: "bob", id: null })).toEqual("#/about/bob/");
    }));

    it('inherit url parameters from current url', inject(function ($state) {
      initStateTo($state.get('root'), {param1: 1});
      expect($state.href("root", {}, {})).toEqual("#/root?param1=1");
      expect($state.href("root", {}, {inherit:false})).toEqual("#/root");
      expect($state.href("root", {}, {inherit:true})).toEqual("#/root?param1=1");
    }));

    it('generates absolute url when absolute is true', inject(function ($state) {
      expect($state.href("about.sidebar", null, { absolute: true })).toEqual("http://server/#/about");
      locationProvider.html5Mode(true);
      expect($state.href("about.sidebar", null, { absolute: true })).toEqual("http://server/about");
    }));

    it('respects $locationProvider.hashPrefix()', inject(function ($state) {
      locationProvider.hashPrefix("!");
      expect($state.href("home")).toEqual("#!/");
    }));

    describe('when $browser.baseHref() exists', function() {
      beforeEach(inject(function($browser) {
        spyOn($browser, 'baseHref').andCallFake(function() {
          return '/base/';
        });
      }));

      it('does not prepend relative urls', inject(function($state) {
        expect($state.href("home")).toEqual("#/");
      }));

      it('prepends absolute urls', inject(function($state) {
        expect($state.href("home", null, { absolute: true })).toEqual("http://server/base/#/");
      }));

      it('prepends relative and absolute urls in html5Mode', inject(function($state) {
        locationProvider.html5Mode(true);
        expect($state.href("home")).toEqual("/base/");
        expect($state.href("home", null, { absolute: true })).toEqual("http://server/base/");
      }));
    });
  });

  describe('.get()', function () {
    it("should return the state's config", inject(function ($state) {
      expect($state.get('home').url).toBe('/');
      expect($state.get('home.item').url).toBe('front/:id');
      expect($state.get('A')).toBe(A);
      expect($state.get('Z')).toBeNull();
    }));

    it("should return all of the state's config", inject(function ($state) {
      var list = $state.get().sort(function(a, b) { return (a.name > b.name) - (b.name > a.name); });
      var names = ['', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'H', 'HH', 'HHH', 'OPT', 'OPT.OPT2', 'RS',
        'about', 'about.person', 'about.person.item', 'about.sidebar', 'about.sidebar.item',
        'badParam', 'badParam2', 'dynamicController', 'dynamicTemplate', 'dynamicstate', 'first', 'home', 'home.item', 'home.redirect',
        'json', 'logA', 'logA.logB', 'logA.logB.logC', 'resolveFail', 'resolveTimeout',
        'root', 'root.sub1', 'root.sub2', 'second'];

      expect(list.map(function(state) { return state.name; })).toEqual(names);
    }));

    it('should work for relative states', inject(function ($state) {
      var about = $state.get('about');

      var person = $state.get('.person', about);
      expect(person.url).toBe('/:person');
      expect($state.get('^', 'about.person').url).toBe('/about');

      var item = $state.get('.person.item', about);
      expect(item.url).toBe('/:id');
      expect($state.get('^.^', item).url).toBe('/about');
    }));

    it("should return undefined on invalid state query", inject(function ($state) {
      expect($state.get(null)).toBeNull();
      expect($state.get(false)).toBeNull();
      expect($state.get(undefined)).toBeNull();
    }));
  });

  describe('optional parameters', function() {
    it("should be populated during transition, if unspecified", inject(function($state, $q) {
      var stateParams;
      $state.get("OPT").onEnter = function($stateParams) { stateParams = $stateParams; };
      $state.go("OPT"); $q.flush();
      expect($state.current.name).toBe("OPT");
      expect(obj($state.params)).toEqual({ param: "100" });
      expect(obj(stateParams)).toEqual({ param: "100" });
    }));

    it("should allow null default value for non-url params", inject(function($state, $q) {
      $state.go("D"); $q.flush();
      expect($state.current.name).toBe("D");
      expect(obj($state.params)).toEqual({ x: null, y: null });
    }));

    it("should allow falsy default values for non-url params", inject(function($state, $q) {
      $state.go("F"); $q.flush();
      expect($state.current.name).toBe("F");
      expect(obj($state.params)).toEqual({ a: '', b: false, c: 0, d: undefined, e: -1 });
    }));

    it("should allow arbitrary objects to pass for non-url params", inject(function($state, $q) {
      $state.go("D", { x: 100, y: { foo: 'bar' } }); $q.flush();
      expect($state.current.name).toBe("D");
      expect(obj($state.params)).toEqual({ x: 100, y: { foo: 'bar' } });
    }));

    it("should be populated during primary transition, if unspecified", inject(function($state, $q) {
      var count = 0;
      $state.get("OPT").onEnter = function($stateParams) { count++; };
      $state.go("OPT"); $q.flush();
      expect($state.current.name).toBe("OPT");
      expect(obj($state.params)).toEqual({ param: "100" });
      expect(count).toEqual(1);
    }));

    it("should allow mixed URL and config params", inject(function($state, $q) {
      var count = 0;
      $state.get("OPT").onEnter =      function($stateParams) { count++; };
      $state.get("OPT.OPT2").onEnter = function($stateParams) { count++; };
      $state.go("OPT"); $q.flush();
      expect($state.current.name).toBe("OPT");
      expect(obj($state.params)).toEqual({ param: "100" });
      expect(count).toEqual(1);

      $state.go("OPT.OPT2", { param2: 200 }); $q.flush();
      expect($state.current.name).toBe("OPT.OPT2");
      expect(obj($state.params)).toEqual({ param: "100", param2: "200", param3: "300", param4: "400" });
      expect(count).toEqual(2);
    }));
  });

  // TODO: Enforce by default in next major release (1.0.0)
  describe('non-optional parameters', function() {
    it("should cause transition failure, when unspecified.", inject(function($state, $q) {
      var count = 0;
      $state.get("OPT").onEnter =      function() { count++; };
      $state.get("OPT.OPT2").onEnter = function() { count++; };
      $state.go("OPT"); $q.flush();
      expect($state.current.name).toBe("OPT");
      expect(obj($state.params)).toEqual({ param: "100" });
      expect(count).toEqual(1);


      $state.go("OPT.OPT2"); // no, because missing non-optional param2
      $q.flush();
      expect($state.current.name).toBe("OPT");
      expect(obj($state.params)).toEqual({ param: "100" });
      expect(count).toEqual(1);
    }));
  });

  describe('url handling', function () {
    it('should transition to the same state with different parameters', inject(function ($state, $rootScope, $location) {
      $location.path("/about/bob");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();
      expect(obj($state.params)).toEqual({ person: "bob" });
      expect($state.current.name).toBe('about.person');

      $location.path("/about/larry");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();
      expect(obj($state.params)).toEqual({ person: "larry" });
      expect($state.current.name).toBe('about.person');
    }));

    it('preserve hash', inject(function($state, $rootScope, $location) {
      $location.path("/about/bob");
      $location.hash("frag");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();
      expect(extend({},$state.params)).toEqual({ "#": 'frag', person: "bob" });
      expect($state.current.name).toBe('about.person');
      expect($location.path()).toBe('/about/bob');
      expect($location.hash()).toBe('frag');
    }));

    it('should correctly handle absolute urls', inject(function ($state, $rootScope, $location) {
      $location.path("/first/subpath");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();
      expect($state.current.name).toBe('first');

      $state.transitionTo('second');
      $rootScope.$apply();
      expect($state.current.name).toBe('second');
      expect($location.path()).toBe('/second');
    }));

    it('should ignore bad urls', inject(function ($state, $rootScope, $location) {
      $location.path("/first/second");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();
      expect($state.current.name).toBe('');
    }));

    describe("typed parameter handling", function() {
      beforeEach(function () {
        stateProvider.state({
          name: "types",
          url: "/types/{p1:string}/{p2:date}",
          params: {
            p1: { value: [ "defaultValue" ], array: true },
            p2: new Date(2014, 10, 15),
            nonurl: null
          }
        });
        stateProvider.state({
          name: "types.substate",
          url: "/sub/{p3[]:int}/{p4:json}?{p5:bool}",
          params: {
            "p3[]": [ 10 ]
          }
        });
      });

      it('should initialize parameters without a hacky empty test', inject(function ($urlMatcherFactory, $state) {
        new UrlMatcher("");
      }));

      it('should ignore bad url parameters', inject(function ($state, $rootScope, $location, $urlMatcherFactory) {
        $location.path("/bad/5");
        $rootScope.$broadcast("$locationChangeSuccess");
        $rootScope.$apply();
        expect($state.current.name).toBe("badParam");

        $state.transitionTo("about");
        $rootScope.$apply();
        expect($state.current.name).toBe('about');

        $location.path("/bad/foo");
        $rootScope.$broadcast("$locationChangeSuccess");
        $rootScope.$apply();
        expect($state.current.name).toBe("about");
      }));

      it('should ignore bad state parameters', inject(function ($state, $rootScope, $location, $stateParams) {
        $state.go("badParam", { param: 5 });
        $rootScope.$apply();
        expect($state.current.name).toBe("badParam");
        expect(obj($stateParams)).toEqual({param: 5});

        $state.go("badParam2", { param: '12345' }); // must be 5 digits
        $rootScope.$apply();
        expect($state.current.name).toBe("badParam2");

        $state.go("about");
        $rootScope.$apply();
        expect($state.current.name).toBe('about');

        $state.go("badParam", { param: 'foo' });
        $rootScope.$apply();
        expect($state.current.name).toBe("about");

        $state.go("badParam2", { param: '1234' }); // must be 5 digits
        $rootScope.$apply();
        expect($state.current.name).toBe("about");
      }));

      function expectStateUrlMappingFn($state, $rootScope, $q, $location) {
        return function (state, url, params, defaults, nonurlparams) {
          $state.go(state, extend({}, nonurlparams, params));
          $q.flush();

          expect($state.current.name).toBe(state.name || state); // allow object
          expect(obj($state.params)).toEqual(extend({}, defaults, params, nonurlparams));
          expect($location.url()).toBe(url);

          initStateTo(A);

          $location.url(url);
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();

          expect($state.current.name).toBe(state.name || state); // allow object
          expect(obj($state.params)).toEqual(extend({}, defaults, params));
          expect($location.url()).toBe(url);
        }
      }

      it('should map to/from the $location.url() and $stateParams', inject(function($state, $location, $q, $rootScope) {
        var nov15 = new Date(2014,10,15);
        var defaults = { p1: [ 'defaultValue' ], p2: nov15, nonurl: null };
        var params = { p1: [ "foo" ], p2: nov15  };
        var nonurl = { nonurl: { foo: 'bar' } };

        var check = expectStateUrlMappingFn($state, $rootScope, $q, $location);
        check('types', '/types/defaultValue/2014-11-15', { }, defaults);
        check('types', "/types/foo/2014-11-15", params, defaults, nonurl);

        extend(defaults, { "p3[]": [ 10 ] });
        extend(params, { p4: { baz: "qux" }});
        check('types.substate', "/types/foo/2014-11-15/sub/10/%7B%22baz%22:%22qux%22%7D", params, defaults, nonurl);

        extend(params, { p5: true });
        check('types.substate', "/types/foo/2014-11-15/sub/10/%7B%22baz%22:%22qux%22%7D?p5=1", params, defaults, nonurl);
      }));
    });

    it('should revert to last known working url on state change failure', inject(function ($state, $rootScope, $location, $q) {
      $state.transitionTo("about");
      $q.flush();

      $location.path("/resolve-fail");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();

      expect($state.current.name).toBe("about");
    }));

    it('should not revert to last known working url on state change failure', inject(function ($state, $rootScope, $location, $q) {
      $state.transitionTo("about");
      $q.flush();

      //$rootScope.$on("$stateChangeError", function(event){
      //    event.defaultPrevented = true;
      //});

      $location.path("/resolve-fail");
      $rootScope.$broadcast("$locationChangeSuccess");
      $rootScope.$apply();

      expect($location.path()).toBe("/resolve-fail");
    }));

    it('should replace browser history when "replace" enabled', inject(function ($state, $rootScope, $location, $q) {

      spyOn($location, 'replace');

      $state.transitionTo('about', {}, { location: 'replace' });
      $q.flush();

      expect($location.replace).toHaveBeenCalled();
    }));

    it('should not replace history normally', inject(function ($state, $rootScope, $location, $q) {

      spyOn($location, 'replace');

      $state.transitionTo('about');
      $q.flush();

      expect($location.replace).not.toHaveBeenCalled();

    }));
  });

  describe('default properties', function() {
    it('should always have a name', inject(function ($state, $q) {
      $state.transitionTo(A);
      $q.flush();
      expect($state.$current.name).toBe('A');
      expect($state.$current.toString()).toBe('A');
    }));

    it('should always have a resolve object', inject(function ($state) {
      expect($state.$current.resolve).toEqual({});
    }));
  });

  describe('"data" property inheritance/override', function () {
    it('should stay immutable for if state doesn\'t have parent', inject(function ($state) {
      initStateTo(H);
      expect($state.current.name).toEqual('H');
      expect($state.current.data.propA).toEqual(H.data.propA);
      expect($state.current.data.propB).toEqual(H.data.propB);
    }));

    it('should be inherited from parent if state doesn\'t define it', inject(function ($state) {
      initStateTo(HH);
      expect($state.current.name).toEqual('HH');
      expect($state.current.data.propA).toEqual(H.data.propA);
      expect($state.current.data.propB).toEqual(H.data.propB);
    }));

    it('should be overridden/extended if state defines it', inject(function ($state) {
      initStateTo(HHH);
      expect($state.current.name).toEqual('HHH');
      expect($state.current.data.propA).toEqual(HHH.data.propA);
      expect($state.current.data.propB).toEqual(H.data.propB);
      expect($state.current.data.propB).toEqual(HH.data.propB);
      expect($state.current.data.propC).toEqual(HHH.data.propC);
    }));
  });


  describe('substate and stateParams inheritance', function() {
    it('should inherit the parent param', inject(function ($state, $stateParams, $q) {
      initStateTo($state.get('root'), { param1: 1 });
      $state.go('root.sub1', { param2: 2 });
      $q.flush();
      expect($state.current.name).toEqual('root.sub1');
      expect(obj($stateParams)).toEqual({ param1: "1", param2: "2" });
    }));

    it('should not inherit siblings\' states', inject(function ($state, $stateParams, $q) {
      initStateTo($state.get('root'), { param1: 1 });
      $state.go('root.sub1', { param2: 2 });
      $q.flush();
      expect($state.current.name).toEqual('root.sub1');

      $state.go('root.sub2');
      $q.flush();
      expect($state.current.name).toEqual('root.sub2');

      expect(obj($stateParams)).toEqual({ param1: "1", param2: undefined });
    }));
  });

  describe('html5Mode compatibility', function() {

    it('should generate non-hashbang URLs in HTML5 mode', inject(function ($state) {
      expect($state.href("about.person", { person: "bob" })).toEqual("#/about/bob");
      locationProvider.html5Mode(true);
      expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
    }));
  });

  describe('default properties', function () {
    it('should always have a name', inject(function ($state, $q) {
      $state.transitionTo(A); $q.flush();
      expect($state.$current.name).toBe('A');
      expect($state.$current.toString()).toBe('A');
    }));

    it('should always have a resolve object', inject(function ($state) {
      expect($state.$current.resolve).toEqual({});
    }));

    it('should include itself and parent states', inject(function ($state, $q) {
      $state.transitionTo(DD); $q.flush();
      expect($state.$current.includes).toEqual({ '': true, D: true, DD: true });
    }));
  });

  describe('template handling', function () {
    it('should inject $stateParams into templateUrl function', inject(function ($state, $q, $httpBackend) {
      $httpBackend.expectGET("/templates/foo.html").respond("200");
      $state.transitionTo('about.sidebar.item', { item: "foo" }); $q.flush();
      expect(templateParams).toEqual({ item: "foo" });
    }));
  });

  describe('provider decorators', function () {

    it('should return built-in decorators', inject(function ($state) {
      expect(stateProvider.decorator('parent')({ parent: A }).self.name).toBe("A");
    }));

    it('should allow built-in decorators to be overridden', inject(function ($state, $q) {
      stateProvider.decorator('data', function(state) {
        return angular.extend(state.data || {}, { foo: "bar" });
      });
      stateProvider.state('AA', { parent: A, data: { baz: "true" } });

      $state.transitionTo('AA');
      $q.flush();
      expect($state.current.data).toEqual({ baz: 'true', foo: 'bar' });
    }));

    it('should allow new decorators to be added', inject(function ($state, $q) {
      stateProvider.decorator('custom', function(state) {
        return function() { return "Custom functionality for state '" + state + "'" };
      });
      stateProvider.state('decoratorTest', {});

      $state.transitionTo('decoratorTest');
      $q.flush();
      expect($state.$current.custom()).toBe("Custom functionality for state 'decoratorTest'");
    }));

    it('should allow built-in decorators to be extended', inject(function ($state, $q, $httpBackend) {
      stateProvider.decorator('views', function(state, parent) {
        var result = {};

        angular.forEach(parent(state), function(config, name) {
          result[name] = angular.extend(config, { templateProvider: function() {
            return "Template for " + name;
          }});
        });
        return result;
      });

      stateProvider.state('viewTest', {
        views: {
          "viewA@": { template: '<div/>' },
          "viewB@": { template: '<div/>' }
        }
      });

      $state.transitionTo('viewTest');
      $q.flush();

      expect($state.$current.views['viewA@'].templateProvider()).toBe('Template for viewA@');
      expect($state.$current.views['viewB@'].templateProvider()).toBe('Template for viewB@');
    }));

  });
});

describe('state queue', function() {
  angular.module('ui.router.queue.test', ['ui.router.queue.test.dependency'])
    .config(function($stateProvider) {
      $stateProvider
        .state('queue-test-a', {})
        .state('queue-test-b-child', { parent: 'queue-test-b' })
        .state('queue-test-b', {});
    });

  angular.module('ui.router.queue.test.dependency', [])
    .config(function($stateProvider) {
      $stateProvider
        .state('queue-test-a.child', {})
    });

  var expectedStates = ['','queue-test-a', 'queue-test-a.child', 'queue-test-b', 'queue-test-b-child'];

  it('should work across modules', function() {
    module('ui.router.queue.test', 'ui.router.queue.test.dependency');

    inject(function ($state) {
      var list = $state.get().sort(function(a, b) { return (a.name > b.name) - (b.name > a.name); });
      expect(list.map(function(state) { return state.name; })).toEqual(expectedStates);
    });
  });

  it('should work when parent is name string', function() {
    module('ui.router.queue.test', 'ui.router.queue.test.dependency');

    inject(function ($state) {
      var list = $state.get().sort(function(a, b) { return (a.name > b.name) - (b.name > a.name); });
      expect(list.map(function(state) { return state.name; })).toEqual(expectedStates);
    });
  });
});

describe("state params", function() {

  describe("observation", function() {
    it("should broadcast updates when values change", inject(function($stateParams, $rootScope) {
      var called = false;

      $stateParams.$observe("a", function(newVal) {
        called = (newVal === "Hello");
      });

      $stateParams.a = "Hello";
      $rootScope.$digest();
      expect(called).toBe(true);
    }));

    it("should broadcast once on change", inject(function($stateParams, $rootScope) {
      var called = 0;

      $stateParams.$observe("a", function(newVal) {
        called++;
      });

      $stateParams.a = "Hello";
      $rootScope.$digest();
      expect(called).toBe(1);

      $rootScope.$digest();
      expect(called).toBe(1);

      $stateParams.a = "Goodbye";
      $rootScope.$digest();
      expect(called).toBe(2);
    }));

    it("should be attachable to multiple fields", inject(function($stateParams, $rootScope) {
      var called = 0;

      $stateParams.$observe("a b", function(newVal) {
        called += (newVal === "Hello") ? 1 : 0;
      });

      $stateParams.a = "Hello";
      $rootScope.$digest();

      expect(called).toBe(1);

      $stateParams.b = "Hello";
      $rootScope.$digest();

      expect(called).toBe(2);
    }));

    it("should be detachable", inject(function($stateParams, $rootScope) {
      var called = 0, off = $stateParams.$observe("a", function(newVal) {
        called++;
      });

      $stateParams.a = "Hello";
      $rootScope.$digest();
      off();

      $stateParams.a = "Goodbye";
      $rootScope.$digest();

      expect(called).toBe(1);

      $stateParams.$observe("a", function(newVal) {
        called++;
      });

      $stateParams.a = "Hello";
      $rootScope.$digest();
      expect(called).toBe(2);

      $stateParams.$off();

      $stateParams.a = "Hello";
      $rootScope.$digest();
      expect(called).toBe(2);
    }));
  });
});
