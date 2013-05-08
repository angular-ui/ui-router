describe('clearAll feature', function () {

  (function() {
    //a simple runtime configurer that uses clearAll to redefine ui-router
    //behavior at *runtime* (as opposed to config time).
    //
    //A note about this provider/service
    //if the ui-router services exposed the configruation
    //functions that live in their providers
    //then this provider/service wrapper would not be necessary.
    //However, by latching onto the providers with
    //this service, runtime (re)configuration is possible.
    //In other words -- the ui-router services *could*
    //do this themselves; the features of this "test" provider/service
    //may show up as a pull for ui-router seperately :)
    //for now, clearAll allows what it does to be possible
    angular.module('uiRouterRuntimeConfigurer', ['ui.state']);
    UiRouterRuntimeConfigProvider.$inject = ['$stateProvider', '$urlRouterProvider'];
    function UiRouterRuntimeConfigProvider($stateProvider, $urlRouterProvider) {

      function clearAll() {
        //the stateProvider clears states and urlRoutes
        //hence this shortcut works
        $stateProvider.clearAll();
      }
      this.clearAll = function() { clearAll(); return this; };

      function state(name, definition) {
        $stateProvider.state(name, definition);
      }
      this.state = function(name, definition) { state(name, definition); return this; };


      function when(what, handler) {
        $urlRouterProvider.when(what, handler);
      }
      this.when = function(what, handler) { when(what, handler); return this; };

      function otherwise(rule) {
        $urlRouterProvider.otherwise(rule);
      }
      this.otherwise = function(rule) { otherwise(rule); return this; };

      this.$get = $get;
      function $get() {
        var uiRouterRuntimeConfig = {};

        uiRouterRuntimeConfig.clearAll = function() { clearAll(); return this; };
        uiRouterRuntimeConfig.state = function(name, definition) { state(name, definition); return this; };
        uiRouterRuntimeConfig.when = function(what, handler) { when(what, handler); return this; };
        uiRouterRuntimeConfig.otherwise = function(rule) { otherwise(rule); return this; };

        //this service can call the ui-router providers from its provider
        return uiRouterRuntimeConfig;
      }
    }
    angular.module('uiRouterRuntimeConfigurer').provider('uiRouterRuntimeConfig', UiRouterRuntimeConfigProvider);

  }()); //self-invoking function

  var log, logEvents, logEnterExit;
  function eventLogger(event, to, toParams, from, fromParams) {
    if (logEvents) log += event.name + '(' + to.name + ',' + from.name + ');';
  }
  function callbackLogger(what) {
    return function () {
      if (logEnterExit) log += this.name + '.' + what + ';';
    };
  }

  var HOME = {url: '/'},
      ABOUT = {url: '/about'},
      ADMIN = {url: '/admin'},
      LOGIN = {url: '/login'},
      THEYWIN = {url: '/theyWin'},
      FOUROHFOUR = {url: '/fourOhFour'};


  function configureBase(uiRouterRuntimeConfigProviderOrService)
  {
    return uiRouterRuntimeConfigProviderOrService
      .clearAll()
      .state('ABOUT', ABOUT)
      .state('HOME', HOME)
      .state('FOUROHFOUR', FOUROHFOUR)
      .state('THEYWIN', THEYWIN)
      .when('/northDakota', '/about' )
      .when('/someoneGuessesThisUrl', '/theyWin' )
      .otherwise('/fourOhFour');
  }

  function configureAnon(uiRouterRuntimeConfigProviderOrService)
  {
    return configureBase(uiRouterRuntimeConfigProviderOrService)
      .state('LOGIN', LOGIN);
  }

  function configureAdmin(uiRouterRuntimeConfigProviderOrService)
  {
    return configureBase(uiRouterRuntimeConfigProviderOrService)
      .state('ADMIN', ADMIN);
  }

  angular.module('test', ['uiRouterRuntimeConfigurer']).config(
    ['uiRouterRuntimeConfigProvider',
      function(uiRouterRuntimeConfigProvider) {
        configureAnon(uiRouterRuntimeConfigProvider);
    }]
  );

  beforeEach(module('test'));

  function $get(what) {
    return jasmine.getEnv().currentSpec.$injector.get(what);
  }

  function testSet() {
    it('should work as always', inject(function ($state, $q) {
      var trans = $state.transitionTo(HOME, {});
      $q.flush();
      expect(resolvedValue(trans)).toBe(HOME);
    }));

    it('should allow transitions by name', inject(function ($state, $q) {
      $state.transitionTo('ABOUT', {});
      $q.flush();
      expect($state.current).toBe(ABOUT);
    }));

    it('should always have $current defined', inject(function ($state) {
      expect($state.$current).toBeDefined();
    }));

    it('should have the correct location', inject(function ($state, $q, $location) {
      $state.transitionTo('FOUROHFOUR', {});
      $q.flush();
      expect($location.path()).toBe(FOUROHFOUR.url);
    }));

    it('should support otherwise', inject(function ($state, $rootScope, $q, $location) {
      $location.path("/nonExistent");
      $rootScope.$apply();
      expect($state.current).toBe(FOUROHFOUR);
    }));

    it('should support urlRouter/when', inject(function ($state, $rootScope, $q, $location) {
      $location.path("/northDakota");
      $rootScope.$apply();
      expect($state.current).toBe(ABOUT);
    }));

    it('should support urlRouter/when', inject(function ($state, $rootScope, $q, $location) {
      $location.path("/someoneGuessesThisUrl");
      $rootScope.$apply();
      expect($state.current).toBe(THEYWIN);
    }));

  }

  describe('initially configured states', function() {
    testSet();

    it('the anonymous user should not have the admin route', inject(function ($state, $rootScope, $q, $location) {
      $location.path("/admin");
      $rootScope.$apply();
      expect($state.current).toBe(FOUROHFOUR);
    }));

    it('the anonymous user should the login route', inject(function ($state, $rootScope, $q, $location) {
      $location.path("/login");
      $rootScope.$apply();
      expect($state.current).toBe(LOGIN);
    }));

  });

  describe('when the user logs in as admin', function() {
    it('the admin user will not have the login route but will have the admin route', inject(function (uiRouterRuntimeConfig, $state, $rootScope, $q, $location) {
      configureAdmin(uiRouterRuntimeConfig);
      //this is kind of  dumb example because the admin should be able to change credentials but for demo purposes
      //this will have to do
      $location.path("/login");
      $rootScope.$apply();
      expect($state.current).toBe(FOUROHFOUR);
      $location.path("/admin");
      $rootScope.$apply();
      expect($state.current).toBe(ADMIN);
    }));
  });

  describe('when the admin user creates a blog page in her angular-based CMS system', function() {
    it('she will be able to preview it because the route will be added on the fly', inject(function (uiRouterRuntimeConfig, $state, $rootScope, $q, $location) {
      configureAdmin(uiRouterRuntimeConfig);
      var BLOG = {url: '/blog'};
      uiRouterRuntimeConfig.state('BLOG', BLOG);

      //this is kind of  dumb example because the admin should be able to change credentials but for demo purposes
      //this will have to do
      $state.transitionTo('BLOG');
      $q.flush();
      expect($state.current).toBe(BLOG);
    }));
  });


});
