/**
 * @ngdoc filter
 * @name ui.router.state.filter:isState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_is $state.is("stateName")}.
 *
 * @param {Object} The params object
 */
$IsStateFilter.$inject = ['$state'];
function $IsStateFilter($state) {
  return function(state, params) {
    return $state.is(state, params);
  };
}

/**
 * @ngdoc filter
 * @name ui.router.state.filter:includedByState
 *
 * @requires ui.router.state.$state
 *
 * @description
 * Translates to {@link ui.router.state.$state#methods_includes $state.includes('fullOrPartialStateName')}.
 *
 * @param {Object} The params object
 */
$IncludedByStateFilter.$inject = ['$state'];
function $IncludedByStateFilter($state) {
  return function(state, params) {
    return $state.includes(state, params);
  };
}

angular.module('ui.router.state')
  .filter('isState', $IsStateFilter)
  .filter('includedByState', $IncludedByStateFilter);
