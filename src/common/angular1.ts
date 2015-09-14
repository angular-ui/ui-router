/// <reference path='../../typings/angularjs/angular.d.ts' />
import {IQService} from "angular";

let app = angular.module("ui.router.angular1", []);

interface IRuntime {
  setRuntimeInjector($injector: ng.auto.IInjectorService);
  $injector: ng.auto.IInjectorService;
  $q: IQService;
}

export let runtime: IRuntime = {
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
 */

export function annotateController(controllerExpression) {
  let $injector = runtime.$injector;
  let $controller = $injector.get("$controller");
  let oldInstantiate = $injector.instantiate;
  try {
    let deps;

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
