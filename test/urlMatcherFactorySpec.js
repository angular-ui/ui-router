describe('urlMatcherFactory', function () {
  
  var $umf;

  beforeEach(module('ngStates'));
  beforeEach(inject(function($urlMatcherFactory) {
    $umf = $urlMatcherFactory;
  }));

  it('compiles simple patterns', function () {
    var pattern = $umf.compile("/hello/world");
    expect(pattern).toBeDefined();
  })
});
