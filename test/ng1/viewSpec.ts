/// <reference path='../../typings/angularjs/angular.d.ts' />
/// <reference path='../../typings/angularjs/angular-mocks.d.ts' />
/// <reference path='../../typings/jasmine/jasmine.d.ts' />

var module = angular.mock.module;

import {inherit, extend, tail} from "../../src/common/common";
import {curry} from "../../src/common/hof";
import {Node} from "../../src/path/module";
import {ResolveContext} from "../../src/resolve/module";
import {PathFactory} from "../../src/path/module";
import {ng1ViewsBuilder, ng1ViewConfigFactory} from "../../src/ng1/viewsBuilder";
import {ViewService} from "../../src/view/view";
import {StateMatcher, StateBuilder} from "../../src/state/module";

import {State} from "../../src/state/module";

describe('view', function() {
  var scope, $compile, $injector, elem, $controllerProvider, $urlMatcherFactoryProvider;
  let root: State, states: {[key: string]: State};

  beforeEach(module('ui.router', function(_$provide_, _$controllerProvider_, _$urlMatcherFactoryProvider_) {
    _$provide_.factory('foo', function() {
      return "Foo";
    });
    $controllerProvider = _$controllerProvider_;
    $urlMatcherFactoryProvider = _$urlMatcherFactoryProvider_;
  }));

  let register;
  let registerState = curry(function(_states, stateBuilder, config) {
    let state = inherit(new State(), extend({}, config, {
      self: config,
      resolve: config.resolve || {}
    }));
    let built: State  = stateBuilder.build(state);
    return _states[built.name] = built;
  });

  beforeEach(inject(function ($rootScope, _$compile_, _$injector_) {
    scope = $rootScope.$new();
    $compile = _$compile_;
    $injector = _$injector_;
    elem = angular.element('<div>');

    states = {};
    let matcher = new StateMatcher(states);
    let stateBuilder = new StateBuilder(matcher, $urlMatcherFactoryProvider);
    stateBuilder.builder('views', ng1ViewsBuilder);
    register = registerState(states, stateBuilder);
    root = register({name: ""});
  }));

  describe('controller handling', function() {
    let ctx, state, path, ctrlExpression;
    beforeEach(() => {
      ctrlExpression = null;
      state = register({
        name: "foo",
        template: "test",
        controllerProvider: function (/* $stateParams, */ foo) { // todo: reimplement localized $stateParams
          ctrlExpression = /* $stateParams.type + */ foo + "Controller as foo";
          return ctrlExpression;
        }
      });
      let $view = new ViewService();
      $view.viewConfigFactory("ng1", ng1ViewConfigFactory);
      
      path = PathFactory.bindTransNodesToPath([root, state].map(_state => new Node(_state, {})));
      path = PathFactory.applyViewConfigs($view, path);

      ctx = new ResolveContext(path);
    });

    it('uses the controllerProvider to get controller dynamically', inject(function ($view, $q) {
      $controllerProvider.register("AcmeFooController", function($scope, foo) { });
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      let view = tail(path).views[0];
      view.load();
      $q.flush();
      expect(ctrlExpression).toEqual("FooController as foo");
    }));
  });
});