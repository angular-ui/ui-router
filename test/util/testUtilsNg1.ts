import * as angular from "angular";

// Promise testing support
angular.module('ngMock').config(function ($provide, $locationProvider) {
  var oldFn = $locationProvider.html5Mode;
  $locationProvider.html5Mode = function() {
    var retval = oldFn.apply($locationProvider, arguments);
    return (angular.isDefined(retval) && angular.isDefined(retval.enabled)) ? retval.enabled : retval;
  };

  $provide.decorator('$q', function ($delegate, $rootScope) {
    $delegate.flush = function() {
      $rootScope.$digest();
    };

    // Add callbacks to the promise that expose the resolved value/error
    function expose(promise) {
      // Don't add hooks to the same promise twice (shouldn't happen anyway)
      if (!promise.hasOwnProperty('$$resolved')) {
        promise.$$resolved = false;
        promise.then(function (value) {
          promise.$$resolved = { success: true, value: value };
        }, function (error) {
          promise.$$resolved = { success: false, error: error };
        });

        // We need to expose() any then()ed promises recursively
        var qThen = promise.then;
        promise.then = function () {
          return expose(qThen.apply(this, arguments));
        };
      }
      return promise;
    }

    // Wrap functions that return a promise
    angular.forEach([ 'when', 'all', 'reject'], function (name) {
      var qFunc = $delegate[name];
      $delegate[name] = function () {
        return expose(qFunc.apply(this, arguments));
      };
    });

    // Wrap defer()
    var qDefer = $delegate.defer;
    $delegate.defer = function () {
      var deferred = qDefer();
      expose(deferred.promise);
      return deferred;
    };

    return $delegate;
  });
});

try {
  // Animation testing support
  angular.module('mock.animate').config(function ($provide) {
    $provide.decorator('$animate', function ($delegate) {
      $delegate.flush = function() {
        while (this.queue.length > 0) {
          this.flushNext(this.queue[0].method);
        }
      };
      return $delegate;
    });
  });
} catch (e) {}

export function testablePromise(promise) {
  if (!promise || !promise.then) throw new Error('Expected a promise, but got ' + jasmine.pp(promise) + '.');
  if (!angular.isDefined(promise.$$resolved)) throw new Error('Promise has not been augmented by ngMock');
  return promise;
}

export function resolvedPromise(promise) {
  var result = testablePromise(promise).$$resolved;
  if (!result) throw new Error('Promise is not resolved yet');
  return result;
}

export function resolvedValue(promise) {
  var result = resolvedPromise(promise);
  if (!result.success) throw result.error;
  return result.value;
}

export function resolvedError(promise) {
  var result = resolvedPromise(promise);
  if (result.success) throw new Error('Promise was expected to fail but returned ' + jasmine.pp(result.value) + '.');
  return result.error;
}

// Misc test utils
export function caught(fn) {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
}

// Usage of this helper should be replaced with a custom matcher in jasmine 2.0+
export function obj(object) {
  var o = {};
  angular.forEach(object, function (val, key) {
    if (!/^\$/.test(key) && key != "#")
      o[key] = val;
  });
  return o;
}

export function html5Compat(html5mode) {
  return (angular.isObject(html5mode) && html5mode.hasOwnProperty("enabled") ? html5mode.enabled : html5mode);
}

/**
 * The ng1 $exceptionHandler from angular-mocks will re-throw any exceptions thrown in a Promise.
 * This chunk of code decorates the handler, allowing a test to disable that behavior.
 * Inject $exceptionHandler and set `$exceptionHandler.disabled = true`
 */
export function decorateExceptionHandler($exceptionHandlerProvider) {
  var $get = $exceptionHandlerProvider.$get;

  $exceptionHandlerProvider.$get = function() {
    var realHandler = $get.apply($exceptionHandlerProvider, arguments);
    function passThrough(e) {
      if (!passThrough['disabled']) {
        realHandler.apply(null, arguments);
      }
    }
    return passThrough;
  };
}


beforeEach(angular['mock'].module('ui.router.compat'));
