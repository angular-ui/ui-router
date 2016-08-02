/** @module path */ /** for typedoc */
import {extend, applyPairs, find, allTrueR} from "../common/common";
import {propEq} from "../common/hof";
import {State} from "../state/stateObject";
import {RawParams} from "../params/interface";
import {Param} from "../params/param";
import {Resolvable} from "../resolve/resolvable";
import {ViewConfig} from "../view/interface";

/**
 * A node in a [[TreeChanges]] path
 *
 * For a [[TreeChanges]] path, this class holds the stateful information for a single node in the path.
 * Each PathNode corresponds to a state being entered, exited, or retained.
 * The stateful information includes parameter values and resolve data.
 */
export class PathNode {
  /** The state being entered, exited, or retained */
  public state: State;
  /** The parameters declared on the state */
  public paramSchema: Param[];
  /** The parameter values that belong to the state */
  public paramValues: { [key: string]: any };
  /** The individual (stateful) resolvable objects that belong to the state */
  public resolvables: Resolvable[];
  /** The state's declared view configuration objects */
  public views: ViewConfig[];

  /** Creates a copy of a PathNode */
  constructor(state: PathNode);
  /** Creates a new (empty) PathNode for a State */
  constructor(state: State);
  constructor(stateOrPath: any) {
    if (stateOrPath instanceof PathNode) {
      let node: PathNode = stateOrPath;
      this.state = node.state;
      this.paramSchema = node.paramSchema.slice();
      this.paramValues = extend({}, node.paramValues);
      this.resolvables = node.resolvables.slice();
      this.views = node.views && node.views.slice();
    } else {
      let state: State = stateOrPath;
      this.state = state;
      this.paramSchema = state.parameters({ inherit: false });
      this.paramValues = {};
      this.resolvables = state.resolvables.map(res => res.clone());
    }
  }

  /** Sets [[paramValues]] for the node, from the values of an object hash */
  applyRawParams(params: RawParams): PathNode {
    const getParamVal = (paramDef: Param) => [ paramDef.id, paramDef.value(params[paramDef.id]) ];
    this.paramValues = this.paramSchema.reduce((memo, pDef) => applyPairs(memo, getParamVal(pDef)), {});
    return this;
  }

  /** Gets a specific [[Param]] metadata that belongs to the node */
  parameter(name: string): Param {
    return find(this.paramSchema, propEq("id", name));
  }

  /**
   * @returns true if the state and parameter values for another PathNode are
   * equal to the state and param values for this PathNode
   */
  equals(node: PathNode, keys = this.paramSchema.map(p => p.id)): boolean {
    const paramValsEq = (key: string) =>
        this.parameter(key).type.equals(this.paramValues[key], node.paramValues[key]);
    return this.state === node.state && keys.map(paramValsEq).reduce(allTrueR, true);
  }

  /** Returns a clone of the PathNode */
  static clone(node: PathNode) {
    return new PathNode(node);
  }

  /**
   * Returns a new path which is a subpath of the first path which matched the second path.
   *
   * The new path starts from root and contains any nodes that match the nodes in the second path.
   * Nodes are compared using their state property and parameter values.
   */
  static matching(pathA: PathNode[], pathB: PathNode[]): PathNode[] {
    let matching: PathNode[] = [];

    for (let i = 0; i < pathA.length && i < pathB.length; i++) {
      let a = pathA[i], b = pathB[i];

      if (a.state !== b.state) break;
      if (!Param.equals(a.paramSchema, a.paramValues, b.paramValues)) break;
      matching.push(a);
    }

    return matching
  }
}