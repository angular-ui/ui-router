/** @module ng2 */ /** */
import {UIRouter} from "../router";
import {ChildModule, RootModule} from "./uiRouterNgModule";
import {Injector} from "@angular/core";
import {isDefined} from "../common/predicates";

export function applyModuleConfig(uiRouter: UIRouter, injector: Injector, options: ChildModule) {
  if (options.configClass) {
    injector.get(options.configClass);
  }

  let states = options.states || [];
  states.forEach(state => uiRouter.stateRegistry.register(state));
}

export function applyRootModuleConfig(uiRouter: UIRouter, injector: Injector, config: RootModule) {
  if (isDefined(config.deferIntercept)) {
    uiRouter.urlRouterProvider.deferIntercept(config.deferIntercept);
  }

  if (isDefined(config.otherwise)) {
    if (isDefined(config.otherwise['state'])) {
      uiRouter.urlRouterProvider.otherwise(function() {
        let { state, params } = <any> config.otherwise;
        uiRouter.stateService.go(state, params, { source: "otherwise" });
        return null;
      });
    } else {
      uiRouter.urlRouterProvider.otherwise(<any> config.otherwise);
    }
  }

  applyModuleConfig(uiRouter, injector, config);
}


