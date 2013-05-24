describe('state', function () {
  
  beforeEach(module('ui.state'));

  var log, logEvents, logEnterExit;
  function eventLogger(event, to, toParams, from, fromParams) {
    if (logEvents) log += event.name + '(' + to.name + ',' + from.name + ');';
  }
  function callbackLogger(what) {
    return function () {
      if (logEnterExit) log += this.name + '.' + what + ';';
    };
  }

  var A = { data: {} },
      B = {},
      C = {},
      D = { params: [ 'x', 'y' ] },
      DD = { parent: D, params: [ 'x', 'y', 'z' ] },
      E = { params: [ 'i' ] },
      AppInjectable = {};

  beforeEach(module(function ($stateProvider, $provide) {
    angular.forEach([ A, B, C, D, DD, E ], function (state) {
      state.onEnter = callbackLogger('onEnter');
      state.onExit = callbackLogger('onExit');
    });

    $stateProvider
      .state('A', A)
      .state('B', B)
      .state('C', C)
      .state('D', D)
      .state('DD', DD)
      .state('E', E)

      .state('home', { url: "/" })
      .state('home.item', { url: "front/:id" })
      .state('about', { url: "/about" })
      .state('about.person', { url: "/:person" })
      .state('about.person.item', { url: "/:id" });

    $provide.value('AppInjectable', AppInjectable);
  }));

  beforeEach(inject(function ($rootScope) {
    log = '';
    logEvents = logEnterExit = false;
    $rootScope.$on('$stateChangeStart', eventLogger);
    $rootScope.$on('$stateChangeSuccess', eventLogger);
    $rootScope.$on('$stateChangeError', eventLogger);
  }));


  function $get(what) {
    return jasmine.getEnv().currentSpec.$injector.get(what);
  }

  function initStateTo(state, optionalParams) {
    var $state = $get('$state'), $q = $get('$q');
    $state.transitionTo(state, optionalParams || {});
    $q.flush();
    expect($state.current).toBe(state);
  }


  describe('.transitionTo()', function () {
    it('returns a promise for the target state', inject(function ($state, $q) {
      var trans = $state.transitionTo(A, {});
      $q.flush();
      expect(resolvedValue(trans)).toBe(A);
    }));

    it('allows transitions by name', inject(function ($state, $q) {
      $state.transitionTo('A', {});
      $q.flush();
      expect($state.current).toBe(A);
    }));

    it('ignores non-applicable state parameters', inject(function ($state, $q) {
      $state.transitionTo('A', { w00t: 'hi mom!' });
      $q.flush();
      expect($state.current).toBe(A);
    }));

    it('triggers $stateChangeStart', inject(function ($state, $q, $rootScope) {
      initStateTo(E, { i: 'iii' });
      var called;
      $rootScope.$on('$stateChangeStart', function (ev, to, toParams, from, fromParams) {
        expect(from).toBe(E);
        expect(fromParams).toEqual({ i: 'iii' });
        expect(to).toBe(D);
        expect(toParams).toEqual({ x: '1', y: '2' });

        expect($state.current).toBe(from); // $state not updated yet
        expect($state.params).toEqual(fromParams);
        called = true;
      });
      $state.transitionTo(D, { x: '1', y: '2' });
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

    it('triggers $stateChangeSuccess', inject(function ($state, $q, $rootScope) {
      initStateTo(E, { i: 'iii' });
      var called;
      $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
        expect(from).toBe(E);
        expect(fromParams).toEqual({ i: 'iii' });
        expect(to).toBe(D);
        expect(toParams).toEqual({ x: '1', y: '2' });

        expect($state.current).toBe(to); // $state has been updated
        expect($state.params).toEqual(toParams);
        called = true;
      });
      $state.transitionTo(D, { x: '1', y: '2' });
      $q.flush();
      expect(called).toBeTruthy();
      expect($state.current).toBe(D);
    }));

    it('is a no-op when passing the current state and identical parameters', inject(function ($state, $q) {
      initStateTo(A);
      var trans = $state.transitionTo(A, {}); // no-op
      expect(trans).toBeDefined(); // but we still get a valid promise
      $q.flush();
      expect(resolvedValue(trans)).toBe(A);
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
      expect(log).toBe(
        '$stateChangeStart(B,A);' +
        '$stateChangeStart(C,A);' +
        '$stateChangeSuccess(C,A);');
    }));

    it('aborts pending transitions even when going back to the curren state', inject(function ($state, $q) {
      initStateTo(A);
      logEvents = true;

      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(A, {});
      $q.flush();
      expect($state.current).toBe(A);
      expect(resolvedError(superseded)).toBeTruthy();
      expect(log).toBe(
        '$stateChangeStart(B,A);');
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
      expect($state.params).toBeDefined();
      expect(angular.isObject($state.params)).toBe(true);
    }));

    it('contains the parameter values for the current state', inject(function ($state, $q) {
      initStateTo(D, { x: 'x value', z: 'invalid value' });
      expect($state.params).toEqual({ x: 'x value', y: null });
    }));
  });


  describe('.transition', function () {
    it('is null when no transition is taking place', inject(function ($state, $q) {
      expect($state.transition).toBeNull();
      $state.transitionTo(A, {});
      $q.flush();
      expect($state.transition).toBeNull();
    }));

    it('is the current transition', inject(function ($state, $q) {
      var trans = $state.transitionTo(A, {});
      expect($state.transition).toBe(trans);
    }));
  });


  describe('.href()', function () {
    it('aborts on un-navigable states', inject(function ($state) {
      expect(function() { $state.href("A"); }).toThrow("State 'A' is not navigable");
    }));

    it('generates a URL without parameters', inject(function ($state) {
      expect($state.href("home")).toEqual("/");
      expect($state.href("about", {})).toEqual("/about");
      expect($state.href("about", { foo: "bar" })).toEqual("/about");
    }));

    it('generates a URL with parameters', inject(function ($state) {
      expect($state.href("about.person", { person: "bob" })).toEqual("/about/bob");
      expect($state.href("about.person.item", { person: "bob", id: null })).toEqual("/about/bob/");
    }));
  });
});
