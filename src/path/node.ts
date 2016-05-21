/** @module path */ /** for typedoc */
import {extend, applyPairs, find, allTrueR} from "../common/common";
import {prop, propEq} from "../common/hof";
import {State} from "../state/module";
import {RawParams} from "../params/interface";
import {Param} from "../params/module";
import {Resolvable, ResolveContext} from "../resolve/module";
import {ViewConfig} from "../view/interface";

export class Node {
  public state: State;
  public paramSchema: Param[];
  public paramValues: { [key: string]: any };
  public resolvables: Resolvable[];
  public views: ViewConfig[];
  public resolveContext: ResolveContext;

  constructor(state: Node);
  constructor(state: State);
  constructor(state) {
    if (state instanceof Node) {
      let node: Node = state;
      this.state = node.state;
      this.paramSchema = node.paramSchema.slice();
      this.paramValues = extend({}, node.paramValues);
      this.resolvables = node.resolvables.slice();
      this.views = node.views && node.views.slice();
      this.resolveContext = node.resolveContext;
    } else {
      this.state = state;
      this.paramSchema = state.parameters({ inherit: false });
      this.paramValues = {};
      this.resolvables = Object.keys(state.resolve || {}).map(key => new Resolvable(key, state.resolve[key]));
    }
  }

  applyRawParams(params: RawParams): Node {
    const getParamVal = (paramDef: Param) => [ paramDef.id, paramDef.value(params[paramDef.id]) ];
    this.paramValues = this.paramSchema.reduce((memo, pDef) => applyPairs(memo, getParamVal(pDef)), {});
    return this;
  }

  parameter(name: string): Param {
    return find(this.paramSchema, propEq("id", name));
  }

  equals(node: Node, keys = this.paramSchema.map(prop('id'))): boolean {
    const paramValsEq = key => this.parameter(key).type.equals(this.paramValues[key], node.paramValues[key]);
    return this.state === node.state && keys.map(paramValsEq).reduce(allTrueR, true);
  }

  static clone(node: Node) {
    return new Node(node);
  }

  /**
   * Returns a new path which is a subpath of the first path which matched the second path.
   *
   * The new path starts from root and contains any nodes that match the nodes in the second path.
   * Nodes are compared using their state property and parameter values.
   */
  static matching(pathA: Node[], pathB: Node[]): Node[] {
    let matching = [];
    
    for (let i = 0; i < pathA.length && i < pathB.length; i++) {
      let a = pathA[i], b = pathB[i];
      
      if (a.state !== b.state) break;
      if (!Param.equals(a.paramSchema, a.paramValues, b.paramValues)) break;
      matching.push(a);
    }
    
    return matching
  }
}