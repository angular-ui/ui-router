/** @module state */ /** for typedoc */

import { ng as angular } from "../angular";
import { Obj, StateService, StateOrName } from "ui-router-core";

/**
 * @ngdoc filter
 * @name ui.router.state.filter:isState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName")}.
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
 * @ngdoc filter
 * @name ui.router.state.filter:includedByState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName')}.
 */
$IncludedByStateFilter.$inject = ['$state'];
export function $IncludedByStateFilter($state: StateService) {
  var includesFilter: any = function(state: StateOrName, params: Obj, options: Obj) {
    return $state.includes(state, params, options);
  };
  includesFilter.$stateful = true;
  return  includesFilter;
}

/**
 * @ngdoc filter
 * @name ui.router.state.filter:asHref
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.router.$urlRouter#href $state.href('absoluteOrRelativeStateName')}.
 */
$AsHrefFilter.$inject = ['$state'];
export function $AsHrefFilter($state) {
  var asFilter: any = function(state, params, options) {
    return $state.href(state, params);
  };
  asFilter.$stateful = true;
  return  asFilter;
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter)
  .filter('asHref', $AsHrefFilter);
