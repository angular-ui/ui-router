/** @module path */ /** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />
import {extend, pick, prop, propEq, pairs, applyPairs, map, find, allTrueR, values} from "../common/common";
import {State} from "../state/module";
import {RawParams} from "../params/interface";
import {Param, Type} from "../params/module";
import {Resolvable, ResolveContext, ResolveInjector} from "../resolve/module";
import {ViewConfig} from "../view/view";

export class Node {

  public schema:   Param[];
  public values:   { [key: string]: any };
  public resolves: any;
  public views:    ViewConfig[];
  public resolveContext: ResolveContext;
  public resolveInjector: ResolveInjector;

  // Possibly extract this logic into an intermediary object that maps states to nodes
  constructor(public state: State, params: RawParams, resolves: any = {}) {
    // Object.freeze(extend(this, { ... }))
    this.schema = state.parameters({ inherit: false });

    const getParamVal = (paramDef: Param) => [ paramDef.id, paramDef.value(params[paramDef.id]) ];
    this.values = this.schema.reduce((memo, pDef) => applyPairs(memo, getParamVal(pDef)), {});

    this.resolves = extend(map(state.resolve, (fn: Function, name: string) => new Resolvable(name, fn)), resolves);

    const makeViewConfig = (viewDeclarationObj, rawViewName) =>
        new ViewConfig({ rawViewName, viewDeclarationObj, context: state, params});
    this.views = values(map(state.views, makeViewConfig));
  }

  parameter(name: string): Param {
    return find(this.schema, propEq("id", name));
  }

  equals(node: Node, keys = this.schema.map(prop('id'))): boolean {
    const paramValsEq = key => this.parameter(key).type.equals(this.values[key], node.values[key]);
    return this.state === node.state && keys.map(paramValsEq).reduce(allTrueR, true);
  }

  static clone(node: Node, update: any = {}) {
    return new Node(node.state, (update.values || node.values), (update.resolves || node.resolves));
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