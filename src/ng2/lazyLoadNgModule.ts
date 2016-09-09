/** @module ng2 */ /** */
import {Transition} from "../transition/transition";
import {NG2_INJECTOR_TOKEN, Ng2StateDeclaration} from "./interface";
import {UIROUTER_STATES_TOKEN} from "./uiRouterNgModule";

import {NgModuleFactoryLoader, NgModuleRef, Injector, NgModuleFactory} from "@angular/core";
import {unnestR} from "../common/common";
import {LazyLoadResult} from "../state/interface";

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
export function loadNgModule(path: string): (transition: Transition) => Promise<LazyLoadResult> {
  /** Get the parent NgModule Injector (from resolves) */
  const getNg2Injector = (transition: Transition) =>
      transition.injector().getAsync(NG2_INJECTOR_TOKEN);

  /**
   * Lazy loads the NgModule using the NgModuleFactoryLoader
   *
   * Use the parent NgModule's Injector to:
   * - Find the correct NgModuleFactoryLoader
   * - Load the new NgModuleFactory from the path string (async)
   * - Create the new NgModule
   */
  const createNg2Module = (path: string, ng2Injector: Injector) =>
      ng2Injector.get(NgModuleFactoryLoader).load(path).then((factory: NgModuleFactory<any>) => 
          factory.create(ng2Injector));

  /**
   * Apply the Lazy Loaded NgModule's Injector to the newly loaded state tree.
   *
   * Lazy loading uses a placeholder state which is removed (and replaced) after the module is loaded.
   * The NgModule should include a state with the same name as the placeholder.
   *
   * Find the *newly loaded state* with the same name as the *placeholder state*.
   * The NgModule's Injector (and ComponentFactoryResolver) will be added to that state.
   * The Injector/Factory are used when creating Components for the `replacement` state and all its children.
   */
  function applyNgModuleToNewStates(transition: Transition, ng2Module: NgModuleRef<any>): LazyLoadResult {
    var targetName = transition.to().name;
    let newStates: Ng2StateDeclaration[] = ng2Module.injector.get(UIROUTER_STATES_TOKEN).reduce(unnestR, []);
    let replacementState = newStates.find(state => state.name === targetName);
    
    if (!replacementState) {
      throw new Error(`The module that was loaded from ${path} should have a state named '${targetName}'` +
          `, but it only had: ${(newStates || []).map(s=>s.name).join(', ')}`);
    }
        
    // Add the injector as a resolve.
    replacementState['_ngModuleInjector'] = ng2Module.injector;

    // Return states to be registered by the lazyLoadHook
    return { states: newStates };
  }

  return (transition: Transition) => getNg2Injector(transition)
      .then((injector: Injector) => createNg2Module(path, injector))
      .then((moduleRef: NgModuleRef<any>) => applyNgModuleToNewStates(transition, moduleRef))
}
