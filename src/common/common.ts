/// <reference path='../../typings/angularjs/angular.d.ts' />
import trace from "./trace"
var { isDefined, isFunction, isNumber, isString, isObject, isArray, forEach, extend, copy, noop, toJson, fromJson, equals, identity } = angular;
export { isDefined, isFunction, isNumber, isString, isObject, isArray, forEach, extend, copy, noop, toJson, fromJson, equals, identity };

export interface TypedMap<T> { [key: string]: T }

export interface Predicate<X> { (x: X): boolean; }
export interface Fx<X,T> { (x: X): T }
export interface F extends Function { }
export interface HOF { (fn1: F, fn2: F): F }

export interface ObjMapFn<X, T> { (x:X, key?: string): T }
export interface ArrMapFn<X, T> { (x:X, key?: number): T }

export var abstractKey = 'abstract';
export function inherit(parent, extra) {
  return extend(new (extend(function() {}, { prototype: parent }))(), extra);
}

/**
 * Applies a set of defaults to an options object.  The options object is filtered
 * to only those properties of the objects in the defaultsList.
 * Earlier objects in the defaultsList take precedence when applying defaults.
 */
export function defaults(opts = {}, ...defaultsList) {
  var defaults = merge.apply(null, [{}].concat(defaultsList));
  return extend({}, defaults, pick(opts || {}, objectKeys(defaults)));
}

/**
 * Merges properties from the list of objects to the destination object.
 * If a property already exists in the destination object, then it is not overwritten.
 */
export function merge(dst, ...objs: Object[]) {
  forEach(objs, function(obj) {
    forEach(obj, function(value, key) {
      if (!dst.hasOwnProperty(key)) dst[key] = value;
    });
  });
  return dst;
}

/**
 * Finds the common ancestor path between two states.
 *
 * @param {Object} first The first state.
 * @param {Object} second The second state.
 * @return {Array} Returns an array of state names in descending order, not including the root.
 */
export function ancestors(first, second) {
  var path = [];

  for (var n in first.path) {
    if (first.path[n] !== second.path[n]) break;
    path.push(first.path[n]);
  }
  return path;
}

/**
 * IE8-safe wrapper for `Object.keys()`.
 *
 * @param {Object} object A JavaScript object.
 * @return {Array} Returns the keys of the object as an array.
 */
export function objectKeys(object): string[] {
  if (Object.keys) {
    return Object.keys(object);
  }
  var result = [];

  forEach(object, function(val, key) {
    result.push(key);
  });
  return result;
}

/**
 * IE8-safe wrapper for `Array.prototype.indexOf()`.
 *
 * @param {Array} array A JavaScript array.
 * @param {*} value A value to search the array for.
 * @return {Number} Returns the array index value of `value`, or `-1` if not present.
 */
export var arraySearch = indexOf;
export function indexOf(array, value) {
  if (Array.prototype.indexOf) {
    return array.indexOf(value, Number(arguments[2]) || 0);
  }
  var len = array.length >>> 0, from = Number(arguments[2]) || 0;
  from = (from < 0) ? Math.ceil(from) : Math.floor(from);

  if (from < 0) from += len;

  for (; from < len; from++) {
    if (from in array && array[from] === value) return from;
  }
  return -1;
}

export const removeFrom = (array: any[]) => (obj) => {
  var idx = array.indexOf(obj);
  if (idx >= 0) array.splice(idx, 1);
  return array;
};

/**
 * Merges a set of parameters with all parameters inherited between the common parents of the
 * current state and a given destination state.
 *
 * @param {Object} currentParams The value of the current state parameters ($stateParams).
 * @param {Object} newParams The set of parameters which will be composited with inherited params.
 * @param {Object} $current Internal definition of object representing the current state.
 * @param {Object} $to Internal definition of object representing state to transition to.
 */
export function inheritParams(currentParams, newParams, $current, $to) {
  var parents = ancestors($current, $to), parentParams, inherited = {}, inheritList = [];

  for (var i in parents) {
    if (!parents[i].params) continue;
    parentParams = objectKeys(parents[i].params);
    if (!parentParams.length) continue;

    for (var j in parentParams) {
      if (indexOf(inheritList, parentParams[j]) >= 0) continue;
      inheritList.push(parentParams[j]);
      inherited[parentParams[j]] = currentParams[parentParams[j]];
    }
  }
  return extend({}, inherited, newParams);
}

/**
 * Performs a non-strict comparison of the subset of two objects, defined by a list of keys.
 *
 * @param {Object} a The first object.
 * @param {Object} b The second object.
 * @param {Array} keys The list of keys within each object to compare. If the list is empty or not specified,
 *                     it defaults to the list of keys in `a`.
 * @return {Boolean} Returns `true` if the keys match, otherwise `false`.
 */
export function equalForKeys(a, b, keys?: string[]) {
  if (!keys) {
    keys = [];
    for (var n in a) keys.push(n); // Used instead of Object.keys() for IE8 compatibility
  }

  for (var i=0; i<keys.length; i++) {
    var k = keys[i];
    if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
  }
  return true;
}

/**
 * Returns the subset of an object, based on a list of keys.
 *
 * @param {Array} keys
 * @param {Object} values
 * @return {Boolean} Returns a subset of `values`.
 */
export function filterByKeys(keys, values) {
  var filtered = {};

  forEach(keys, function (name) {
    if (isDefined(values[name])) filtered[name] = values[name];
  });
  return filtered;
}

// like _.indexBy
// when you know that your index values will be unique, or you want last-one-in to win
export function indexBy(array, propName) {
  var result = {};
  forEach(array, function(item) {
    result[item[propName]] = item;
  });
  return result;
}

// extracted from underscore.js
// Return a copy of the object only containing the whitelisted properties.
export function pick(obj, propNames: string[]): Object;
export function pick(obj, ...propName: string[]): Object;
export function pick(obj): Object {
  var copy = {};
  var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
  for (var key in obj) {
    if (keys.indexOf(key) !== -1) copy[key] = obj[key];
  }
  return copy;
}

// extracted from underscore.js
// Return a copy of the object omitting the blacklisted properties.
export function omit(obj, propNames: string[]): Object;
export function omit(obj, ...propName: string[]): Object;
export function omit(obj) {
  var copy = {};
  var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
  for (var key in obj) {
    if (keys.indexOf(key) === -1) copy[key] = obj[key];
  }
  return copy;
}

export function pluck(collection: any[], propName: string): any[]
export function pluck(collection: TypedMap<any>, propName: string): TypedMap<any>
export function pluck(collection, propName): any {
  return map(collection, prop(propName));
}

// Given an array or object, return a new array or object with:
// - array: only the elements which passed the callback predicate
// - object: only the properties that passed the callback predicate
export function filter<T>(collection: TypedMap<T>, callback: Predicate<T>): TypedMap<T>
export function filter<T>(collection: T[], callback: Predicate<T>): T[]
export function filter<T>(collection: T, callback: Function): T {
  var arr = isArray(collection), resultarray = [], resultobj = {};
  forEach(collection, function(val, i) {
    if (callback(val, i)) {
      if (arr) resultarray.push(val);
      else resultobj[i] = val;
    }
  });
  return <T>(arr ? resultarray : resultobj);
}

export const _filter = (callback) =>
    (collection) => filter(collection, callback);

export function find<T>(collection: TypedMap<T>, callback: Predicate<T>): T
export function find<T>(collection: T[], callback: Predicate<T>): T
export function find(collection, callback) {
  var result;

  forEach(collection, function(val, i) {
    if (result) return;
    if (callback(val, i)) result = val;
  });

  return result;
}

export function map<T, U>(collection: TypedMap<T>, callback: ObjMapFn<T,U>): TypedMap<U>
export function map<T, U>(collection: T[], callback: ArrMapFn<T,U>): U[]
export function map<T>(collection: T, callback): T { // This T is either Array or Map
  var result = isArray(collection) ? [] : {};
  forEach(collection, (val, i) =>  result[i] = callback(val, i));
  return <T> result;
}

// export function _map<T,U>(callback: ObjMapFn<T,U>): Fx<TypedMap<T>,TypedMap<U>>
// export function _map<T,U>(callback: ArrMapFn<T,U>): Fx<T[],U[]>
export function _map<T,U>(callback: any): any {
  return (collection) => map(collection, callback);
}

export function unnest(list) {
  var result = [];
  forEach(list, function(val) { result = result.concat(val); });
  return result;
}

export function unroll(callback) {
  callback = callback || angular.identity;

  return function(object) {
    var result = [];
    forEach(object, function(val, key) {
      var tmp = {};
      tmp[key] = val;
      result.push(callback(tmp));
    });
    return result;
  };
}

// Return a completely flattened version of an array.
export function flatten (array) {
  function _flatten(input, output) {
    forEach(input, function(value) {
      if (angular.isArray(value)) {
        _flatten(value, output);
      } else {
        output.push(value);
      }
    });
    return output;
  }

  return _flatten(array, []);
}

/**
 * Like _.zipObject or _.object: Given two parallel arrays, makes an object with key/value pairs, where
 * the key comes from array1 and the value comes from array2. Alternatively, the key/value pairs may be provided
 * in array1 only, where each element of the array is a nested array where the key is in nested[0] and val in nested[1]
 */
export function zipObject(array1: any[], array2?: any[]) {
  let pairs: any[] = array1;
  if (isDefined(array2)) {
    if (array1.length !== array2.length) {
      throw new Error("pairs(): Unequal length arrays not allowed");
    }
    pairs = array1.map((key, idx) => [key, array2[idx]]);
  }

  return pairs.reduce(addPairToObj, {});
}

/** Like _.pairs: Given an object, returns an array of key/value pairs */
export const pairs = (object) => Object.keys(object).map(key => [ key, object[key]] );

/**
 * Sets a key/val pair on an object, and returns the object.
 * Use as a reduce function for an array of key/val pairs
 *
 * Given:
 * var pairs = [ ["fookey", "fooval"], ["barkey","barval"] ]
 * var pairsToObj = pairs.reduce(addPairToObj, {})
 * Then:
 * true === angular.equals(pairsToObj, { fookey: "fooval", barkey: "barval" })
 */
export function addPairToObj(obj: TypedMap<any>, [key, val]) {
  obj[key] = val;
  return obj;
}

// Checks if a value is injectable
export function isInjectable(value) {
  return (isFunction(value) || (isArray(value) && isFunction(value[value.length - 1])));
}

export function isNull(o) { return o === null; }

export function compose() {
  var args = arguments;
  var start = args.length - 1;
  return function() {
    var i = start;
    var result = args[start].apply(this, arguments);
    while (i--) result = args[i].call(this, result);
    return result;
  };
}

export function pipe(...funcs: Function[]) {
  return compose.apply(null, [].slice.call(arguments).reverse());
}

export function prop(name): Fx<any,any> {
  return function(obj) { return obj && obj[name]; };
}

export function parse(name) {
  return pipe.apply(null, name.split(".").map(prop));
}

export function not(fn): Predicate<any> {
  return function() { return !fn.apply(null, [].slice.call(arguments)); };
}

export function and(fn1, fn2): Function {
  return function() {
    return fn1.apply(null, [].slice.call(arguments)) && fn2.apply(null, [].slice.call(arguments));
  };
}

export function or(fn1, fn2): Function {
  return function() {
    return fn1.apply(null, [].slice.call(arguments)) || fn2.apply(null, [].slice.call(arguments));
  };
}

export function is(ctor): Predicate<any> {
  return function(val) { return val != null && val.constructor === ctor || val instanceof ctor; };
}

export function eq(comp): Predicate<any> {
  return function(val) { return val === comp; };
}

export function isEq(fn1: F, fn2: F): () => boolean {
  return function() {
    var args = [].slice.call(arguments);
    return fn1.apply(null, args) === fn2.apply(null, args);
  };
}

export function val<T>(v: T): () => T {
  return function() { return v; };
}

export function invoke(fnName: string): Function;
export function invoke(fnName: string, args: any[]): Function;
export function invoke(fnName: string, args?: any[]): Function {
  return function(obj) {
    return obj[fnName].apply(obj, args);
  };
}

export function pattern(struct: Function[][]): Function {
  return function(val) {
    for (var i = 0; i < struct.length; i++) {
      if (struct[i][0](val)) return struct[i][1](val);
    }
  };
}

export var isPromise = and(isObject, pipe(prop('then'), isFunction));

// Stolen: http://stackoverflow.com/questions/4394747/javascript-curry-function
export function curry(fn: F): F {
    var initial_args = [].slice.apply(arguments, [1]);
    var func_args_length = fn.length;
    
    function curried(args) {
        if (args.length >= func_args_length)
            return fn.apply(null, args);
        return function () {
            return curried(args.concat([].slice.apply(arguments)));
        };
    }
    return curried(initial_args);
}
/**
 * @ngdoc overview
 * @name ui.router.util
 *
 * @description
 * # ui.router.util sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 *
 */
angular.module('ui.router.util', ['ng']);

/**
 * @ngdoc overview
 * @name ui.router.router
 * 
 * @requires ui.router.util
 *
 * @description
 * # ui.router.router sub-module
 *
 * This module is a dependency of other sub-modules. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 */
angular.module('ui.router.router', ['ui.router.util']);

/**
 * @ngdoc overview
 * @name ui.router.state
 * 
 * @requires ui.router.router
 * @requires ui.router.util
 *
 * @description
 * # ui.router.state sub-module
 *
 * This module is a dependency of the main ui.router module. Do not include this module as a dependency
 * in your angular app (use {@link ui.router} module instead).
 * 
 */
angular.module('ui.router.state', ['ui.router.router', 'ui.router.util', 'ui.router.angular1']);

/**
 * @ngdoc overview
 * @name ui.router
 *
 * @requires ui.router.state
 *
 * @description
 * # ui.router
 * 
 * ## The main module for ui.router 
 * There are several sub-modules included with the ui.router module, however only this module is needed
 * as a dependency within your angular app. The other modules are for organization purposes. 
 *
 * The modules are:
 * * ui.router - the main "umbrella" module
 * * ui.router.router - 
 * 
 * *You'll need to include **only** this module as the dependency within your angular app.*
 * 
 * <pre>
 * <!doctype html>
 * <html ng-app="myApp">
 * <head>
 *   <script src="js/angular.js"></script>
 *   <!-- Include the ui-router script -->
 *   <script src="js/angular-ui-router.min.js"></script>
 *   <script>
 *     // ...and add 'ui.router' as a dependency
 *     var myApp = angular.module('myApp', ['ui.router']);
 *   </script>
 * </head>
 * <body>
 * </body>
 * </html>
 * </pre>
 */
angular.module('ui.router', ['ui.router.state', 'ui.router.angular1']);

angular.module('ui.router.compat', ['ui.router']);
