describe('view', function () {

  it('should notify when content is loading', inject(function($view, $rootScope) {
    var event, options, loadConfig = {
      template: 'Hello!',
      params: { foo: "bar" },
      controller: "MyController"
    };

    $rootScope.$on('$viewContentLoading', function(e, o) {
      event = e;
      options = o;
    });

    $view.load("custom.view", loadConfig);

    expect(event.name).toBe('$viewContentLoading');
    expect(options.template).toBe('Hello!');
    expect(options.targetView).toBe('custom.view');
    expect(options.params).toEqual({ foo: "bar" });
  }));

  it('should always return a promise', inject(function($view, $httpBackend, $rootScope) {
    var result;
    $httpBackend.expectGET('/partials/test.html').respond("Test content");

    $view.load("custom.view", { templateUrl: '/partials/test.html' }).then(function(template) {
      result = template;
    });
    expect(result).toBeUndefined();

    $httpBackend.flush();
    expect(result.$template).toBe("Test content");

    $view.load("custom.view", { template: 'Hello!' }).then(function(template) {
      result = template;
    });
    $rootScope.$digest();
    expect(result.$template).toBe("Hello!");
  }));
});