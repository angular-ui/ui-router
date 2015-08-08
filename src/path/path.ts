/// <reference path='../../typings/angularjs/angular.d.ts' />
import {extend, isArray, identity, noop,
    defaults, map, omit, pluck, find, pipe, prop, eq}  from "../common/common";
import trace  from "../common/trace";
import {runtime} from "../common/angular1"
import {IPromise} from "angular";

import {INode, IParamsNode, IParamsPath} from "./interface";

import {IState} from "../state/interface";

import StateReference from "../state/stateReference"

import {IResolvables} from "../resolve/interface";
import Resolvable from "../resolve/resolvable";

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
  
  // returns a subpath of this path from the root path element up to and including the toPathElement parameter
  pathFromRootTo(toState: IState): Path<NODE> {
    var first = this._nodes.filter((node) => node.state === toState);
    var elementIdx = this._nodes.indexOf(first[0]);
    if (elementIdx == -1) throw new Error("This Path does not contain the toPathElement");
    return this.slice(0, elementIdx + 1);
  }

  concat(path: Path<NODE>): Path<NODE> {
    return new Path(this._nodes.concat(path._nodes));
  }

  slice(start: number, end?: number): Path<NODE> {
    return new Path(this._nodes.slice(start, end));
  }

  reverse(): Path<NODE> {
    let copy = [].concat(this._nodes);
    copy.reverse();
    return new Path(copy)
  }

  states(): IState[] {
    return this._nodes.map(prop("state"));
  }

  elementForState(state: IState): NODE {
    return find(this._nodes, pipe(prop('state'), eq(state)));
  }
  
  nodes(): NODE[] {
    return [].concat(this._nodes);
  }

  last(): NODE {
    return this._nodes.length ? this._nodes[this._nodes.length - 1] : null;
  }

  adapt<T extends INode>(nodeMapper: (NODE) => T): Path<T> {
    var adaptedNodes = this._nodes.map(nodeMapper);
    return new Path(adaptedNodes);
  }

  toString() {
    var elements = this._nodes.map(e => e.state.name).join(", ");
    return `Path([${elements}])`;
  }
}