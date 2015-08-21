import {IState} from "../state/interface";
import {IRawParams} from "../params/interface";
import {IResolvables} from "../resolve/interface";
import Path from "./../path/path";

/** Base data (contains a state) for a node in a Path */
export interface INode {
  state: IState
}

/** Data, including raw params values, for a node in a Path */
export interface IParamsNode extends INode { 
  ownParams: IRawParams
}

/** Transition Data for a node in a Path (either to path or from path) */
export interface IResolveNode extends IParamsNode {
  ownResolvables: IResolvables
}

/** A basic Path. Each node contains the data necessary for a Transition to work. */
export interface IPath extends Path<INode> {}
/** A Params Path. Each node contains raw params data for each state */
export interface IParamsPath extends Path<IParamsNode> {}
/** A Transition Path. Each node contains the data necessary for a Transition to work. */
export interface IResolvePath extends Path<IResolveNode> { }
