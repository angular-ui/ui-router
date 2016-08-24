import {Ng2StateDeclaration} from "./interface";
import {NgModule, NgModuleMetadataType, OpaqueToken} from "@angular/core";
import {UIROUTER_DIRECTIVES} from "./directives/directives";
import {UIROUTER_PROVIDERS} from "./providers";
import {UIView} from "./directives/uiView";
import {uniqR} from "../common/common";

@NgModule({
  declarations: [UIROUTER_DIRECTIVES],
  exports: [UIROUTER_DIRECTIVES],
  entryComponents: [UIView],
  providers: [UIROUTER_PROVIDERS]
})
export class _UIRouterModule {}

/**
 * A module declaration lteral, including UI-Router states.
 * 
 * This interface extends the NG2 [NgModuleMetadataType](https://angular.io/docs/ts/latest/api/core/index/NgModuleMetadataType-interface.html)
 * by adding a `states` array.
 */
export interface UIRouterModuleMetadata extends NgModuleMetadataType {
  states?: Ng2StateDeclaration[]
}

export const UIROUTER_STATES_TOKEN = new OpaqueToken("UIRouterStates");

/**
 * Declares a NgModule with UI-Router states
 * 
 * A Typescript decorator for declaring a [NgModule](https://angular.io/docs/ts/latest/guide/ngmodule.html)
 * which contains UI-Router states.
 * 
 * This decorator analyzes the `states` in the module.
 * It adds all routed `component:`(s) for each state to the module's `declarations` and `entryComponents`.
 *
 * @example
 * ```js
 * 
 * var homeState = { name: 'home', url: '/home', component: Home };
 * var aboutState = { name: 'about', url: '/about', component: About };
 * @UIRouterModule({
 *   imports: [BrowserModule],
 *   declarations: [NonRoutedComponent],
 *   states: [homeState, aboutState]
 * }) export class AppModule {};
 * ```
 * 
 * @param moduleMetaData the [[UIRouterModuleMetadata]] 
 *        (See also [NgModuleMetadataType](https://angular.io/docs/ts/latest/api/core/index/NgModuleMetadataType-interface.html)
 */
export function UIRouterModule(moduleMetaData: UIRouterModuleMetadata) {
  let states = moduleMetaData.states || [];

  // Get the component classes for all views for all states in the module
  let components = states.map(state => state.views || { $default: state })
      .map(viewObj => Object.keys(viewObj).map(key => viewObj[key].component))
      .reduce((acc, arr) => acc.concat(arr), [])
      .filter(x => typeof x === 'function' && x !== UIView);

  moduleMetaData.imports = <any[]> (moduleMetaData.imports || []).concat(_UIRouterModule).reduce(uniqR, []);
  moduleMetaData.declarations = <any[]> (moduleMetaData.declarations || []).concat(components).reduce(uniqR, []);
  moduleMetaData.entryComponents = <any[]> (moduleMetaData.entryComponents || []).concat(components).reduce(uniqR, []);
  moduleMetaData.providers = (moduleMetaData.providers || []).concat({ provide: UIROUTER_STATES_TOKEN, useValue: states });

  return function(moduleClass) {
    return NgModule(moduleMetaData)(moduleClass);
  }
}
