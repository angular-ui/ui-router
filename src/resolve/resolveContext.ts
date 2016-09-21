/** @module resolve */ /** for typedoc */
import { find, tail, uniqR, unnestR, inArray } from "../common/common";
import {propEq} from "../common/hof";
import {trace} from "../common/trace";
import {services, $InjectorLike} from "../common/coreservices";
import {resolvePolicies, PolicyWhen} from "./interface";

import {PathNode} from "../path/node";
import {Resolvable} from "./resolvable";
import {State} from "../state/stateObject";
import {PathFactory} from "../path/pathFactory";
import {stringify} from "../common/strings";
import {Transition} from "../transition/transition";
import {UIInjector} from "../common/interface";

const when = resolvePolicies.when;
const ALL_WHENS = [when.EAGER, when.LAZY];
const EAGER_WHENS = [when.EAGER];

export const NATIVE_INJECTOR_TOKEN = "Native Injector";

/**
 * Encapsulates Depenency Injection for a path of nodes
 *
 * UI-Router states are organized as a tree.
 * A nested state has a path of ancestors to the root of the tree.
 * When a state is being activated, each element in the path is wrapped as a [[PathNode]].
 * A `PathNode` is a stateful object that holds things like parameters and resolvables for the state being activated.
 *
 * The ResolveContext closes over the [[PathNode]]s, and provides DI for the last node in the path.
 */
export class ResolveContext {
  _injector: UIInjector;

  constructor(private _path: PathNode[]) { }

  /** Gets all the tokens found in the resolve context, de-duplicated */
  getTokens(): any[] {
    return this._path.reduce((acc, node) => acc.concat(node.resolvables.map(r => r.token)), []).reduce(uniqR, []);
  }

  /**
   * Gets the Resolvable that matches the token
   *
   * Gets the last Resolvable that matches the token in this context, or undefined.
   * Throws an error if it doesn't exist in the ResolveContext
   */
  getResolvable(token: any): Resolvable {
    var matching = this._path.map(node => node.resolvables)
        .reduce(unnestR, [])
        .filter((r: Resolvable) => r.token === token);
    return tail(matching);
  }

  /**
   * Returns a ResolveContext that includes a portion of this one
   *
   * Given a state, this method creates a new ResolveContext from this one.
   * The new context starts at the first node (root) and stops at the node for the `state` parameter.
   *
   * #### Why
   *
   * When a transition is created, the nodes in the "To Path" are injected from a ResolveContext.
   * A ResolveContext closes over a path of [[PathNode]]s and processes the resolvables.
   * The "To State" can inject values from its own resolvables, as well as those from all its ancestor state's (node's).
   * This method is used to create a narrower context when injecting ancestor nodes.
   *
   * @example
   * `let ABCD = new ResolveContext([A, B, C, D]);`
   *
   * Given a path `[A, B, C, D]`, where `A`, `B`, `C` and `D` are nodes for states `a`, `b`, `c`, `d`:
   * When injecting `D`, `D` should have access to all resolvables from `A`, `B`, `C`, `D`.
   * However, `B` should only be able to access resolvables from `A`, `B`.
   *
   * When resolving for the `B` node, first take the full "To Path" Context `[A,B,C,D]` and limit to the subpath `[A,B]`.
   * `let AB = ABCD.subcontext(a)`
   */
  subContext(state: State): ResolveContext {
    return new ResolveContext(PathFactory.subPath(this._path, node => node.state === state));
  }

  /**
   * Adds Resolvables to the node that matches the state
   *
   * This adds a [[Resolvable]] (generally one created on the fly; not declared on a [[StateDeclaration.resolve]] block).
   * The resolvable is added to the node matching the `state` parameter.
   *
   * These new resolvables are not automatically fetched.
   * The calling code should either fetch them, fetch something that depends on them,
   * or rely on [[resolvePath]] being called when some state is being entered.
   *
   * Note: each resolvable's [[ResolvePolicy]] is merged with the state's policy, and the global default.
   *
   * @param newResolvables the new Resolvables
   * @param state Used to find the node to put the resolvable on
   */
  addResolvables(newResolvables: Resolvable[], state: State) {
    var node = <PathNode> find(this._path, propEq('state', state));
    var keys = newResolvables.map(r => r.token);
    node.resolvables = node.resolvables.filter(r => keys.indexOf(r.token) === -1).concat(newResolvables);
  }
  
  /**
   * Returns a promise for an array of resolved path Element promises
   *
   * @param when
   * @param trans
   * @returns {Promise<any>|any}
   */
  resolvePath(when: PolicyWhen = "LAZY", trans?: Transition): Promise<{ token: any, value: any }[]> {
    // This option determines which 'when' policy Resolvables we are about to fetch.
    let whenOption: string = inArray(ALL_WHENS, when) ? when : "LAZY";
    // If the caller specified EAGER, only the EAGER Resolvables are fetched.
    // if the caller specified LAZY, both EAGER and LAZY Resolvables are fetched.`
    let matchedWhens = whenOption === resolvePolicies.when.EAGER ? EAGER_WHENS : ALL_WHENS;
    
    // get the subpath to the state argument, if provided
    trace.traceResolvePath(this._path, when, trans);

    let promises: Promise<any>[] = this._path.reduce((acc, node) => {
      const matchesRequestedPolicy = (resolvable: Resolvable) =>
          inArray(matchedWhens, resolvable.getPolicy(node.state).when);
      let nodeResolvables = node.resolvables.filter(matchesRequestedPolicy);
      let subContext = this.subContext(node.state);

      // For the matching Resolvables, start their async fetch process.
      var getResult = (r: Resolvable) => r.get(subContext, trans)
          // Return a tuple that includes the Resolvable's token
          .then(value => ({ token: r.token, value: value }));
      return acc.concat(nodeResolvables.map(getResult));
    }, []);

    return services.$q.all(promises);
  }

  injector(): UIInjector {
    return this._injector || (this._injector = new UIInjectorImpl(this));
  }

  findNode(resolvable: Resolvable): PathNode {
    return find(this._path, (node: PathNode) => inArray(node.resolvables, resolvable));
  }

  /**
   * Gets the async dependencies of a Resolvable
   *
   * Given a Resolvable, returns its dependencies as a Resolvable[]
   */
  getDependencies(resolvable: Resolvable): Resolvable[] {
    let node = this.findNode(resolvable);
    // Find which other resolvables are "visible" to the `resolvable` argument
    // subpath stopping at resolvable's node, or the whole path (if the resolvable isn't in the path)
    let subPath: PathNode[] = PathFactory.subPath(this._path, x => x === node) || this._path;
    let availableResolvables: Resolvable[] = subPath
        .reduce((acc, node) => acc.concat(node.resolvables), []) //all of subpath's resolvables
        .filter(res => res !== resolvable); // filter out the `resolvable` argument

    const getDependency = (token: any) => {
      let matching = availableResolvables.filter(r => r.token === token);
      if (matching.length) return tail(matching);

      let fromInjector = this.injector().getNative(token);
      if (!fromInjector) {
        throw new Error("Could not find Dependency Injection token: " + stringify(token));
      }

      return new Resolvable(token, () => fromInjector, [], fromInjector);
    };

    return resolvable.deps.map(getDependency);
  }
}

class UIInjectorImpl implements UIInjector {
  native: $InjectorLike;

  constructor(public context: ResolveContext) {
    this.native = this.get(NATIVE_INJECTOR_TOKEN) || services.$injector;
  }

  get(token: any) {
    var resolvable = this.context.getResolvable(token);
    if (resolvable) {
      if (!resolvable.resolved) {
        throw new Error("Resolvable async .get() not complete:" + stringify(resolvable.token))
      }
      return resolvable.data;
    }
    return this.native && this.native.get(token);
  }

  getAsync(token: any) {
    var resolvable = this.context.getResolvable(token);
    if (resolvable) return resolvable.get(this.context);
    return services.$q.when(this.native.get(token));
  }

  getNative(token: any) {
    return this.native.get(token);
  }
}