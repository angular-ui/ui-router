/** @module resolve */ /** for typedoc */
import {
    IInjectable, find, filter, map, tail, defaults, extend, pick, uniqR, unnestR
} from "../common/common";
import {prop, propEq} from "../common/hof";
import {isString, isObject} from "../common/predicates";
import {trace} from "../common/trace";
import {services} from "../common/coreservices";
import {Resolvables, ResolvePolicy, IOptions1} from "./interface";

import {PathNode} from "../path/node";
import {Resolvable} from "./resolvable";
import {State} from "../state/stateObject";
import {PathFactory} from "../path/pathFactory";
import {stringify} from "../common/strings";

// TODO: make this configurable
let defaultResolvePolicy = ResolvePolicy[ResolvePolicy.LAZY];

interface IPolicies { [key: string]: string; }
interface Promises { [key: string]: Promise<any>; }

export class ResolveContext {

  constructor(private _path: PathNode[]) { }

  /** Gets all the tokens found in the resolve context, de-duplicated */
  getTokens() {
    return this._path.reduce((acc, node) => acc.concat(node.resolvables.map(r => r.token)), []).reduce(uniqR, []);
  }

  /**
   * Gets the Resolvable that matches the token
   *
   * Gets the last Resolvable that matches the token in this context, or undefined.
   * Throws an error if it doesn't exist in the ResolveContext
   */
  getResolvable(token): Resolvable {
    var matching = this._path.map(node => node.resolvables)
        .reduce(unnestR, [])
        .filter((r: Resolvable) => r.token === token);
    return tail(matching);
  }

  private _nodeFor(state: State): PathNode {
    return <PathNode> find(this._path, propEq('state', state));
  }

  private _pathTo(state: State): PathNode[] {
    return PathFactory.subPath(this._path, node => node.state === state);
  }

  isolateRootTo(state: State): ResolveContext {
    return new ResolveContext(this._pathTo(state));
  }
  
  addResolvables(newResolvables: Resolvable[], state: State) {
    var node = this._nodeFor(state);
    var keys = newResolvables.map(r => r.token);
    node.resolvables = node.resolvables.filter(r => keys.indexOf(r.token) === -1).concat(newResolvables);
  }
  
  /** Gets the resolvables declared on a particular state */
  getOwnResolvables(state: State): Resolvables {
    return this._nodeFor(state).resolvables
        .reduce((acc, r) => { acc[r.token] = r; return acc; }, <Resolvables>{});
  }
   
  // Returns a promise for an array of resolved path Element promises
  resolvePath(options: IOptions1 = {}): Promise<{ token: any, value: any }[]> {
    let policy: string = options && options.resolvePolicy;
    let policyOrdinal: number = ResolvePolicy[policy || defaultResolvePolicy];
    // get the subpath to the state argument, if provided
    trace.traceResolvePath(this._path, options);

    let promises: Promise<any>[] = this._path.reduce((acc, node) => {
      const matchesRequestedPolicy = resolvable => getPolicy(node.state.resolvePolicy, resolvable) >= policyOrdinal;
      let nodeResolvables = node.resolvables.filter(matchesRequestedPolicy);
      let subContext = this.isolateRootTo(node.state);

      // For the matching Resolvables, start their async fetch process.
      var getResult = (r: Resolvable) => r.get(subContext, options)
          // Return a tuple that includes the Resolvable's token
          .then(value => ({ token: r.token, value: value }));
      return acc.concat(nodeResolvables.map(getResult));
    }, []);

    return services.$q.all(promises);
  }

  injector(): { get(any): any } {
    
    let get = (token: any) => {
      var resolvable = this.getResolvable(token);
      if (resolvable) return resolvable.data;
      return services.$injector.get(token);
    };
    
    return { get };
  }

  /**
   * Gets the async dependencies of a Resolvable
   *
   * Given a Resolvable, returns its dependencies as a Resolvable[]
   */
  getDependencies(resolvable: Resolvable): Resolvable[] {
    // predicate that finds the node the resolvable belongs to
    const nodeForResolvable = node => node.resolvables.indexOf(resolvable) !== -1;
    // Find which other resolvables are "visible" to the `resolvable` argument
    // subpath stopping at resolvable's node, or the whole path (if the resolvable isn't in the path)
    var subPath: PathNode[] = PathFactory.subPath(this._path, nodeForResolvable) || this._path;
    var availableResolvables: Resolvable[] = subPath
        .reduce((acc, node) => acc.concat(node.resolvables), []) //all of subpath's resolvables
        .filter(res => res !== resolvable); // filter out the `resolvable` argument

    const getDependency = token => {
      let matching = availableResolvables.filter(r => r.token === token);
      if (matching.length) return tail(matching);

      let fromInjector = services.$injector.get(token);
      if (!fromInjector) {
        throw new Error("Could not find Dependency Injection token: " + stringify(token));
      }

      return new Resolvable(token, () => fromInjector, [], fromInjector);
    };

    return resolvable.deps.map(getDependency);
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
  let policyName = resolveLevelPolicies[resolvable.token] || stateLevelPolicy || defaultResolvePolicy;
  return ResolvePolicy[policyName];  
}