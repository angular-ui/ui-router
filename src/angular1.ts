/// <reference path='../bower_components/DefinitelyTyped/angularjs/angular.d.ts' />
import {IPromise, IQService} from "angular";

var app = angular.module("ui.router.angular1", []);

interface IRuntime {
  setRuntimeInjector($injector: ng.auto.IInjectorService),
  $injector: ng.auto.IInjectorService,
  $q: IQService
}

export var runtime: IRuntime = {
  setRuntimeInjector: function($injector: ng.auto.IInjectorService) {
    runtime.$injector = $injector;
    runtime.$q = $injector.get("$q");
  },
  $injector: undefined,
  $q: undefined
};

/**
 * Annotates a controller expression (may be a controller function(), a "controllername",
 * or "controllername as name")
 *
 * - Temporarily decorates $injector.instantiate.
 * - Invokes $controller() service
 *   - Calls $injector.instantiate with controller constructor
 * - Annotate constructor
 * - Undecorate $injector
 * */
export function annotateController($controller: Function, $injector: ng.auto.IInjectorService, controllerExpression) {
  var oldInstantiate = $injector.instantiate;
  try {
    var deps;

    $injector.instantiate = function fakeInstantiate(constructorFunction) {
      $injector.instantiate = oldInstantiate; // Un-decorate ASAP
      deps = $injector.annotate(constructorFunction);
    };

    $controller(controllerExpression, { $scope: {} });

    return deps;
  } finally {
    $injector.instantiate = oldInstantiate;
  }
}

runBlock.$inject = ["$injector"];
function runBlock($injector) {
  runtime.setRuntimeInjector($injector);
}

app.run(runBlock);
