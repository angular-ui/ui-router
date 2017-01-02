import * as angular from "angular";
import { ILocationService, ILocationProvider } from "angular";
import "./util/matchers";
import { html5Compat } from "./util/testUtilsNg1";
import { UrlRule, UrlMatcher, UrlMatcherFactory, UrlRouter, StateService, UIRouter } from "../src/index";
import { UrlRouterProvider } from "../src/urlRouterProvider";

declare var inject;

var module = angular['mock'].module;

describe("UrlRouter", function () {
  var router: UIRouter;
  var $urp: UrlRouterProvider,
      $lp: ILocationProvider,
      $umf: UrlMatcherFactory,
      $s: StateService,
      $ur: UrlRouter,
      location: ILocationService,
      match, scope;

  describe("provider", function () {

    beforeEach(function() {
      angular.module('ui.router.router.test', []).config(function ($uiRouterProvider) {
        router = $uiRouterProvider;
        $umf = router.urlMatcherFactory;
        $urp = router.urlRouterProvider;
        $urp.deferIntercept();
      });

      module('ui.router.router', 'ui.router.router.test');

      inject(function($rootScope, $location) {
        scope = $rootScope.$new();
        location = $location;
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
        return null;
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
      angular.module('ui.router.router.test', []).config(function ($uiRouterProvider, $locationProvider) {
        router = $uiRouterProvider;
        $umf = router.urlMatcherFactory;
        $urp = router.urlRouterProvider;
        $lp  = $locationProvider;
        $locationProvider.hashPrefix('');

        $urp.rule(function ($injector, $location) {
          var path = $location.path();
          if (!/baz/.test(path)) return;
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
        $ur = $injector.invoke($urp['$get'], $urp);
        $s = $injector.get('$sniffer');
        $s['history'] = true;
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
        $timeout(() => $urlRouter.sync(), 2000);
      });
      scope.$emit("$locationChangeSuccess");
      $timeout.flush();
      expect(called).toBeTruthy();
      expect(location.path()).toBe("/b4z");
    }));
    

    it('rule should return a deregistration function', function() {
      var count = 0, rule: UrlRule = {
        match: () => count++,
        handler: match => match,
        matchPriority: () => 0,
        $id: 0,
        priority: 0,
        type: 'RAW',
      };
      let dereg = $ur.rule(rule as any);

      $ur.sync();
      expect(count).toBe(1);
      $ur.sync();
      expect(count).toBe(2);

      dereg();
      $ur.sync();
      expect(count).toBe(2);
    });

    it('removeRule should remove a previously registered rule', function() {
      var count = 0, rule = {
        match: () => count++,
        handler: match => match,
        matchPriority: () => 0,
        $id: 0,
        priority: 0,
        type: 'RAW',
      };
      $ur.rule(rule as any);

      $ur.sync();
      expect(count).toBe(1);
      $ur.sync();
      expect(count).toBe(2);

      $ur.removeRule(rule);
      $ur.sync();
      expect(count).toBe(2);
    });

    describe("location updates", function() {
      it('can push location changes', inject(function($urlRouter) {
        spyOn(router.locationService, "url");
        $urlRouter.push($umf.compile("/hello/:name"), { name: "world" });
        expect(router.locationService.url).toHaveBeenCalledWith("/hello/world", undefined);
      }));

      it('can push a replacement location', inject(function($urlRouter, $location) {
        spyOn(router.locationService, "url");
        $urlRouter.push($umf.compile("/hello/:name"), { name: "world" }, { replace: true });
        expect(router.locationService.url).toHaveBeenCalledWith("/hello/world", true);
      }));

      it('can push location changes with no parameters', inject(function($urlRouter, $location) {
        spyOn(router.locationService, "url");
        $urlRouter.push($umf.compile("/hello/:name", {params:{name: ""}}));
        expect(router.locationService.url).toHaveBeenCalledWith("/hello/", undefined);
      }));

      it('can push location changes that include a #fragment', inject(function($urlRouter, $location) {
        // html5mode disabled
        $lp.html5Mode(false);
        expect(html5Compat($lp.html5Mode())).toBe(false);
        $urlRouter.push($umf.compile('/hello/:name'), {name: 'world', '#': 'frag'});
        expect($location.url()).toBe('/hello/world#frag');
        expect($location.hash()).toBe('frag');

        // html5mode enabled
        $lp.html5Mode(true);
        expect(html5Compat($lp.html5Mode())).toBe(true);
        $urlRouter.push($umf.compile('/hello/:name'), {name: 'world', '#': 'frag'});
        expect($location.url()).toBe('/hello/world#frag');
        expect($location.hash()).toBe('frag');
      }));

      it('can read and sync a copy of location URL', inject(function($urlRouter, $location) {
        $location.url('/old');

        spyOn(router.locationService, 'path').and.callThrough();
        $urlRouter.update(true);
        expect(router.locationService.path).toHaveBeenCalled();

        $location.url('/new');
        $urlRouter.update();

        expect($location.url()).toBe('/old');
      }));
    });

    describe("URL generation", function() {
      it("should return null when UrlMatcher rejects parameters", inject(function($urlRouter) {
        $umf.type("custom", <any> { is: val => val === 1138 });
        var matcher = $umf.compile("/foo/{param:custom}");

        expect($urlRouter.href(matcher, { param: 1138 })).toBe('#/foo/1138');
        expect($urlRouter.href(matcher, { param: 5 })).toBeNull();
      }));

      it('should handle the new html5Mode object config from Angular 1.3', inject(function($urlRouter) {

        $lp.html5Mode({
          enabled: false
        });

        expect($urlRouter.href($umf.compile('/hello'))).toBe('#/hello');
      }));

      it('should return URLs with #fragments', inject(function($urlRouter) {
        // html5mode disabled
        $lp.html5Mode(false);
        expect(html5Compat($lp.html5Mode())).toBe(false);
        expect($urlRouter.href($umf.compile('/hello/:name'), {name: 'world', '#': 'frag'})).toBe('#/hello/world#frag');

        // html5mode enabled
        $lp.html5Mode(true);
        expect(html5Compat($lp.html5Mode())).toBe(true);
        expect($urlRouter.href($umf.compile('/hello/:name'), {name: 'world', '#': 'frag'})).toBe('/hello/world#frag');
      }));

      it('should return URLs with #fragments when html5Mode is true & browser does not support pushState', inject(function($urlRouter) {
        $lp.html5Mode(true);
        $s['history'] = false;
        expect(html5Compat($lp.html5Mode())).toBe(true);
        expect($urlRouter.href($umf.compile('/hello/:name'), {name: 'world', '#': 'frag'})).toBe('#/hello/world#frag');
      }));
    });
  });

});