import {map, pick, forEach, omit} from "@uirouter/core";

let stateProps = ["resolve", "resolvePolicy", "data", "template", "templateUrl", "url", "name", "params"];

export function tree2Array(tree, inheritName) {

  function processState(parent, state, name) {
    var substates: any = omit(state, stateProps);
    var thisState: any = pick(state, stateProps);
    thisState.name = name;
    if (!inheritName) thisState.parent = parent;

    return [thisState].concat(processChildren(thisState, substates));
  }

  function processChildren(parent, substates) {
    let states = [];
    forEach(substates, function (value, key) {
      if (inheritName && parent.name) key = `${parent.name}.${key}`;
      states = states.concat(processState(parent, value, key));
    });
    return states;
  }

  return processChildren("", tree);
}

export function PromiseResult(promise?) {
  var self = this, _promise: Promise<any>;
  var resolve, reject, complete;

  this.setPromise = function(promise) {
    if (_promise) {
      throw new Error("Already have with'd a promise.");
    }

    var onfulfilled = (data) =>
        resolve = data || true;
    var onrejected = (err) =>
        reject = err || true;
    var done = () =>
        complete = true;

    _promise = promise;
    _promise.then(onfulfilled)
        .catch(onrejected)
        .then(done, done);
  };

  this.get = () =>
      ({ resolve: resolve, reject: reject, complete: complete });

  this.called = () =>
      map(self.get(), (val, key) => val !== undefined);

  if (promise) {
    this.setPromise(promise);
  }
}


