import * as angular from "angular";
import { UIRouter, trace } from "@uirouter/core";

declare var inject;

var module = angular.mock.module;
describe('UI-Router services', () => {
  var $uiRouterProvider: UIRouter, $uiRouter: UIRouter;
  var providers;
  var services;

  beforeEach(module('ui.router', function(
      _$uiRouterProvider_,
      $urlMatcherFactoryProvider,
      $urlRouterProvider,
      $stateRegistryProvider,
      $uiRouterGlobalsProvider,
      $transitionsProvider,
      $stateProvider,
  ) {
    $uiRouterProvider = _$uiRouterProvider_;

    expect($uiRouterProvider['router']).toBe($uiRouterProvider);

    providers =  {
      $uiRouterProvider,
      $urlMatcherFactoryProvider,
      $urlRouterProvider,
      $stateRegistryProvider,
      $uiRouterGlobalsProvider,
      $transitionsProvider,
      $stateProvider,
    };
  }));

  beforeEach(inject(function(
      _$uiRouter_,
      $urlMatcherFactory,
      $urlRouter,
      $stateRegistry,
      $uiRouterGlobals,
      $transitions,
      $state,
      $stateParams,
      $templateFactory,
      $view,
      $trace,
  ) {
    $uiRouter = _$uiRouter_;

    services = {
      $urlMatcherFactory,
      $urlRouter,
      $stateRegistry,
      $uiRouterGlobals,
      $transitions,
      $state,
      $stateParams,
      $templateFactory,
      $view,
      $trace,
    }
  }));

  it("Should expose ui-router providers from the UIRouter instance", () => {
    expect(providers.$urlMatcherFactoryProvider).toBe($uiRouterProvider.urlMatcherFactory);
    expect(providers.$urlRouterProvider).toBe($uiRouterProvider.urlRouterProvider);
    expect(providers.$stateRegistryProvider).toBe($uiRouterProvider.stateRegistry);
    expect(providers.$uiRouterGlobalsProvider).toBe($uiRouterProvider.globals);
    expect(providers.$transitionsProvider).toBe($uiRouterProvider.transitionService);
    expect(providers.$stateProvider).toBe($uiRouterProvider.stateProvider);
  });

  it("Should expose ui-router services from the UIRouter instance", () => {
    expect($uiRouter).toBe($uiRouterProvider);
    expect(services.$urlMatcherFactory).toBe($uiRouter.urlMatcherFactory);
    expect(services.$urlRouter).toBe($uiRouter.urlRouter);
    expect(services.$stateRegistry).toBe($uiRouter.stateRegistry);
    expect(services.$uiRouterGlobals).toBe($uiRouter.globals);
    expect(services.$transitions).toBe($uiRouter.transitionService);
    expect(services.$state).toBe($uiRouter.stateService);
    expect(services.$stateParams).toBe($uiRouter.globals.params);
    expect(services.$templateFactory.constructor.name).toBe("TemplateFactory");
    expect(services.$view).toBe($uiRouter.viewService);
    expect(services.$trace).toBe(trace);
  });
});