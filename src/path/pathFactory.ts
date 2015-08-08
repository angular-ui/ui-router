import {map} from "../common/common"

import {IState} from "../state/interface"
import StateReference from "../state/stateReference"

import {INode, IParamsNode, ITransNode, IParamsPath, ITransPath} from "../path/interface"
import Path from "../path/path"

import Resolvable from "../resolve/resolvable"

const makeResolvable = (node) =>
    (fn, name: string) => new Resolvable(name, fn, node.state);

const adaptParamsToTrans = (node: IParamsNode) => {
  let ownResolvables = map(node.state.resolve, makeResolvable(node));
  
  return {
    state: node.state,
    ownParams: node.ownParams,
    ownResolvables: ownResolvables
  };
};

export default class PathFactory {
  constructor(rootGetter: () => IState) { 
    this.root = rootGetter
  }

  root(): IState {
    return null;
  }
	  
  paramsPath(ref: StateReference): IParamsPath { 
    let states = ref ? ref.$state().path : [];
    let params = ref ? ref.params() : {};
    states = [this.root()].concat(states);
    const makeParamsNode = (state: IState) => ({ state, ownParams: state.ownParams.$$values(params) });
    
    let nodes = states.map(makeParamsNode);
    return new Path(nodes);
  }
  
  static transPath(path: IParamsPath): ITransPath {
    return path.slice(0).adapt(adaptParamsToTrans)
  }
}
