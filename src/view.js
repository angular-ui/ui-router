
$ViewProvider.$inject = [];
function $ViewProvider() {

  this.$get = $get;
  $get.$inject = ['$rootScope', '$templateFactory', '$stateParams'];
  function $get(   $rootScope,   $templateFactory,   $stateParams) {
    return {
      // $view.load('full.viewName', { template: ..., controller: ..., resolve: ..., async: false })
      load: function load(name, options) {
        var result;
        options = extend({
          template: null, controller: null, view: null, locals: null, notify: true, async: true
        }, options);
    
        if (options.view) {
          result = $templateFactory.fromConfig(options.view, $stateParams, options.locals);
        }
        if (result && options.notify) {
          $rootScope.$broadcast('$viewContentLoading', options);
        }
        return result;
      }
    };
  }
}

angular.module('ui.state').provider('$view', $ViewProvider);
