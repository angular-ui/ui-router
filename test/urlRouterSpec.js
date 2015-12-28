var module = angular.mock.module;
var uiRouter = require("ui-router");
var UrlMatcher = uiRouter.url.UrlMatcher;
var services = uiRouter.common.services;

describe("UrlRouter", function () {

  var $urp, $lp, $s, $ur, location, match, scope;

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
      expect(function() { $urp.rule(null); }).toThrowError("'rule' must be a function");
      expect(function() { $urp.otherwise(null); }).toThrowError("'rule' must be a string or function");
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
        $s = $injector.get('$sniffer');
        $s.history = true;
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
          isRoot:     function() {},
          format:     function() {},
          append:     function() {},
          validates:  function() {},
          parameter:  function() {},
          parameters: function() {}
        },
        handler: function() {}
      };

      spyOn(custom.url, "exec").and.returnValue({});
      spyOn(custom.url, "format").and.returnValue("/foo-bar");
      spyOn(custom, "handler").and.returnValue(true);

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
      it('can push location changes', inject(function($urlRouter) {
        spyOn(services.location, "url");
        spyOn(services.location, "replace");
        $urlRouter.push(new UrlMatcher("/hello/:name"), { name: "world" });

        expect(services.location.url).toHaveBeenCalledWith("/hello/world");
        expect(services.location.replace).not.toHaveBeenCalled();
      }));

      it('can push a replacement location', inject(function($urlRouter, $location) {
        spyOn(services.location, "url");
        spyOn(services.location, "replace");
        $urlRouter.push(new UrlMatcher("/hello/:name"), { name: "world" }, { replace: true });

        expect(services.location.url).toHaveBeenCalledWith("/hello/world");
        expect(services.location.replace).toHaveBeenCalled();
      }));

      it('can push location changes with no parameters', inject(function($urlRouter, $location) {
        spyOn(services.location, "url");
        $urlRouter.push(new UrlMatcher("/hello/:name", {params:{name: ""}}));

        expect(services.location.url).toHaveBeenCalledWith("/hello/");
      }));

      it('can push location changes that include a #fragment', inject(function($urlRouter, $location) {
        // html5mode disabled
        $lp.html5Mode(false);
        expect(html5Compat($lp.html5Mode())).toBe(false);
        $urlRouter.push(new UrlMatcher('/hello/:name'), {name: 'world', '#': 'frag'});
        expect($location.url()).toBe('/hello/world#frag');
        expect($location.hash()).toBe('frag');

        // html5mode enabled
        $lp.html5Mode(true);
        expect(html5Compat($lp.html5Mode())).toBe(true);
        $urlRouter.push(new UrlMatcher('/hello/:name'), {name: 'world', '#': 'frag'});
        expect($location.url()).toBe('/hello/world#frag');
        expect($location.hash()).toBe('frag');
      }));

      it('can read and sync a copy of location URL', inject(function($urlRouter, $location) {
        $location.url('/old');

        spyOn(services.location, 'url').and.callThrough();
        $urlRouter.update(true);
        expect(services.location.url).toHaveBeenCalled();

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

      it('should return URLs with #fragments', inject(function($urlRouter) {
        // html5mode disabled
        $lp.html5Mode(false);
        expect(html5Compat($lp.html5Mode())).toBe(false);
        expect($urlRouter.href(new UrlMatcher('/hello/:name'), {name: 'world', '#': 'frag'})).toBe('#/hello/world#frag');

        // html5mode enabled
        $lp.html5Mode(true);
        expect(html5Compat($lp.html5Mode())).toBe(true);
        expect($urlRouter.href(new UrlMatcher('/hello/:name'), {name: 'world', '#': 'frag'})).toBe('/hello/world#frag');
      }));

      it('should return URLs with #fragments when html5Mode is true & browser does not support pushState', inject(function($urlRouter) {
        $lp.html5Mode(true);
        $s.history = false;
        expect(html5Compat($lp.html5Mode())).toBe(true);
        expect($urlRouter.href(new UrlMatcher('/hello/:name'), {name: 'world', '#': 'frag'})).toBe('#/hello/world#frag');
      }));
    });
  });

});