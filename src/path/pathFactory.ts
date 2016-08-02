/** @module path */ /** for typedoc */

import {extend, find, pick, omit, tail, mergeR, values, unnestR, Predicate, inArray} from "../common/common";
import {prop, propEq, not} from "../common/hof";

import {RawParams} from "../params/interface";
import {TreeChanges} from "../transition/interface";
import {ViewConfig} from "../view/interface";
import {_ViewDeclaration} from "../state/interface";

import {State} from "../state/stateObject";
import {TargetState} from "../state/targetState";
import {PathNode} from "../path/node";
import {ViewService} from "../view/view";

/**
 * This class contains functions which convert TargetStates, Nodes and paths from one type to another.
 */
export class PathFactory {

  constructor() { }

  /** Given a PathNode[], create an TargetState */
  static makeTargetState(path: PathNode[]): TargetState {
    let state = tail(path).state;
    return new TargetState(state, state, path.map(prop("paramValues")).reduce(mergeR, {}));
  }

  static buildPath(targetState: TargetState) {
    let toParams = targetState.params();
    return targetState.$state().path.map(state => new PathNode(state).applyRawParams(toParams));
  }

  /** Given a fromPath: PathNode[] and a TargetState, builds a toPath: PathNode[] */
  static buildToPath(fromPath: PathNode[], targetState: TargetState): PathNode[] {
    let toPath: PathNode[] = PathFactory.buildPath(targetState);
    if (targetState.options().inherit) {
      return PathFactory.inheritParams(fromPath, toPath, Object.keys(targetState.params()));
    }
    return toPath;
  }

  /**
   * Creates ViewConfig objects and adds to nodes.
   *
   * On each [[PathNode]], creates ViewConfig objects from the views: property of the node's state
   */
  static applyViewConfigs($view: ViewService, path: PathNode[], states: State[]) {
    // Only apply the viewConfigs to the nodes for the given states
    path.filter(node => inArray(states, node.state)).forEach(node => {
      let viewDecls: _ViewDeclaration[] = values(node.state.views || {});
      let subPath = PathFactory.subPath(path, n => n === node);
      let viewConfigs: ViewConfig[][] = viewDecls.map(view => $view.createViewConfig(subPath, view));
      node.views = viewConfigs.reduce(unnestR, []);
    });
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
  static inheritParams(fromPath: PathNode[], toPath: PathNode[], toKeys: string[] = []): PathNode[] {
    function nodeParamVals(path: PathNode[], state: State): RawParams {
      let node: PathNode = find(path, propEq('state', state));
      return extend({}, node && node.paramValues);
    }

    /**
     * Given an [[PathNode]] "toNode", return a new [[PathNode]] with param values inherited from the
     * matching node in fromPath.  Only inherit keys that aren't found in "toKeys" from the node in "fromPath""
     */
    function makeInheritedParamsNode(toNode: PathNode): PathNode {
      // All param values for the node (may include default key/vals, when key was not found in toParams)
      let toParamVals = extend({}, toNode && toNode.paramValues);
      // limited to only those keys found in toParams
      let incomingParamVals = pick(toParamVals, toKeys);
      toParamVals = omit(toParamVals, toKeys);
      let fromParamVals = nodeParamVals(fromPath, toNode.state) || {};
      // extend toParamVals with any fromParamVals, then override any of those those with incomingParamVals
      let ownParamVals: RawParams = extend(toParamVals, fromParamVals, incomingParamVals);
      return new PathNode(toNode.state).applyRawParams(ownParamVals);
    }

    // The param keys specified by the incoming toParams
    return <PathNode[]> toPath.map(makeInheritedParamsNode);
  }

  /**
   * Computes the tree changes (entering, exiting) between a fromPath and toPath.
   */
  static treeChanges(fromPath: PathNode[], toPath: PathNode[], reloadState: State): TreeChanges {
    let keep = 0, max = Math.min(fromPath.length, toPath.length);
    const staticParams = (state: State) => 
        state.parameters({ inherit: false }).filter(not(prop('dynamic'))).map(prop('id'));
    const nodesMatch = (node1: PathNode, node2: PathNode) =>
        node1.equals(node2, staticParams(node1.state));

    while (keep < max && fromPath[keep].state !== reloadState && nodesMatch(fromPath[keep], toPath[keep])) {
      keep++;
    }

    /** Given a retained node, return a new node which uses the to node's param values */
    function applyToParams(retainedNode: PathNode, idx: number): PathNode {
      let cloned = PathNode.clone(retainedNode);
      cloned.paramValues = toPath[idx].paramValues;
      return cloned;
    }

    let from: PathNode[], retained: PathNode[], exiting: PathNode[], entering: PathNode[], to: PathNode[];

    from                  = fromPath;
    retained              = from.slice(0, keep);
    exiting               = from.slice(keep);

    // Create a new retained path (with shallow copies of nodes) which have the params of the toPath mapped
    let retainedWithToParams  = retained.map(applyToParams);
    entering              = toPath.slice(keep);
    to                    = (retainedWithToParams).concat(entering);

    return { from, to, retained, exiting, entering };
  }

  /**
   * Return a subpath of a path, which stops at the first matching node
   *
   * Given an array of nodes, returns a subset of the array starting from the first node,
   * stopping when the first node matches the predicate.
   *
   * @param path a path of [[PathNode]]s
   * @param predicate a [[Predicate]] fn that matches [[PathNode]]s
   * @returns a subpath up to the matching node, or undefined if no match is found
   */
  static subPath(path: PathNode[], predicate: Predicate<PathNode>): PathNode[] {
    let node = find(path, predicate);
    let elementIdx = path.indexOf(node);
    return elementIdx === -1 ? undefined : path.slice(0, elementIdx + 1);
  }

  /** Gets the raw parameter values from a path */
  static paramValues = (path: PathNode[]) => path.reduce((acc, node) => extend(acc, node.paramValues), {});
}
