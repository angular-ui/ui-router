var module = angular.mock.module;
var uiRouter = require("ui-router");
var Path = uiRouter.resolve.Path;
var Resolvable = uiRouter.resolve.Resolvable;
var ViewContext = uiRouter.viewContext.ViewContext;
var ViewConfig = uiRouter.view.ViewConfig;

describe('view', function() {
  var scope, $compile, $injector, elem, $controllerProvider;

  beforeEach(module('ui.router', function(_$provide_, _$controllerProvider_) {
    _$provide_.factory('foo', function() {
      return "Foo";
    });
    $controllerProvider = _$controllerProvider_;
  }));

  beforeEach(inject(function ($rootScope, _$compile_, _$injector_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    $injector = _$injector_;
    elem = angular.element('<div>');
  }));

  describe('controller handling', function() {
    var state = { name: "foo" };
    var path = new Path([state]);

    it('uses the controllerProvider to get controller dynamically', inject(function ($view, $q, $injector) {
      var ctrlExpression;
      $controllerProvider.register("AcmeFooController", function($scope, foo) { });
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      var svc = {
        view: {
          template: "test",
          controllerProvider: function (/* $stateParams, */ foo) { // todo: reimplement localized $stateParams
            ctrlExpression = /* $stateParams.type + */ foo + "Controller as foo";
            return ctrl;
          }
        },
        name: '$default',
        params: {type: "Acme"},
        locals: new ViewContext(path.last(), path, {}, $injector)
      };
      $view.load(new ViewConfig(svc));
      $q.flush();
      expect(ctrlExpression).toEqual("FooController as foo");
    }));
  });

});