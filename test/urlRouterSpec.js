describe("UrlRouter", function () {

  var $urp, $ur, location, match, scope;

  beforeEach(function() {
    angular.module('ui.router.test', function() {}).config(function ($urlRouterProvider) {
      $urp = $urlRouterProvider;

      $urp.rule(function ($injector, $location) {
        return $location.path().replace('baz', 'b4z');
      }).when('/foo/:param', function($match) {
        match = ['/foo/:param', $match];
      }).when('/bar', function($match) {
        match = ['/bar', $match];
      }).when('/:param', function($match) {
        match = ['/:param', $match];
      });
    });

    module('ui.router', 'ui.router.test');

    inject(function($rootScope, $location, $injector) {
      scope = $rootScope.$new();
      location = $location;
      $ur = $injector.invoke($urp.$get);
    });
  });

  describe("provider", function () {

    it("should throw on non-function rules", function () {
      expect(function() { $urp.rule(null); }).toThrow("'rule' must be a function")
      expect(function() { $urp.otherwise(null); }).toThrow("'rule' must be a function")
    });

  });

  describe("service", function() {
    it("should execute rewrite rules", function () {
      location.path("/foo");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/foo");

      location.path("/baz");
      scope.$emit("$locationChangeSuccess");
      expect(location.path()).toBe("/b4z");
    });
  });

});