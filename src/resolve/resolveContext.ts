/// <reference path='../../typings/angularjs/angular.d.ts' />
import {filter, map, noop, defaults, extend, prop, pick, omit, isString, isObject} from "../common/common"
import trace from "../common/trace"
import {runtime} from "../common/angular1"
import {IPromise} from "angular"

import {ITransPath, ITransNode} from "../path/interface"
import Path from "./../path/path"

import {IPromises, IResolvables,ResolvePolicy, IOptions1} from "./interface"
import Resolvable from "./resolvable"
import {IState} from "../state/interface"

var defaultResolvePolicy = "JIT"; // TODO: make this configurable

interface IOrdinals { [key: string]: number }
interface IPolicies { [key: string]: string }

export default class ResolveContext {
  constructor(private _path: ITransPath) { }
 
  /**
   * Gets the available Resolvables for the last element of this path.
   *
   * @param options
   *
   * options.omitOwnLocals: array of property names
   *   Omits those Resolvables which are found on the last element of the path.
   *
   *   This will hide a deepest-level resolvable (by name), potentially exposing a parent resolvable of
   *   the same name further up the state tree.
   *
   *   This is used by Resolvable.resolve() in order to provide the Resolvable access to all the other
   *   Resolvables at its own PathElement level, yet disallow that Resolvable access to its own injectable Resolvable.
   *
   *   This is also used to allow a state to override a parent state's resolve while also injecting
   *   that parent state's resolve:
   *
   *   state({ name: 'G', resolve: { _G: function() { return "G"; } } });
   *   state({ name: 'G.G2', resolve: { _G: function(_G) { return _G + "G2"; } } });
   *   where injecting _G into a controller will yield "GG2"
   */
  getResolvables(state?: IState, options?: any): IResolvables {
    options = defaults(options, { omitOwnLocals: [] });
    let path: ITransPath = (state ? this._path.pathFromRootTo(state) : this._path);
    var last = path.last();
    
    return path.nodes().reduce((memo, node) => {
      var omitProps = (node === last) ? options.omitOwnLocals : [];
      var filteredResolvables = omit(node.ownResolvables, omitProps);
      return extend(memo, filteredResolvables);
    }, {});
  }

  isolateRootTo(state: IState): ResolveContext {
    return new ResolveContext(this._path.pathFromRootTo(state))
  }
  
  addResolvables(resolvables: IResolvables, state: IState) {
    let node = this._path.elementForState(state);
    extend(node.ownResolvables, resolvables);
  }
  
  /** Gets the resolvables declared on a particular state */
  getOwnResolvables(state: IState): IResolvables {
    return extend({}, this._path.elementForState(state).ownResolvables);
  }
   
  // Returns a promise for an array of resolved Path Element promises
  resolvePath(options: IOptions1): IPromise<any> {
    options = options || <any> {};
    if (options.trace) trace.traceResolvePath(this, options);
    const promiseForNode = (node: ITransNode) => this.resolvePathElement(node.state, options);
    return runtime.$q.all(<any> map(this._path.nodes(), promiseForNode)).then(noop);
  }

  // returns a promise for all the resolvables on this PathElement
  // options.resolvePolicy: only return promises for those Resolvables which are at 
  // the specified policy, or above.  i.e., options.resolvePolicy === 'lazy' will
  // resolve both 'lazy' and 'eager' resolves.
  resolvePathElement(state: IState, options: IOptions1): IPromise<any> {
    options = options || {};
    // The caller can request the path be resolved for a given policy and "below" 
    let policy: string = options && options.resolvePolicy;
    let policyOrdinal: number = ResolvePolicy[policy || defaultResolvePolicy];
    // Get path Resolvables available to this element
    let resolvables = this.getOwnResolvables(state);

    const matchesRequestedPolicy = resolvable => getPolicy(state.resolvePolicy, resolvable) >= policyOrdinal;
    let matchingResolves = filter(resolvables, matchesRequestedPolicy);

    const getResolvePromise = (resolvable: Resolvable) => resolvable.get(this.isolateRootTo(state), options);
    let resolvablePromises: IPromises = <any> map(matchingResolves, getResolvePromise);

    if (options.trace) trace.traceResolvePathElement(this, matchingResolves, options);

    return runtime.$q.all(resolvablePromises).then(noop);
  } 
  
  
  /**
   * Injects a function given the Resolvables available in the ITransPath, from the first node
   * up to the node for the given state.
   *
   * First it resolves all the resolvable depencies.  When they are done resolving, it invokes
   * the function.
   *
   * @return a promise for the return value of the function.
   *
   * @param state: The state context object (within the Path)
   * @param fn: the function to inject (i.e., onEnter, onExit, controller)
   * @param locals: are the angular $injector-style locals to inject
   * @param options: options (TODO: document)
   */
  invokeLater(state: IState, fn: Function, locals: any, options): IPromise<any> {
    options = options || {};
    var resolvables = resolvablesForFn(fn, this.isolateRootTo(state), options, "Later");
    const getPromise = (resolvable: Resolvable) => resolvable.get(this.isolateRootTo(state), options);
    var promises: IPromises = <any> map(resolvables, getPromise);
    
    return runtime.$q.all(promises).then(() => {
      try {
        return this.invokeNow(state, fn, locals, options);
      } catch (error) {
        return runtime.$q.reject(error);
      }
    });
  }

  /**
   * Immediately injects a function with the dependent Resolvables available in the ITransPath, from
   * the first node up to the node for the given state.
   *
   * If a Resolvable is not yet resolved, then null is injected in place of the resolvable.
   *
   * @return the return value of the function.
   *
   * @param state: The state context object (within the Path)
   * @param fn: the function to inject (i.e., onEnter, onExit, controller)
   * @param locals: are the angular $injector-style locals to inject
   * @param options: options (TODO: document)
   */
  // Injects a function at this PathElement level with available Resolvables
  // Does not wait until all Resolvables have been resolved; you must call PathElement.resolve() (or manually resolve each dep) first
  invokeNow(state: IState, fn: Function, locals: any, options: any = {}) {
    var resolvables = resolvablesForFn(fn, this, options, "Now  ");
    var resolvedLocals = map(resolvables, prop("data"));
    var combinedLocals = extend({}, locals, resolvedLocals);
    return runtime.$injector.invoke(fn, state, combinedLocals);
  }
}

/**
 * Given a state's resolvePolicy attribute and a resolvable from that state, returns the policy ordinal for the Resolvable
 * Use the policy declared for the Resolve. If undefined, use the policy declared for the State.  If
 * undefined, use the system defaultResolvePolicy.
 * 
 * @param stateResolvePolicyConf The raw resolvePolicy declaration on the state object; may be a String or Object
 * @param resolvable The resolvable to compute the policy for
 */
function getPolicy(stateResolvePolicyConf, resolvable: Resolvable): number {
  // Normalize the configuration on the state to either state-level (a string) or resolve-level (a Map of string:string)
  let stateLevelPolicy: string = <string> (isString(stateResolvePolicyConf) ? stateResolvePolicyConf : null);
  let resolveLevelPolicies: IPolicies = <any> (isObject(stateResolvePolicyConf) ? stateResolvePolicyConf : {});
  let policyName = resolveLevelPolicies[resolvable.name] || stateLevelPolicy || defaultResolvePolicy;
  return ResolvePolicy[policyName];  
}


/** Inspects a function `fn` for its dependencies.  Returns an object containing matching Resolvables */
function resolvablesForFn(fn: Function, resolveContext: ResolveContext, options, when: string): {[key:string]: Resolvable} {
  var deps = runtime.$injector.annotate(fn);
  var resolvables = <any> pick(resolveContext.getResolvables(), deps);
  if (options.trace) trace.tracePathElementInvoke(this, fn, deps, extend({when: when}, options));
  return resolvables;
}
