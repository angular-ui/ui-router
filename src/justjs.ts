/**
 * Naive, pure JS implementation of core ui-router services
 *
 * @module justjs
 */ /** */
export * from "./core";
import {services} from "./common/coreservices";
import {stringify} from "./common/strings";
import {isFunction, isArray, isObject, isInjectable} from "./common/predicates";
import {extend, assertPredicate} from "./common/common";

/** $q-like promise api */
services.$q = (executor: (resolve: any, reject: any) => void) => new Promise(executor);
services.$q.when = (val: any) => Promise.resolve(val);
services.$q.reject = (val: any) => Promise.reject(val);
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
    return Promise.all(promises);
  }

  if (isObject(promises)) {
    // Convert promises map to promises array.
    // When each promise resolves, map it to a tuple { key: key, val: val }
    let objectToTuples = Object.keys(promises)
        .map(key => (<any>promises)[key].then((val: any) => ({key, val})));

    const tuplesToObject = (values: any) =>
        values.reduce((acc: any, tuple: any) => { acc[tuple.key] = tuple.val; return acc; }, {});

    // Then wait for all promises to resolve, and convert them back to an object
    return services.$q.all(objectToTuples).then(tuplesToObject);
  }
};





// angular1-like injector api

// globally available injectables
let globals: { [key: string]: any; } = { };
services.$injector = { };

services.$injector.get = (name: any) => globals[name];
services.$injector.has = (name: any) => services.$injector.get(name) != null;
services.$injector.invoke = function(fn: any, context?: any, locals?: any) {
  let all = extend({}, globals, locals || {});
  let params = services.$injector.annotate(fn);
  let ensureExist = assertPredicate(key => all.hasOwnProperty(key), (key: any) => `Could not find Dependency Injection token: ${stringify(key)}`);
  let args = params.filter(ensureExist).map((x: any) => all[x]);
  if (isFunction(fn)) return fn.apply(context, args);
  return fn.slice(-1)[0].apply(context, args);
};

let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
let ARGUMENT_NAMES = /([^\s,]+)/g;
// http://stackoverflow.com/questions/1007981
services.$injector.annotate = function(fn: any) {
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
loc.url = (url: any) => { if (url) location.hash = url; return loc.path(); };
loc.replace = () => { console.log(new Error("not impl")); };
loc.onChange = (cb: any) => {
  window.addEventListener("hashchange", cb, false);
};

let locCfg = <any> services.locationConfig;

locCfg.port = () => location.port;
locCfg.protocol = () => location.protocol;
locCfg.host = () => location.host;
locCfg.baseHref = () => "";
locCfg.html5Mode = () => false;
locCfg.hashPrefix = () => "";
