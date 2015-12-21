/// <reference path='../typings/angularjs/angular.d.ts' />
/// <reference path='../typings/angularjs/angular-mocks.d.ts' />
/// <reference path='../typings/jasmine/jasmine.d.ts' />

var module = angular.mock.module;

import {inherit, extend, curry} from "../src/common/common";
import {Node} from "../src/path/module";
import {ResolveContext} from "../src/resolve/module";
import {PathFactory} from "../src/path/module";
import {ViewConfig} from "../src/view/module";
import {StateMatcher, StateBuilder} from "../src/state/module";

import {State} from "../src/state/module";

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
    let stateBuilder = new StateBuilder(() => root, matcher, $urlMatcherFactoryProvider);
    register = registerState(states, stateBuilder);
    root = register({name: ""});
  }));

  describe('controller handling', function() {
    let ctx, state;
    beforeEach(() => {
      state = register({ name: "foo" });
      var path = PathFactory.bindTransNodesToPath([root, state].map(_state => new Node(_state, {})));
      ctx = new ResolveContext(path);
    });

    it('uses the controllerProvider to get controller dynamically', inject(function ($view, $q) {
      var ctrlExpression;
      $controllerProvider.register("AcmeFooController", function($scope, foo) { });
      elem.append($compile('<div><ui-view></ui-view></div>')(scope));

      var rootcontext = {name: "", parent: null};
      var viewConfig = {
        viewDeclarationObj: {
          template: "test",
          controllerProvider: function (/* $stateParams, */ foo) { // todo: reimplement localized $stateParams
            ctrlExpression = /* $stateParams.type + */ foo + "Controller as foo";
            return ctrlExpression;
          }
        },
        rawViewName: '$default',
        context: { name: "blarg", parent: rootcontext },
        params: {type: "Acme"},
        locals: {}
      };
      var injector = {
        invokeNow: (fn, locals) => $injector.invoke(fn, null, locals),
        invokeLater: (fn, locals) => $injector.invoke(fn, null, locals)
      };
      $view.load(new ViewConfig(viewConfig), injector);
      $q.flush();
      expect(ctrlExpression).toEqual("FooController as foo");
    }));
  });
});