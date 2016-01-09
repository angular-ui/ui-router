/** Predicates @module common */

/** reimplementation of common.not */
const not = (fn) => (x) => !fn(x);
const tis = (t) => (x) => typeof(x) === t;
export const isDefined = not(tis('undefined'));
export const isFunction = tis('function');
export const isNumber = tis('number');
export const isString = tis('string');
export const isObject = (x) => x !== null && typeof x === 'object';
export const isArray = Array.isArray;

let toStr = Object.prototype.toString;
export const isDate = (x) => toStr.call(x) === '[object Date]';
export const isRegExp = (x) => toStr.call(x) === '[object RegExp]';
