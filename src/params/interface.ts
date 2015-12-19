/** @module params */ /** for typedoc */
import {Type} from "./type";

export interface RawParams {
  [key: string]: any
}

export type ParamsOrArray = (RawParams|RawParams[]);

/**
 * Inside the [[StateDeclaration.params]] object of a [[StateDeclaration]]:
 * A ParamDeclaration object defines how a single State Parameter should work.
 *
 * @example ---
 *
 * ```
 * var mystate = {
 *   template: '<div ui-view/>',
 *   controller: function() {}
 *   url: '/mystate/:param1',
 *   params: {
 *     param1: "index",         // Default value for 'param1'
 *
 *     nonUrlParam: {           // ParamDeclaration for 'nonUrlParam' starts
 *      type: "int",            // non
 *      array: true,
 *      value: []
 *     }
 *   }
 * }
 * ```
 */
export interface ParamDeclaration {
  /**
   * Specifies the default value for this parameter. This implicitly sets this parameter as optional.
   *
   * When UI-Router routes to a state and no value is specified for this parameter in the URL or transition,
   * the default value will be used instead. If value is a function, it will be injected and invoked, and the
   * return value used.
   *
   * Note:  `value: undefined` is treated as though no default value was specified, while `value: null` is treated
   * as "the default value is null".
   *
   * ```
   * // define default values for param1 and param2
   * params: {
   *   param1: {
   *     value: "defaultValue"
   *   },
   *   param2: {
   *     value: "param2Default;
   *   }
   * }
   *```
   *
   * Shorthand: If you only need to configure the default value of the parameter, you may use a shorthand syntax.
   * In the params map, instead mapping the param name to a full parameter configuration object, simply set map it
   * to the default parameter value, e.g.:
   * ```
   * // define a parameter's default value
   * params: {
   *   param1: {
   *     value: "defaultValue"
   *   },
   *   param2: {
   *     value: "param2Default;
   *   }
   * }
   *
   * // shorthand default values
   * params: {
   *   param1: "defaultValue",
   *   param2: "param2Default"
   * }
   ```
   *
   * This defines a default value for the parameter.  If the parameter value is `undefined`, this value will be used instead
   */
  value?: any;

  /**
   * Specifies the parameter type.
   *
   * Supplying a parameter type
   */
  type: (string|Type);
  array: boolean;
  squash: (boolean|string);
  replace: any;
  /** @internal */
  isOptional: boolean;
  dynamic: boolean;
}

/**
 * Inside a state definition:
 * A nested object named `params` which defines state parameter customizations.
 *
 * The ParamDeclaration contains configuration for state parameter declarations.
 * Keys should be the name of the parameter and values are treated as [[ParamDeclaration]] objects.
 *
 * #### example:
 * ```
 * params: {
 *   folder: {
 *     value: "index",
 *     squash: true
 *   }
 * }```
 */
export interface ParamsConfig { [key: string]: ParamDeclaration }
