
import Path from "./../path/path";

import {IState} from "../state/interface";

import {IRawParams} from "../params/interface";
import ParamValues from "../params/paramValues";

import {IResolvables} from "../resolve/interface";
import ResolveContext from "../resolve/resolveContext";


/** Base data (contains a state) for a node in a Path */
export interface INode {
  state: IState
}
/** A basic Path. Each node contains an IState */
export interface IPath extends Path<INode> {}


/** Contains INode base data plus raw params values for the node */
export interface IParamsNode extends INode { 
  ownParams: IRawParams
}
/** A Path of IParamsNode(s) */
export interface IParamsPath extends Path<IParamsNode> {}


/** Contains IParamsNode data, plus Resolvables for the node */
export interface IResolveNode extends IParamsNode {
  ownResolvables: IResolvables
}
/** A Path of IResolveNode(s) */
export interface IResolvePath extends Path<IResolveNode> {}


/** Contains IResolveNode data, plus a ResolveContext and ParamsValues (bound to a full path) for the node,  */
export interface ITransNode extends IResolveNode {
  resolveContext: ResolveContext,
  paramValues: ParamValues
}
/**
 * A Path of ITransNode(s). Each node contains raw param values, Resolvables and also a ResolveContext
 * and ParamValues which are bound to the overall path, but isolated to the node.
 */
export interface ITransPath extends Path<ITransNode> {}
