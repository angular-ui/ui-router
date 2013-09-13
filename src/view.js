
$ViewProvider.$inject = [];
function $ViewProvider() {

  this.$get = $get;
  $get.$inject = ['$rootScope', '$templateFactory'];
  function $get(   $rootScope,   $templateFactory) {
    return {
      // $view.load('full.viewName', { template: ..., controller: ..., async: false, params: ... })
      load: function load(name, options) {
        var result, defaults = {
          template: undefined,
          templateUrl: undefined,
          templateProvider: undefined,
          controller: null,
          locals: null,
          notify: true,
          async: true,
          params: {}
        };
        options = extend(defaults, options);

        if (options.template || options.templateUrl || options.templateProvider) {
          result = $templateFactory.fromConfig(options, options.params, options.locals);
        }
        if (result && options.notify) {
          options.targetView = name;
          $rootScope.$broadcast('$viewContentLoading', options);
        }
        return result;
      }
    };
  }
}

angular.module('ui.router.state').provider('$view', $ViewProvider);
