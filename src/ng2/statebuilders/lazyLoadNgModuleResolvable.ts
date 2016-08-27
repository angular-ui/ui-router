/** @module ng2 */ /** */
import {State} from "../../state/stateObject";
import {NG2_INJECTOR_TOKEN} from "../interface";
import {Resolvable} from "../../resolve/resolvable";

/**
 * This is a [[StateBuilder.builder]] function which enables lazy Ng2Module support.
 * 
 * See [[loadNgModule]]
 *
 * After lazy loading an NgModule, any Components from that module should be created using the NgModule's Injecjtor.
 * The NgModule's ComponentFactory only exists inside that Injector.
 * 
 * After lazy loading an NgModule, it is stored on the root state of the lazy loaded state tree.
 * When instantiating Component, the parent Component's Injector is merged with the NgModule injector.
 */
export function ngModuleResolvablesBuilder(state: State, parentFn: Function): Resolvable[] {
  let resolvables: Resolvable[] = parentFn(state);
  let injector = state.self['_ngModuleInjector'];
  return !injector ? resolvables : resolvables.concat(Resolvable.fromData(NG2_INJECTOR_TOKEN, injector));
}
