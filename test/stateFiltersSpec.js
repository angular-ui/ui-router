describe('isState filter', function() {
  beforeEach(module('ui.router'));
  beforeEach(module(function($stateProvider) {
    $stateProvider
      .state('a', { url: '/' })
      .state('a.b', { url: '/b' })
      .state('a.c', { url: '/:x?y' })
      .state('d', { url: '/' })
      .state('d.c', { url: '/c' });
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

  it('should return true when the current state is passed with matching parameters', inject(function ($parse, $q, $state, $rootScope) {
    $state.go('a.c', {x: 'foo', y: 'bar'});
    $q.flush();
    expect($parse('"a.c" | isState')($rootScope)).toBe(true);
    expect($parse('"a.c" | isState:{params:{x: "foo", y: "bar"}}')($rootScope)).toBe(true);
    expect($parse('"a.c" | isState:{params:{x: "bar", y: "foo"}}')($rootScope)).toBe(false);
    expect($parse('"a.c" | isState:{params:{x: "bar"}}')($rootScope)).toBe(false);
    expect($parse('"a.c" | isState:{params:{y: "foo"}}')($rootScope)).toBe(false);
    expect($parse('"a.c" | isState:{params:{x: "bar", y: "foo", z: "hello"}}')($rootScope)).toBe(false);
  }));

  it('should work for relative states', inject(function ($parse, $q, $state, $rootScope) {
    var scope = $rootScope.$new();
    scope.options = { relative: $state.get('a') };

    $state.go('a.c');
    $q.flush();

    expect($parse('".c" | isState:{options: options}')(scope)).toBe(true);

    $state.go('a.c', {x: 'foo', y: 'bar'});
    $q.flush();
    expect($parse('".c" | isState:{params:{x: "foo", y: "bar"}, options: options}')(scope)).toBe(true);

    scope.options.relative = $state.get('d');
    expect($parse('".c" | isState:{options: options}')(scope)).toBe(false);
  }));
});

describe('includedByState filter', function() {
  beforeEach(module('ui.router'));
  beforeEach(module(function($stateProvider) {
    $stateProvider
      .state('a', { url: '/' })
      .state('a.b', { url: '/b' })
      .state('c', { url: '/c' });
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
});
