/** @module url */ /** for typedoc */
/// <reference path='../../typings/angularjs/angular.d.ts' />
import {IServiceProviderFactory} from "angular";
import {forEach, extend, inherit, map, filter, isObject, isDefined, isArray, isString,
    isInjectable, isFunction, toJson, fromJson, identity, equals} from "../common/common";

import {UrlMatcher, matcherConfig} from "./module";
import {Param, paramTypes, Type} from "../params/module";

function getDefaultConfig() {
  return {
    strict: matcherConfig.strictMode(),
    caseInsensitive: matcherConfig.caseInsensitive()
  };
}

/**
 * Factory for [[UrlMatcher]] instances. The factory is available to ng1 services as
 * `$urlMatcherFactor` or ng1 providers as `$urlMatcherFactoryProvider`.
 */
export class UrlMatcherFactory {
  constructor() {
    extend(this, { UrlMatcher, Param });
  }

  /**
   * Defines whether URL matching should be case sensitive (the default behavior), or not.
   *
   * @param value `false` to match URL in a case sensitive manner; otherwise `true`;
   * @returns the current value of caseInsensitive
   */
  caseInsensitive(value: boolean) {
    return matcherConfig.caseInsensitive(value);
  }

  /**
   * Defines whether URLs should match trailing slashes, or not (the default behavior).
   *
   * @param value `false` to match trailing slashes in URLs, otherwise `true`.
   * @returns the current value of strictMode
   */
  strictMode(value: boolean) {
    return matcherConfig.strictMode(value);
  }

  /**
   * Sets the default behavior when generating or matching URLs with default parameter values.
   *
   * @param value A string that defines the default parameter URL squashing behavior.
   *    - `nosquash`: When generating an href with a default parameter value, do not squash the parameter value from the URL
   *    - `slash`: When generating an href with a default parameter value, squash (remove) the parameter value, and, if the
   *             parameter is surrounded by slashes, squash (remove) one slash from the URL
   *    - any other string, e.g. "~": When generating an href with a default parameter value, squash (remove)
   *             the parameter value from the URL and replace it with this string.
   * @returns the current value of defaultSquashPolicy
   */
  defaultSquashPolicy(value: string) {
    return matcherConfig.defaultSquashPolicy(value);
  }

  /**
   * Creates a [[UrlMatcher]] for the specified pattern.
   *
   * @param pattern  The URL pattern.
   * @param config  The config object hash.
   * @returns The UrlMatcher.
   */
  compile(pattern: string, config?: { [key: string]: any }) {
    return new UrlMatcher(pattern, extend(getDefaultConfig(), config));
  }

  /**
   * Returns true if the specified object is a [[UrlMatcher]], or false otherwise.
   *
   * @param object  The object to perform the type check against.
   * @returns `true` if the object matches the `UrlMatcher` interface, by
   *          implementing all the same methods.
   */
  isMatcher(object: any) {
    // TODO: typeof?
    if (!isObject(object)) return false;
    var result = true;

    forEach(UrlMatcher.prototype, (val, name) => {
      if (isFunction(val)) result = result && (isDefined(object[name]) && isFunction(object[name]));
    });
    return result;
  };

  /**
   * Registers a custom [[Type]] object that can be used to generate URLs with typed parameters.
   *
   * @param name  The type name.
   * @param definition The type definition. See [[Type]] for information on the values accepted.
   * @param definitionFn A function that is injected before the app
   *        runtime starts.  The result of this function is merged into the existing `definition`.
   *        See [[Type]] for information on the values accepted.
   *
   * @returns - if a type was registered: the [[UrlMatcherFactory]]
   *   - if only the `name` parameter was specified: the currently registered [[Type]] object, or undefined
   *
   * ---
   *
   * This is a simple example of a custom type that encodes and decodes items from an
   * array, using the array index as the URL-encoded value:
   *
   * @example
   * ```
   *
   * var list = ['John', 'Paul', 'George', 'Ringo'];
   *
   * $urlMatcherFactoryProvider.type('listItem', {
   *   encode: function(item) {
   *     // Represent the list item in the URL using its corresponding index
   *     return list.indexOf(item);
   *   },
   *   decode: function(item) {
   *     // Look up the list item by index
   *     return list[parseInt(item, 10)];
   *   },
   *   is: function(item) {
   *     // Ensure the item is valid by checking to see that it appears
   *     // in the list
   *     return list.indexOf(item) > -1;
   *   }
   * });
   *
   * $stateProvider.state('list', {
   *   url: "/list/{item:listItem}",
   *   controller: function($scope, $stateParams) {
   *     console.log($stateParams.item);
   *   }
   * });
   *
   * // ...
   *
   * // Changes URL to '/list/3', logs "Ringo" to the console
   * $state.go('list', { item: "Ringo" });
   * ```
   */
  type(name: string, definition?: (Function|Type), definitionFn?: Function) {
    var type = paramTypes.type(name, definition, definitionFn);
    return !isDefined(definition) ? type : this;
  };

  /** @hidden */
  $get() {
    paramTypes.enqueue = false;
    paramTypes._flushTypeQueue();
    return this;
  };
}
