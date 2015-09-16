/// <reference path='../../typings/angularjs/angular.d.ts' />
import {IInjectable, filter, map, noop, defaults, extend, prop, pick, omit, isString, isObject} from "../common/common";
import trace from "../common/trace";
import {runtime} from "../common/angular1";
import {IPromise} from "angular";

import {IResolvePath, IResolveNode} from "../path/interface";

import {IPromises, IResolvables, ResolvePolicy, IOptions1} from "./interface";
import Resolvable from "./resolvable";
import {IState} from "../state/interface";

// TODO: make this configurable
let defaultResolvePolicy = ResolvePolicy[ResolvePolicy.LAZY];

interface IPolicies { [key: string]: string; }

export default class ResolveContext {
  constructor(private _path: IResolvePath) { }
 
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
    let path: IResolvePath = (state ? this._path.pathFromRootTo(state) : this._path);
    let last = path.last();
    
    return path.nodes().reduce((memo, node) => {
      let omitProps = (node === last) ? options.omitOwnLocals : [];
      let filteredResolvables = omit(node.ownResolvables, omitProps);
      return extend(memo, filteredResolvables);
    }, {});
  }

  /** Inspects a function `fn` for its dependencies.  Returns an object containing any matching Resolvables */
  getResolvablesForFn(fn: IInjectable, resolveContext: ResolveContext = this): {[key: string]: Resolvable} {
    let deps = runtime.$injector.annotate(<Function> fn);
    return <any> pick(resolveContext.getResolvables(), deps);
  }

  isolateRootTo(state: IState): ResolveContext {
    return new ResolveContext(this._path.pathFromRootTo(state));
  }
  
  addResolvables(resolvables: IResolvables, state: IState) {
    let node = this._path.nodeForState(state);
    extend(node.ownResolvables, resolvables);
  }
  
  /** Gets the resolvables declared on a particular state */
  getOwnResolvables(state: IState): IResolvables {
    return extend({}, this._path.nodeForState(state).ownResolvables);
  }
   
  // Returns a promise for an array of resolved Path Element promises
  resolvePath(options: IOptions1 = {}): IPromise<any> {
    trace.traceResolvePath(this._path, options);
    const promiseForNode = (node: IResolveNode) => this.resolvePathElement(node.state, options);
    return runtime.$q.all(<any> map(this._path.nodes(), promiseForNode)).then(noop);
  }

  // returns a promise for all the resolvables on this PathElement
  // options.resolvePolicy: only return promises for those Resolvables which are at 
  // the specified policy, or above.  i.e., options.resolvePolicy === 'lazy' will
  // resolve both 'lazy' and 'eager' resolves.
  resolvePathElement(state: IState, options: IOptions1 = {}): IPromise<any> {
    // The caller can request the path be resolved for a given policy and "below" 
    let policy: string = options && options.resolvePolicy;
    let policyOrdinal: number = ResolvePolicy[policy || defaultResolvePolicy];
    // Get path Resolvables available to this element
    let resolvables = this.getOwnResolvables(state);

    const matchesRequestedPolicy = resolvable => getPolicy(state.resolvePolicy, resolvable) >= policyOrdinal;
    let matchingResolves = filter(resolvables, matchesRequestedPolicy);

    const getResolvePromise = (resolvable: Resolvable) => resolvable.get(this.isolateRootTo(state), options);
    let resolvablePromises: IPromises = <any> map(matchingResolves, getResolvePromise);

    trace.traceResolvePathElement(this, matchingResolves, options);

    return runtime.$q.all(resolvablePromises).then(noop);
  } 
  
  
  /**
   * Injects a function given the Resolvables available in the IResolvePath, from the first node
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
  invokeLater(state: IState, fn: IInjectable, locals: any = {}, options: IOptions1 = {}): IPromise<any> {
    let isolateCtx = this.isolateRootTo(state);
    let resolvables = this.getResolvablesForFn(fn, isolateCtx);
    trace.tracePathElementInvoke(state, fn, Object.keys(resolvables), extend({when: "Later"}, options));
    const getPromise = (resolvable: Resolvable) => resolvable.get(isolateCtx, options);
    let promises: IPromises = <any> map(resolvables, getPromise);
    
    return runtime.$q.all(promises).then(() => {
      try {
        return isolateCtx.invokeNow(state, fn, locals, options);
      } catch (error) {
        return runtime.$q.reject(error);
      }
    });
  }

  /**
   * Immediately injects a function with the dependent Resolvables available in the IResolvePath, from
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
  invokeNow(state: IState, fn: IInjectable, locals: any, options: any = {}) {
    let isolateCtx = this.isolateRootTo(state);
    let resolvables = this.getResolvablesForFn(fn, isolateCtx);
    trace.tracePathElementInvoke(state, fn, Object.keys(resolvables), extend({when: "Now  "}, options));
    let resolvedLocals = map(resolvables, prop("data"));
    let combinedLocals = extend({}, locals, resolvedLocals);
    return runtime.$injector.invoke(<Function> fn, state, combinedLocals);
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