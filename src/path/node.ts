/** @module path */ /** for typedoc */
import {extend, applyPairs, map, find, allTrueR, values, mapObj} from "../common/common";
import {prop, propEq} from "../common/hof";
import {State} from "../state/module";
import {RawParams} from "../params/interface";
import {Param} from "../params/module";
import {Resolvable, ResolveContext, ResolveInjector} from "../resolve/module";
import {ViewConfig} from "../view/interface";
import {Resolvables} from "../resolve/interface";

export class Node {
  public state: State;
  public paramSchema: Param[];
  public paramValues: { [key: string]: any };
  public resolves: Resolvables;
  public views: ViewConfig[];
  public resolveContext: ResolveContext;
  public resolveInjector: ResolveInjector;

  constructor(state: Node);
  constructor(state: State);
  constructor(state) {
    if (state instanceof Node) {
      let node: Node = state;
      this.state = node.state;
      this.paramSchema = node.paramSchema.slice();
      this.paramValues = extend({}, node.paramValues);
      this.resolves = extend({}, node.resolves);
      this.views = node.views && node.views.slice();
      this.resolveContext = node.resolveContext;
      this.resolveInjector = node.resolveInjector;
    } else {
      this.state = state;
      this.paramSchema = state.parameters({ inherit: false });
      this.paramValues = {};
      this.resolves = mapObj(state.resolve, (fn: Function, name: string) => new Resolvable(name, fn));
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
   * Returns a new path which is a subpath of the first path. The new path starts from root and contains any nodes
   * that match the nodes in the second path. Nodes are compared using their state property.
   * @param first {Node[]}
   * @param second {Node[]}
   * @returns {Node[]}
   */
  static matching(first: Node[], second: Node[]): Node[] {
    let matchedCount = first.reduce((prev, node, i) =>
      prev === i && i < second.length && node.state === second[i].state ? i + 1 : prev, 0);
    return first.slice(0, matchedCount);
  }
}