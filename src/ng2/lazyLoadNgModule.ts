/** @module ng2 */ /** */
import {NgModuleFactoryLoader, NgModuleRef, Injector, NgModuleFactory, Type, Compiler} from "@angular/core";

import {LazyLoadResult} from "ui-router-core";

import {Transition} from "ui-router-core";
import {RootModule, StatesModule, UIROUTER_ROOT_MODULE, UIROUTER_MODULE_TOKEN} from "./uiRouterNgModule";
import {applyModuleConfig} from "./uiRouterConfig";
import {UIRouter} from "ui-router-core";
import {Resolvable} from "ui-router-core";
import {NATIVE_INJECTOR_TOKEN} from "ui-router-core";

export type ModuleTypeCallback = () => Type<any> | Promise<Type<any>>;

/**
 * Returns a function which lazy loads a nested module
 *
 * Use this function as a [[StateDeclaration.lazyLoad]] property to lazy load a state tree (an NgModule).
 *
 * @param path the path to the module source code.
 * @returns A function which takes a transition, then:
 *
 * - Gets the Injector (scoped properly for the destination state)
 * - Loads and creates the NgModule
 * - Finds the "replacement state" for the target state, and adds the new NgModule Injector to it (as a resolve)
 *
 * returns the new states array
 */
export function loadNgModule( moduleToLoad: string | ModuleTypeCallback): (transition: Transition) => Promise<LazyLoadResult> {
  /** Get the parent NgModule Injector (from resolves) */
  const getNg2Injector = (transition: Transition) =>
      transition.injector().getAsync(NATIVE_INJECTOR_TOKEN);

  /**
   * Returns the module factory that can be used to instantiate a module
   *
   * For strings this:
   * - Finds the correct NgModuleFactoryLoader
   * - Loads the new NgModuleFactory from the path string (async)
   *
   * For a Type<any> or Promise<Type<any>> this:
   * - Compiles the component type (if not running with AOT)
   * - Returns the NgModuleFactory resulting from compilation (or direct loading if using AOT) as a Promise
   *
   */
  const loadModuleFactory = (loadChildren: string | ModuleTypeCallback, ng2Injector: Injector): Promise<NgModuleFactory<any>>=>{
    if(typeof(loadChildren) === 'string'){
      return ng2Injector.get(NgModuleFactoryLoader).load(loadChildren);
    }
    else{
     const compiler: Compiler = ng2Injector.get(Compiler);
     const offlineMode = compiler instanceof Compiler;
     const loadChildrenPromise = Promise.resolve(loadChildren());
     return offlineMode ? loadChildrenPromise : loadChildrenPromise.then( moduleType => compiler.compileModuleAsync(moduleType))
    }
  }

  /**
   * Lazy loads the NgModule using the NgModuleFactoryLoader
   *
   * Use the parent NgModule's Injector to:
   * - Find the correct NgModuleFactory
   * - Create the new NgModule
   */
  const createNg2Module = ( moduleToLoad: string | ModuleTypeCallback , ng2Injector: Injector) =>
      loadModuleFactory(moduleToLoad, ng2Injector).then((factory: NgModuleFactory<any>) =>
          factory.create(ng2Injector));


  /**
   * Apply the UI-Router Modules found in the lazy loaded module.
   *
   * Apply the Lazy Loaded NgModule's newly created Injector to the right state in the state tree.
   *
   * Lazy loading uses a placeholder state which is removed (and replaced) after the module is loaded.
   * The NgModule should include a state with the same name as the placeholder.
   *
   * Find the *newly loaded state* with the same name as the *placeholder state*.
   * The NgModule's Injector (and ComponentFactoryResolver) will be added to that state.
   * The Injector/Factory are used when creating Components for the `replacement` state and all its children.
   */
  function loadUIRouterModules(transition: Transition, ng2Module: NgModuleRef<any>): LazyLoadResult {
    let injector = ng2Module.injector;
    let parentInjector = <Injector> ng2Module.injector['parent'];
    let uiRouter: UIRouter = injector.get(UIRouter);

    let originalName = transition.to().name;
    let originalState = uiRouter.stateRegistry.get(originalName);

    let rootModules: RootModule[] = injector.get(UIROUTER_ROOT_MODULE);
    let parentRootModules: RootModule[] = parentInjector.get(UIROUTER_ROOT_MODULE);
    let newRootModules = rootModules.filter(module => parentRootModules.indexOf(module) === -1);

    if (newRootModules.length) {
      console.log(rootModules);
      throw new Error('Lazy loaded modules should not contain a UIRouterModule.forRoot() module');
    }

    let modules: StatesModule[] = injector.get(UIROUTER_MODULE_TOKEN);
    modules.forEach(module => applyModuleConfig(uiRouter, injector, module));

    let replacementState = uiRouter.stateRegistry.get(originalName);
    if (replacementState === originalState) {
      throw new Error(`The module that was loaded from ${moduleToLoad} should have a ui-router state named '${originalName}'`);
    }

    // Supply the newly loaded states with the Injector from the lazy loaded NgModule
    replacementState.$$state().resolvables.push(Resolvable.fromData(NATIVE_INJECTOR_TOKEN, injector));

    return {};
  }

  return (transition: Transition) => getNg2Injector(transition)
      .then((injector: Injector) => createNg2Module(moduleToLoad, injector))
      .then((moduleRef: NgModuleRef<any>) => loadUIRouterModules(transition, moduleRef))
}
