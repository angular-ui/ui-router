/** @module ng1 */ /** */
import {State} from "../../state/stateObject";
import {isObject, isString, isInjectable} from "../../common/predicates";
import {Resolvable} from "../../resolve/resolvable";
import {services} from "../../common/coreservices";

/**
 * This is a [[StateBuilder.builder]] function for angular1 `resolve:` block on a [[Ng1StateDeclaration]].
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `resolve` property with logic specific to angular-ui-router (ng1).
 */
export function ng1ResolveBuilder(state: State) {
    return isObject(state.resolve) ? makeResolvables(state.resolve) : [];
}

/** Validates the result map as a "resolve:" style object, then transforms the resolves into Resolvable[] */
export function makeResolvables(resolves: { [key: string]: Function; }): Resolvable[] {
  // desugar ng1 sugar to create a resolve that is a service
  // e.g., resolve: { myService: 'myService' }
  const resolveServiceFromString = tuple => {
    if (!isString(tuple.val)) return tuple;

    injectService.$inject = [tuple.val];
    function injectService(svc) { return svc; }
    return { key: tuple.key, val: injectService };
  };

  // Convert from object to tuple array
  let tuples = Object.keys(resolves).map(key => ({key, val: resolves[key]})).map(resolveServiceFromString);

  // If a hook result is an object, it should be a map of strings to (functions|strings).
  let invalid = tuples.filter(tuple => !isInjectable(tuple.val));
  if (invalid.length)
    throw new Error(`Invalid resolve key/value: ${invalid[0].key}/${invalid[0].val}`);

  const deps = (resolveFn) => services.$injector.annotate(resolveFn, services.$injector.strictDi);
  return tuples.map(tuple => new Resolvable(tuple.key, tuple.val, deps(tuple.val)));
}
