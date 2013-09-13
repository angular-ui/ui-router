$View.$inject = ['$rootScope', '$templateFactory', '$q', '$rootScope'];
function $View(   $rootScope,   $templateFactory,   $q,   $rootScope) {

  /**
   * Uses `$templateFactory` to load a template from a configuration object into a named view.
   *
   * @param {String} name The fully-qualified name of the view to load the template into
   * @param {Object} options The options used to load the template:
   * @param {Boolean} options.notify Indicates whether a `$viewContentLoading` event should be
   *    this call.
   * @params {*} options.* Accepts the full list of parameters and options accepted by
   *    `$templateFactory.fromConfig()`, including `params` and `locals`.
   * @return {Promise.<string>} Returns a promise that resolves to the value of the template loaded.
   */
  this.load = function load (name, options) {
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
    if (isString(result)) {
      var deferred = $q.defer();
      $rootScope.$evalAsync(function() { deferred.resolve(result); });
      return deferred.promise;
    }
    return result;
  }
}

angular.module('ui.router.state').service('$view', $View);
