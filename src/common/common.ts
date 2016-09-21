/**
 * Random utility functions used in the UI-Router code
 *
 * @preferred @module common
 */ /** for typedoc */

import {isFunction, isString, isArray, isRegExp, isDate} from "./predicates";
import { all, any, not, prop, curry } from "./hof";
import {services} from "./coreservices";
import {State} from "../state/stateObject";

let w: any = typeof window === 'undefined' ? {} : window;
let angular = w.angular || {};
export const fromJson = angular.fromJson || JSON.parse.bind(JSON);
export const toJson = angular.toJson || JSON.stringify.bind(JSON);
export const copy = angular.copy || _copy;
export const forEach = angular.forEach || _forEach;
export const extend = angular.extend || _extend;
export const equals = angular.equals || _equals;
export const identity = (x: any) => x;
export const noop = () => <any> undefined;

export type Mapper<X, T> = (x: X, key?: (string|number)) => T;
export interface TypedMap<T> { [key: string]: T; }
export type Predicate<X> = (x: X) => boolean;
export type IInjectable = (Function|any[]);

export interface Obj extends Object {
  [key: string]: any
}

/**
 * Binds and copies functions onto an object
 *
 * Takes functions from the 'from' object, binds those functions to the _this object, and puts the bound functions
 * on the 'to' object.
 *
 * This example creates an new class instance whose functions are prebound to the new'd object.
 * @example
 * ```
 *
 * class Foo {
 *   constructor(data) {
 *     // Binds all functions from Foo.prototype to 'this',
 *     // then copies them to 'this'
 *     bindFunctions(Foo.prototype, this, this);
 *     this.data = data;
 *   }
 *
 *   log() {
 *     console.log(this.data);
 *   }
 * }
 *
 * let myFoo = new Foo([1,2,3]);
 * var logit = myFoo.log;
 * logit(); // logs [1, 2, 3] from the myFoo 'this' instance
 * ```
 *
 * This example creates a bound version of a service function, and copies it to another object
 * @example
 * ```
 *
 * var SomeService = {
 *   this.data = [3, 4, 5];
 *   this.log = function() {
 *     console.log(this.data);
 *   }
 * }
 *
 * // Constructor fn
 * function OtherThing() {
 *   // Binds all functions from SomeService to SomeService,
 *   // then copies them to 'this'
 *   bindFunctions(SomeService, this, SomeService);
 * }
 *
 * let myOtherThing = new OtherThing();
 * myOtherThing.log(); // logs [3, 4, 5] from SomeService's 'this'
 * ```
 *
 * @param from The object which contains the functions to be bound
 * @param to The object which will receive the bound functions
 * @param bindTo The object which the functions will be bound to
 * @param fnNames The function names which will be bound (Defaults to all the functions found on the 'from' object)
 */
export function bindFunctions(from: Obj, to: Obj, bindTo: Obj, fnNames: string[] = Object.keys(from)) {
  return fnNames.filter(name => typeof from[name] === 'function')
      .forEach(name => to[name] = from[name].bind(bindTo));
}


/**
 * prototypal inheritance helper.
 * Creates a new object which has `parent` object as its prototype, and then copies the properties from `extra` onto it
 */
export const inherit = (parent: Obj, extra: Obj) =>
    extend(new (extend(function() {}, { prototype: parent }))(), extra);

/**
 * Given an arguments object, converts the arguments at index idx and above to an array.
 * This is similar to es6 rest parameters.
 *
 * Optionally, the argument at index idx may itself already be an array.
 *
 * For example,
 * given either:
 *        arguments = [ obj, "foo", "bar" ]
 * or:
 *        arguments = [ obj, ["foo", "bar"] ]
 * then:
 *        restArgs(arguments, 1) == ["foo", "bar"]
 *
 * This allows functions like pick() to be implemented such that it allows either a bunch
 * of string arguments (like es6 rest parameters), or a single array of strings:
 *
 * given:
 *        var obj = { foo: 1, bar: 2, baz: 3 };
 * then:
 *        pick(obj, "foo", "bar");   // returns { foo: 1, bar: 2 }
 *        pick(obj, ["foo", "bar"]); // returns { foo: 1, bar: 2 }
 */
const restArgs = (args: IArguments, idx = 0) =>
    Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(args, idx));

/** Given an array, returns true if the object is found in the array, (using indexOf) */
export const inArray = (array: any[], obj: any) =>
    array.indexOf(obj) !== -1;

/** Given an array, and an item, if the item is found in the array, it removes it (in-place).  The same array is returned */
export const removeFrom = curry((array: any[], obj: any) => {
  let idx = array.indexOf(obj);
  if (idx >= 0) array.splice(idx, 1);
  return array;
});

/**
 * Applies a set of defaults to an options object.  The options object is filtered
 * to only those properties of the objects in the defaultsList.
 * Earlier objects in the defaultsList take precedence when applying defaults.
 */
export function defaults(opts = {}, ...defaultsList: Obj[]) {
  let defaults = merge.apply(null, [{}].concat(defaultsList));
  return extend({}, defaults, pick(opts || {}, Object.keys(defaults)));
}

/**
 * Merges properties from the list of objects to the destination object.
 * If a property already exists in the destination object, then it is not overwritten.
 */
export function merge(dst: Obj, ...objs: Obj[]) {
  forEach(objs, function(obj: Obj) {
    forEach(obj, function(value: any, key: string) {
      if (!dst.hasOwnProperty(key)) dst[key] = value;
    });
  });
  return dst;
}

/** Reduce function that merges each element of the list into a single object, using extend */
export const mergeR = (memo: Obj, item: Obj) => extend(memo, item);

/**
 * Finds the common ancestor path between two states.
 *
 * @param {Object} first The first state.
 * @param {Object} second The second state.
 * @return {Array} Returns an array of state names in descending order, not including the root.
 */
export function ancestors(first: State, second: State) {
  let path: State[] = [];

  for (var n in first.path) {
    if (first.path[n] !== second.path[n]) break;
    path.push(first.path[n]);
  }
  return path;
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
export function equalForKeys(a: Obj, b: Obj, keys: string[] = Object.keys(a)) {
  for (var i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
  }
  return true;
}

type PickOmitPredicate = (keys: string[], key: string) => boolean;
function pickOmitImpl(predicate: PickOmitPredicate, obj: Obj, ...keys: string[]) {
  let objCopy = {};
  for (let key in obj) {
    if (predicate(keys, key)) objCopy[key] = obj[key];
  }
  return objCopy;
}

/**
 * @example
 * ```
 *
 * var foo = { a: 1, b: 2, c: 3 };
 * var ab = pick(foo, ['a', 'b']); // { a: 1, b: 2 }
 * ```
 * @param obj the source object
 * @param propNames an Array of strings, which are the whitelisted property names
 */
export function pick(obj: Obj, propNames: string[]): Obj;
/**
 * @example
 * ```
 *
 * var foo = { a: 1, b: 2, c: 3 };
 * var ab = pick(foo, 'a', 'b'); // { a: 1, b: 2 }
 * ```
 * @param obj the source object
 * @param propNames 1..n strings, which are the whitelisted property names
 */
export function pick(obj: Obj, ...propNames: string[]): Obj;
/** Return a copy of the object only containing the whitelisted properties. */
export function pick(obj: Obj) {
  return pickOmitImpl.apply(null, [inArray].concat(restArgs(arguments)));
}

/**
 * @example
 * ```
 *
 * var foo = { a: 1, b: 2, c: 3 };
 * var ab = omit(foo, ['a', 'b']); // { c: 3 }
 * ```
 * @param obj the source object
 * @param propNames an Array of strings, which are the blacklisted property names
 */
export function omit(obj: Obj, propNames: string[]): Obj;
/**
 * @example
 * ```
 *
 * var foo = { a: 1, b: 2, c: 3 };
 * var ab = omit(foo, 'a', 'b'); // { c: 3 }
 * ```
 * @param obj the source object
 * @param propNames 1..n strings, which are the blacklisted property names
 */
export function omit(obj: Obj, ...propNames: string[]): Obj;
/** Return a copy of the object omitting the blacklisted properties. */
export function omit(obj: Obj) {
  let notInArray = (array, item) => !inArray(array, item);
  return pickOmitImpl.apply(null, [notInArray].concat(restArgs(arguments)));
}


/** Given an array of objects, maps each element to a named property of the element. */
export function pluck(collection: Obj[], propName: string): Obj[];
/** Given an object, maps each property of the object to a named property of the property. */
export function pluck(collection: { [key: string]: any }, propName: string): { [key: string]: any };
/**
 * Maps an array, or object to a property (by name)
 */
export function pluck(collection: any, propName: string): any {
  return map(collection, <Mapper<any, string>> prop(propName));
}


/** Given an array of objects, returns a new array containing only the elements which passed the callback predicate */
export function filter<T>(collection: T[], callback: (t: T, key?: number) => boolean): T[];
/** Given an object, returns a new object with only those properties that passed the callback predicate */
export function filter<T>(collection: TypedMap<T>, callback: (t: T, key?: string) => boolean): TypedMap<T>;
/** Filters an Array or an Object's properties based on a predicate */
export function filter<T>(collection: any, callback: Function): T {
  let arr = isArray(collection), result: any = arr ? [] : {};
  let accept = arr ? x => result.push(x) : (x, key) => result[key] = x;
  forEach(collection, function(item, i) {
    if (callback(item, i)) accept(item, i);
  });
  return <T>result;
}


/** Given an object, return the first property of that object which passed the callback predicate */
export function find<T>(collection: TypedMap<T>, callback: Predicate<T>): T;
/** Given an array of objects, returns the first object which passed the callback predicate */
export function find<T>(collection: T[], callback: Predicate<T>): T;
/** Finds an object from an array, or a property of an object, that matches a predicate */
export function find(collection: any, callback: any) {
  let result;

  forEach(collection, function(item, i) {
    if (result) return;
    if (callback(item, i)) result = item;
  });

  return result;
}

/** Given an object, returns a new object, where each property is transformed by the callback function */
export let mapObj: <T,U>(collection: { [key: string]: T }, callback: Mapper<T,U>) => { [key: string]: U } = map;
/** Given an array, returns a new array, where each element is transformed by the callback function */
export function map<T, U>(collection: T[], callback: Mapper<T, U>): U[];
export function map<T, U>(collection: { [key: string]: T }, callback: Mapper<T, U>): { [key: string]: U }
/** Maps an array or object properties using a callback function */
export function map(collection: any, callback: any): any {
  let result = isArray(collection) ? [] : {};
  forEach(collection, (item, i) => result[i] = callback(item, i));
  return result;
}

/**
 * Given an object, return its enumerable property values
 *
 * @example
 * ```
 *
 * let foo = { a: 1, b: 2, c: 3 }
 * let vals = values(foo); // [ 1, 2, 3 ]
 * ```
 */
export const values: (<T> (obj: TypedMap<T>) => T[]) = (obj: Obj) =>
    Object.keys(obj).map(key => obj[key]);

/**
 * Reduce function that returns true if all of the values are truthy.
 *
 * @example
 * ```
 *
 * let vals = [ 1, true, {}, "hello world"];
 * vals.reduce(allTrueR, true); // true
 *
 * vals.push(0);
 * vals.reduce(allTrueR, true); // false
 * ```
 */
export const allTrueR  = (memo: boolean, elem: any) => memo && elem;

/**
 * Reduce function that returns true if any of the values are truthy.
 *
 *  * @example
 * ```
 *
 * let vals = [ 0, null, undefined ];
 * vals.reduce(anyTrueR, true); // false
 *
 * vals.push("hello world");
 * vals.reduce(anyTrueR, true); // true
 * ```
 */
export const anyTrueR  = (memo: boolean, elem: any) => memo || elem;

/**
 * Reduce function which un-nests a single level of arrays
 * @example
 * ```
 *
 * let input = [ [ "a", "b" ], [ "c", "d" ], [ [ "double", "nested" ] ] ];
 * input.reduce(unnestR, []) // [ "a", "b", "c", "d", [ "double, "nested" ] ]
 * ```
 */
export const unnestR   = (memo: any[], elem: any[]) => memo.concat(elem);

/**
 * Reduce function which recursively un-nests all arrays
 *
 * @example
 * ```
 *
 * let input = [ [ "a", "b" ], [ "c", "d" ], [ [ "double", "nested" ] ] ];
 * input.reduce(unnestR, []) // [ "a", "b", "c", "d", "double, "nested" ]
 * ```
 */
export const flattenR  = (memo: any[], elem: any) =>
    isArray(elem) ? memo.concat(elem.reduce(flattenR, [])) : pushR(memo, elem);

/**
 * Reduce function that pushes an object to an array, then returns the array.
 * Mostly just for [[flattenR]] and [[uniqR]]
 */
export function pushR(arr: any[], obj: any) {
  arr.push(obj);
  return arr;
}

/** Reduce function that filters out duplicates */
export const uniqR = <T> (acc: T[], token: T): T[] =>
    inArray(acc, token) ? acc : pushR(acc, token);

/**
 * Return a new array with a single level of arrays unnested.
 *
 * @example
 * ```
 *
 * let input = [ [ "a", "b" ], [ "c", "d" ], [ [ "double", "nested" ] ] ];
 * unnest(input) // [ "a", "b", "c", "d", [ "double, "nested" ] ]
 * ```
 */
export const unnest    = (arr: any[]) => arr.reduce(unnestR, []);
/**
 * Return a completely flattened version of an array.
 *
 * @example
 * ```
 *
 * let input = [ [ "a", "b" ], [ "c", "d" ], [ [ "double", "nested" ] ] ];
 * flatten(input) // [ "a", "b", "c", "d", "double, "nested" ]
 * ```
 */
export const flatten   = (arr: any[]) => arr.reduce(flattenR, []);

/**
 * Given a .filter Predicate, builds a .filter Predicate which throws an error if any elements do not pass.
 * @example
 * ```
 *
 * let isNumber = (obj) => typeof(obj) === 'number';
 * let allNumbers = [ 1, 2, 3, 4, 5 ];
 * allNumbers.filter(assertPredicate(isNumber)); //OK
 *
 * let oneString = [ 1, 2, 3, 4, "5" ];
 * oneString.filter(assertPredicate(isNumber, "Not all numbers")); // throws Error(""Not all numbers"");
 * ```
 */
export function assertPredicate<T>(predicate: Predicate<T>, errMsg: (string|Function) = "assert failure"): Predicate<T> {
  return (obj: T) => {
    if (!predicate(obj)) {
      throw new Error(isFunction(errMsg) ? (<Function> errMsg)(obj) : errMsg);
    }
    return true;
  };
}

/**
 * Like _.pairs: Given an object, returns an array of key/value pairs
 *
 * @example
 * ```
 *
 * pairs({ foo: "FOO", bar: "BAR }) // [ [ "foo", "FOO" ], [ "bar": "BAR" ] ]
 * ```
 */
export const pairs = (obj: Obj) =>
    Object.keys(obj).map(key => [ key, obj[key]] );

/**
 * Given two or more parallel arrays, returns an array of tuples where
 * each tuple is composed of [ a[i], b[i], ... z[i] ]
 *
 * @example
 * ```
 *
 * let foo = [ 0, 2, 4, 6 ];
 * let bar = [ 1, 3, 5, 7 ];
 * let baz = [ 10, 30, 50, 70 ];
 * arrayTuples(foo, bar);       // [ [0, 1], [2, 3], [4, 5], [6, 7] ]
 * arrayTuples(foo, bar, baz);  // [ [0, 1, 10], [2, 3, 30], [4, 5, 50], [6, 7, 70] ]
 * ```
 */
export function arrayTuples(...arrayArgs: any[]): any[] {
  if (arrayArgs.length === 0) return [];
  let length = arrayArgs.reduce((min, arr) => Math.min(arr.length, min), 9007199254740991); // aka 2^53 − 1 aka Number.MAX_SAFE_INTEGER
  return Array.apply(null, Array(length)).map((ignored, idx) => arrayArgs.map(arr => arr[idx]));
}

/**
 * Reduce function which builds an object from an array of [key, value] pairs.
 *
 * Each iteration sets the key/val pair on the memo object, then returns the memo for the next iteration.
 *
 * Each keyValueTuple should be an array with values [ key: string, value: any ]
 *
 * @example
 * ```
 *
 * var pairs = [ ["fookey", "fooval"], ["barkey", "barval"] ]
 *
 * var pairsToObj = pairs.reduce((memo, pair) => applyPairs(memo, pair), {})
 * // pairsToObj == { fookey: "fooval", barkey: "barval" }
 *
 * // Or, more simply:
 * var pairsToObj = pairs.reduce(applyPairs, {})
 * // pairsToObj == { fookey: "fooval", barkey: "barval" }
 * ```
 */
export function applyPairs(memo: TypedMap<any>, keyValTuple: any[]) {
  let key: string, value: any;
  if (isArray(keyValTuple)) [key, value] = keyValTuple;
  if (!isString(key)) throw new Error("invalid parameters to applyPairs");
  memo[key] = value;
  return memo;
}

/** Get the last element of an array */
export function tail<T>(arr: T[]): T {
  return arr.length && arr[arr.length - 1] || undefined;
}

/**
 * shallow copy from src to dest
 *
 * note: This is a shallow copy, while angular.copy is a deep copy.
 * ui-router uses `copy` only to make copies of state parameters.
 */
function _copy(src: Obj, dest: Obj) {
  if (dest) Object.keys(dest).forEach(key => delete dest[key]);
  if (!dest) dest = {};
  return extend(dest, src);
}

/** Naive forEach implementation works with Objects or Arrays */
function _forEach(obj: (any[]|any), cb: (el, idx?) => void, _this: Obj) {
  if (isArray(obj)) return obj.forEach(cb, _this);
  Object.keys(obj).forEach(key => cb(obj[key], key));
}

function _copyProps(to: Obj, from: Obj) {
  Object.keys(from).forEach(key => to[key] = from[key]);
  return to;
}
function _extend(toObj: Obj, fromObj: Obj): Obj;
function _extend(toObj: Obj, ...fromObj: Obj[]): Obj;
function _extend(toObj: Obj) {
  return restArgs(arguments, 1).filter(identity).reduce(_copyProps, toObj);
}

function _equals(o1: any, o2: any): boolean {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  let t1 = typeof o1, t2 = typeof o2;
  if (t1 !== t2 || t1 !== 'object') return false;

  const tup = [o1, o2];
  if (all(isArray)(tup)) return _arraysEq(o1, o2);
  if (all(isDate)(tup)) return o1.getTime() === o2.getTime();
  if (all(isRegExp)(tup)) return o1.toString() === o2.toString();
  if (all(isFunction)(tup)) return true; // meh

  let predicates = [isFunction, isArray, isDate, isRegExp];
  if (predicates.map(any).reduce((b, fn) => b || !!fn(tup), false)) return false;

  let key: string, keys: { [i: string]: boolean } = {};
  for (key in o1) {
    if (!_equals(o1[key], o2[key])) return false;
    keys[key] = true;
  }
  for (key in o2) {
    if (!keys[key]) return false;
  }

  return true;
}

function _arraysEq(a1: any[], a2: any[]) {
  if (a1.length !== a2.length) return false;
  return arrayTuples(a1, a2).reduce((b, t) => b && _equals(t[0], t[1]), true);
}

// issue #2676
export const silenceUncaughtInPromise = (promise: Promise<any>) =>
    promise.catch(e => 0) && promise;
export const silentRejection = (error: any) =>
    silenceUncaughtInPromise(services.$q.reject(error));
