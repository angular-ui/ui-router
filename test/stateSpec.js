describe('state', function () {
  
  beforeEach(module('ui.state'));

  var A = { data: {} }, B = {}, C = {};
  
  beforeEach(module(function ($stateProvider) {
    $stateProvider
      .state('A', A)
      .state('B', B)
      .state('C', C);
  }));

  var log = '';
  function eventLogger(event, to, from) {
    log += event.name + '(' + to.name + ',' + from.name + ');';
  }

  beforeEach(inject(function ($rootScope) {
    $rootScope.$on('$stateChangeStart', eventLogger);
    $rootScope.$on('$stateChangeSuccess', eventLogger);
  }));

  function $get(what) {
    return jasmine.getEnv().currentSpec.$injector.get(what);
  }

  function initStateTo(state) {
    var $state = $get('$state'), $q = $get('$q');
    $state.transitionTo(state, {});
    $q.flush();
    expect($state.current).toBe(state);
    log = '';
  }


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

    it('wraps the raw state object', inject(function ($state, $q) {
      $state.transitionTo(A, {});
      $q.flush();
      expect($state.$current.data).toBe(A.data); // 'data' is reserved for app use
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

  
  describe('.transitionTo()', function () {
    it('returns a promise for the target state', inject(function ($state, $q) {
      var trans = $state.transitionTo(A, {});
      $q.flush();
      expect(resolvedValue(trans)).toBe(A);
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
      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(C, {});
      $q.flush();
      expect($state.current).toBe(C);
      expect(resolvedError(superseded)).toBeDefined();
      expect(log).toBe(
        '$stateChangeStart(B,A);' +
        '$stateChangeStart(C,A);' +
        '$stateChangeSuccess(C,A);');
    }));

    it('aborts pending transitions even when going back to the curren state', inject(function ($state, $q) {
      initStateTo(A);
      var superseded = $state.transitionTo(B, {});
      $state.transitionTo(A, {});
      $q.flush();
      expect($state.current).toBe(A);
      expect(resolvedError(superseded)).toBeDefined();
      expect(log).toBe(
        '$stateChangeStart(B,A);');
    }));
  });
});
