describe('view', function () {

	it('should notify when content is loading', inject(function($view, $httpBackend, $rootScope) {
		var event, options, loadConfig = {
			templateUrl: '/partials/test.html',
			params: { foo: "bar" },
			controller: "MyController"
		};

		$rootScope.$on('$viewContentLoading', function(e, o) {
			event = e;
			options = o;
		});
		$httpBackend.expectGET('/partials/test.html').respond("Test content");

		$view.load("custom.view", loadConfig);
		$httpBackend.flush();

		expect(event.name).toBe('$viewContentLoading');
		expect(options.templateUrl).toBe('/partials/test.html');
		expect(options.targetView).toBe('custom.view');
		expect(options.params).toEqual({ foo: "bar" });
	}));
});