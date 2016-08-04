/**
 * Naive, pure JS implementation of core ui-router services
 *
 * @module justjs
 */ /** */
export * from "./core";
import {services} from "./common/coreservices";
import {stringify} from "./common/strings";
import {isFunction, isArray, isObject, isInjectable} from "./common/predicates";
import {extend, assertPredicate, TypedMap, Obj} from "./common/common";

/** $q-like promise api */
services.$q = ((executor) => new Promise(executor)) as any;
services.$q.when = (val) => Promise.resolve(val);
services.$q.reject = (val) => Promise.reject(val);
services.$q.defer = function() {
  let deferred: any = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
};

type Promises = TypedMap<Promise<any>>;

services.$q.all = function (promises: Promises | Promise<any>[]) {
  if (isArray(promises)) {
    return Promise.all(promises);
  }

  if (isObject(promises)) {
    var p = <Promises> promises;
    // Convert promises map to promises array.
    // When each promise resolves, map it to a tuple { key: key, val: val }
    let objectToTuples = Object.keys(promises)
        .map(key => p[key].then(val => ({key, val})));

    const tuplesToObject = (values: any[]) =>
        values.reduce((acc, tuple) => { acc[tuple.key] = tuple.val; return acc; }, {});

    // Then wait for all promises to resolve, and convert them back to an object
    return services.$q.all(objectToTuples).then(tuplesToObject);
  }
};





// angular1-like injector api

// globally available injectables
let globals: { [key: string]: any } = {};
services.$injector = {
  get: (name: any) => globals[<string> name],

  has: (name: any) => services.$injector.get(name) != null,

  invoke: function(fn: Function, context?: any, locals?: Obj) {
    let all = extend({}, globals, locals || {});
    let params = services.$injector.annotate(fn);
    let ensureExist = assertPredicate(key => all.hasOwnProperty(key), (key: any) => `Could not find Dependency Injection token: ${stringify(key)}`);
    let args = params.filter(ensureExist).map(x => all[x]);
    if (isFunction(fn)) return fn.apply(context, args);
    return (fn as any).slice(-1)[0].apply(context, args);
  },

  // http://stackoverflow.com/questions/1007981
  annotate: function(fn: Function) {
    let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    let ARGUMENT_NAMES = /([^\s,]+)/g;
    if (!isInjectable(fn)) throw new Error(`Not an injectable function: ${fn}`);
    if (fn && fn['$inject']) return fn['$inject'];
    if (isArray(fn)) return (fn as any).slice(0, -1);
    let fnStr = fn.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    return result || [];
  }

};

let loc = <any> services.location;

loc.hash = () => "";
loc.path = () => location.hash.replace(/^#/, "");
loc.search = () => location.search;
loc.url = (url: string) => { if (url) location.hash = url; return loc.path(); };
loc.replace = () => { console.log(new Error("not impl")); };
loc.onChange = (cb: (ev?: HashChangeEvent) => any) => {
  window.addEventListener("hashchange", cb, false);
};

let locCfg = <any> services.locationConfig;

locCfg.port = () => location.port;
locCfg.protocol = () => location.protocol;
locCfg.host = () => location.host;
locCfg.baseHref = () => "";
locCfg.html5Mode = () => false;
locCfg.hashPrefix = () => "";
