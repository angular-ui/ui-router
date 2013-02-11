describe('templateFactory', function () {
  
  beforeEach(module('ngStates'));

  it('exists', inject(function ($templateFactory) {
    expect($templateFactory).toBeDefined();
  }));
});
