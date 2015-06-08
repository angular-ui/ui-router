describe('view', function() {

  var scope, $compile, $injector, elem;

  beforeEach(module('ui.router'));

  beforeEach(inject(function ($rootScope, _$compile_, _$injector_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    $injector = _$injector_;
    elem = angular.element('<div>');
  }));

  describe('controller handling', function() {
    it('uses the controllerProvider to get controller dynamically', inject(function ($view, $q) {
      var ctrl, locals = function(fn, locals) {
        locals = angular.extend(locals || {}, { $stateParams: { type: "Acme" }})
        return $injector.invoke(fn, null, locals);
      };

      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      $view.load('$default', {
        template: "test",
        params: { type: "Acme" },
        controllerProvider: function($stateParams, foo) {
          ctrl = $stateParams.type + foo + "Controller";
          return ctrl;
        }
      });
      $q.flush();
      expect(ctrl).toEqual("AcmeFooController");
    }));
  });

});