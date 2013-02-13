$RouterProvider.$inject = ['$stateProvider'];
function $RouterProvider(  $stateProvider) {

  onEnterRoute.$inject = ['$$state'];
  function onEnterRoute(   $$state) {
    this.locals = $$state.locals.globals;
  }
  function onExitRoute() {
    this.locals = null;
  }

  this.when = function (url, route) {
    route.onEnter = onEnterRoute;
    route.onExot = onExitRoute;
    $stateProvider.when(url, route);
    return this;
  };

  this.$get =
    [        '$state',
    function ($state) {
      return $state;
    }];
}

function $RouteParamsProvider() {
  this.$get =
    [        '$stateParams',
    function ($stateParams) {
      return $stateParams;
    }];
}

var $ViewDirective; // forward reference
angular.module('ui.compat')
  .directive('ngView', $ViewDirective)
  .provider('$router', $RouterProvider)
  .provider('$routeParams', $RouteParamsProvider);
