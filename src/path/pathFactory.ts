import {map, extend, pairs, prop, pick, omit, not, curry} from "../common/common";

import {runtime} from "../common/angular1";

import {IRawParams} from "../params/interface";
import ParamValues from "../params/paramValues";

import {ITreeChanges} from "../transition/interface";

import {IState} from "../state/interface";
import TargetState from "../state/targetState";

import {INode, IParamsNode, IResolveNode, ITransNode, IParamsPath, IResolvePath, ITransPath} from "../path/interface";
import Path from "../path/path";

import Resolvable from "../resolve/resolvable";
import ResolveContext from "../resolve/resolveContext";
import PathContext from "../resolve/pathContext";

import {ViewConfig} from "../view/view";

/**
 * This class contains functions which convert TargetStates, Nodes and Paths from one type to another.
 */
export default class PathFactory {
  constructor() { }

  /** Given a TargetState, create an IParamsPath */
  static makeParamsPath(ref: TargetState): IParamsPath {
    let states = ref ? ref.$state().path : [];
    let params = ref ? ref.params() : {};
    const toParamsNodeFn: (IState) => IParamsNode = PathFactory.makeParamsNode(params);
    return new Path(states.map(toParamsNodeFn));
  }

  /** Given a IParamsPath, create an TargetState */
  static makeTargetState(path: IParamsPath): TargetState {
    let state = path.last().state;
    return new TargetState(state, state, new ParamValues(path));
  }

  /* Given params and a state, creates an IParamsNode */
  static makeParamsNode = curry(function(params: IRawParams, state: IState) {
    return {
      state,
      ownParams: state.ownParams.$$values(params)
    };
  });

  /** Given an IParamsNode, make an IResolveNode by creating resolvables for resolves on the state's declaration */
  static makeResolveNode(node: IParamsNode): IResolveNode {
    const makeResolvable = (_node: INode) => (resolveFn: Function, name: string) => new Resolvable(name, resolveFn, _node.state);
    let resolvables = {ownResolvables:  map(node.state.resolve || {}, makeResolvable(node)) };
    return extend({}, node, resolvables);
  }

  /** Given a fromPath: ITransPath and a TargetState, builds a toPath: IParamsPath */
  static buildToPath(fromPath: ITransPath, targetState: TargetState): IParamsPath {
    let toParams = targetState.params();
    const toParamsNodeFn: (IState) => IParamsNode = PathFactory.makeParamsNode(toParams);
    let toPath: IParamsPath = new Path(targetState.$state().path.map(toParamsNodeFn));
    if (targetState.options().inherit)
      toPath = PathFactory.inheritParams(fromPath, toPath, Object.keys(toParams));
    return toPath;
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
  static inheritParams(fromPath: IParamsPath, toPath: IParamsPath, toKeys: string[] = []): IParamsPath {
    function nodeParamVals(path: IParamsPath, state: IState): IRawParams {
      let node = path.nodeForState(state);
      return extend({}, node && node.ownParams);
    }
    
    /** 
     * Given an IParamsNode "toNode", return a new IParamsNode with param values inherited from the
     * matching node in fromPath.  Only inherit keys that aren't found in "toKeys" from the node in "fromPath""
     */
    let makeInheritedParamsNode = curry(function(_fromPath: IParamsPath, _toKeys: string[], toNode: IParamsNode): IParamsNode {
      // All param values for the node (may include default key/vals, when key was not found in toParams)
      let toParamVals = extend({}, toNode && toNode.ownParams);
      // limited to only those keys found in toParams
      let incomingParamVals = pick(toParamVals, _toKeys);
      toParamVals = omit(toParamVals, _toKeys);
      let fromParamVals = nodeParamVals(_fromPath, toNode.state) || {};
      // extend toParamVals with any fromParamVals, then override any of those those with incomingParamVals
      let ownParamVals: IRawParams = extend(toParamVals, fromParamVals, incomingParamVals);
      return { state: toNode.state, ownParams: ownParamVals };
    });
    
    // The param keys specified by the incoming toParams
    return new Path(<IParamsNode[]> toPath.nodes().map(makeInheritedParamsNode(fromPath, toKeys)));
  }

  /**
   * Given an IResolvePath, upgrades the path to an ITransPath.  Each node is assigned a ResolveContext
   * and ParamValues object which is bound to the whole path, but closes over the subpath from root to the node.
   * The views are also added to the node.
   */
  static bindTransNodesToPath(resolvePath: IResolvePath): ITransPath {
    let resolveContext = new ResolveContext(resolvePath);
    let paramValues = new ParamValues(resolvePath);
    let transPath = <ITransPath> resolvePath;

    // TODO: this doesn't belong here.
    // TODO: pass options to PathContext
    // TODO: rename PathContext
    function makeViews(node: ITransNode) {
      let context = node.state, params = node.paramValues;
      let locals = new PathContext(node.resolveContext, node.state, runtime.$injector, {});
      const makeViewConfig = ([rawViewName, viewDeclarationObj]) =>
          new ViewConfig({rawViewName, viewDeclarationObj, context, locals, params});
      return pairs(node.state.views || {}).map(makeViewConfig);
    }

    // Attach bound resolveContext and paramValues to each node
    // Attach views to each node
    transPath.nodes().forEach((node: ITransNode) => {
          node.resolveContext = resolveContext.isolateRootTo(node.state);
          node.paramValues = paramValues.$isolateRootTo(node.state.name);
          node.views = makeViews(node);
        }
    );

    return transPath;
  }

  /**
   * Computes the tree changes (entering, exiting) between a fromPath and toPath.
   */
  static treeChanges(fromPath: ITransPath, toPath: IParamsPath, reloadState: IState): ITreeChanges {
    function nonDynamicParams(state) {
      return state.params.$$filter(not(prop('dynamic')));
    }

    let fromNodes = fromPath.nodes();
    let toNodes = toPath.nodes();
    let keep = 0, max = Math.min(fromNodes.length, toNodes.length);

    const nodesMatch = (node1: IParamsNode, node2: IParamsNode) =>
        node1.state === node2.state && nonDynamicParams(node1.state).$$equals(node1.ownParams, node2.ownParams);

    while (keep < max && fromNodes[keep].state !== reloadState && nodesMatch(fromNodes[keep], toNodes[keep])) {
      keep++;
    }

    /** Given a retained node, return a new node which uses the to node's param values */
    function applyToParams(retainedNode: ITransNode, idx: number): ITransNode {
      let toNodeParams = toPath.nodes()[idx].ownParams;
      return extend({}, retainedNode, { ownParams: toNodeParams });
    }

    let from: ITransPath, retained: ITransPath, exiting: ITransPath, entering: ITransPath, to: ITransPath;
    // intermediate vars
    let retainedWithToParams: ITransPath, enteringResolvePath: IResolvePath, toResolvePath: IResolvePath;

    from                  = fromPath;
    retained              = from.slice(0, keep);
    exiting               = from.slice(keep);

    // Create a new retained path (with shallow copies of nodes) which have the params of the toPath mapped
    retainedWithToParams  = retained.adapt(applyToParams);
    enteringResolvePath   = toPath.slice(keep).adapt(PathFactory.makeResolveNode);
    // "toResolvePath" is "retainedWithToParams" concat "enteringResolvePath".
    toResolvePath         = (<IResolvePath> retainedWithToParams).concat(enteringResolvePath);

    // "to: is "toResolvePath" with ParamValues/ResolveContext added to each node and bound to the path context
    to                    = PathFactory.bindTransNodesToPath(toResolvePath);

    // "entering" is the tail of "to"
    entering              = to.slice(keep);

    return { from, to, retained, exiting, entering };
  }

}
