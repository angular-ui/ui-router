/** @module url */ /** for typedoc */
import {
  map, defaults, extend, inherit, identity,
  unnest, tail, forEach, find, Obj, pairs, allTrueR
} from "../common/common";
import {prop, propEq } from "../common/hof";
import {isArray, isString} from "../common/predicates";
import {Param} from "../params/param";
import {ParamTypes} from "../params/paramTypes";
import {isDefined} from "../common/predicates";
import {DefType} from "../params/param";
import {unnestR} from "../common/common";
import {arrayTuples} from "../common/common";
import {RawParams} from "../params/interface";

/** @hidden */
function quoteRegExp(string: any, param?: any) {
  let surroundPattern = ['', ''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
  if (!param) return result;

  switch (param.squash) {
    case false:
      surroundPattern = ['(', ')' + (param.isOptional ? '?' : '')]; break;
    case true:
      result = result.replace(/\/$/, '');
      surroundPattern = ['(?:\/(', ')|\/)?'];
      break;
    default:
      surroundPattern = [`(${param.squash}|`, ')?']; break;
  }
  return result + surroundPattern[0] + param.type.pattern.source + surroundPattern[1];
}

/** @hidden */
const memoizeTo = (obj: Obj, prop: string, fn: Function) =>
    obj[prop] = obj[prop] || fn();

/**
 * Matches URLs against patterns.
 *
 * Matches URLs against patterns and extracts named parameters from the path or the search
 * part of the URL.
 *
 * A URL pattern consists of a path pattern, optionally followed by '?' and a list of search (query)
 * parameters. Multiple search parameter names are separated by '&'. Search parameters
 * do not influence whether or not a URL is matched, but their values are passed through into
 * the matched parameters returned by [[UrlMatcher.exec]].
 *
 * - *Path parameters* are defined using curly brace placeholders (`/somepath/{param}`)
 * or colon placeholders (`/somePath/:param`).
 *
 * - *A parameter RegExp* may be defined for a param after a colon
 * (`/somePath/{param:[a-zA-Z0-9]+}`) in a curly brace placeholder.
 * The regexp must match for the url to be matched.
 * Should the regexp itself contain curly braces, they must be in matched pairs or escaped with a backslash.
 *
 * - *Custom parameter types* may also be specified after a colon (`/somePath/{param:int}`)
 * in curly brace parameters.  See [[UrlMatcherFactory.type]] for more information.
 *
 * - *Catch-all parameters* are defined using an asterisk placeholder (`/somepath/*catchallparam`).  A catch-all
 * parameter value will contain the remainder of the URL.
 *
 * ---
 *
 * Parameter names may contain only word characters (latin letters, digits, and underscore) and
 * must be unique within the pattern (across both path and search parameters).
 * A path parameter matches any number of characters other than '/'. For catch-all
 * placeholders the path parameter matches any number of characters.
 *
 * Examples:
 *
 * * `'/hello/'` - Matches only if the path is exactly '/hello/'. There is no special treatment for
 *   trailing slashes, and patterns have to match the entire path, not just a prefix.
 * * `'/user/:id'` - Matches '/user/bob' or '/user/1234!!!' or even '/user/' but not '/user' or
 *   '/user/bob/details'. The second path segment will be captured as the parameter 'id'.
 * * `'/user/{id}'` - Same as the previous example, but using curly brace syntax.
 * * `'/user/{id:[^/]*}'` - Same as the previous example.
 * * `'/user/{id:[0-9a-fA-F]{1,8}}'` - Similar to the previous example, but only matches if the id
 *   parameter consists of 1 to 8 hex digits.
 * * `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
 *   path into the parameter 'path'.
 * * `'/files/*path'` - ditto.
 * * `'/calendar/{start:date}'` - Matches "/calendar/2014-11-12" (because the pattern defined
 *   in the built-in  `date` ParamType matches `2014-11-12`) and provides a Date object in $stateParams.start
 *
 */
export class UrlMatcher {
  /** @hidden */
  static nameValidator: RegExp = /^\w+([-.]+\w+)*(?:\[\])?$/;

  /** @hidden */
  private _cache: { path: UrlMatcher[], pattern?: RegExp } = { path: [], pattern: null };
  /** @hidden */
  private _children: UrlMatcher[] = [];
  /** @hidden */
  private _params:   Param[]      = [];
  /** @hidden */
  private _segments: string[]     = [];
  /** @hidden */
  private _compiled: string[]     = [];

  /**
   * A static prefix of this pattern.
   *
   * The matcher guarantees that any
   *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
   *   non-null) will start with this prefix.
   */
  public prefix: string;
  /** The pattern that was passed into the constructor */
  public pattern: string;

  /**
   * @param pattern The pattern to compile into a matcher.
   * @param paramTypes The [[ParamTypes]] registry
   * @param config  A configuration object
   * - `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
   * - `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
   */
  constructor(pattern: string, paramTypes: ParamTypes, public config?: any) {
    this.pattern = pattern;
    this.config = defaults(this.config, {
      params: {},
      strict: true,
      caseInsensitive: false,
      paramMap: identity
    });

    // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
    //   '*' name
    //   ':' name
    //   '{' name '}'
    //   '{' name ':' regexp '}'
    // The regular expression is somewhat complicated due to the need to allow curly braces
    // inside the regular expression. The placeholder regexp breaks down as follows:
    //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
    //    \{([\w\[\]]+)(?:\:\s*( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
    //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
    //    [^{}\\]+                       - anything other than curly braces or backslash
    //    \\.                            - a backslash escape
    //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
    let placeholder = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
        searchPlaceholder = /([:]?)([\w\[\].-]+)|\{([\w\[\].-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
        last = 0, m: RegExpExecArray, patterns: any[][] = [];

    const checkParamErrors = (id: string) => {
      if (!UrlMatcher.nameValidator.test(id)) throw new Error(`Invalid parameter name '${id}' in pattern '${pattern}'`);
      if (find(this._params, propEq('id', id))) throw new Error(`Duplicate parameter name '${id}' in pattern '${pattern}'`);
    };

    // Split into static segments separated by path parameter placeholders.
    // The number of segments is always 1 more than the number of parameters.
    const matchDetails = (m: RegExpExecArray, isSearch: boolean) => {
      // IE[78] returns '' for unmatched groups instead of null
      let id = m[2] || m[3], regexp = isSearch ? m[4] : m[4] || (m[1] === '*' ? '.*' : null);

      return {
        id,
        regexp,
        cfg:     this.config.params[id],
        segment: pattern.substring(last, m.index),
        type:    !regexp ? null : paramTypes.type(regexp || "string") || inherit(paramTypes.type("string"), {
          pattern: new RegExp(regexp, this.config.caseInsensitive ? 'i' : undefined)
        })
      };
    }

    let p: any, segment: string;

    while ((m = placeholder.exec(pattern))) {
      p = matchDetails(m, false);
      if (p.segment.indexOf('?') >= 0) break; // we're into the search part

      checkParamErrors(p.id);
      this._params.push(Param.fromPath(p.id, p.type, this.config.paramMap(p.cfg, false), paramTypes));
      this._segments.push(p.segment);
      patterns.push([p.segment, tail(this._params)]);
      last = placeholder.lastIndex;
    }
    segment = pattern.substring(last);

    // Find any search parameter names and remove them from the last segment
    let i = segment.indexOf('?');

    if (i >= 0) {
      let search = segment.substring(i);
      segment = segment.substring(0, i);

      if (search.length > 0) {
        last = 0;

        while ((m = searchPlaceholder.exec(search))) {
          p = matchDetails(m, true);
          checkParamErrors(p.id);
          this._params.push(Param.fromSearch(p.id, p.type, this.config.paramMap(p.cfg, true), paramTypes));
          last = placeholder.lastIndex;
          // check if ?&
        }
      }
    }

    this._segments.push(segment);

    extend(this, {
      _compiled: patterns.map(pattern => quoteRegExp.apply(null, pattern)).concat(quoteRegExp(segment)),
      prefix: this._segments[0]
    });

    Object.freeze(this);
  }

  /**
   * Creates a new concatenated UrlMatcher
   *
   * Builds a new UrlMatcher by appending another UrlMatcher to this one.
   *
   * @param url A `UrlMatcher` instance to append as a child of the current `UrlMatcher`.
   */
  append(url: UrlMatcher): UrlMatcher {
    this._children.push(url);
    forEach(url._cache, (val, key) => url._cache[key] = isArray(val) ? [] : null);
    url._cache.path = this._cache.path.concat(this);
    return url;
  }

  /** @hidden */
  isRoot(): boolean {
    return this._cache.path.length === 0;
  }

  /** Returns the input pattern string */
  toString(): string {
    return this.pattern;
  }

  /**
   * Tests the specified url/path against this matcher.
   *
   * Tests if the given url matches this matcher's pattern, and returns an object containing the captured
   * parameter values.  Returns null if the path does not match.
   *
   * The returned object contains the values
   * of any search parameters that are mentioned in the pattern, but their value may be null if
   * they are not present in `search`. This means that search parameters are always treated
   * as optional.
   *
   * @example
   * ```js
   *
   * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', {
   *   x: '1', q: 'hello'
   * });
   * // returns { id: 'bob', q: 'hello', r: null }
   * ```
   *
   * @param path    The URL path to match, e.g. `$location.path()`.
   * @param search  URL search parameters, e.g. `$location.search()`.
   * @param hash    URL hash e.g. `$location.hash()`.
   * @param options
   *
   * @returns The captured parameter values.
   */
  exec(path: string, search: any = {}, hash?: string, options: any = {}): RawParams {
    let match = memoizeTo(this._cache, 'pattern', () => {
      return new RegExp([
        '^',
        unnest(this._cache.path.concat(this).map(prop('_compiled'))).join(''),
        this.config.strict === false ? '\/?' : '',
        '$'
      ].join(''), this.config.caseInsensitive ? 'i' : undefined);
    }).exec(path);

    if (!match) return null;

    //options = defaults(options, { isolate: false });

    let allParams:    Param[] = this.parameters(),
        pathParams:   Param[] = allParams.filter(param => !param.isSearch()),
        searchParams: Param[] = allParams.filter(param => param.isSearch()),
        nPathSegments  = this._cache.path.concat(this).map(urlm => urlm._segments.length - 1).reduce((a, x) => a + x),
        values: RawParams = {};

    if (nPathSegments !== match.length - 1)
      throw new Error(`Unbalanced capture group in route '${this.pattern}'`);

    function decodePathArray(string: string) {
      const reverseString = (str: string) => str.split("").reverse().join("");
      const unquoteDashes = (str: string) => str.replace(/\\-/g, "-");

      let split = reverseString(string).split(/-(?!\\)/);
      let allReversed = map(split, reverseString);
      return map(allReversed, unquoteDashes).reverse();
    }

    for (let i = 0; i < nPathSegments; i++) {
      let param: Param = pathParams[i];
      let value: (any|any[]) = match[i + 1];

      // if the param value matches a pre-replace pair, replace the value before decoding.
      for (let j = 0; j < param.replace.length; j++) {
        if (param.replace[j].from === value) value = param.replace[j].to;
      }
      if (value && param.array === true) value = decodePathArray(value);
      if (isDefined(value)) value = param.type.decode(value);
      values[param.id] = param.value(value);
    }
    searchParams.forEach(param => {
      let value = search[param.id];
      for (let j = 0; j < param.replace.length; j++) {
        if (param.replace[j].from === value) value = param.replace[j].to;
      }
      if (isDefined(value)) value = param.type.decode(value);
      values[param.id] = param.value(value);
    });

    if (hash) values["#"] = hash;

    return values;
  }

  /**
   * @hidden
   * Returns all the [[Param]] objects of all path and search parameters of this pattern in order of appearance.
   *
   * @returns {Array.<Param>}  An array of [[Param]] objects. Must be treated as read-only. If the
   *    pattern has no parameters, an empty array is returned.
   */
  parameters(opts: any = {}): Param[] {
    if (opts.inherit === false) return this._params;
    return unnest(this._cache.path.concat(this).map(prop('_params')));
  }

  /**
   * @hidden
   * Returns a single parameter from this UrlMatcher by id
   *
   * @param id
   * @param opts
   * @returns {T|Param|any|boolean|UrlMatcher|null}
   */
  parameter(id: string, opts: any = {}): Param {
    const parent = tail(this._cache.path);

    return (
      find(this._params, propEq('id', id)) ||
      (opts.inherit !== false && parent && parent.parameter(id)) ||
      null
    );
  }

  /**
   * Validates the input parameter values against this UrlMatcher
   *
   * Checks an object hash of parameters to validate their correctness according to the parameter
   * types of this `UrlMatcher`.
   *
   * @param params The object hash of parameters to validate.
   * @returns Returns `true` if `params` validates, otherwise `false`.
   */
  validates(params: RawParams): boolean {
    const validParamVal = (param: Param, val: any) => 
        !param || param.validates(val);
    return pairs(params || {}).map(([key, val]) => validParamVal(this.parameter(key), val)).reduce(allTrueR, true);
  }

  /**
   * Given a set of parameter values, creates a URL from this UrlMatcher.
   *
   * Creates a URL that matches this pattern by substituting the specified values
   * for the path and search parameters.
   *
   * @example
   * ```js
   *
   * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
   * // returns '/user/bob?q=yes'
   * ```
   *
   * @param values  the values to substitute for the parameters in this pattern.
   * @returns the formatted URL (path and optionally search part).
   */
  format(values: RawParams = {}) {
    if (!this.validates(values)) return null;

    // Build the full path of UrlMatchers (including all parent UrlMatchers)
    let urlMatchers = this._cache.path.slice().concat(this);

    // Extract all the static segments and Params into an ordered array
    let pathSegmentsAndParams: Array<string|Param> =
        urlMatchers.map(UrlMatcher.pathSegmentsAndParams).reduce(unnestR, []);

    // Extract the query params into a separate array
    let queryParams: Array<Param> =
        urlMatchers.map(UrlMatcher.queryParams).reduce(unnestR, []);

    /**
     * Given a Param,
     * Applies the parameter value, then returns details about it
     */
    function getDetails(param: Param): ParamDetails {
      // Normalize to typed value
      let value = param.value(values[param.id]);
      let isDefaultValue = param.isDefaultValue(value);
      // Check if we're in squash mode for the parameter
      let squash = isDefaultValue ? param.squash : false;
      // Allow the Parameter's Type to encode the value
      let encoded = param.type.encode(value);

      return { param, value, isDefaultValue, squash, encoded };
    }

    // Build up the path-portion from the list of static segments and parameters
    let pathString = pathSegmentsAndParams.reduce((acc: string, x: string|Param) => {
      // The element is a static segment (a raw string); just append it
      if (isString(x)) return acc + x;

      // Otherwise, it's a Param.  Fetch details about the parameter value
      let {squash, encoded, param} = getDetails(<Param> x);

      // If squash is === true, try to remove a slash from the path
      if (squash === true) return (acc.match(/\/$/)) ? acc.slice(0, -1) : acc;
      // If squash is a string, use the string for the param value
      if (isString(squash)) return acc + squash;
      if (squash !== false) return acc; // ?
      if (encoded == null) return acc;
      // If this parameter value is an array, encode the value using encodeDashes
      if (isArray(encoded)) return acc + map(<string[]> encoded, UrlMatcher.encodeDashes).join("-");
      // If the parameter type is "raw", then do not encodeURIComponent
      if (param.type.raw) return acc + encoded;
      // Encode the value
      return acc + encodeURIComponent(<string> encoded);
    }, "");

    // Build the query string by applying parameter values (array or regular)
    // then mapping to key=value, then flattening and joining using "&"
    let queryString = queryParams.map((param: Param) => {
      let {squash, encoded, isDefaultValue} = getDetails(param);
      if (encoded == null || (isDefaultValue && squash !== false)) return;
      if (!isArray(encoded)) encoded = [<string> encoded];
      if (encoded.length === 0) return;
      if (!param.type.raw) encoded = map(<string[]> encoded, encodeURIComponent);

      return (<string[]> encoded).map(val => `${param.id}=${val}`);
    }).filter(identity).reduce(unnestR, []).join("&");

    // Concat the pathstring with the queryString (if exists) and the hashString (if exists)
    return pathString + (queryString ? `?${queryString}` : "") + (values["#"] ? "#" + values["#"] : "");
  }

  /** @hidden */
  static encodeDashes(str: string) { // Replace dashes with encoded "\-"
    return encodeURIComponent(str).replace(/-/g, c => `%5C%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }

  /** @hidden Given a matcher, return an array with the matcher's path segments and path params, in order */
  static pathSegmentsAndParams(matcher: UrlMatcher) {
    let staticSegments = matcher._segments;
    let pathParams = matcher._params.filter(p => p.location === DefType.PATH);
    return arrayTuples(staticSegments, pathParams.concat(undefined)).reduce(unnestR, []).filter(x => x !== "" && isDefined(x));
  }

  /** @hidden Given a matcher, return an array with the matcher's query params */
  static queryParams(matcher: UrlMatcher): Param[] {
    return matcher._params.filter(p => p.location === DefType.SEARCH);
  }
}

/** @hidden */
interface ParamDetails {
  param: Param;
  value: any;
  isDefaultValue: boolean;
  squash: (boolean|string);
  encoded: (string|string[]);
}
