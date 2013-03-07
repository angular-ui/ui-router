describe('state', function () {
  
  beforeEach(module('ui.state'));

  describe('(transitions and related promises)', function () {
    var A = { data: {} };
    
    beforeEach(module(function ($stateProvider) {
      $stateProvider.state('A', A)
    }));

    it('.current is always defined', inject(function ($state) {
      expect($state.current).toBeDefined();
    }));

    it('.$current is always defined', inject(function ($state) {
      expect($state.$current).toBeDefined();
    }));

    it('.$current wraps the raw state object', inject(function ($state) {
      resolvedValue($state.transitionTo(A, {}));
      expect($state.$current.data).toBe(A.data); // 'data' is reserved for app use
    }));

    it('.transitionTo() returns a promise for the target state', inject(function ($state) {
      var trans = $state.transitionTo(A, {});
      expect(resolvedValue(trans)).toBe(A);
    }));

    it('.current updates asynchronously as the transitionTo() promise is resolved', inject(function ($state) {
      var trans = $state.transitionTo(A, {});
      expect($state.current).not.toBe(A);
      resolvedValue(trans);
      expect($state.current).toBe(A);
    }));

    it('.$transition is always the current or last transition', inject(function ($state) {
      expect($state.$transition).toBeDefined();
      expect(resolvedValue($state.$transition)).toBe($state.current);
      var trans = $state.transitionTo(A, {});
      expect($state.$transition).toBeDefined();
      expect($state.$transition).toBe(trans);
      resolvedValue(trans);
      expect($state.$transition).toBe(trans);
    }));

    it('.transition is null when no transition is taking place', inject(function ($state) {
      expect($state.transition).toBeNull();
      resolvedValue($state.transitionTo(A, {}));
      expect($state.transition).toBeNull();
    }));
  });
});
