import {IPromise} from "angular";
import {IState, IStateParams} from "../state/interface";
import {IRawParams} from "../params/interface";
import {StateParams} from "../state/state";
import Resolvable from "./resolvable";
import Path from "./path"; 
import ResolveContext from "./resolveContext"

export interface IResolvables { 
	[key:string]: Resolvable 
}

export interface IPromises {
	[key:string]: IPromise<any>
}

export interface IOptions1 {
  omitOwnLocals: string[],
  resolvePolicy: string,
  trace: boolean  
}


/** Base data (contains a state) for a node in a Path */
export interface INode {
  state: IState
}

/** Data, including raw params values, for a node in a Path */
export interface IParamsNode extends INode { 
  ownParams: IRawParams
}

/** Transition Data for a node in a Path (either to path or from path) */
export interface ITransNode extends INode, IParamsNode { 
  ownResolvables: IResolvables,
  resolveContext: ResolveContext,
  params: IStateParams
}

/** A basic Path. Each node contains the data necessary for a Transition to work. */
export interface IPath extends Path<INode> {};
/** A Params Path. Each node contains raw params data for each state */
export interface IParamsPath extends Path<IParamsNode> {};
/** A Transition Path. Each node contains the data necessary for a Transition to work. */
export interface ITransPath extends Path<ITransNode> {};

interface IOrdinals { [key: string]: number };
interface IPolicies { [key: string]: string };

// TODO: convert to enum
// Defines the available policies and their ordinals.
export enum ResolvePolicy {
  EAGER, // Eager resolves are resolved before the transition starts.
  LAZY, // Lazy resolves are resolved before their state is entered.
  JIT // JIT resolves are resolved just-in-time, right before an injected function that depends on them is invoked.
}