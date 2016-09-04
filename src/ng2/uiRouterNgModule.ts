/** @module ng2 */ /** */
import {Ng2StateDeclaration} from "./interface";
import {NgModule, NgModuleMetadataType, OpaqueToken} from "@angular/core";
import {_UIROUTER_DIRECTIVES} from "./directives/directives";
import {_UIROUTER_PROVIDERS} from "./providers";
import {UIView} from "./directives/uiView";
import {uniqR, flattenR} from "../common/common";

@NgModule({
  declarations: [_UIROUTER_DIRECTIVES],
  exports: [_UIROUTER_DIRECTIVES],
  entryComponents: [UIView],
  providers: [_UIROUTER_PROVIDERS]
})
export class UIRouterLibraryModule {}

/**
 * A module declaration lteral, including UI-Router states.
 * 
 * This interface extends the NG2 [NgModuleMetadataType](https://angular.io/docs/ts/latest/api/core/index/NgModuleMetadataType-interface.html)
 * by adding a `states` array.
 */
export interface UIRouterModuleMetadata extends NgModuleMetadataType {
  states?: Ng2StateDeclaration[]
}

export const UIROUTER_STATES_TOKEN = new OpaqueToken("UIRouter States");

/**
 * Declares a NgModule with UI-Router states
 * 
 * A Typescript decorator for declaring an [NgModule](https://angular.io/docs/ts/latest/guide/ngmodule.html)
 * which contains UI-Router states and/or uses UI-Router directives and providers.
 *
 * The decorator adds the `UIRouterLibraryModule` NgModule as an import.
 * The `UIRouterLibraryModule has the UI-Router directives and providers.
 * 
 * The decorator also analyzes the `states:` property.
 * When it finds a state with a routed `component:`, it adds the component
 * to the module's `declarations` and `entryComponents`.
 *
 * Note: adding the component to `entryComponents` instructs the Module Compiler that those
 * components should be compiled.
 * Otherwise, they would not be automatically discovered as "reachable" by the compiler.
 *
 * Further, the states found in the `states:` property are added to Dependency Injection
 * using a specific token.
 * This will automatically register them with the [[StateRegistry]] when the application bootstraps.
 *
 * @example
 * ```js
 * 
 * var homeState = { name: 'home', url: '/home', component: Home };
 * var aboutState = { name: 'about', url: '/about', component: About };
 *
 * @UIRouterModule({
 *   imports: [ BrowserModule ],
 *   declarations: [ NonRoutedComponent ],
 *   states: [ homeState, aboutState ]
 * }) export class AppModule {};
 * ```
 *
 * ---
 *
 * Note: the `UIRouterModule` decorator creates a standard Angular 2 `NgModule`.
 * The equivalent `AppModule` could also be crafted by hand using only the `NgModule` decorator:
 *
 * ```
 * var homeState = { name: 'home', url: '/home', component: Home };
 * var aboutState = { name: 'about', url: '/about', component: About };
 *
 * @NgModule({
 *   imports: [BrowserModule, UIRouterLibraryModule],
 *   declarations: [NonRoutedComponent, Home, About],
 *   entryComponents: [Home, About],
 *   providers: [
 *    { provide: UIROUTER_STATES_TOKEN, useValue: [homeState, aboutState], multi: true }
 *   ]
 * }) export class AppModule {};
 *
 * ```
 * 
 * @param moduleMetaData the [[UIRouterModuleMetadata]] 
 *        (See also [NgModuleMetadataType](https://angular.io/docs/ts/latest/api/core/index/NgModuleMetadataType-interface.html)
 */
export function UIRouterModule(moduleMetaData: UIRouterModuleMetadata) {
  let states = moduleMetaData.states || [];
  var statesProvider = { provide: UIROUTER_STATES_TOKEN, useValue: states, multi: true };

  // Get the component classes for all views for all states in the module
  let routedComponents = states.reduce(flattenR, [])
      .map(state => state.views || { $default: state })
      .map(viewObj => Object.keys(viewObj).map(key => viewObj[key].component))
      .reduce((acc, arr) => acc.concat(arr), [])
      .filter(x => typeof x === 'function' && x !== UIView);

  moduleMetaData.imports          = <any[]> (moduleMetaData.imports || []).concat(UIRouterLibraryModule).reduce(uniqR, []);
  moduleMetaData.declarations     = <any[]> (moduleMetaData.declarations || []).concat(routedComponents).reduce(uniqR, []);
  moduleMetaData.entryComponents  = <any[]> (moduleMetaData.entryComponents || []).concat(routedComponents).reduce(uniqR, []);
  moduleMetaData.providers        = (moduleMetaData.providers || []).concat(statesProvider);

  return function(moduleClass) {
    return NgModule(moduleMetaData)(moduleClass);
  }
}
