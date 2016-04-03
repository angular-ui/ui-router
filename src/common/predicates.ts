/** Predicates @module common_predicates */ /** */
import {and, not, pipe, prop} from "./hof";

const toStr = Object.prototype.toString;
const tis = (t) => (x) => typeof(x) === t;
export const isUndefined = tis('undefined');
export const isDefined = not(isUndefined);
export const isNull = o => o === null;
export const isFunction = tis('function');
export const isNumber = tis('number');
export const isString = tis('string');
export const isObject = (x) => x !== null && typeof x === 'object';
export const isArray = Array.isArray;
export const isDate = (x) => toStr.call(x) === '[object Date]';
export const isRegExp = (x) => toStr.call(x) === '[object RegExp]';

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

/**
 * Predicate which checks if a value looks like a Promise
 *
 * It is probably a Promise if it's an object, and it has a `then` property which is a Function
 */
export const isPromise = and(isObject, pipe(prop('then'), isFunction));

