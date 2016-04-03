/** @module common_strings */ /** */

import {isString, isArray, isDefined, isNull, isPromise, isInjectable, isObject} from "./predicates";
import {TransitionRejection} from "../transition/rejectFactory";
import {IInjectable, identity} from "./common";
import {pattern, is, not, val, invoke} from "./hof";
import {Transition} from "../transition/transition";
import {Resolvable} from "../resolve/resolvable";

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

export const kebobString = (camelCase: string) => camelCase.replace(/([A-Z])/g, $1 => "-"+$1.toLowerCase());

function _toJson(obj) {
  return JSON.stringify(obj);
}

function _fromJson(json) {
  return isString(json) ? JSON.parse(json) : json;
}


function promiseToString(p) {
  if (is(TransitionRejection)(p.reason)) return p.reason.toString();
  return `Promise(${JSON.stringify(p)})`;
}

export function functionToString(fn) {
  let fnStr = fnToString(fn);
  let namedFunctionMatch = fnStr.match(/^(function [^ ]+\([^)]*\))/);
  return namedFunctionMatch ? namedFunctionMatch[1] : fnStr;
}

export function fnToString(fn: IInjectable) {
  let _fn = isArray(fn) ? fn.slice(-1)[0] : fn;
  return _fn && _fn.toString() || "undefined";
}


let stringifyPattern = pattern([
  [not(isDefined),            val("undefined")],
  [isNull,                    val("null")],
  [isPromise,                 promiseToString],
  [is(Transition),            invoke("toString")],
  [is(Resolvable),            invoke("toString")],
  [isInjectable,              functionToString],
  [val(true),                 identity]
]);

export function stringify(o) {
  var seen = [];

  function format(val) {
    if (isObject(val)) {
      if (seen.indexOf(val) !== -1) return '[circular ref]';
      seen.push(val);
    }
    return stringifyPattern(val);
  }

  return JSON.stringify(o, (key, val) => format(val)).replace(/\\"/g, '"');
}

