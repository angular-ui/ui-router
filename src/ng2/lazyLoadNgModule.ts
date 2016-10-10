/** @module ng2 */ /** */
import {NgModuleFactoryLoader, NgModuleRef, Injector, NgModuleFactory, Type, Compiler} from "@angular/core";
import {Transition, LazyLoadResult, UIRouter, Resolvable, NATIVE_INJECTOR_TOKEN, isString} from "ui-router-core";
import {RootModule, StatesModule, UIROUTER_ROOT_MODULE, UIROUTER_MODULE_TOKEN} from "./uiRouterNgModule";
import {applyModuleConfig} from "./uiRouterConfig";

export type ModuleTypeCallback = () => Type<any> | Promise<Type<any>>;
export type NgModuleToLoad = string | ModuleTypeCallback;

/**
 * Returns a function which lazy loads a nested module
 *
 * Use this function as a [[StateDeclaration.lazyLoad]] property to lazy load an NgModule and its state.
 *
 * @param moduleToLoad
 *    If a string, it should be the path to the NgModule code, which will then be loaded by the `NgModuleFactoryLoader`.
 *    If a function, the function should load the NgModule code and return a reference to the `NgModule` class being loaded.
 *
 * @returns A function which takes a transition, which:
 * - Gets the Injector (scoped properly for the destination state)
 * - Loads and creates the NgModule
 * - Finds the "replacement state" for the target state, and adds the new NgModule Injector to it (as a resolve)
 * - Returns the new states array
 */
export function loadNgModule(moduleToLoad: NgModuleToLoad): (transition: Transition) => Promise<LazyLoadResult> {
  return function(transition: Transition) {
    const ng2Injector = transition.injector().get(NATIVE_INJECTOR_TOKEN);

    const createModule = (factory: NgModuleFactory<any>) =>
        factory.create(ng2Injector);

    const applyModule = (moduleRef: NgModuleRef<any>) =>
        applyNgModule(transition, moduleRef);

    return loadModuleFactory(moduleToLoad, ng2Injector)
        .then(createModule)
        .then(applyModule);
  }
}

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
export function loadModuleFactory(moduleToLoad: NgModuleToLoad, ng2Injector: Injector): Promise<NgModuleFactory<any>> {
  if (isString(moduleToLoad)) {
    return ng2Injector.get(NgModuleFactoryLoader).load(moduleToLoad);
  }

  const compiler: Compiler = ng2Injector.get(Compiler);
  const offlineMode = compiler instanceof Compiler;
  const loadChildrenPromise = Promise.resolve(moduleToLoad());
  const compileAsync = (moduleType: Type<any>) =>
      compiler.compileModuleAsync(moduleType);

  return offlineMode ? loadChildrenPromise : loadChildrenPromise.then(compileAsync)
}

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
export function applyNgModule(transition: Transition, ng2Module: NgModuleRef<any>): LazyLoadResult {
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
    throw new Error(`The module that was lazy loaded by activating ${originalName} should also have a ui-router state named '${originalName}'`);
  }

  // Supply the newly loaded states with the Injector from the lazy loaded NgModule
  replacementState.$$state().resolvables.push(Resolvable.fromData(NATIVE_INJECTOR_TOKEN, injector));

  return {};
}
