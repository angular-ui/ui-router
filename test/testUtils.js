// Promise testing support
angular.module('ngMock')
  .config(function ($provide) {
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
      }

      return $delegate;
    });
  });


function resolvedPromise(promise) {
  if (!promise.then) throw new Error('Expected a promise, but got ' + jasmine.pp(promise) + '.');
  var result = promise.$$resolved;
  if (!isDefined(result)) throw new Error('Promise has not been augmented by ngMock');
  if (!result) throw new Error('Promise is not resolved yet');
  return result;
}

function resolvedValue(promise) {
  var result = resolvedPromise(promise);
  if (!result.success) throw result.error;
  return result.value;
}

function resolvedError(promise) {
  var result = resolvedPromise(promise);
  if (result.success) throw new Error('Promise was expected to fail but returned ' + jasmin.pp(res.value) + '.');
  return result.error;
}


// Utils for test from core angular
var noop = angular.noop,
    toJson = angular.toJson;
beforeEach(module('ui.compat'));
