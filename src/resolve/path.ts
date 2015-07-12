/// <reference path='../../bower_components/DefinitelyTyped/angularjs/angular.d.ts' />

import {extend, isArray, identity, noop} from "../common/common";
import {defaults, map, omit, pluck, find, pipe, prop, eq}  from "../common/common";
import {trace}  from "../common/trace";
import {IPromise} from "angular";
import {IPublicState} from "../state/state";
import {runtime} from "../common/angular1"
import PathElement from "./pathElement";
import Resolvable from "./resolvable";


/**
 *  A Path Object holds an ordered list of PathElements.
 *
 *  This object is used to store resolve status for an entire path of states. It has concat and slice
 *  helper methods to return new Paths, based on the current Path.
 *
 *
 *  Path becomes the replacement data structure for $state.$current.locals.
 *  The Path is used in the three resolve() functions (Path.resolvePath, PathElement.resolvePathElement,
 *  and Resolvable.resolveResolvable) and provides context for injectable dependencies (Resolvables)
 *
 *  @param statesOrPathElements [array]: an array of either state(s) or PathElement(s)
 */

class Path {
  constructor(statesOrPathElements: (IPublicState[] | PathElement[])) {
    if (!isArray(statesOrPathElements))
      throw new Error("states must be an array of state(s) or PathElement(s): ${statesOrPathElements}");

    var isPathElementArray = (statesOrPathElements.length && (statesOrPathElements[0] instanceof PathElement));
    var toPathElement = isPathElementArray ? identity : function (state) { return new PathElement(state); };
    this.elements = <PathElement[]> map(statesOrPathElements, toPathElement);
  }

  elements: PathElement[];

  // Returns a promise for an array of resolved Path Element promises
  resolvePath(options: any): IPromise<any> {
    options = options || {};
    if (options.trace) trace.traceResolvePath(this, options);
    const elementPromises = (element => element.resolvePathElement(this, options));
    return runtime.$q.all(<any> map(this.elements, elementPromises)).then(noop);
  }
  // TODO nuke this in favor of resolvePath()
  resolve(options: any) { return this.resolvePath(options); }

  /**
   *  Gets the available Resolvables for the last element of this path.
   *
   * @param options
   *
   * options.omitOwnLocals: array of property names
   *   Omits those Resolvables which are found on the last element of the path.
   *
   *   This will hide a deepest-level resolvable (by name), potentially exposing a parent resolvable of
   *   the same name further up the state tree.
   *
   *   This is used by Resolvable.resolve() in order to provide the Resolvable access to all the other
   *   Resolvables at its own PathElement level, yet disallow that Resolvable access to its own injectable Resolvable.
   *
   *   This is also used to allow a state to override a parent state's resolve while also injecting
   *   that parent state's resolve:
   *
   *   state({ name: 'G', resolve: { _G: function() { return "G"; } } });
   *   state({ name: 'G.G2', resolve: { _G: function(_G) { return _G + "G2"; } } });
   *   where injecting _G into a controller will yield "GG2"
   */
  getResolvables(options?: any): { [key:string]:Resolvable; } {
    options = defaults(options, { omitOwnLocals: [] });
    var last = this.last();
    return this.elements.reduce(function(memo, elem) {
      var omitProps = (elem === last) ? options.omitOwnLocals : [];
      var elemResolvables = omit.apply(null, [elem.getResolvables()].concat(omitProps));
      return extend(memo, elemResolvables);
    }, {});
  }

  clone(): Path {
    throw new Error("Clone not yet implemented");
  }

  // returns a subpath of this path from the root path element up to and including the toPathElement parameter
  pathFromRoot(toPathElement): Path {
    var elementIdx = this.elements.indexOf(toPathElement);
    if (elementIdx == -1) throw new Error("This Path does not contain the toPathElement");
    return this.slice(0, elementIdx + 1);
  }

  concat(path): Path {
    return new Path(this.elements.concat(path.elements));
  }

  slice(start: number, end?: number): Path {
    return new Path(this.elements.slice(start, end));
  }

  reverse(): Path {
    this.elements.reverse(); // TODO: return new Path()
    return this;
  }

  states(): IPublicState[] {
    return pluck(this.elements, "state");
  }

  elementForState(state: IPublicState): PathElement {
    return find(this.elements, pipe(prop('state'), eq(state)));
  }

  last(): PathElement {
    return this.elements.length ? this.elements[this.elements.length - 1] : null;
  }

  toString() {
    var elements = this.elements.map(e => e.state.name).join(", ");
    return `Path([${elements}])`;
  }
}

export default Path;