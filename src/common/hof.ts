/**
 * Higher order functions
 *
 * @module common_hof
 */ /** */

import {Predicate} from "./common";
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

  function curried(args: any[]) {
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
export const prop = (name: string) =>
    (obj: any) => obj && obj[name];

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
export const parse = (name: string) =>
    pipe.apply(null, name.split(".").map(prop));

/**
 * Given a function that returns a truthy or falsey value, returns a
 * function that returns the opposite (falsey or truthy) value given the same inputs
 */
export const not: (fn: Predicate<any>) => Predicate<any> = (fn: Predicate<any>) =>
    (...args: any[]) => !fn.apply(null, args);

/**
 * Given two functions that return truthy or falsey values, returns a function that returns truthy
 * if both functions return truthy for the given arguments
 */
export function and(fn1: Predicate<any>, fn2: Predicate<any>): Predicate<any> {
  return (...args: any[]) => fn1.apply(null, args) && fn2.apply(null, args);
}

/**
 * Given two functions that return truthy or falsey values, returns a function that returns truthy
 * if at least one of the functions returns truthy for the given arguments
 */
export function or(fn1: Predicate<any>, fn2: Predicate<any>): Predicate<any> {
  return (...args: any[]) => fn1.apply(null, args) || fn2.apply(null, args);
}

/**
 * Check if all the elements of an array match a predicate function
 *
 * @param fn1 a predicate function `fn1`
 * @returns a function which takes an array and returns true if `fn1` is true for all elements of the array
 */
export const all = (fn1: Predicate<any>) =>
    (arr: any[]) => arr.reduce((b, x) => b && !!fn1(x), true) as boolean;
export const any = (fn1: Predicate<any>) =>
    (arr: any[]) => arr.reduce((b, x) => b || !!fn1(x), false) as boolean;

/** Given a class, returns a Predicate function that returns true if the object is of that class */
export const is = (ctor: Function): Predicate<any> => obj => 
    (obj != null && obj.constructor === ctor || obj instanceof ctor);

/** Given a value, returns a Predicate function that returns true if another value is === equal to the original value */
export const eq: (comp: any) => Predicate<any> = (val: any) => (other: any) =>
    val === other;

/** Given a value, returns a function which returns the value */
export const val = <T> (v: T) => () => v;



export function invoke(fnName: string): Function;
export function invoke(fnName: string, args: any[]): Function;
export function invoke(fnName: string, args?: any[]): Function {
  return (obj: any) =>
      obj[fnName].apply(obj, args);
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
  return function(x: any) {
    for (var i = 0; i < struct.length; i++) {
      if (struct[i][0](x)) return struct[i][1](x);
    }
  };
}

