/** @module params */ /** for typedoc */
import {extend, ancestors} from "../common/common";

export class StateParams {
  constructor(params: Object = {}) {
    extend(this, params);
  }

  /**
   * Merges a set of parameters with all parameters inherited between the common parents of the
   * current state and a given destination state.
   *
   * @param {Object} newParams The set of parameters which will be composited with inherited params.
   * @param {Object} $current Internal definition of object representing the current state.
   * @param {Object} $to Internal definition of object representing state to transition to.
   */
  $inherit(newParams, $current, $to) {
    let parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

    for (let i in parents) {
      if (!parents[i] || !parents[i].params) continue;
      parentParams = Object.keys(parents[i].params);
      if (!parentParams.length) continue;

      for (let j in parentParams) {
        if (inheritList.indexOf(parentParams[j]) >= 0) continue;
        inheritList.push(parentParams[j]);
        inherited[parentParams[j]] = this[parentParams[j]];
      }
    }
    return extend({}, inherited, newParams);
  };
}

