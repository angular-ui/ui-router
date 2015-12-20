/** @module params */ /** for typedoc */
import {Type} from "./type";

export interface RawParams {
  [key: string]: any
}

export type ParamsOrArray = (RawParams|RawParams[]);

/**
 Inside a [[StateDeclaration.params]]:
 *
 * A ParamDeclaration object defines how a single State Parameter should work.
 *
 * @example
 * ```
 *
 * var mystate = {
 *   template: '<div ui-view/>',
 *   controller: function() {}
 *   url: '/mystate/:param1',
 *   params: {
 *     param1: "index", // <-- Default value for 'param1'
 *                      // (shorthand ParamDeclaration)
 *
 *     nonUrlParam: { // <-- ParamDeclaration for 'nonUrlParam'
 *      type: "int",
 *      array: true,
 *      value: []
 *     }
 *   }
 * }
 * ```
 */
export interface ParamDeclaration {
  /**
   * A property of [[ParamDeclaration]]:
   *
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
   * ### Shorthand Declaration
   * If you only want to set the default value of the parameter, you may use a shorthand syntax.
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
   * A property of [[ParamDeclaration]]:
   *
   * Specifies the [[Type]] of the parameter.
   *
   * Set this property to the name of parameter's type.   The type may be either one of the
   * built in types, or a custom type that has been registered with the [[$urlMatcherFactory]]
   */
  type: (string|Type);

  /**
   * A property of [[ParamDeclaration]]:
   *
   * Explicitly specifies the array mode of a URL parameter
   *
   * - If `false`, the parameter value will be treated (encoded/decoded) as a single value
   * - If `true`, the parameter value will be treated (encoded/decoded) as an array of values.
   * - If `auto` (for query parameters only), if multiple values for a single parameter are present
   * in the URL (e.g.: /foo?bar=1&bar=2&bar=3) then the values are mapped to an array (e.g.:
   * `{ foo: [ '1', '2', '3' ] }`). However, if only one value is present (e.g.: /foo?bar=1)
   * then the value is treated as single value (e.g.: { foo: '1' }).
   *

   * If you specified a [[type]] for the parameter, the value will be treated as an array
   * of the specified Type.
   *
   * @example
   * ```
   *
   * {
   *   name: 'foo',
   *   url: '/foo/{arrayParam:int}`,
   *   params: {
   *     arrayParam: { array: true }
   *   }
   * }
   *
   * // After the transition, URL should be '/foo/1-2-3'
   * $state.go("foo", { arrayParam: [ 1, 2, 3 ] });
   * ```
   *
   * @default `false` for path parameters, such as `url: '/foo/:pathParam'`
   * @default `auto` for query parameters, such as `url: '/foo?queryParam'`
   * @default `true` if the parameter name ends in `[]`, such as `url: '/foo/{implicitArrayParam:int[]}'`
   */
  array: boolean;
  /**
   * A property of [[ParamDeclaration]]:
   *
   * Configures how a default parameter value is represented in the URL when the current parameter value
   * is the same as the default value.
   *
   * There are three squash settings:
   *
   * - `false`: The parameter's default value is not squashed. It is encoded and included in the URL
   * - `true`: The parameter's default value is omitted from the URL. If the parameter is preceeded
   *    and followed by slashes in the state's url declaration, then one of those slashes are omitted.
   *    This can allow for cleaner looking URLs.
   * - `"&lt;arbitrary string&gt;"`: The parameter's default value is replaced with an arbitrary
   *    placeholder of your choice.
   *
   * @example
   * ```
   *
   * {
   *   name: 'mystate',
   *   url: '/mystate/:myparam',
   *   params: {
   *     myparam: 'defaultParamValue'
   *     squash: true
   *   }
   * }
   *
   * // URL will be `/mystate/`
   * $state.go('mystate', { myparam: 'defaultParamValue' });
   *
   * // URL will be `/mystate/someOtherValue`
   * $state.go('mystate', { myparam: 'someOtherValue' });
   * ```
   *
   * @example
   * ```
   *
   * {
   *   name: 'mystate2',
   *   url: '/mystate2/:myparam2',
   *   params: {
   *     myparam2: 'defaultParamValue'
   *     squash: "~"
   *   }
   * }
   *
   * // URL will be `/mystate/~`
   * $state.go('mystate', { myparam2: 'defaultParamValue' });
   *
   * // URL will be `/mystate/someOtherValue`
   * $state.go('mystate', { myparam2: 'someOtherValue' });
   * ```
   *
   * If squash is not set, it uses the configured default squash policy. (See [[defaultSquashPolicy]]())
   */
  squash: (boolean|string);
  /**
   * @hidden
   * @internalapi
   *
   * An array of [[Replace]] objects.
   *
   * When creating a Transition, defines how to handle certain special values, such as `undefined`, `null`,
   * or empty string `""`.  If the transition is started, and the parameter value is equal to one of the "to"
   * values, then the parameter value is replaced with the "from" value.
   *
   * @example
   * ```
   *
   * replace: [
   *   { from: undefined, to: null },
   *   { from: "", to: null }
   * ]
   */
  replace: Replace[];
  /**
   * @hidden
   * @internalapi
   *
   * This is not part of the declaration; it is a calculated value depending on if a default value was specified or not.
   */
  isOptional: boolean;
  /** @todo document this one too */
  dynamic: boolean;
}

interface Replace {
  from: string,
  to:string
}
