import {extend, isArray, isDefined, filter, map} from "./common";

/**
 * @ngdoc object
 * @name ui.router.util.type:Type
 *
 * @description
 * Implements an interface to define custom parameter types that can be decoded from and encoded to
 * string parameters matched in a URL. Used by {@link ui.router.util.type:UrlMatcher `UrlMatcher`}
 * objects when matching or formatting URLs, or comparing or validating parameter values.
 *
 * See {@link ui.router.util.$urlMatcherFactory#methods_type `$urlMatcherFactory#type()`} for more
 * information on registering custom types.
 *
 * @param {Object} config  A configuration object which contains the custom type definition.  The object's
 *        properties will override the default methods and/or pattern in `Type`'s public interface.
 * @example
 * <pre>
 * {
 *   decode: function(val) { return parseInt(val, 10); },
 *   encode: function(val) { return val && val.toString(); },
 *   equals: function(a, b) { return this.is(a) && a === b; },
 *   is: function(val) { return angular.isNumber(val) isFinite(val) && val % 1 === 0; },
 *   pattern: /\d+/
 * }
 * </pre>
 *
 * @property {RegExp} pattern The regular expression pattern used to match values of this type when
 *           coming from a substring of a URL.
 *
 * @returns {Object}  Returns a new `Type` object.
 */
export class Type {
  pattern: RegExp;
  name: string;

  constructor(config) {
    extend(this, config);
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:Type#is
   * @methodOf ui.router.util.type:Type
   *
   * @description
   * Detects whether a value is of a particular type. Accepts a native (decoded) value
   * and determines whether it matches the current `Type` object.
   *
   * @param {*} val  The value to check.
   * @param {string} key  Optional. If the type check is happening in the context of a specific
   *        {@link ui.router.util.type:UrlMatcher `UrlMatcher`} object, this is the name of the
   *        parameter in which `val` is stored. Can be used for meta-programming of `Type` objects.
   * @returns {Boolean}  Returns `true` if the value matches the type, otherwise `false`.
   */
  is(val, key?) {
    return true;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:Type#encode
   * @methodOf ui.router.util.type:Type
   *
   * @description
   * Encodes a custom/native type value to a string that can be embedded in a URL. Note that the
   * return value does *not* need to be URL-safe (i.e. passed through `encodeURIComponent()`), it
   * only needs to be a representation of `val` that has been coerced to a string.
   *
   * @param {*} val  The value to encode.
   * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
   *        meta-programming of `Type` objects.
   * @returns {string}  Returns a string representation of `val` that can be encoded in a URL.
   */
  encode(val, key) {
    return val;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:Type#decode
   * @methodOf ui.router.util.type:Type
   *
   * @description
   * Converts a parameter value (from URL string or transition param) to a custom/native value.
   *
   * @param {string} val  The URL parameter value to decode.
   * @param {string} key  The name of the parameter in which `val` is stored. Can be used for
   *        meta-programming of `Type` objects.
   * @returns {*}  Returns a custom representation of the URL parameter value.
   */
  decode(val, key?) {
    return val;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:Type#equals
   * @methodOf ui.router.util.type:Type
   *
   * @description
   * Determines whether two decoded values are equivalent.
   *
   * @param {*} a  A value to compare against.
   * @param {*} b  A value to compare against.
   * @returns {Boolean}  Returns `true` if the values are equivalent/equal, otherwise `false`.
   */
  equals(a, b) {
    return a == b;
  }

  $subPattern() {
    var sub = this.pattern.toString();
    return sub.substr(1, sub.length - 2);
  }

  toString() {
    return "{Type:" + this.name + "}";
  }

  /** Given an encoded string, or a decoded object, returns a decoded object */
  $normalize(val) {
    return this.is(val) ? val : this.decode(val);
  }

  /*
   * Wraps an existing custom Type as an array of Type, depending on 'mode'.
   * e.g.:
   * - urlmatcher pattern "/path?{queryParam[]:int}"
   * - url: "/path?queryParam=1&queryParam=2
   * - $stateParams.queryParam will be [1, 2]
   * if `mode` is "auto", then
   * - url: "/path?queryParam=1 will create $stateParams.queryParam: 1
   * - url: "/path?queryParam=1&queryParam=2 will create $stateParams.queryParam: [1, 2]
   */
  $asArray(mode, isSearch) {
    if (!mode) return this;
    if (mode === "auto" && !isSearch) throw new Error("'auto' array mode is for query parameters only");

    function ArrayType(type, mode) {
      function bindTo(type, callbackName) {
        return function() {
          return type[callbackName].apply(type, arguments);
        };
      }

      // Wrap non-array value as array
      function arrayWrap(val) { return isArray(val) ? val : (isDefined(val) ? [ val ] : []); }
      // Unwrap array value for "auto" mode. Return undefined for empty array.
      function arrayUnwrap(val) {
        switch(val.length) {
          case 0: return undefined;
          case 1: return mode === "auto" ? val[0] : val;
          default: return val;
        }
      }
      function falsey(val) { return !val; }

      // Wraps type (.is/.encode/.decode) functions to operate on each value of an array
      function arrayHandler(callback, allTruthyMode?: boolean) {
        return function handleArray(val) {
          val = arrayWrap(val);
          var result = map(val, callback);
          if (allTruthyMode === true)
            return filter(result, falsey).length === 0;
          return arrayUnwrap(result);
        };
      }

      // Wraps type (.equals) functions to operate on each value of an array
      function arrayEqualsHandler(callback) {
        return function handleArray(val1, val2) {
          var left = arrayWrap(val1), right = arrayWrap(val2);
          if (left.length !== right.length) return false;
          for (var i = 0; i < left.length; i++) {
            if (!callback(left[i], right[i])) return false;
          }
          return true;
        };
      }

      this.encode = arrayHandler(bindTo(type, 'encode'));
      this.decode = arrayHandler(bindTo(type, 'decode'));
      this.is     = arrayHandler(bindTo(type, 'is'), true);
      this.equals = arrayEqualsHandler(bindTo(type, 'equals'));
      this.pattern = type.pattern;
      this.$normalize = arrayHandler(bindTo(type, '$normalize'));
      this.name = type.name;
      this.$arrayMode = mode;
    }

    return new ArrayType(this, mode);
  }
}

Type.prototype.pattern = /.*/;
