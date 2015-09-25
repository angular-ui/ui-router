/// <reference path='../../typings/angularjs/angular.d.ts' />

import {extend, isString, find, pipe, parse, prop, eq}  from "../common/common";
import {INode} from "./interface";

import {IState, IStateDeclaration, IStateOrName} from "../state/interface";

const stateMatches = (state: IState|IStateDeclaration) => (node) => node.state === state || node.state.self === state;
const stateNameMatches = (stateName: string) => (node) => node.state.name === stateName;
const shallowNodeCopy = node => extend({}, node);

/**
 * A Path Object represents a Path of nested States within the State Hierarchy.
 * Each node of the path holds the IState object, and additional data, according
 * to the use case.
 *
 * A Path can be used to construct new Paths based on the current Path via the concat
 * and slice helper methods.
 *
 * @param _nodes [array]: an array of INode data
 */
export default class Path<NODE extends INode> {
  constructor(private _nodes: NODE[]) { }

  /**
   * returns a subpath of this path from the root path element up to and including the toState parameter.
   * Each node of the subpath is a shallow copy of the original node.
   *
   * @param toState A state or name of a state
   */
  pathFromRootTo(toState: IStateOrName): Path<NODE> {
    let predicate = isString(toState) ? stateNameMatches(<string> toState) : stateMatches(<IState> toState);
    let node = find(this._nodes, predicate);
    let elementIdx = this._nodes.indexOf(node);
    if (elementIdx === -1) throw new Error("This Path does not contain the toPathElement");
    return this.slice(0, elementIdx + 1);
  }

  /**
   * Returns a new Path which contains this Path's nodes, concatenated with another Path's nodes.
   * Each node of the concatenated Path is a shallow copy of the original nodes.
   */
  concat(path: Path<NODE>): Path<NODE> {
    return new Path(this._nodes.concat(path._nodes).map(shallowNodeCopy));
  }

  /**
   * Returns a new Path which is a subpath of this Path.  The new Path contains nodes starting from "start" and
   * ending at "end".  Each node of the subpath is a shallow copy of the original Path's node.
   */
  slice(start: number, end?: number): Path<NODE> {
    return new Path(this._nodes.slice(start, end).map(shallowNodeCopy));
  }

  /**
   * Returns a new Path which is a subpath of this Path.  The new Path starts from root and contains any nodes
   * that match the nodes in the otherPath. Nodes are compared using their state properties.
   * @param otherPath {Path<NODE>}
   * @returns {Path<NODE>}
   */
  matching(otherPath: Path<NODE>): Path<NODE> {
    let otherNodes = otherPath._nodes;
    let matchedCount = this._nodes.reduce((prev, node, i) =>
        prev === i && i < otherNodes.length && node.state === otherNodes[i].state ? i + 1 : prev, 0);
    return this.slice(matchedCount);
  }

  /**
   * Returns a new Path which is a copy of this Path, but with nodes in reverse order.
   * Each node in the reversed path is a shallow copy of the original Path's node.
   */
  reverse(): Path<NODE> {
    return new Path(this.nodes().map(shallowNodeCopy).reverse());
  }

  /** Returns the "state" property of each node in this Path */
  states(): IState[] {
    return this._nodes.map(prop("state"));
  }

  /** Gets the first node that exactly matches the given state */
  nodeForState(state: IStateOrName): NODE {
    let propName = (isString(state) ? "state.name" : "state");
    return find(this._nodes, pipe(parse(propName), eq(state)));
  }

  /** Returns the Path's nodes wrapped in a new array */
  nodes(): NODE[] {
    return [].concat(this._nodes);
  }

  /** Returns the last node in the Path  */
  last(): NODE {
    return this._nodes.length ? this._nodes[this._nodes.length - 1] : null;
  }

  /** Returns a new path where each path element is mapped using the nodeMapper function */
  adapt<T extends INode>(nodeMapper: (NODE, idx?) => T): Path<T> {
    return new Path(this._nodes.map(nodeMapper));
  }

  toString() {
    var elements = this._nodes.map(parse('state.name')).join(', ');
    return `Path([${elements}])`;
  }
}