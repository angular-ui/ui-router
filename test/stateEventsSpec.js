describe('UI-Router v0.2.x $state events', function () {
  var stateProvider;

  beforeEach(module('ui.router.state.events', function($stateEventsProvider) {
    $stateEventsProvider.enabledEvents("*");
  }));

  var log, logEvents, logEnterExit;
  function eventLogger(event, to, toParams, from, fromParams) {
    if (logEvents && angular.isFunction(to.to)) {
      var transition = to;
      log += event.name + '(' + transition.to().name + ',' + transition.from().name + ');';
    } else if (logEvents) {
      log += event.name + '(' + (angular.isString(to.name) ? to.name : to)  + ',' + (angular.isString(from.name) ? from.name : from) + ');';
    }
  }
  function callbackLogger(what) {
    return function () {
      if (logEnterExit) log += this.name + '.' + what + ';';
    };
  }

  var A = { data: {} },
    B = {},
    C = {},
    D = { params: { x: {}, y: {} } },
    DD = { parent: D, params: { x: {}, y: {}, z: {} } },
    E = { params: { i: {} } };

  beforeEach(module(function ($stateProvider, $provide) {
    angular.forEach([ A, B, C, D, DD ], function (state) {
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
      .state('E', E);
  }));

  beforeEach(inject(function ($rootScope) {
    log = '';
    logEvents = logEnterExit = false;
    $rootScope.$on('$stateChangeStart', eventLogger);
    $rootScope.$on('$stateChangeSuccess', eventLogger);
    $rootScope.$on('$stateChangeError', eventLogger);
    $rootScope.$on('$stateNotFound', eventLogger);
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

  describe('.transitionTo()', function () {
    it('triggers $stateChangeStart', inject(function ($state, $q, $rootScope) {
      initStateTo(E, {i: 'iii'});
      var called;
      $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams, transition) {
        expect(from).toBe(E);
        expect(transition.from.state()).toBe(E);

        expect(obj(fromParams)).toEqual({i: 'iii'});
        expect(obj(transition.from.params())).toEqual({i: 'iii'});

        expect(to).toBe(D);
        expect(transition.to.state()).toBe(D);

        expect(toParams).toEqual({x: '1', y: '2'});
        expect(obj(transition.params())).toEqual({x: '1', y: '2'});

        expect($state.current).toBe(transition.from.state()); // $state not updated yet
        expect(obj($state.params)).toEqual(obj(transition.from.params()));
        called = true;
      });
      $state.transitionTo(D, {x: '1', y: '2'});
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toBe(D);
    }));

    it('can be cancelled by preventDefault() in $stateChangeStart', inject(function ($state, $q, $rootScope) {
      initStateTo(A);
      var called;
      $rootScope.$on('$stateChangeStart', function (ev) {
        ev.preventDefault();
        called = true;
      });
      var promise = $state.transitionTo(B, {});
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toBe(A);
      expect(resolvedError(promise)).toBeTruthy();
    }));

    it('triggers $stateNotFound', inject(function ($state, $q, $rootScope) {
      initStateTo(E, {i: 'iii'});
      var called;
      $rootScope.$on('$stateNotFound', function (ev, unfoundState, fromState, fromParams, transition) {
        expect(transition.from.state()).toBe(E);
        expect(obj(transition.from.params())).toEqual({i: 'iii'});
        expect(transition.to()).toEqual('never_defined');
        expect(transition.to.params()).toEqual({x: '1', y: '2'});

        expect($state.current).toBe(E); // $state not updated yet
        expect(obj($state.params)).toEqual({i: 'iii'});
        called = true;
      });
      var message;
      try {
        $state.transitionTo('never_defined', {x: '1', y: '2'});
      } catch (err) {
        message = err.message;
      }
      $q.flush();
      expect(message).toEqual('No such state \'never_defined\'');
      expect(called).toBeTruthy();
      expect($state.current).toBe(E);
    }));

    it('throws Error on failed relative state resolution', inject(function ($state, $q) {
      $state.transitionTo(DD);
      $q.flush();

      var err = "Could not resolve '^.Z' from state 'DD'";
      expect(function() { $state.transitionTo("^.Z", null, { relative: $state.$current }); }).toThrow(err);
    }));


    it('can be cancelled by preventDefault() in $stateNotFound', inject(function ($state, $q, $rootScope) {
      initStateTo(A);
      var called;
      $rootScope.$on('$stateNotFound', function (ev) {
        ev.preventDefault();
        called = true;
      });
      var promise = $state.transitionTo('never_defined', {});
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toBe(A);
      expect(resolvedError(promise)).toBeTruthy();
    }));

    it('can be redirected in $stateNotFound', inject(function ($state, $q, $rootScope) {
      initStateTo(A);
      var called;
      $rootScope.$on('$stateNotFound', function (ev, redirect) {
        redirect.to = D;
        redirect.toParams = {x: '1', y: '2'};
        called = true;
      });
      var promise = $state.transitionTo('never_defined', {z: 3});
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toBe(D);
      expect(extend({}, $state.params)).toEqual({x: '1', y: '2'});
    }));

    it('can lazy-define a state in $stateNotFound', inject(function ($state, $q, $rootScope) {
      initStateTo(DD, {x: 1, y: 2, z: 3});
      var called;
      $rootScope.$on('$stateNotFound', function (ev, redirect) {
        stateProvider.state(redirect.to, {parent: DD, params: {x: {}, y: {}, z: {}, w: {}}});
        ev.retry = called = true;
      });
      var promise = $state.go('DDD', {w: 4});
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current.name).toEqual('DDD');
      expect(extend({}, $state.params)).toEqual({x: 1, y: 2, z: 3, w: 4});
    }));

    it('can defer a state transition in $stateNotFound', inject(function ($state, $q, $rootScope) {
      initStateTo(A);
      var called;
      var deferred = $q.defer();
      $rootScope.$on('$stateNotFound', function (ev, redirect) {
        ev.retry = deferred.promise;
        called = true;
      });
      var promise = $state.go('AA', {a: 1});
      stateProvider.state('AA', {parent: A, params: {a: {}}});
      deferred.resolve();
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current.name).toEqual('AA');
      expect(extend({}, $state.params)).toEqual({a: 1});
    }));

    it('can defer and supersede a state transition in $stateNotFound', inject(function ($state, $q, $rootScope) {
      initStateTo(A);
      var called;
      var deferred = $q.defer();
      $rootScope.$on('$stateNotFound', function (ev, redirect) {
        ev.retry = deferred.promise;
        called = true;
      });
      var promise = $state.go('AA', {a: 1});
      $state.go(B);
      stateProvider.state('AA', {parent: A, params: {a: {}}});
      deferred.resolve();
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toEqual(B);
      expect(extend({}, $state.params)).toEqual({});
    }));

    it('triggers $stateChangeSuccess', inject(function ($state, $q, $rootScope) {
      initStateTo(E, {i: 'iii'});
      var called;
      $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
        expect(from).toBe(E);
        expect(fromParams).toEqual({i: 'iii'});
        expect(to).toBe(D);
        expect(toParams).toEqual({x: '1', y: '2'});

        expect($state.current).toBe(to); // $state has been updated
        expect(extend({}, $state.params)).toEqual(toParams);
        called = true;
      });
      $state.transitionTo(D, {x: '1', y: '2'});
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toBe(D);
    }));

    it('does not trigger $stateChangeSuccess when suppressed, but changes state', inject(function ($state, $q, $rootScope) {
      initStateTo(E, {i: 'iii'});
      var called;

      $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
        called = true;
      });

      $state.transitionTo(D, {x: '1', y: '2'}, {notify: false});
      $q.flush();

      expect(called).toBeFalsy();
      expect($state.current).toBe(D);
    }));

    it('does not trigger $stateChangeSuccess when suppressed, but updates params', inject(function ($state, $q, $rootScope) {
      initStateTo(E, {x: 'iii'});
      var called;

      $rootScope.$on('$stateChangeSuccess', function (ev, transition) {
        called = true;
      });
      $state.transitionTo(E, {i: '1', y: '2'}, {notify: false});
      $q.flush();

      expect(called).toBeFalsy();
      expect($state.params.i).toBe('1');
      expect($state.current).toBe(E);
    }));


    it('aborts pending transitions even when going back to the current state', inject(function ($state, $q) {
      initStateTo(A);
      logEvents = true;

      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(A, {});
      $q.flush();
      expect($state.current).toBe(A);
      expect(resolvedError(superseded)).toBeTruthy();
      expect(log).toBe('$stateChangeStart(B,A);');
    }));

    it('aborts pending transitions (last call wins)', inject(function ($state, $q) {
      initStateTo(A);
      logEvents = true;

      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(C, {});
      $q.flush();
      expect($state.current).toBe(C);
      expect(resolvedError(superseded)).toBeTruthy();
      expect(log).toBe(
        '$stateChangeStart(B,A);' +
        '$stateChangeStart(C,A);' +
        '$stateChangeSuccess(C,A);');
    }));
  });
});

