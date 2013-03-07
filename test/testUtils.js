function resolvePromise(promise) {
  if (!promise.then) throw new Error('Expected a promise, but got ' + jasmine.pp(promise) + '.');
  
  var result;
  promise.then(function (value) {
    result = { success: true, value: value };
  }, function (error) {
    result = { success: false, error: error };
  });

  jasmine.getEnv().currentSpec.$injector.get('$rootScope').$digest();
  if (!result) throw new Error('Promise is still pending');
  return result;
}

function resolvedValue(promise) {
  var result = resolvePromise(promise);
  if (!result.success) throw result.error;
  return result.value;
}

function resolvedError(promise) {
  var result = resolvePromise(promise);
  if (result.success) throw new Error('Promise was expected to fail but returned ' + jasmin.pp(res.value) + '.');
  return result.error;
}
