/** @module common */ /** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />
let { isDefined, isFunction, isNumber, isString, isObject, isArray, forEach, extend, copy, noop, toJson, fromJson, equals, identity } = angular;
export { isDefined, isFunction, isNumber, isString, isObject, isArray, forEach, extend, copy, noop, toJson, fromJson, equals, identity };

type Mapper<X, T> = (x: X, key?: (string|number)) => T;
export interface TypedMap<T> { [key: string]: T; }
export type Predicate<X> = (X) => boolean;
export type IInjectable = (Function|any[]);

export var abstractKey = 'abstract';

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
export function bindFunctions(from, to, bindTo, fnNames: string[] = Object.keys(from)) {
  return fnNames.filter(name => typeof from[name] === 'function')
      .forEach(name => to[name] = from[name].bind(bindTo));
}

/**
 * Returns a new function for [Partial Application](https://en.wikipedia.org/wiki/Partial_application) of the original function.
 *
 * Given a function with N parameters, returns a new function that supports partial application.
 * The new function accepts anywhere from 1 to N parameters.  When that function is called with M parameters,
 * where M is less than N, it returns a new function that accepts the remaining parameters.  It continues to
 * accept more parameters until all N parameters have been supplied.
 *
 *
 * This contrived example uses a partially applied function as an predicate, which returns true
 * if an object is found in both arrays.
 * @example
 * ```
 * // returns true if an object is in both of the two arrays
 * function inBoth(array1, array2, object) {
 *   return array1.indexOf(object) !== -1 &&
 *          array2.indexOf(object) !== 1;
 * }
 * let obj1, obj2, obj3, obj4, obj5, obj6, obj7
 * let foos = [obj1, obj3]
 * let bars = [obj3, obj4, obj5]
 *
 * // A curried "copy" of inBoth
 * let curriedInBoth = curry(inBoth);
 * // Partially apply both the array1 and array2
 * let inFoosAndBars = curriedInBoth(foos, bars);
 *
 * // Supply the final argument; since all arguments are
 * // supplied, the original inBoth function is then called.
 * let obj1InBoth = inFoosAndBars(obj1); // false
 *
 * // Use the inFoosAndBars as a predicate.
 * // Filter, on each iteration, supplies the final argument
 * let allObjs = [ obj1, obj2, obj3, obj4, obj5, obj6, obj7 ];
 * let foundInBoth = allObjs.filter(inFoosAndBars); // [ obj3 ]
 *
 * ```
 *
 * Stolen from: http://stackoverflow.com/questions/4394747/javascript-curry-function
 *
 * @param fn
 * @returns {*|function(): (*|any)}
 */
export function curry(fn: Function): Function {
  let initial_args = [].slice.apply(arguments, [1]);
  let func_args_length = fn.length;

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
 * Given a varargs list of functions, returns a function that composes the argument functions, right-to-left
 * given: f(x), g(x), h(x)
 * let composed = compose(f,g,h)
 * then, composed is: f(g(h(x)))
 */
export function compose() {
  let args = arguments;
  let start = args.length - 1;
  return function() {
    let i = start, result = args[start].apply(this, arguments);
    while (i--) result = args[i].call(this, result);
    return result;
  };
}

/**
 * Given a varargs list of functions, returns a function that is composes the argument functions, left-to-right
 * given: f(x), g(x), h(x)
 * let piped = pipe(f,g,h);
 * then, piped is: h(g(f(x)))
 */
export function pipe(...funcs: Function[]): (obj: any) => any {
  return compose.apply(null, [].slice.call(arguments).reverse());
}

/**
 * Given a property name, returns a function that returns that property from an object
 * let obj = { foo: 1, name: "blarg" };
 * let getName = prop("name");
 * getName(obj) === "blarg"
 */
export const prop = (name: string) => (obj: any) => obj && obj[name];

/**
 * Given a property name and a value, returns a function that returns a boolean based on whether
 * the passed object has a property that matches the value
 * let obj = { foo: 1, name: "blarg" };
 * let getName = propEq("name", "blarg");
 * getName(obj) === true
 */
export const propEq = curry((name: string, val: any, obj: any) => obj && obj[name] === val);

/**
 * Given a dotted property name, returns a function that returns a nested property from an object, or undefined
 * let obj = { id: 1, nestedObj: { foo: 1, name: "blarg" }, };
 * let getName = prop("nestedObj.name");
 * getName(obj) === "blarg"
 * let propNotFound = prop("this.property.doesnt.exist");
 * propNotFound(obj) === undefined
 */
export const parse = (name: string) => pipe.apply(null, name.split(".").map(prop));

/**
 * Given a function that returns a truthy or falsey value, returns a
 * function that returns the opposite (falsey or truthy) value given the same inputs
 */
export const not = (fn) => (...args) => !fn.apply(null, args);

/**
 * Given two functions that return truthy or falsey values, returns a function that returns truthy
 * if both functions return truthy for the given arguments
 */
export function and(fn1, fn2): Function {
  return (...args) => fn1.apply(null, args) && fn2.apply(null, args);
}

/**
 * Given two functions that return truthy or falsey values, returns a function that returns truthy
 * if at least one of the functions returns truthy for the given arguments
 */
export function or(fn1, fn2): Function {
  return (...args) => fn1.apply(null, args) || fn2.apply(null, args);
}

/** Given a class, returns a Predicate function that returns true if the object is of that class */
export const is: (ctor) => Predicate<any> = ctor => obj => (obj != null && obj.constructor === ctor || obj instanceof ctor);

/** Given a value, returns a Predicate function that returns true if another value is === equal to the original value */
export const eq: (comp) => Predicate<any> = (val) => (other) => val === other;

/** Given a value, returns a function which returns the value */
export const val = <T> (v: T) => () => v;

export function invoke(fnName: string): Function;
export function invoke(fnName: string, args: any[]): Function;
export function invoke(fnName: string, args?): Function {
  return (obj: any) => obj[fnName].apply(obj, args);
}

/**
 * Sorta like Pattern Matching (a functional programming conditional construct)
 *
 * See http://c2.com/cgi/wiki?PatternMatching
 *
 * This is a conditional construct which allows a series of predicates and output functions
 * to be checked and then applied.  Each predicate receives the input.  If the predicate
 * returns truthy, then its matching output function (mapping function) is provided with
 * the input and, then the result is returned.
 *
 * Each combination (2-tuple) of predicate + output function should be placed in an array
 * of size 2: [ predicate, mapFn ]
 *
 * These 2-tuples should be put in an outer array.
 *
 * @example
 * ```
 *
 * // Here's a 2-tuple where the first element is the isString predicate
 * // and the second element is a function that returns a description of the input
 * let firstTuple = [ angular.isString, (input) => `Heres your string ${input}` ];
 *
 * // Second tuple: predicate "isNumber", mapfn returns a description
 * let secondTuple = [ angular.isNumber, (input) => `(${input}) That's a number!` ];
 *
 * let third = [ (input) => input === null,  (input) => `Oh, null...` ];
 *
 * let fourth = [ (input) => input === undefined,  (input) => `notdefined` ];
 *
 * let descriptionOf = pattern([ firstTuple, secondTuple, third, fourth ]);
 *
 * console.log(descriptionOf(undefined)); // 'notdefined'
 * console.log(descriptionOf(55)); // '(55) That's a number!'
 * console.log(descriptionOf("foo")); // 'Here's your string foo'
 * ```
 *
 * @param struct A 2D array.  Each element of the array should be an array, a 2-tuple,
 * with a Predicate and a mapping/output function
 * @returns {function(any): *}
 */
export function pattern(struct: Function[][]): Function {
  return function(x) {
    for (var i = 0; i < struct.length; i++) {
      if (struct[i][0](x)) return struct[i][1](x);
    }
  };
}


/**
 * prototypal inheritance helper.
 * Creates a new object which has `parent` object as its prototype, and then copies the properties from `extra` onto it
 */
export const inherit = (parent, extra) => extend(new (extend(function() {}, { prototype: parent }))(), extra);

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
const restArgs = (args, idx = 0) => Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(args, idx));

/** Given an array, returns true if the object is found in the array, (using indexOf) */
const inArray = (array: any[], obj: any) => array.indexOf(obj) !== -1;

/** Given an array, and an item, if the item is found in the array, it removes it (in-place).  The same array is returned */
export const removeFrom = curry((array: any[], obj) => {
  let idx = array.indexOf(obj);
  if (idx >= 0) array.splice(idx, 1);
  return array;
});

/**
 * Applies a set of defaults to an options object.  The options object is filtered
 * to only those properties of the objects in the defaultsList.
 * Earlier objects in the defaultsList take precedence when applying defaults.
 */
export function defaults(opts = {}, ...defaultsList) {
  let defaults = merge.apply(null, [{}].concat(defaultsList));
  return extend({}, defaults, pick(opts || {}, Object.keys(defaults)));
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

/** Reduce function that merges each element of the list into a single object, using angular.extend */
export const mergeR = (memo, item) => extend(memo, item);

/**
 * Finds the common ancestor path between two states.
 *
 * @param {Object} first The first state.
 * @param {Object} second The second state.
 * @return {Array} Returns an array of state names in descending order, not including the root.
 */
export function ancestors(first, second) {
  let path = [];

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
export function equalForKeys(a, b, keys: string[] = Object.keys(a)) {
  for (var i = 0; i < keys.length; i++) {
    let k = keys[i];
    if (a[k] != b[k]) return false; // Not '===', values aren't necessarily normalized
  }
  return true;
}

type PickOmitPredicate = (keys: string[], key) => boolean;
function pickOmitImpl(predicate: PickOmitPredicate, obj) {
  let objCopy = {}, keys = restArgs(arguments, 2);
  for (var key in obj) {
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
export function pick(obj, propNames: string[]): Object;
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
export function pick(obj, ...propNames: string[]): Object;
/** Return a copy of the object only containing the whitelisted properties. */
export function pick(obj) { return pickOmitImpl.apply(null, [inArray].concat(restArgs(arguments))); }

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
export function omit(obj, propNames: string[]): Object;
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
export function omit(obj, ...propNames: string[]): Object;
/** Return a copy of the object omitting the blacklisted properties. */
export function omit(obj) { return pickOmitImpl.apply(null, [not(inArray)].concat(restArgs(arguments))); }


/** Given an array of objects, maps each element to a named property of the element. */
export function pluck(collection: any[], propName: string): any[];
/** Given an object, maps each property of the object to a named property of the property. */
export function pluck(collection: { [key: string]: any }, propName: string): { [key: string]: any };
/**
 * Maps an array, or object to a property (by name)
 */
export function pluck(collection, propName): any {
  return map(collection, <Mapper<any, string>> prop(propName));
}


/** Given an array of objects, returns a new array containing only the elements which passed the callback predicate */
export function filter<T>(collection: T[], callback: (T, key?) => boolean): T[];
/** Given an object, returns a new object with only those properties that passed the callback predicate */
export function filter<T>(collection: TypedMap<T>, callback: (T, key?) => boolean): TypedMap<T>;
/** Filters an Array or an Object's properties based on a predicate */
export function filter<T>(collection: T, callback: Function): T {
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
export function find(collection, callback) {
  let result;

  forEach(collection, function(item, i) {
    if (result) return;
    if (callback(item, i)) result = item;
  });

  return result;
}

/** Given an array, returns a new array, where each element is transformed by the callback function */
export function map<T, U>(collection: T[], callback: Mapper<T, U>): U[];
/** Given an object, returns a new object, where each property is transformed by the callback function */
export function map<T, U>(collection: TypedMap<T>, callback: Mapper<T, U>): TypedMap<U>;
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
export const values: (<T> (obj: TypedMap<T>) => T[]) = (obj) => Object.keys(obj).map(key => obj[key]);

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
export const allTrueR  = (memo: boolean, elem) => memo && elem;
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
export const anyTrueR  = (memo: boolean, elem) => memo || elem;

/** Reduce function that pushes an object to an array, then returns the array.  Mostly just for [[flattenR]] */
export const pushR     = (arr: any[], obj) => { arr.push(obj); return arr; };
/**
 * Reduce function which un-nests a single level of arrays
 * @example
 * ```
 *
 * let input = [ [ "a", "b" ], [ "c", "d" ], [ [ "double", "nested" ] ] ];
 * input.reduce(unnestR, []) // [ "a", "b", "c", "d", [ "double, "nested" ] ]
 * ```
 */
export const unnestR   = (memo: any[], elem) => memo.concat(elem);
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
export const flattenR  = (memo: any[], elem) => isArray(elem) ? memo.concat(elem.reduce(flattenR, [])) : pushR(memo, elem);
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
export function assertPredicate<T>(fn: Predicate<T>, errMsg: string = "assert failure"): Predicate<T> {
  return (obj: T) => {
    if (!fn(obj)) throw new Error(errMsg);
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
export const pairs = (object) => Object.keys(object).map(key => [ key, object[key]] );

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
  let key, value;
  if (isArray(keyValTuple)) [key, value] = keyValTuple;
  if (!isString(key)) throw new Error("invalid parameters to applyPairs");
  memo[key] = value;
  return memo;
}

/**
 * Predicate which checks if a value is injectable
 *
 * A value is "injectable" if it is a function, or if it is an ng1 array-notation-style array
 * where all the elements in the array are Strings, except the last one, which is a Function
 */
export function isInjectable(val) {
  if (isArray(val) && val.length) {
    let head = val.slice(0, -1), tail = val.slice(-1);
    return !(head.filter(not(isString)).length || tail.filter(not(isFunction)).length);
  }
  return isFunction(val);
}
/** Predicate which checks if a value is `=== null` */
export const isNull = o => o === null;

/**
 * Predicate which checks if a value looks like a Promise
 *
 * It is probably a Promise if it's an object, and it has a `then` property which is a Function
 */
export const isPromise = and(isObject, pipe(prop('then'), isFunction));

export function fnToString(fn: IInjectable) {
  let _fn = pattern([
    [isArray, arr => arr.slice(-1)[0]],
    [val(true), identity]
  ])(fn);

  return _fn && _fn.toString() || "undefined";
}

/**
 * Returns a string shortened to a maximum length
 *
 * If the string is already less than the `max` length, return the string.
 * Else return the string, shortened to `max - 3` and append three dots ("...").
 *
 * @param max the maximum length of the string to return
 * @param str the input string
 */
export function maxLength(max: number, str: string) {
  if (str.length <= max) return str;
  return str.substr(0, max - 3) + "...";
}

/**
 * Returns a string, with spaces added to the end, up to a desired str length
 *
 * If the string is already longer than the desired length, return the string.
 * Else returns the string, with extra spaces on the end, such that it reaches `length` characters.
 *
 * @param length the desired length of the string to return
 * @param str the input string
 */
export function padString(length: number, str: string) {
  while (str.length < length) str += " ";
  return str;
}

export function tail<T>(collection: T[]): T;
/** Get the last element of an array */
export function tail(arr: any[]): any {
  return arr.length && arr[arr.length - 1] || undefined;
}


