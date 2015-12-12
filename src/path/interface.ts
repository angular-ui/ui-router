import {State} from "../state/state";
import {Node} from "../path/node";

import {ViewConfig} from "../view/view";

import {IRawParams} from "../params/interface";

import {IResolvables} from "../resolve/interface";
import {ResolveContext} from "../resolve/resolveContext";
import {ResolveInjector} from "../resolve/resolveInjector";


/** Contains Node base data plus raw params values for the node */
export interface IParamsNode extends Node {
  values: IRawParams;
}

/** Contains IParamsNode data, plus Resolvables for the node */
export interface IResolveNode extends IParamsNode {
  resolves: IResolvables;
}

/** Contains IResolveNode data, plus a ResolveContext and ParamsValues (bound to a full path) for the node,  */
export interface ITransNode extends IResolveNode {
  resolveContext: ResolveContext;
  resolveInjector: ResolveInjector;
  views: ViewConfig[];
  // paramValues: ParamValues;
}
