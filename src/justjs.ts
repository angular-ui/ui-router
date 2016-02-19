export * from "./ui-router";
import {services} from "./common/coreservices";
import {isDefined, isFunction, isArray, isObject, isInjectable} from "./common/predicates";
import {extend, assertPredicate, forEach} from "./common/common";

/** $q-like promise api */
services.$q = (executor: (resolve, reject) => void) => new Promise(executor);
services.$q.when = (val) => new Promise((resolve, reject) => resolve(val));
services.$q.reject = (val) => new Promise((resolve, reject) => { reject(val); });
services.$q.defer = function() {
  let deferred: any = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
};

services.$q.all = function (promises: { [key: string]: Promise<any> } | Promise<any>[]) {
  if (isArray(promises)) {
    return new Promise((resolve, reject) => {
      let results = [];
      promises.reduce((memo, promise) => {
        if (!isDefined(memo)) return promise;
        return memo.then(val => results.push(val)).then(() => promise);
      }).then(() => resolve(results), reject);
    });
  }

  if (isObject(promises)) {
    let results = {};
    return new Promise((resolve, reject) => {
      let chain = services.$q.when();
      forEach(promises, (promise: Promise<any>, key: string) => {
        promise.then(val => results[key] = val);
        chain = chain.then(() => promise);
      });
      chain.then(resolve, reject);
    });
  }
};





// angular1-like injector api

// globally available injectables
let globals = { };
services.$injector = { };

services.$injector.get = name => globals[name];
services.$injector.has = (name) => services.$injector.get(name) != null;
services.$injector.invoke = function(fn, context?, locals?) {
  let all = extend({}, globals, locals || {});
  let params = services.$injector.annotate(fn);
  let ensureExist = assertPredicate(key => all.hasOwnProperty(key), key => `DI can't find injectable: '${key}'`);
  let args = params.filter(ensureExist).map(x => all[x]);
  if (isFunction(fn)) return fn.apply(context, args);
  return fn.slice(-1)[0].apply(context, args);
};

let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
let ARGUMENT_NAMES = /([^\s,]+)/g;
// http://stackoverflow.com/questions/1007981
services.$injector.annotate = function(fn) {
  if (!isInjectable(fn)) throw new Error(`Not an injectable function: ${fn}`);
  if (fn && fn.$inject) return fn.$inject;
  if (isArray(fn)) return fn.slice(0, -1);
  let fnStr = fn.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  return result || [];
};

let loc = <any> services.location;

loc.hash = () => "";
loc.path = () => location.hash.replace(/^#/, "");
loc.search = () => location.search;
loc.url = (url) => { if (url) location.hash = url; return loc.path(); };
loc.replace = () => { console.log(new Error("not impl")); };
loc.onChange = (cb) => {
  window.addEventListener("hashchange", cb, false);
};

let locCfg = <any> services.locationConfig;

locCfg.port = () => location.port;
locCfg.protocol = () => location.protocol;
locCfg.host = () => location.host;
locCfg.baseHref = () => "";
locCfg.html5Mode = () => false;
locCfg.hashPrefix = () => "";
