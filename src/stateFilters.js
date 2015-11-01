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
function $IsStateFilter($state) {
  var isFilter = function (state, params) {
    return $state.is(state, params);
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
  return includesFilter;
}

/**
 * @ngdoc filter
 * @name ui.router.state.filter:includedByStateWithParams
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName', {})}.
 */
$IncludedByStateWithParamsFilter.$inject = ['$state'];
function $IncludedByStateWithParamsFilter($state) {
  var includesFilter = function (state, params) {
    return $state.includes(state, params);
  };
  includesFilter.$stateful = true;
  return includesFilter;
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter)
  .filter('includedByStateWithParams', $IncludedByStateWithParamsFilter);
