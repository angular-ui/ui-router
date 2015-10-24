/// <reference path='../../typings/angularjs/angular.d.ts' />
import {extend, pick, prop, propEq, pairs, map, find, allTrueR} from "../common/common";
import {State} from "../state/state";
import Param from "../params/param";
import Type from "../params/type";
import {IRawParams} from "../params/interface";
import Resolvable from "../resolve/resolvable";
import ResolveContext from "../resolve/resolveContext";
import ResolveInjector from "../resolve/resolveInjector";
import {ViewConfig} from "../view/view";

export default class Node {

  public schema:   Param[];
  public values:   { [key: string]: any };
  public resolves: any;
  public views:    ViewConfig[];
  public resolveContext: ResolveContext;
  public resolveInjector: ResolveInjector;

  // Possibly extract this logic into an intermediary object that maps states to nodes
  constructor(public state: State, params: IRawParams, resolves: any = {}) {
    const schema: Param[] = state.parameters({ inherit: false });
    // schema = keys.map(key => [key, state.parameter(key)]).reduce(applyPairs, {});

    // Object.freeze(extend(this, { ... }))
    extend(this, {
      state,
      schema,
      values: pick(params, schema.map(prop('id'))),
      resolves: map(
        extend(state.resolve || {}, resolves),
        (fn: Function, name: string) => new Resolvable(name, fn, state)
      ),
      views: pairs(state.views || {}).map(([rawViewName, viewDeclarationObj]): ViewConfig => {
        return new ViewConfig({
          rawViewName, viewDeclarationObj, context: state, params
        });
      })
    });
  }

  parameter(name: string): Param {
    return find(this.schema, propEq("id", name));
  }

  equals(node: Node, keys = this.schema.map(prop('id'))): boolean {
    const paramValsEq = key => this.parameter(key).type.equals(this.values[key], node.values[key]);
    return this.state === node.state && keys.map(paramValsEq).reduce(allTrueR, true);
  }

  static clone(node: Node, update: any = {}) {
    return new Node(node.state, update.params || node.values, update.resolves || map(node.resolves, prop('resolveFn')));
  }

  /**
   * Returns a new path which is a subpath of this path. The new path starts from root and contains any nodes
   * that match the nodes in the second path. Nodes are compared using their state properties.
   * @param first {Node[]}
   * @param second {Node[]}
   * @returns {Node[]}
   */
  static matching(first: Node[], second: Node[]): Node[] {
    let matchedCount = first.reduce((prev, node, i) =>
      prev === i && i < second.length && node.state === second[i].state ? i + 1 : prev, 0);
    return first.slice(matchedCount);
  }
}