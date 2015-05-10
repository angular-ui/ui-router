/**
 * @ngdoc filter
 * @name ui.router.state.filter:isState
 *
 * @param {string|object} stateOrName The state name (absolute or relative) or state object you'd like to check.
 * @param {Object} onbject config represent the optional arguments
 * of @link ui.router.state.$state#methods_is $state.is("stateName"[, params [, options]])}. Valid keys are:
 *     - `params`: {object=} params A param object, e.g. `{sectionId: section.id}`, that you'd like
 *                 to test against the current active state.
 *     - `options`: {object=} options An options object.  The options are:
 *                 - **`relative`** - {string|object} -  If `stateOrName` is a relative state name and `options.relative` is set, it will
 *                  test relative to `options.relative` state (or name).
 * @returns {boolean} Returns true if it is the state.
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName"[, params [, options]])}.
 */
$IsStateFilter.$inject = ['$state'];
function $IsStateFilter($state) {
  var isFilter = function (state, stateOptions) {
    stateOptions = stateOptions || {};
    return $state.is(state, stateOptions.params, stateOptions.options);
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
function $IncludedByStateFilter($state) {
  var includesFilter = function (state) {
    return $state.includes(state);
  };
  includesFilter.$stateful = true;
  return  includesFilter;
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter);
