$RouteProvider.$inject = ['$stateProvider', '$urlRouterProvider'];
function $RouteProvider(  $stateProvider,    $urlRouterProvider) {

  var routes = [];

  onEnterRoute.$inject = ['$$state'];
  function onEnterRoute(   $$state) {
    this.locals = $$state.locals.globals;
  }

  function onExitRoute() {
    this.locals = null;
  }

  this.when = when;
  function when(url, route) {
    if (route.redirectTo != null) {
      // Redirect, configure directly on $urlRouterProvider
      var redirect = route.redirectTo, handler;
      if (isString(redirect)) {
        handler = redirect; // leave $urlRouteProvider to handle
      } else if (isFunction(redirect)) {
        // Adapt to $urlRouterProvider API
        handler = function (params, $location) {
          return redirect(params, $location.path(), $location.search());
        };
      } else {
        throw new Error("Invalid 'redirectTo' in when()");
      }
      $urlRouterProvider.when(url, handler);
    } else {
      // Regular route, configure as state
      $stateProvider.state(inherit(route, {
        parent: null,
        name: 'route:' + url,
        url: url,
        onEnter: onEnterRoute,
        onExit: onExitRoute
      }));
    }
    routes.push(route);
    return this;
  }

  this.$get = $get;
  $get.$inject = ['$state'];
  function $get(   $state) {
    return inherit($state, {
      routes: routes
    });
  }
}

function $RouteParamsProvider() {
  this.$get = $get;
  $get.$inject = ['$stateParams'];
  function $get(   $stateParams) {
    return $stateParams;
  }
}

var $ViewDirective; // forward reference
angular.module('ui.compat')
    .directive('ngView', $ViewDirective)
    .provider('$route', $RouteProvider)
    .provider('$routeParams', $RouteParamsProvider);
