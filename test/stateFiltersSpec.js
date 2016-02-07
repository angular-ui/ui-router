describe('isState filter', function() {
  beforeEach(module('ui.router'));
  beforeEach(module(function($stateProvider) {
    $stateProvider
      .state('a', { url: '/' })
      .state('a.b', { url: '/b' })
      .state('with-param', { url: '/with/:param' });
  }));

  it('should return true if the current state exactly matches the input state', inject(function($parse, $state, $q, $rootScope) {
    $state.go('a');
    $q.flush();
    expect($parse('"a" | isState')($rootScope)).toBe(true);
  }));

  it('should return false if the current state does not exactly match the input state', inject(function($parse, $q, $state, $rootScope) {
    $state.go('a.b');
    $q.flush();
    expect($parse('"a" | isState')($rootScope)).toBe(false);
  }));
  
  it('should return true if the current state and param matches the input state', inject(function($parse, $state, $q, $rootScope) {
    $state.go('with-param', {param: 'a'});
    $q.flush();
    expect($parse('"with-param" | isState: {param: "a"}')($rootScope)).toBe(true);
  }));

  it('should return false if the current state and param does not match the input state', inject(function($parse, $state, $q, $rootScope) {
    $state.go('with-param', {param: 'b'});
    $q.flush();
    expect($parse('"with-param" | isState: {param: "a"}')($rootScope)).toBe(false);
  }));
});

describe('includedByState filter', function() {
  beforeEach(module('ui.router'));
  beforeEach(module(function($stateProvider) {
    $stateProvider
      .state('a', { url: '/' })
      .state('a.b', { url: '/b' })
      .state('c', { url: '/c' })
      .state('d', { url: '/d/:id' });
  }));

  it('should return true if the current state exactly matches the input state', inject(function($parse, $state, $q, $rootScope) {
    $state.go('a');
    $q.flush();
    expect($parse('"a" | includedByState')($rootScope)).toBe(true);
  }));

  it('should return true if the current state includes the input state', inject(function($parse, $state, $q, $rootScope) {
    $state.go('a.b');
    $q.flush();
    expect($parse('"a" | includedByState')($rootScope)).toBe(true);
  }));

  it('should return false if the current state does not include input state', inject(function($parse, $state, $q, $rootScope) {
    $state.go('c');
    $q.flush();
    expect($parse('"a" | includedByState')($rootScope)).toBe(false);
  }));

  it('should return true if the current state include input state and params', inject(function($parse, $state, $q, $rootScope) {
    $state.go('d', { id: 123 });
    $q.flush();
    expect($parse('"d" | includedByState:{ id: 123 }')($rootScope)).toBe(true);
  }));

  it('should return false if the current state does not include input state and params', inject(function($parse, $state, $q, $rootScope) {
    $state.go('d', { id: 2377 });
    $q.flush();
    expect($parse('"d" | includedByState:{ id: 123 }')($rootScope)).toBe(false);
  }));
});
