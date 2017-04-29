/** @module ng1 */ /** for typedoc */

import { ng as angular } from "./angular";
import { Obj, StateService, StateOrName } from "@uirouter/core";

/**
 * `isState` Filter: truthy if the current state is the parameter
 *
 * Translates to [[StateService.is]] `$state.is("stateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'stateName' | isState">show if state is 'stateName'</div>
 * ```
 */
$IsStateFilter.$inject = ['$state'];
export function $IsStateFilter($state: StateService) {
  var isFilter: any = function(state: StateOrName, params: Obj, options?: { relative?: boolean }) {
    return $state.is(state, params, options);
  };
  isFilter.$stateful = true;
  return isFilter;
}

/**
 * `includedByState` Filter: truthy if the current state includes the parameter
 *
 * Translates to [[StateService.includes]]` $state.is("fullOrPartialStateName")`.
 *
 * #### Example:
 * ```html
 * <div ng-if="'fullOrPartialStateName' | includedByState">show if state includes 'fullOrPartialStateName'</div>
 * ```
 */
$IncludedByStateFilter.$inject = ['$state'];
export function $IncludedByStateFilter($state: StateService) {
  var includesFilter: any = function(state: StateOrName, params: Obj, options: Obj) {
    return $state.includes(state, params, options);
  };
  includesFilter.$stateful = true;
  return  includesFilter;
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter);
