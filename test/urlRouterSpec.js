describe("UrlRouter", function () {

  var $urp, $lp, $ur, location, match, scope;

  describe("provider", function () {

    beforeEach(function() {
      angular.module('ui.router.router.test', function() {}).config(function ($urlRouterProvider) {
        $urlRouterProvider.deferIntercept();
        $urp = $urlRouterProvider;
      });

      module('ui.router.router', 'ui.router.router.test');

      inject(function($rootScope, $location, $injector) {
        scope = $rootScope.$new();
        location = $location;
        $ur = $injector.invoke($urp.$get);
      });
    });

    it("should throw on non-function rules", function () {
      expect(function() { $urp.rule(null); }).toThrow("'rule' must be a function")
      expect(function() { $urp.otherwise(null); }).toThrow("'rule' must be a function")
    });

    it("should allow location changes to be deferred", inject(function ($urlRouter, $location, $rootScope) {
      var log = [];

      $urp.rule(function ($injector, $location) {
        log.push($location.path());
      });

      $location.path("/foo");
      $rootScope.$broadcast("$locationChangeSuccess");

      expect(log).toEqual([]);

      $urlRouter.listen();
      $rootScope.$broadcast("$locationChangeSuccess");

      expect(log).toEqual(["/foo"]);
    }));
  });

  describe("service", function() {

    beforeEach(function() {
      angular.module('ui.router.router.test', function() {}).config(function ($urlRouterProvider, $locationProvider) {
        $urp = $urlRouterProvider;
        $lp  = $locationProvider;

        $urp.rule(function ($injector, $location) {
          var path = $location.path();
          if (!/baz/.test(path)) return false;
          return path.replace('baz', 'b4z');
        }).when('/foo/:param', function($match) {
          match = ['/foo/:param', $match];
        }).when('/bar', function($match) {
          match = ['/bar', $match];
        });
      });

      module('ui.router.router', 'ui.router.router.test');

      inject(function($rootScope, $location, $injector) {
        scope = $rootScope.$new();
        location = $location;
        $ur = $injector.invoke($urp.$get);
      });
    });

    it("should execute rewrite rules", function () {
      location.path("/foo");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/foo");

      location.path("/baz");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/b4z");
    });

    it("should keep otherwise last", function () {
      $urp.otherwise('/otherwise');

      location.path("/lastrule");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/otherwise");

      $urp.when('/lastrule', function($match) {
        match = ['/lastrule', $match];
      });

      location.path("/lastrule");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/lastrule");
    });

    it("should allow custom URL matchers", function () {
      var custom = {
        url: {
          exec:       function() {},
          format:     function() {},
          concat:     function() {},
          validates:  function() {},
          parameters: function() {}
        },
        handler: function() {}
      };

      spyOn(custom.url, "exec").andReturn({});
      spyOn(custom.url, "format").andReturn("/foo-bar");
      spyOn(custom, "handler").andReturn(true);

      $urp.when(custom.url, custom.handler);
      scope.$broadcast("$locationChangeSuccess");
      scope.$apply();

      expect(custom.url.exec).toHaveBeenCalled();
      expect(custom.url.format).not.toHaveBeenCalled();
      expect(custom.handler).toHaveBeenCalled();
    });

    it('can be cancelled by preventDefault() in $locationChangeSuccess', inject(function () {
      var called;
      location.path("/baz");
      scope.$on('$locationChangeSuccess', function (ev) {
        ev.preventDefault();
        called = true;
      });
      scope.$emit("$locationChangeSuccess");
      expect(called).toBeTruthy();
      expect(location.path()).toBe("/baz");
    }));

    it('can be deferred and updated in $locationChangeSuccess', inject(function ($urlRouter, $timeout) {
      var called;
      location.path("/baz");
      scope.$on('$locationChangeSuccess', function (ev) {
        ev.preventDefault();
        called = true;
        $timeout($urlRouter.sync, 2000);
      });
      scope.$emit("$locationChangeSuccess");
      $timeout.flush();
      expect(called).toBeTruthy();
      expect(location.path()).toBe("/b4z");
    }));

    describe("location updates", function() {
      it('can push location changes', inject(function($urlRouter, $location) {
        spyOn($location, "url");
        spyOn($location, "replace");
        $urlRouter.push(new UrlMatcher("/hello/:name"), { name: "world" });

        expect($location.url).toHaveBeenCalledWith("/hello/world");
        expect($location.replace).not.toHaveBeenCalled();
      }));

      it('can push a replacement location', inject(function($urlRouter, $location) {
        spyOn($location, "url");
        spyOn($location, "replace");
        $urlRouter.push(new UrlMatcher("/hello/:name"), { name: "world" }, { replace: true });

        expect($location.url).toHaveBeenCalledWith("/hello/world");
        expect($location.replace).toHaveBeenCalled();
      }));

      it('can push location changes with no parameters', inject(function($urlRouter, $location) {
        spyOn($location, "url");
        $urlRouter.push(new UrlMatcher("/hello/:name"));

        expect($location.url).toHaveBeenCalledWith("/hello/");
      }));

      it('can read and sync a copy of location URL', inject(function($urlRouter, $location) {
        $location.url('/old');

        spyOn($location, 'url').andCallThrough();
        $urlRouter.update(true);
        expect($location.url).toHaveBeenCalled();

        $location.url('/new');
        $urlRouter.update();

        expect($location.url()).toBe('/old');
      }));
    });

    describe("URL generation", function() {
      it("should return null when UrlMatcher rejects parameters", inject(function($urlRouter, $urlMatcherFactory) {
        $urlMatcherFactory.type("custom", {
          is: function(val) {
            return val === 1138;
          }
        });
        var matcher = new UrlMatcher("/foo/{param:custom}");

        expect($urlRouter.href(matcher, { param: 1138 })).toBe('#/foo/1138');
        expect($urlRouter.href(matcher, { param: 5 })).toBeNull();
      }));

      it('should handle the new html5Mode object config from Angular 1.3', inject(function($urlRouter) {
        
        $lp.html5Mode({
          enabled: false
        });

        expect($urlRouter.href(new UrlMatcher('/hello'))).toBe('#/hello');
      }));
    });
  });

});