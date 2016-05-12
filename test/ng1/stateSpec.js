var module = angular.mock.module;
var uiRouter = require("angular-ui-router");
var extend = uiRouter.extend;
var forEach = uiRouter.forEach;
var services = uiRouter.services;
var UrlMatcher = uiRouter.UrlMatcher;


describe('state', function () {

  var $injector, $stateProvider, locationProvider, templateParams, template, ctrlName;

  beforeEach(module('ui.router', function($locationProvider) {
    locationProvider = $locationProvider;
    $locationProvider.html5Mode(false);
  }));

  var log, logEvents, logEnterExit;
  function callbackLogger(state, what) {
    return function () {
      if (logEnterExit) log += state.name + '.' + what + ';';
    };
  }

  var A = { data: {}, controller: function() { log += "controller;"; }, template: "a" },
    B = { template: "b"},
    C = { template: "c"},
    D = { params: { x: null, y: null }, template: "d" },
    DD = { parent: D, params: { x: null, y: null, z: null }, template: "dd" },
    DDDD = { parent: D, controller: function() {}, template: "hey"},
    E = { params: { i: {} }, template: "e" },
    F = { params: { a: '', b: false, c: 0, d: undefined, e: -1 }, template: "f" },
    H = { data: {propA: 'propA', propB: 'propB'}, template: "h" },
    HH = { parent: H, template: "hh" },
    HHH = {parent: HH, data: {propA: 'overriddenA', propC: 'propC'}, template: "hhh" },
    RS = { url: '^/search?term', reloadOnSearch: false, template: "rs" },
    OPT = { url: '/opt/:param', params: { param: "100" }, template: "opt" },
    OPT2 = { url: '/opt2/:param2/:param3', params: { param3: "300", param4: "400" }, template: "opt2" },
    ISS2101 = { params: { bar: { squash: false, value: 'qux'}}, url: '/2101/{bar:string}'},
    URLLESS = { url: '/urllessparams', params: { myparam: { type: 'int' } } },
    AppInjectable = {};

  beforeEach(module(function (_$stateProvider_, $provide) {
    forEach([ A, B, C, D, DD, E, H, HH, HHH ], function (state) {
      state.onEnter = callbackLogger(state, 'onEnter');
      state.onExit = callbackLogger(state, 'onExit');
    });
    $stateProvider = _$stateProvider_;

    $stateProvider
      .state('A', A)
      .state('B', B)
      .state('C', C)
      .state('D', D)
      .state('DD', DD)
      .state('DDDD', DDDD)
      .state('E', E)
      .state('F', F)
      .state('H', H)
      .state('HH', HH)
      .state('HHH', HHH)
      .state('RS', RS)
      .state('OPT', OPT)
      .state('OPT.OPT2', OPT2)
      .state('ISS2101', ISS2101)
      .state('URLLESS', URLLESS)
      .state('home', { url: "/" })
      .state('home.item', { url: "front/:id" })
      .state('about', {
        url: "/about",
        resolve: {
          stateInfo: function($transition$) {
            return [$transition$.from().name, $transition$.to().name];
          }
        },
        onEnter: function(stateInfo) {
          log = stateInfo.join(' => ');
        }
      })
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
        },
        onEnter: function(badness) {}
      })
      .state('resolveTimeout', {
        url: "/resolve-timeout/:foo",
        resolve: {
          value: function ($timeout) {
            return $timeout(function() { log += "Success!"; }, 1);
          }
        },
        onEnter: function(value) {},
        template: "-",
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
          '$default':{
                template: "<div> <div ui-view/></div>",
                controller: function() {log += "logB;"}
          }
        }
      })
      .state('logA.logB.logC', {
        url: "/logC",
        views:{
          '$default':{
                template: "<div> <div ui-view/></div>",
                controller: function() {log += "logC;"}
          }
        }
      });
    $stateProvider.state('root.sub2', {url: '/2?param2' });

    $provide.value('AppInjectable', AppInjectable);
  }));

  beforeEach(inject(function (_$injector_) {
    $injector = _$injector_;
    log = '';
    logEvents = logEnterExit = false;
  }));


  function $get(what) {
    return $injector.get(what);
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
        $stateProvider.state('toString', { url: "/to-string" });
      }).not.toThrow();
      expect(function() {
        $stateProvider.state('watch', { url: "/watch" });
      }).not.toThrow();
    });
  });

  describe('.transitionTo()', function () {

    var $rootScope, $state, $stateParams, $transitions, $q, $location;

    beforeEach(inject(function (_$rootScope_, _$state_, _$stateParams_, _$transitions_, _$q_, _$location_) {
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $transitions = _$transitions_;
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

    describe("dynamic transitions", function () {
      var dynlog, paramsChangedLog;
      var dynamicstate, childWithParam, childNoParam;

      beforeEach(inject(function ($compile, $rootScope) {
        dynlog = paramsChangedLog = "";
        dynamicstate = {
          name: 'dyn',
          url: '^/dynstate/:path/:pathDyn?search&searchDyn',
          params: {
            pathDyn: { dynamic: true },
            searchDyn: { dynamic: true }
          },
          template: "dyn state. <div ui-view></div>",
          controller: function() {
            this.uiOnParamsChanged = function(updatedParams) {
              var paramNames = Object.keys(updatedParams).sort();
              var keyValues = paramNames.map(function (key) { return key + "=" + updatedParams[key]; });
              dynlog += '[' + keyValues.join(",") + "];";
              paramsChangedLog += paramNames.join(",") + ";";
            };
          }
        };

        childWithParam = {
          name: 'dyn.child',
          url: "/child",
          params: {
            config: 'c1', // allow empty
            configDyn: { value: null, dynamic: true }
          },
          template: 'dyn.child state',
          controller: function() {
            this.uiOnParamsChanged = function(updatedParams) {
              var paramNames = Object.keys(updatedParams).sort();
              var keyValues = paramNames.map(function (key) { return key + "=" + updatedParams[key]; });
              dynlog += '{' + keyValues.join(",") + "};";
              paramsChangedLog += paramNames.join(",") + ";";
            };
          }
        };

        childNoParam = {
          name: 'dyn.noparams',
          url: "/noparams",
          template: 'dyn.noparams state',
          controller: function() {
            this.uiOnParamsChanged = function(updatedParams) {
              var paramNames = Object.keys(updatedParams).sort();
              var keyValues = paramNames.map(function (key) { return key + "=" + updatedParams[key]; });
              dynlog += '<' + keyValues.join(",") + ">;";
              paramsChangedLog += paramNames.join(",") + ";";
            };
          }
        };

        $stateProvider.state(dynamicstate);
        $stateProvider.state(childWithParam);
        $stateProvider.state(childNoParam);

        $transitions.onEnter({}, function ($state$) { dynlog += "enter:"+$state$.name+";" });
        $transitions.onExit({}, function ($state$) { dynlog += "exit:"+$state$.name+";" });
        $transitions.onSuccess({}, function () { dynlog += "success;"; });

        $compile('<div><ui-view></ui-view></div>')($rootScope.$new());
        initStateTo(dynamicstate, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
        expect(dynlog).toBe("enter:dyn;success;");
        dynlog = "";
        expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
        expect($location.url()).toEqual("/dynstate/p1/pd1?search=s1&searchDyn=sd1");
      }));

      describe('[ transition.dynamic() ]:', function() {
        it('is considered fully dynamic when only dynamic params have changed', function () {
          var promise = $state.go(".", {pathDyn: "pd2", searchDyn: 'sd2'});
          expect(promise.transition.dynamic()).toBeTruthy();
        });

        it('is not considered fully dynamic if any state is entered', function () {
          var promise = $state.go(childWithParam);
          expect(promise.transition.dynamic()).toBeFalsy();
        });

        it('is not considered fully dynamic if any state is exited', function () {
          initStateTo(childWithParam, { config: 'p1', path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
          var promise = $state.go(dynamicstate); $q.flush();
          expect(promise.transition.dynamic()).toBeFalsy();
        });

        it('is not considered fully dynamic if any state is reloaded', function () {
          var promise = $state.go(dynamicstate, null, { reload: true });
          expect(promise.transition.dynamic()).toBeFalsy();
        });

        it('is not considered fully dynamic if any non-dynamic parameter changes', function () {
          var promise = $state.go(dynamicstate, { path: 'p2' });
          expect(promise.transition.dynamic()).toBeFalsy();
        });
      });

      describe('[ promises ]', function() {
        it('runs successful transition when fully dynamic', function () {
          var promise = $state.go(dynamicstate, {searchDyn: 'sd2'}), transition = promise.transition;
          transition.promise.then(function(result) { transSuccess = true; });
          $q.flush();
          expect(transition.dynamic()).toBeTruthy();
          expect(transSuccess).toBeTruthy();
          expect(dynlog).toBe('success;[searchDyn=sd2];')
        });

        it('resolves the $state.go() promise with the original/final state, when fully dynamic', function () {
          initStateTo(dynamicstate, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
          var destState, promise = $state.go(dynamicstate, { pathDyn: 'pd2', searchDyn: 'sd2' });
          promise.then(function(result) { destState = result; });
          $q.flush();
          expect(promise.transition.dynamic()).toBeTruthy();
          expect($state.current).toBe(dynamicstate);
          expect(destState).toBe(dynamicstate);
        });
      });

      describe('[ enter/exit ]', function() {
        it('does not exit nor enter any states when fully dynamic', function () {
          var promise = $state.go(dynamicstate, { searchDyn: 'sd2' }); $q.flush();
          expect(promise.transition.dynamic()).toBeTruthy();
          expect(promise.transition.treeChanges().entering.length).toBe(0);
          expect(promise.transition.treeChanges().exiting.length).toBe(0);
          expect(promise.transition.treeChanges().retained.length).toBe(2);
          expect(dynlog).toBe("success;[searchDyn=sd2];");
          expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd2' });
        });

        it('does not exit nor enter the state when only dynamic search params change', function () {
          var promise = $state.go(dynamicstate, {searchDyn: 'sd2'}); $q.flush();
          expect(promise.transition.dynamic()).toBeTruthy();
          expect(dynlog).toBe("success;[searchDyn=sd2];");
          expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd2' });
        });

        it('does not exit nor enter the state when only dynamic path params change', function () {
          var promise = $state.go(dynamicstate, {pathDyn: 'pd2'}); $q.flush();
          expect(promise.transition.dynamic()).toBeTruthy();
          expect(dynlog).toBe("success;[pathDyn=pd2];");
          expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd2', search: 's1', searchDyn: 'sd1' });
        });

        it('exits and enters a state when a non-dynamic search param changes', function () {
          var promise = $state.go(dynamicstate, {search: 's2'}); $q.flush();
          expect(promise.transition.dynamic()).toBeFalsy();
          expect(dynlog).toBe("exit:dyn;enter:dyn;success;");
          expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's2', searchDyn: 'sd1' });
        });

        it('exits and enters a state when a non-dynamic path param changes', function () {
          var promise = $state.go(dynamicstate, {path: 'p2'}); $q.flush();
          expect(promise.transition.dynamic()).toBeFalsy();
          expect(dynlog).toBe("exit:dyn;enter:dyn;success;");
          expect(obj($stateParams)).toEqual({ path: 'p2', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
        });

        it('does not exit nor enter a state when only dynamic params change (triggered via url)', function () {
          $location.search({ search: 's1', searchDyn: 'sd2' });
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect(dynlog).toBe('success;[searchDyn=sd2];')
        });

        it('exits and enters a state when any non-dynamic params change (triggered via url)', function () {
          $location.search({ search: 's2', searchDyn: 'sd2' });
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect(dynlog).toBe('exit:dyn;enter:dyn;success;')
        });

        it('does not exit nor enter a state when only dynamic params change (triggered via $state transition)', function () {
          $state.go('.', {searchDyn: 'sd2'}, { inherit: true }); $q.flush();
          expect(dynlog).toBe('success;[searchDyn=sd2];')
        });
      });

      describe('[ global $stateParams service ]', function() {
        it('updates the global $stateParams object', function () {
          $state.go(dynamicstate, {searchDyn: 'sd2'});
          $q.flush();
          expect(obj($stateParams)).toEqual({ path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd2' });
        });

        it('updates $stateParams and $location.search when only dynamic params change (triggered via url)', function () {
          $location.search({search: 's1', searchDyn: 'sd2'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect($stateParams.search).toBe('s1');
          expect($stateParams.searchDyn).toBe('sd2');
          expect($location.search()).toEqual({search: 's1', searchDyn: 'sd2'});
        });

        it('updates $stateParams and $location.search when only dynamic params change (triggered via $state transition)', function () {
          $state.go('.', {searchDyn: 'sd2'});
          $q.flush();
          expect($stateParams.search).toBe('s1');
          expect($stateParams.searchDyn).toBe('sd2');
          expect($location.search()).toEqual({search: 's1', searchDyn: 'sd2'});
        });

        it('dynamic param changes can be observed by watching the global $stateParams', function () {
          var observedParamValue;
          function stateParamsTerm() { return $stateParams.searchDyn; }
          $rootScope.$watch(stateParamsTerm, function (newval, oldval) {
            if (newval === oldval) return;
            observedParamValue = newval;
          });
          $q.flush();

          $location.search({search: 's1', searchDyn: 'sd2'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect(observedParamValue).toBe("sd2");
        });
      });

      describe('[ uiOnParamsChanged ]', function() {
        it('should be called when dynamic parameter values change', function() {
          $state.go('.', { searchDyn: 'sd2' }); $q.flush();
          expect(paramsChangedLog).toBe('searchDyn;');
        });

        it('should not be called if a non-dynamic parameter changes (causing the controller\'s state to exit/enter)', function() {
          $state.go('.', { search: 's2', searchDyn: 'sd2' }); $q.flush();
          expect(paramsChangedLog).toBe('');
        });

        it('should not be called, when entering a new state, if no parameter values change', function() {
          $state.go(childNoParam); $q.flush();
          expect(paramsChangedLog).toBe('');
        });

        it('should be called, when entering a new state, if any dynamic parameter value changed', function() {
          $state.go(childNoParam, { searchDyn: 'sd2' }); $q.flush();
          expect(paramsChangedLog).toBe('searchDyn;');
        });

        it('should be called, when entering a new state, if a new parameter value is added', function() {
          $state.go(childWithParam, { config: 'c2' }); $q.flush();
          expect(paramsChangedLog).toBe('config,configDyn;');
        });

        it('should be called, when reactivating the uiOnParamsChanged state, if a dynamic parameter changed', function() {
          initStateTo(childNoParam, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
          dynlog = paramsChangedLog = "";

          $state.go(dynamicstate, { pathDyn: 'pd2' }); $q.flush();
          expect(paramsChangedLog).toBe('pathDyn;');
        });

        it('should not be called, when reactivating the uiOnParamsChanged state "dyn", if any of dyns non-dynamic parameters changed', function() {
          initStateTo(childNoParam, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1' });
          dynlog = paramsChangedLog = "";

          $state.go(dynamicstate, { path: 'p2' }); $q.flush();
          expect(paramsChangedLog).toBe('');
        });

        it('should be called with an object containing only the changed params', function() {
          $state.go(dynamicstate, { pathDyn: 'pd2' }); $q.flush();
          expect(dynlog).toBe('success;[pathDyn=pd2];');

          $state.go(dynamicstate, { pathDyn: 'pd3', searchDyn: 'sd2' }); $q.flush();
          expect(dynlog).toBe('success;[pathDyn=pd2];success;[pathDyn=pd3,searchDyn=sd2];');
        });

        it('should be called on all active controllers that have a uiOnParamsChanged', function() {
          initStateTo(childWithParam, { path: 'p1', pathDyn: 'pd1', search: 's1', searchDyn: 'sd1', config: 'p1', configDyn: 'c1' });
          dynlog = paramsChangedLog = "";

          $state.go(childWithParam, { pathDyn: 'pd2' }); $q.flush();
          expect(dynlog).toBe('success;[pathDyn=pd2];{pathDyn=pd2};');

          dynlog = paramsChangedLog = "";
          $state.go(childWithParam, { pathDyn: 'pd2', searchDyn: 'sd2', configDyn: 'cd2' }); $q.flush();
          expect(dynlog).toBe('success;[configDyn=cd2,searchDyn=sd2];{configDyn=cd2,searchDyn=sd2};');
        });
      });

    });

    describe("(with dynamic params because reloadOnSearch=false)", function () {
      describe("and only query params changed", function () {

        var entered = false;
        beforeEach(function() {
          initStateTo(RS);
          $transitions.onEnter({entering: 'RS'}, function () { entered = true });
        });

        it('doesn\'t re-enter state (triggered by url change)', function () {
          $location.search({term: 'hello'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect($location.search()).toEqual({term: 'hello'});
          expect(entered).toBeFalsy();
        });

        it('doesn\'t re-enter state (triggered by $state transition)', function () {
          initStateTo(RS);
          var promise = $state.go(".", {term: "hello"});
          var success = false, transition = promise.transition;
          transition.promise.then(function () { success = true; });
          $q.flush();
          expect($state.current).toBe(RS);
          expect(entered).toBeFalsy();
          expect(success).toBeTruthy();
          expect($location.search()).toEqual({term: 'hello'});
        });

        it('updates $stateParams', function () {
          initStateTo(RS);
          $location.search({term: 'hello'});
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();
          expect(obj($stateParams)).toEqual({term: 'hello'});
          expect(entered).toBeFalsy();
        });

        it('updates URL when (triggered by $state transition)', function () {
          initStateTo(RS);
          $state.go(".", {term: 'goodbye'});
          $q.flush();
          expect(obj($stateParams)).toEqual({term: 'goodbye'});
          expect($location.url()).toEqual("/search?term=goodbye");
          expect(entered).toBeFalsy();
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
      expect(actual.detail).toEqual(err)
    }));

    it('uses the templateProvider to get template dynamically', inject(function ($state, $q) {
      $state.transitionTo('dynamicTemplate', { type: "Acme" });
      $q.flush();
      expect(template).toEqual("AcmeFooTemplate");
    }));

    it('updates the location #fragment, if specified', inject(function ($state, $q, $location) {
      // html5mode disabled
      locationProvider.html5Mode(false);
      expect(html5Compat(locationProvider.html5Mode())).toBe(false);
      $state.transitionTo('home.item', {id: 'world', '#': 'frag'});
      $q.flush();
      expect($location.url()).toBe('/front/world#frag');
      expect($location.hash()).toBe('frag');

      // html5mode enabled
      locationProvider.html5Mode(true);
      expect(html5Compat(locationProvider.html5Mode())).toBe(true);
      $state.transitionTo('home.item', {id: 'world', '#': 'frag'});
      $q.flush();
      expect($location.url()).toBe('/front/world#frag');
      expect($location.hash()).toBe('frag');
    }));

    it('runs a transition when the location #fragment is updated', inject(function ($state, $q, $location, $transitions) {
      var transitionCount = 0;
      $transitions.onSuccess({}, function() { transitionCount++; });

      $state.transitionTo('home.item', {id: 'world', '#': 'frag'});
      $q.flush();
      expect($location.hash()).toBe('frag');
      expect(transitionCount).toBe(1);

      $state.transitionTo('home.item', {id: 'world', '#': 'blarg'});
      $q.flush();
      expect($location.hash()).toBe('blarg');
      expect(transitionCount).toBe(2);
    }));

    it('injects $transition$ into resolves', inject(function ($state, $q) {
      $state.transitionTo('home'); $q.flush();
      $state.transitionTo('about'); $q.flush();
      expect(log).toBe('home => about');
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
      $q.flush();
      $timeout.flush();
      expect(log).toBe('Success!controller;');

      $state.reload();
      $q.flush();
      $timeout.flush();
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

    it('should not reload states when passing false', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      log = '';
      $state.reload(false);
      $q.flush();
      expect(log).toBe('');
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
        ).toThrowError(Error, "No such reload state 'logInvalid'");
    }));

    it('should throw an exception for invalid reload state object', inject(function ($state, $q, $timeout, $rootScope, $compile) {
      $compile('<div> <div ui-view/></div>')($rootScope);
      $state.transitionTo('logA.logB.logC');
      $q.flush();
      expect(log).toBe('logA;logB;logC;');

      var invalidObject = {foo:'bar'};
      expect(function(){
          $state.reload(invalidObject)}
        ).toThrowError(Error, "Invalid reload state object");

      expect(function(){
          $state.reload({name:'invalidState'})}
        ).toThrowError(Error, "No such reload state 'invalidState'");
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

    it('generates urls with unsquashable default params', inject(function($state) {
      expect($state.href("ISS2101")).toEqual("#/2101/qux");
    }));

    describe('when $browser.baseHref() exists', function() {
      beforeEach(inject(function($browser) {
        spyOn(services.locationConfig, 'baseHref').and.callFake(function() {
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
      var names = ['', 'A', 'B', 'C', 'D', 'DD', 'DDDD', 'E', 'F', 'H', 'HH', 'HHH', 'ISS2101', 'OPT', 'OPT.OPT2', 'RS', 'URLLESS',
        'about', 'about.person', 'about.person.item', 'about.sidebar', 'about.sidebar.item',
        'badParam', 'badParam2', 'dynamicTemplate', 'first', 'home', 'home.item', 'home.redirect',
        'json', 'logA', 'logA.logB', 'logA.logB.logC', 'resolveFail', 'resolveTimeout',
        'root', 'root.sub1', 'root.sub2', 'second'];

      expect(list.map(function(state) { return state.name; }).sort()).toEqual(names.sort());
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


    // Tests for issue #2339
    describe("slashes in parameter values", function() {

      var $rootScope, $state, $compile;
      beforeEach(function () {

        $stateProvider.state('myState', {
          template: 'myState',
          url: '/my-state?:previous',
          controller: function () {
            log += 'myController;';
          }
        });

        inject(function (_$rootScope_, _$state_, _$compile_) {
          $rootScope = _$rootScope_;
          $state = _$state_;
          $compile = _$compile_;
        });
        spyOn($state, 'go').and.callThrough();
        spyOn($state, 'transitionTo').and.callThrough();
        $compile('<div><div ui-view/></div>')($rootScope);
        log = '';
      });

      describe('with no "/" in the params', function () {
        beforeEach(function () {
          $state.go('myState',{previous: 'last'});
          $rootScope.$digest();
        });
        it('should call $state.go once', function() {
          expect($state.go.calls.count()).toBe(1);
        });
        it('should call $state.transitionTo once', function() {
          expect($state.transitionTo.calls.count()).toBe(1);
        });
        it('should call myController once', function() {
          expect(log).toBe('myController;');
        });
      });

      describe('with a "/" in the params', function () {
        beforeEach(function () {
          $state.go('myState',{previous: '/last'});
          $rootScope.$digest();
        });
        it('should call $state.go once', function() {
          expect($state.go.calls.count()).toBe(1);
        });
        it('should call $state.transitionTo once', function() {
          expect($state.transitionTo.calls.count()).toBe(1);
        });
        it('should call myController once', function() {
          expect(log).toBe('myController;');
        });
      });

      describe('with an encoded "/" in the params', function () {
        beforeEach(function () {
          $state.go('myState',{previous: encodeURIComponent('/last')});
          $rootScope.$digest();
        });
        it('should call $state.go once', function() {
          expect($state.go.calls.count()).toBe(1);
        });
        it('should call $state.transitionTo once', function() {
          expect($state.transitionTo.calls.count()).toBe(1);
        });
        it('should call myController once', function() {
          expect(log).toBe('myController;');
        });
      });
    });



    describe("typed parameter handling", function() {
      beforeEach(function () {
        $stateProvider.state({
          name: "types",
          url: "/types/{p1:string}/{p2:date}",
          params: {
            p1: { value: [ "defaultValue" ], array: true },
            p2: new Date(2014, 10, 15),
            nonurl: null
          }
        });
        $stateProvider.state({
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
          expect(obj($state.params)).toEqualData(extend({}, defaults, params, nonurlparams));
          expect($location.url()).toBe(url);

          initStateTo(A);

          $location.url(url);
          $rootScope.$broadcast("$locationChangeSuccess");
          $q.flush();

          expect($state.current.name).toBe(state.name || state); // allow object
          expect(obj($state.params)).toEqualData(extend({}, defaults, params));
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

      it('should support non-url parameters', inject(function($state, $q, $stateParams) {
        $state.transitionTo(A); $q.flush();
        expect($state.is(A)).toBe(true);

        $state.go('URLLESS', { myparam: "0" }); $q.flush(); // string "0" decodes to 0
        expect($state.current.name).toBe("URLLESS");
        expect($stateParams.myparam).toBe(0);

        $state.go('URLLESS', { myparam: "1" }); $q.flush(); // string "1" decodes to 1
        expect($stateParams.myparam).toBe(1);
      }));

      it('should not transition if a required non-url parameter is missing', inject(function($state, $q, $stateParams) {
        $state.transitionTo(A); $q.flush();
        expect($state.current.name).toBe("A");

        $state.go('URLLESS');  $q.flush(); // Missing required parameter; transition fails
        expect($state.current.name).toBe("A");
      }));

      it('should not transition if a required non-url parameter is invalid', inject(function($state, $q, $stateParams) {
        $state.transitionTo(A); $q.flush();
        expect($state.current.name).toBe("A");

        $state.go('URLLESS', { myparam: "somestring"}); $q.flush(); // string "somestring" is not an int
        expect($state.current.name).toBe("A");
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

      spyOn(services.location, 'replace');

      $state.transitionTo('about', {}, { location: 'replace' });
      $q.flush();

      expect(services.location.replace).toHaveBeenCalled();
    }));

    it('should not replace history normally', inject(function ($state, $rootScope, $location, $q) {

      spyOn(services.location, 'replace');

      $state.transitionTo('about');
      $q.flush();

      expect(services.location.replace).not.toHaveBeenCalled();

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
      expect($state.current.data.hasOwnProperty('propB')).toBe(false);
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
      expect(obj(templateParams)).toEqual({ item: "foo" });
    }));
  });

  describe('provider decorators', function () {

    it('should return built-in decorators', inject(function ($state) {
      expect($stateProvider.decorator('parent')({ parent: A }).self.name).toBe("A");
    }));

    it('should allow built-in decorators to be overridden', inject(function ($state, $q) {
      $stateProvider.decorator('data', function(state) {
        return angular.extend(state.data || {}, { foo: "bar" });
      });
      $stateProvider.state('AA', { parent: A, data: { baz: "true" } });

      $state.transitionTo('AA');
      $q.flush();
      expect($state.current.data).toEqual({ baz: 'true', foo: 'bar' });
    }));

    it('should allow new decorators to be added', inject(function ($state, $q) {
      $stateProvider.decorator('custom', function(state) {
        return function() { return "Custom functionality for state '" + state + "'" };
      });
      $stateProvider.state('decoratorTest', {});

      $state.transitionTo('decoratorTest');
      $q.flush();
      expect($state.$current.custom()).toBe("Custom functionality for state 'decoratorTest'");
    }));

    it('should allow built-in decorators to be extended', inject(function ($state, $q, $httpBackend) {
      $stateProvider.decorator('views', function(state, parent) {
        var result = {};

        var views = parent(state);
        forEach(views, function(config, name) {
          result[name] = angular.extend(config, { templateProvider: function() {
            return "Template for " + name;
          }});
          delete result[name].template;
        });
        return result;
      });

      $stateProvider.state('viewTest', {
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

    it('should invoke multiple decorators, if exist', inject(function ($state, $q, $httpBackend) {
      var d = { d1: false, d2: false };
      function decorator1(state, parent) { d.d1 = true; return parent(state); }
      function decorator2(state, parent) { d.d2 = true; return parent(state); }

      $stateProvider.decorator('parent', decorator1);
      $stateProvider.decorator('parent', decorator2);

      $stateProvider.state({ name: "test", parent: A });
      $state.go("test"); $q.flush();

      expect($state.$current.name).toBe("test");
      expect($state.$current.parent.name).toBe("A");
      expect(d.d1).toBe(true);
      expect(d.d2).toBe(true);
    }));

    it('should allow any decorator to short circuit the chain', inject(function ($state, $q, $httpBackend) {
      var d = { d1: false, d2: false };
      function decorator1(state, parent) { d.d1 = true; return parent(state); }
      function decorator2(state, parent) { d.d2 = true; return {}; }

      $stateProvider.decorator('data', decorator1);
      $stateProvider.decorator('data', decorator2);

      $stateProvider.state({ name: "test", data: { x: 1 } });
      $state.go("test"); $q.flush();

      expect($state.$current.name).toBe("test");
      expect($state.$current.data.x).toBeUndefined();
      expect(d.d1).toBe(false);
      expect(d.d2).toBe(true);
    }));

    it('should allow any decorator to modify the return value of the parent', inject(function ($state, $q, $httpBackend) {
      var d = { d1: false, d2: false };
      function decorator1(state, parent) { d.d1 = true; return angular.extend(parent(state), { y: 2 }); }
      function decorator2(state, parent) { d.d2 = true; return angular.extend(parent(state), { z: 3 }); }

      $stateProvider.decorator('data', decorator1);
      $stateProvider.decorator('data', decorator2);

      $stateProvider.state({ name: "test", data: { x: 1 } });
      $state.go("test"); $q.flush();

      expect($state.$current.name).toBe("test");
      expect($state.$current.data).toEqualData({ x: 1, y: 2, z: 3 });
      expect(d.d1).toBe(true);
      expect(d.d2).toBe(true);
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

describe("Targeted Views", function() {
  var states, scope, $compile, $injector, $q, $state, elem, $controllerProvider;
  beforeEach(module('ui.router', function(_$provide_, _$controllerProvider_,_$stateProvider_) {
    $stateProvider = _$stateProvider_;
    states.forEach($stateProvider.state.bind($stateProvider));
  }));

  beforeEach(inject(function ($rootScope, _$compile_, _$injector_, _$q_, _$state_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    $injector = _$injector_;
    $q = _$q_;
    $state = _$state_;
    elem = angular.element('<div>');
    elem.append($compile('<div><ui-view></ui-view></div>')(scope));
  }));

  states = [
    { name: 'A', template: "<div ui-view id='A_default'></div> <div ui-view='named' id='named_A'></div>" },
    { name: 'A.a', template: "<div ui-view id='Aa_default'>mike</div><div ui-view='named2' id='Aa_named2'>initial</div>" },
    { name: 'A.a.i', views: {
      "^.named2": { template: "A.a.i" },
      "$default": { template: "<div ui-view id='Aai_default'>asdf</div>"}
    } },
    { name: 'A.a.i.1', views: {
      "^.^.^.named": { template: "A.a.i.1" }
    } },
    { name: 'A.a.i.2', views: {
      "!$default": { template: "rooted!" }
    } },
    { name: 'A.a.i.3', views: {
      "!$default.named": { template: "fhqwhgads" }
    } },

    { name: 'A.b', template: "<div ui-view id='Ab_default'>mike</div><div ui-view='named2' id='Ab_named2'>initial</div>" },
    { name: 'A.b.i', views: {
      "named2@A.b": { template: "A.b.i" },
      "": { template: "<div ui-view id='Abi_default'>asdf</div>"}
    } },
    { name: 'A.b.i.1', views: {
      "named@A": { template: "A.b.i.1" }
    } },
    { name: 'A.b.i.2', views: {
      "@": { template: "rooted!" }
    } }

  ];


  describe("view targeting", function() {
    it("should target the unnamed ui-view in the parent context, when the view's name is '$default'", inject(function() {
      $state.go("A.a.i"); $q.flush();
      expect(elem[0].querySelector("#Aa_default").textContent).toBe("asdf");
    }));

    it("should relatively target a ui-view in the grandparent context, when the viewname starts with '^.'", inject(function() {
      $state.go("A.a.i"); $q.flush();
      expect(elem[0].querySelector("#Aa_named2").textContent).toBe("A.a.i");
    }));

    it("should relatively target a ui-view in the great-grandparent context, when the viewname starts with '^.^.'", inject(function() {
      $state.go("A.a.i.1"); $q.flush();
      expect(elem[0].querySelector("#named_A").textContent).toBe("A.a.i.1");
    }));

    it("should target the root ui-view, when the view's name is '!$default'", inject(function() {
      $state.go("A.a.i.2"); $q.flush();
      expect(elem[0].textContent).toBe("rooted!");
    }));

    it("should target a ui-view absolutely using the ui-view's FQN when the view name is preceded by the '!' character", inject(function() {
      $state.go("A.a.i.3"); $q.flush();
      expect(elem[0].querySelector("#named_A").textContent).toBe("fhqwhgads");
    }));
  });


  describe("with view@context style view targeting", function() {
    it("should target the unnamed ui-view in the parent context, when the view's name is ''", inject(function() {
      $state.go("A.b.i"); $q.flush();
      expect(elem[0].querySelector("#Ab_default").textContent).toBe("asdf");
    }));

    it("should target a ui-view named 'named2' at the context named 'A.b' when the view's name is 'named2@A.b'", inject(function() {
      $state.go("A.b.i"); $q.flush();
      expect(elem[0].querySelector("#Ab_named2").textContent).toBe("A.b.i");
    }));

    it("should target a ui-view named 'named' at the context named 'A' when the view's name is 'named@A'", inject(function() {
      $state.go("A.b.i.1"); $q.flush();
      expect(elem[0].querySelector("#named_A").textContent).toBe("A.b.i.1");
    }));

    it("should target the unnamed ui-view at the root context (named ''), when the view's name is '@'", inject(function() {
      $state.go("A.b.i.2"); $q.flush();
      expect(elem[0].textContent).toBe("rooted!");
    }));
  });
});


describe('.onInvalid()', function() {
  var states, scope, $compile, $injector, $q, $state, elem, $controllerProvider;
  beforeEach(module('ui.router', function(_$provide_, _$controllerProvider_,_$stateProvider_) {
    $stateProvider = _$stateProvider_;
    $stateProvider.state("second", { template: "foo"} );
  }));

  it('should fire when the to-state reference is invalid', inject(function($state, $transitions, $q) {
    var ref = null;
    $stateProvider.onInvalid(function($to$) {
      ref = $to$;
      return false;
    });

    $state.go("invalid");
    $q.flush();
    expect(ref).not.toBeNull();
    expect(ref.valid()).toBeFalsy();
  }));


  it('should allow redirection if an ITargetState is returned', inject(function($state, $transitions, $q) {
    $stateProvider.onInvalid(function($to$) {
      return $state.target("second", $to$.params(), $to$.options());
    });

    $state.go("invalid");
    $q.flush();
    expect($state.current.name).toBe("second")
  }));
});

describe('$stateParams', function () {
  beforeEach(module('ui.router.state'));

  it('should start empty', inject(function ($stateParams) {
    expect($stateParams.foo).toBeUndefined();
  }));
  it('should allow setting values on it', inject(function ($stateParams) {
    $stateParams.foo = 'bar';
    expect($stateParams.foo).toBeDefined();
  }));
  it('should be cleared between tests', inject(function ($stateParams) {
    expect($stateParams.foo).toBeUndefined();
  }));
});

// Test for #600, #2238, #2229
describe('otherwise and state redirects', function() {
  beforeEach(module('ui.router.state.events', function($stateEventsProvider) {
    $stateEventsProvider.enable();
  }));

  beforeEach(module(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
    $stateProvider
        .state('home', { url: '/home', template: 'home' })
        .state('loginPage', { url: '/login', templateUrl: 'login.html' });
  }));

  beforeEach(inject(function ($rootScope, $state) {
    $rootScope.$on('$stateChangeStart', function (event, toState) {
      if (toState.name !== "loginPage") {
        event.preventDefault();
        $state.go('loginPage', { redirectUrl: toState.name });
      }
    });
  }));

  it("should not go into an infinite loop", inject(function($location, $rootScope, $state, $urlRouter, $httpBackend) {
    $httpBackend.expectGET("login.html").respond("login page");
    $location.url("notmatched");
    $urlRouter.update(true);
    expect(function() { $rootScope.$digest(); }).not.toThrow();
    expect(function() { $httpBackend.flush(); }).not.toThrow();
    expect($state.current.name).toBe("loginPage")
  }));
});


describe('transition hook', function() {
  var log, resolvelog;
  beforeEach(module(function ($stateProvider, $urlRouterProvider) {
    log = resolvelog = "";
    $urlRouterProvider.otherwise('/home');
    $stateProvider.state('home', {
          url: '/home',
          template: 'home <ui-view></ui-view>',
          controller: function () { log += "homeCtrl;"; },
          resolve: {
            foo: function () { resolvelog += "fooResolve;"; return "foo"; }
          }
        })
        .state('home.foo', {url: '/foo', template: 'foo'})
        .state('loginPage', {url: '/login', template: 'login'});
  }));

  beforeEach(inject(function($compile, $rootScope) {
    var $scope = $rootScope.$new();
    $compile('<div><ui-view></ui-view></div>')($scope);
  }));

  // Test for #2455
  it("redirects from .otherwise() should go to the redirect-to target state and url", inject(function($transitions, $q, $state, $location) {
    $transitions.onBefore({ to: 'home' }, function() {
      return $state.target('loginPage', {}, { location: true });
    });
    $q.flush();
    expect($state.current.name).toBe("loginPage");
    expect($location.path()).toBe('/login');
  }));

  // Test for #2537
  it("redirects should be able to change option.reload", inject(function($transitions, $q, $state, $trace) {
    var count = 0;
    $q.flush();
    expect($state.current.name).toBe("home");
    expect(log).toBe("homeCtrl;");

    $state.go('.'); $q.flush();
    expect(log).toBe("homeCtrl;");

    $transitions.onBefore({ to: 'home' }, function($state, $transition$) {
      var options = $transition$.options();
      if (!options.reload && count++ < 5) {
        return $state.target($transition$.to(), $transition$.params("to"), extend({}, options, {reload: true}));
      }
    });

    $state.go('.'); $q.flush();

    expect($state.current.name).toBe("home");
    expect(log).toBe("homeCtrl;homeCtrl;");
  }));

  // Test for #2539
  it("redirects should re-resolve when reloading during a redirect", inject(function($transitions, $q, $state, $trace) {
    var count = 0;
    $q.flush();

    expect($state.current.name).toBe("home");
    expect(resolvelog).toBe("fooResolve;");

    $state.go('home.foo'); $q.flush();
    expect(resolvelog).toBe("fooResolve;");

    $transitions.onStart({ to: 'home' }, function($transition$, $state) {
      if (!$transition$.options().reload && count++ < 5) {
        console.log("forcing re-enter (reload) of home state ");
        var options = $transition$.options();
        return $state.target($transition$.to(), $transition$.params("to"), extend({}, options, {reload: true}));
      }
    });

    $state.go('home'); $q.flush();
    expect($state.current.name).toBe("home");
    expect(resolvelog).toBe("fooResolve;fooResolve;");
  }));

  // Test for #2611
  it("aborts should reset the URL to the prevous state's", inject(function($transitions, $q, $state, $location) {
    $q.flush();
    $transitions.onStart({ to: 'home.foo' }, function() { return false; });
    $location.path('/home/foo'); $q.flush();
    expect($state.current.name).toBe("home");
    expect($location.path()).toBe('/home');
  }));

});
