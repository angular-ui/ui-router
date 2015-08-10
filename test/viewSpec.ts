/// <reference path='../typings/angularjs/angular.d.ts' />
/// <reference path='../typings/angularjs/angular-mocks.d.ts' />
/// <reference path='../typings/jasmine/jasmine.d.ts' />

var module = angular.mock.module;

import * as uiRouter from "../src/ui-router"
import Path from "../src/path/path"
import Resolvable from "../src/resolve/resolvable"
import ResolveContext from "../src/resolve/resolveContext"
import PathContext from "../src/resolve/pathContext"
import PathFactory from "../src/path/pathFactory"
import {ViewConfig} from "../src/view/view"

import {IState} from "../src/state/interface"

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
    var state: IState = <any> { name: "foo" };
    var root: IState = <any> { name: "" };
    var nodes = [root,state].map(state => ({ state: state, ownParams: {}}));
    var path = PathFactory.transPath(<any> new Path(nodes));
    var ctx = new ResolveContext(path);

    it('uses the controllerProvider to get controller dynamically', inject(function ($view, $q, $injector) {
      var ctrlExpression;
      $controllerProvider.register("AcmeFooController", function($scope, foo) { });
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      var viewConfig = {
        view: {
          template: "test",
          controllerProvider: function (/* $stateParams, */ foo) { // todo: reimplement localized $stateParams
            ctrlExpression = /* $stateParams.type + */ foo + "Controller as foo";
            return ctrlExpression;
          }
        },
        name: '$default',
        params: {type: "Acme"},
        locals: new PathContext(ctx, state, $injector)
      };
      $view.load(new ViewConfig(<any> viewConfig));
      $q.flush();
      expect(ctrlExpression).toEqual("FooController as foo");
    }));
  });
});