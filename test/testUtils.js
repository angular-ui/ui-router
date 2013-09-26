// Promise testing support
angular.module('ngMock')
  .config(function ($provide) {
    $provide.decorator('$q', function ($delegate, $rootScope) {

      var openDeferreds = {};
      var nextDeferredId = 0;

      $delegate.dump = function () {
        var list = [];
        forEach(openDeferreds, function(deferred) { list.push(deferred); });
        if (list.length > 0) {
          console.log('Unresolved deferreds:');
          list.map(function(deferred) { deferred.$$dump(); });
        }
      };

      $delegate.flush = function() {
        $rootScope.$digest();
        $delegate.dump();
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

        var id = nextDeferredId++;
        openDeferreds[id] = deferred;

        var e = new Error(id);
        deferred.$$id = deferred.promise.$$id
        deferred.$$stack = deferred.promise.$$stack = e.stack;
        deferred.$$dump = function() { console.log(id, e.stack); };

        var qResolve = deferred.resolve;
        deferred.resolve = function() {
          delete openDeferreds[id];
          qResolve.apply(this, arguments);
        };

        var qReject = deferred.reject;
        deferred.reject = function() {
          delete openDeferreds[id];
          qReject.apply(this, arguments);
        };

        expose(deferred.promise);

        return deferred;
      }

      return $delegate;
    });
  });

function testablePromise(promise) {
  if (!promise || !promise.then) throw new Error('Expected a promise, but got ' + jasmine.pp(promise) + '.');
  if (!isDefined(promise.$$resolved)) throw new Error('Promise has not been augmented by ngMock');
  return promise;
}

function resolvedPromise(promise) {
  var result = testablePromise(promise).$$resolved;
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

beforeEach(function () {
  this.addMatchers({
    toBeResolved: function() {
      return !!testablePromise(this.actual).$$resolved;
    }
  });
});

// Misc test utils
function caught(fn) {
  try {
    fn();
    return null;
  } catch (e) {
    return e;
  }
}

// Utils for test from core angular
var noop = angular.noop,
    toJson = angular.toJson;
beforeEach(module('ui.router.compat'));
