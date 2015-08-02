/// <reference path='../../typings/angularjs/angular.d.ts' />

import {isObject, isString, extend, forEach, noop, prop, pick, map, filter, parse} from "../common/common";
import trace  from "../common/trace";
import {IPromise} from "angular";
import {IState} from "../state/interface";
import Path from "./path";
import Resolvable from "./resolvable";
import {IResolvables, IPromises} from "./interface";
import {runtime} from "../common/angular1";

interface IOrdinals { [key: string]: number };
interface IPolicies { [key: string]: string };
// TODO: convert to enum
// Defines the available policies and their ordinals.
const resolvePolicies: IOrdinals = { 
  eager: 3, // Eager resolves are resolved before the transition starts.
  lazy: 2, // Lazy resolves are resolved before their state is entered.
  jit: 1 // JIT resolves are resolved just-in-time, right before an injected function that depends on them is invoked. 
};
var defaultResolvePolicy = "jit"; // TODO: make this configurable

/**
 * Given a state's resolvePolicy attribute and map of resolvables, returns the policy ordinal for each resolvable
 * Use the policy declared for the Resolve. If undefined, use the policy declared for the State.  If
 * undefined, use the system defaultResolvePolicy.
 * 
 * @param stateResolvePolicyConf The raw resolvePolicy declaration on the state object; may be a String or Object
 * @param resolvables The resolvables to fetch resolve policies for
 */
function getResolvablesPolicies(stateResolvePolicyConf, resolvables: IResolvables): IOrdinals {
  // Normalize the configuration on the state to either state-level (a string) or resolve-level (a Map of string:string)
  let stateLevelPolicy: string = <string> (isString(stateResolvePolicyConf) ? stateResolvePolicyConf : null);
  let resolveLevelPolicies: IPolicies = <any> (isObject(stateResolvePolicyConf) ? stateResolvePolicyConf : {});
  
  const getOrdinalFor = (stateLevelPolicy, resolveLevelPolicies, resolvable) => {
    let policy = resolveLevelPolicies[resolvable.name] || stateLevelPolicy || defaultResolvePolicy;
    return resolvePolicies[policy];  
  }
   
  // Determine each resolvable's Resolve Policy (as an ordinal).
  const toPolicyOrdinal = resolvable => getOrdinalFor(stateLevelPolicy, resolveLevelPolicies, resolvable)
  return <any> map(resolvables, toPolicyOrdinal);
}

/**
 * An element in the path which represents a state and that state's Resolvables and their resolve statuses.
 * When the resolved data is ready, it is stored in each Resolvable object within the PathElement
 *
 * Should be passed a state object.  I think maybe state could even be the public state, so users can add resolves
 * on the fly.
 */
export default class PathElement {
  constructor(state: IState) {
    this.state = state;
    // Convert state's resolvable assoc-array into an assoc-array of empty Resolvable(s)
    const makeResolvable = (resolveFn, resolveName) => new Resolvable(resolveName, resolveFn, state);
    this._resolvables = map(state.resolve || {}, makeResolvable);
  }

  state: IState;
  private _resolvables: Object;

  getResolvables(): Object {
    return this._resolvables;
  }

  addResolvables(resolvablesByName): Object {
    return extend(this._resolvables, resolvablesByName);
  }

  // returns a promise for all the resolvables on this PathElement
  // options.resolvePolicy: only return promises for those Resolvables which are at 
  // the specified policy, or above.  i.e., options.resolvePolicy === 'lazy' will
  // resolve both 'lazy' and 'eager' resolves.
  resolvePathElement(pathContext, options): IPromise<any> {
    options = options || {};
    // The caller can request the path be resolved for a given policy and "below" 
    let policyOrdinal = resolvePolicies[options && options.resolvePolicy || defaultResolvePolicy];
         
    // Get this path element's resolvables
    let resolvables: IResolvables = <any> (new Path([this]).getResolvables());
    // Get each resolvable's resolve policy
    let policies = getResolvablesPolicies(this.state.resolvePolicy, resolvables);

    const matchesRequestedPolicy = resolvable => policies[resolvable.name] >= policyOrdinal;
    let matchingResolves = filter(resolvables, matchesRequestedPolicy);

    const getResolvePromise = (resolvable) => resolvable.get(pathContext, options);
    let resolvablePromises: IPromises = <any> map(matchingResolves, getResolvePromise);

    if (options.trace) trace.traceResolvePathElement(this, matchingResolves, options);

    return runtime.$q.all(resolvablePromises).then(noop);
  }

  // Injects a function at this PathElement level with available Resolvables
  // First it resolves all resolvables.  When they are done resolving, invokes the function.
  // Returns a promise for the return value of the function.
  // public function
  // fn is the function to inject (onEnter, onExit, controller)
  // locals are the regular-style locals to inject
  // pathContext is a Path which is used to retrieve dependent Resolvables for injecting
  invokeLater(fn, locals, pathContext, options): IPromise<any> {
    options = options || {};
    var resolvables = this._resolvablesForFn(fn, pathContext, options, "Later");
    var getPromise = resolvable => resolvable.get(pathContext, options);
    var promises: any = map(resolvables, getPromise);
    
    return runtime.$q.all(promises).then(() => {
      try {
        return this.invokeNow(fn, locals, pathContext, options);
      } catch (error) {
        return runtime.$q.reject(error);
      }
    });
  }

  // private function? Maybe needs to be public-to-$transition to allow onEnter/onExit to be invoked synchronously
  // and in the correct order, but only after we've manually ensured all the deps are resolved.

  // Injects a function at this PathElement level with available Resolvables
  // Does not wait until all Resolvables have been resolved; you must call PathElement.resolve() (or manually resolve each dep) first
  invokeNow(fn: Function, locals: any, pathContext: Path, options: any = {}) {
    var resolvables = this._resolvablesForFn(fn, pathContext, options, "Now  ");
    var resolvedLocals = map(resolvables, prop("data"));
    var combinedLocals = extend({}, locals, resolvedLocals);
    return runtime.$injector.invoke(fn, this.state, combinedLocals);
  }

  /** Inspects a function `fn` for its dependencies.  Returns an object containing matching Resolvables */
  private _resolvablesForFn(fn: Function, pathContext: Path, options, when: string): {[key:string]: Resolvable} {
    var deps = runtime.$injector.annotate(fn);
    var resolvables = <any> pick(pathContext.pathFromRoot(this).getResolvables(), deps);
    if (options.trace) trace.tracePathElementInvoke(this, fn, deps, extend({when: when}, options));
    return resolvables;
  }

  toString(): string {
    var state = parse("state.name")(this) || "(root)";
    return `PathElement(${state})`;
  }
}