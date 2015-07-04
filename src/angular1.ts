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


runBlock.$inject = ["$injector"];
function runBlock($injector) {
  runtime.setRuntimeInjector($injector);
}

app.run(runBlock);
