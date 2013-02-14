describe('templateFactory', function () {
  
  beforeEach(module('ui.util'));

  it('exists', inject(function ($templateFactory) {
    expect($templateFactory).toBeDefined();
  }));
});
