/** @module ng1 */ /** */
import {State} from "../state/stateObject";
import {forEach} from "../common/common";
import {isString} from "../common/predicates";

/**
 * This is a [[StateBuilder.builder]] function for angular1 `resolve:` block on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `resolve` property with logic specific to angular-ui-router (ng1).
 */
export function ng1ResolveBuilder(state: State) {
  let resolve = {};
  forEach(state.resolve || {}, function (resolveFn, name: string) {
    resolve[name] = isString(resolveFn) ? [ resolveFn, x => x ] : resolveFn;
  });
  return resolve;
}
