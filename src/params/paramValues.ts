import {IParamsPath} from "../path/interface";
import {IRawParams} from "../params/interface";

import {extend, find} from "../common/common";
/**
 * This class closes over a Path and encapsulates the parameter values from the Path's Nodes.
 * The param values for the path are flattened and copied to the resulting ParamValues object.  
 * Param values for a specific state are exposed with the $byState(stateName) function.
 */
const stateNameMatches = (stateName: string) => (node) => node.state.name === stateName;

export default class ParamValues implements IRawParams {
  [key: string]: any
  private $$path: IParamsPath;

  constructor($$path: IParamsPath) {
    Object.defineProperty(this, "$$path", { value: $$path });
    $$path.nodes().reduce((memo, node) => extend(memo, node.ownParamValues), this);
  }

  /** Gets the param values for a given state (by state name) */
  $byState(stateName: string) {
    let found = find(this.$$path.nodes(), stateNameMatches(stateName));
    return found && found.ownParamValues;
  }

  /** Returns a new ParamValues object which closes over a subpath of this ParamValue's Path. */
  $isolateRootTo(stateName: string): ParamValues {
    return new ParamValues(this.$$path.pathFromRootTo(stateName));
  }
}
