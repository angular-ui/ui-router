/** @module path */ /** for typedoc */

import {extend, find, pick, omit, tail, mergeR, map, values} from "../common/common";
import {prop, propEq, not, curry} from "../common/hof";

import {RawParams} from "../params/interface";
import {TreeChanges} from "../transition/interface";

import {State, TargetState} from "../state/module";
import {Node} from "../path/node";
import {ResolveContext, Resolvable, ResolveInjector} from "../resolve/module";
import {Transition} from "../transition/module";
import {ViewService} from "../view/view";

/**
 * This class contains functions which convert TargetStates, Nodes and paths from one type to another.
 */
export class PathFactory {

  constructor() { }

  /** Given a Node[], create an TargetState */
  static makeTargetState(path: Node[]): TargetState {
    let state = tail(path).state;
    return new TargetState(state, state, path.map(prop("paramValues")).reduce(mergeR, {}));
  }

  static buildPath(targetState: TargetState) {
    let toParams = targetState.params();
    return targetState.$state().path.map(state => new Node(state).applyRawParams(toParams));
  }

  /** Given a fromPath: Node[] and a TargetState, builds a toPath: Node[] */
  static buildToPath(fromPath: Node[], targetState: TargetState): Node[] {
    let toPath: Node[] = PathFactory.buildPath(targetState);
    if (targetState.options().inherit) {
      return PathFactory.inheritParams(fromPath, toPath, Object.keys(targetState.params()));
    }
    return toPath;
  }
  
  static applyViewConfigs($view: ViewService, path: Node[]) {
    return path.map(node =>
        extend(node, { views: values(node.state.views || {}).map(view => $view.createViewConfig(node, view))})
    );
  }

  /**
   * Given a fromPath and a toPath, returns a new to path which inherits parameters from the fromPath
   *
   * For a parameter in a node to be inherited from the from path:
   * - The toPath's node must have a matching node in the fromPath (by state).
   * - The parameter name must not be found in the toKeys parameter array.
   *
   * Note: the keys provided in toKeys are intended to be those param keys explicitly specified by some
   * caller, for instance, $state.transitionTo(..., toParams).  If a key was found in toParams,
   * it is not inherited from the fromPath.
   */
  static inheritParams(fromPath: Node[], toPath: Node[], toKeys: string[] = []): Node[] {
    function nodeParamVals(path: Node[], state: State): RawParams {
      let node: Node = find(path, propEq('state', state));
      return extend({}, node && node.paramValues);
    }

    /**
     * Given an Node "toNode", return a new Node with param values inherited from the
     * matching node in fromPath.  Only inherit keys that aren't found in "toKeys" from the node in "fromPath""
     */
    let makeInheritedParamsNode = curry(function(_fromPath: Node[], _toKeys: string[], toNode: Node): Node {
      // All param values for the node (may include default key/vals, when key was not found in toParams)
      let toParamVals = extend({}, toNode && toNode.paramValues);
      // limited to only those keys found in toParams
      let incomingParamVals = pick(toParamVals, _toKeys);
      toParamVals = omit(toParamVals, _toKeys);
      let fromParamVals = nodeParamVals(_fromPath, toNode.state) || {};
      // extend toParamVals with any fromParamVals, then override any of those those with incomingParamVals
      let ownParamVals: RawParams = extend(toParamVals, fromParamVals, incomingParamVals);
      return new Node(toNode.state).applyRawParams(ownParamVals);
    });

    // The param keys specified by the incoming toParams
    return <Node[]> toPath.map(makeInheritedParamsNode(fromPath, toKeys));
  }

  /**
   * Given a path, upgrades the path to a Node[].  Each node is assigned a ResolveContext
   * and ParamValues object which is bound to the whole path, but closes over the subpath from root to the node.
   * The views are also added to the node.
   */
  static bindTransNodesToPath(resolvePath: Node[]): Node[] {
    let resolveContext = new ResolveContext(resolvePath);
    // let paramValues = new ParamValues(resolvePath);

    // Attach bound resolveContext and paramValues to each node
    // Attach views to each node
    resolvePath.forEach((node: Node) => {
      node.resolveContext = resolveContext.isolateRootTo(node.state);
      node.resolveInjector = new ResolveInjector(node.resolveContext, node.state);
      node.resolves['$stateParams'] = new Resolvable("$stateParams", () => node.paramValues, node.paramValues);
    });

    return resolvePath;
  }

  /**
   * Computes the tree changes (entering, exiting) between a fromPath and toPath.
   */
  static treeChanges(fromPath: Node[], toPath: Node[], reloadState: State): TreeChanges {
    let keep = 0, max = Math.min(fromPath.length, toPath.length);
    const staticParams = (state) => state.parameters({ inherit: false }).filter(not(prop('dynamic'))).map(prop('id'));
    const nodesMatch = (node1: Node, node2: Node) => node1.equals(node2, staticParams(node1.state));

    while (keep < max && fromPath[keep].state !== reloadState && nodesMatch(fromPath[keep], toPath[keep])) {
      keep++;
    }

    /** Given a retained node, return a new node which uses the to node's param values */
    function applyToParams(retainedNode: Node, idx: number): Node {
      let cloned = Node.clone(retainedNode);
      cloned.paramValues = toPath[idx].paramValues;
      return cloned;
    }

    let from: Node[], retained: Node[], exiting: Node[], entering: Node[], to: Node[];
    // intermediate vars
    let retainedWithToParams: Node[], enteringResolvePath: Node[], toResolvePath: Node[];

    from                  = fromPath;
    retained              = from.slice(0, keep);
    exiting               = from.slice(keep);

    // Create a new retained path (with shallow copies of nodes) which have the params of the toPath mapped
    retainedWithToParams  = retained.map(applyToParams);
    enteringResolvePath   = toPath.slice(keep);
    // "toResolvePath" is "retainedWithToParams" concat "enteringResolvePath".
    toResolvePath         = (retainedWithToParams).concat(enteringResolvePath);

    // "to: is "toResolvePath" with ParamValues/ResolveContext added to each node and bound to the path context
    to                    = PathFactory.bindTransNodesToPath(toResolvePath);

    // "entering" is the tail of "to"
    entering              = to.slice(keep);

    return { from, to, retained, exiting, entering };
  }

  static bindTransitionResolve(treeChanges: TreeChanges, transition: Transition) {
    let rootNode = treeChanges.to[0];
    rootNode.resolves['$transition$'] = new Resolvable('$transition$', () => transition, transition);
  }

  /**
   * Find a subpath of a path that stops at the node for a given state
   *
   * Given an array of nodes, returns a subset of the array starting from the first node, up to the
   * node whose state matches `stateName`
   *
   * @param path a path of [[Node]]s
   * @param state the [[State]] to stop at
   */
  static subPath(path: Node[], state): Node[] {
    let node = find(path, _node => _node.state === state);
    let elementIdx = path.indexOf(node);
    if (elementIdx === -1) throw new Error("The path does not contain the state: " + state);
    return path.slice(0, elementIdx + 1);
  }

  /** Gets the raw parameter values from a path */
  static paramValues = (path: Node[]) => path.reduce((acc, node) => extend(acc, node.paramValues), {});
}
