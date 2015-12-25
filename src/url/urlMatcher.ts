/** @module url */ /** for typedoc */
import {
  map, prop, propEq, defaults, extend, inherit, identity, isDefined, isObject, isArray, isString,
  invoke, unnest, tail, forEach, find, curry, omit, pairs, allTrueR
} from "../common/common";
import {Param, paramTypes} from "../params/module";

interface params {
  $$validates: (params: string) => Array<string>;
}

function quoteRegExp(string: any, param?: any) {
  var surroundPattern = ['', ''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
  if (!param) return result;

  switch (param.squash) {
    case false: surroundPattern = ['(', ')' + (param.isOptional ? '?' : '')]; break;
    case true:  surroundPattern = ['?(', ')?']; break;
    default:    surroundPattern = [`(${param.squash}|`, ')?']; break;
  }
  return result + surroundPattern[0] + param.type.pattern.source + surroundPattern[1];
}

const memoizeTo = (obj, prop, fn) => obj[prop] = obj[prop] || fn();

/**
 * @ngdoc object
 * @name ui.router.util.type:UrlMatcher
 *
 * @description
 * Matches URLs against patterns and extracts named parameters from the path or the search
 * part of the URL. A URL pattern consists of a path pattern, optionally followed by '?' and a list
 * of search parameters. Multiple search parameter names are separated by '&'. Search parameters
 * do not influence whether or not a URL is matched, but their values are passed through into
 * the matched parameters returned by {@link ui.router.util.type:UrlMatcher#methods_exec exec}.
 *
 * Path parameter placeholders can be specified using simple colon/catch-all syntax or curly brace
 * syntax, which optionally allows a regular expression for the parameter to be specified:
 *
 * * `':'` name - colon placeholder
 * * `'*'` name - catch-all placeholder
 * * `'{' name '}'` - curly placeholder
 * * `'{' name ':' regexp|type '}'` - curly placeholder with regexp or type name. Should the
 *   regexp itself contain curly braces, they must be in matched pairs or escaped with a backslash.
 *
 * Parameter names may contain only word characters (latin letters, digits, and underscore) and
 * must be unique within the pattern (across both path and search parameters). For colon
 * placeholders or curly placeholders without an explicit regexp, a path parameter matches any
 * number of characters other than '/'. For catch-all placeholders the path parameter matches
 * any number of characters.
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
 *   in the built-in  `date` Type matches `2014-11-12`) and provides a Date object in $stateParams.start
 *
 * @param {string} pattern  The pattern to compile into a matcher.
 * @param {Object} config  A configuration object hash
 * * `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
 * * `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
 *
 * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
 *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
 *   non-null) will start with this prefix.
 *
 * @property {string} pattern  The pattern that was passed into the constructor
 *
 * @returns {Object}  New `UrlMatcher` object
 */
export class UrlMatcher {

  static nameValidator: RegExp = /^\w+(-+\w+)*(?:\[\])?$/;

  private _cache: { path: UrlMatcher[], pattern?: RegExp } = { path: [], pattern: null };
  private _children: UrlMatcher[] = [];
  private _params:   Param[]      = [];
  private _segments: string[]     = [];
  private _compiled: string[]     = [];

  public prefix: string;

  constructor(public pattern: string, public config: any) {
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
    var placeholder = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
        searchPlaceholder = /([:]?)([\w\[\]-]+)|\{([\w\[\]-]+)(?:\:\s*((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
        last = 0, m, patterns = [];

    const checkParamErrors = (id) => {
      if (!UrlMatcher.nameValidator.test(id)) throw new Error(`Invalid parameter name '${id}' in pattern '${pattern}'`);
      if (find(this._params, propEq('id', id))) throw new Error(`Duplicate parameter name '${id}' in pattern '${pattern}'`);
    };

    // Split into static segments separated by path parameter placeholders.
    // The number of segments is always 1 more than the number of parameters.
    const matchDetails = (m, isSearch) => {
      // IE[78] returns '' for unmatched groups instead of null
      var id = m[2] || m[3], regexp = isSearch ? m[4] : m[4] || (m[1] === '*' ? '.*' : null);

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

    var p, param, segment;

    while ((m = placeholder.exec(pattern))) {
      p = matchDetails(m, false);
      if (p.segment.indexOf('?') >= 0) break; // we're into the search part

      checkParamErrors(p.id);
      this._params.push(Param.fromPath(p.id, p.type, this.config.paramMap(p.cfg, false)));
      this._segments.push(p.segment);
      patterns.push([p.segment, tail(this._params)]);
      last = placeholder.lastIndex;
    }
    segment = pattern.substring(last);

    // Find any search parameter names and remove them from the last segment
    var i = segment.indexOf('?');

    if (i >= 0) {
      var search = segment.substring(i);
      segment = segment.substring(0, i);

      if (search.length > 0) {
        last = 0;

        while ((m = searchPlaceholder.exec(search))) {
          p = matchDetails(m, true);
          checkParamErrors(p.id);
          this._params.push(Param.fromSearch(p.id, p.type, this.config.paramMap(p.cfg, true)));
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
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#append
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * @TODO
   *
   * @example
   * @TODO
   *
   * @param {UrlMatcher} url A `UrlMatcher` instance to append as a child of the current `UrlMatcher`.
   */
  append(url: UrlMatcher): UrlMatcher {
    this._children.push(url);
    forEach(url._cache, (val, key) => url._cache[key] = isArray(val) ? [] : null);
    url._cache.path = this._cache.path.concat(this);
    return url;
  }

  isRoot(): boolean {
    return this._cache.path.length === 0;
  }

  toString(): string {
    return this.pattern;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#exec
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Tests the specified path against this matcher, and returns an object containing the captured
   * parameter values, or null if the path does not match. The returned object contains the values
   * of any search parameters that are mentioned in the pattern, but their value may be null if
   * they are not present in `search`. This means that search parameters are always treated
   * as optional.
   *
   * @example
   * <pre>
   * new UrlMatcher('/user/{id}?q&r').exec('/user/bob', {
   *   x: '1', q: 'hello'
   * });
   * // returns { id: 'bob', q: 'hello', r: null }
   * </pre>
   *
   * @param {string} path  The URL path to match, e.g. `$location.path()`.
   * @param {Object} search  URL search parameters, e.g. `$location.search()`.
   * @param {string} hash  URL hash e.g. `$location.hash()`.
   * @param {Object} options
   * @returns {Object}  The captured parameter values.
   */
  exec(path: string, search: any = {}, hash?: string, options: any = {}) {
    var match = memoizeTo(this._cache, 'pattern', () => {
      return new RegExp([
        '^',
        unnest(this._cache.path.concat(this).map(prop('_compiled'))).join(''),
        this.config.strict === false ? '\/?' : '',
        '$'
      ].join(''), this.config.caseInsensitive ? 'i' : undefined);
    }).exec(path);

    if (!match) return null;

    //options = defaults(options, { isolate: false });

    var allParams:    Param[] = this.parameters(),
        pathParams:   Param[] = allParams.filter(param => !param.isSearch()),
        searchParams: Param[] = allParams.filter(param => param.isSearch()),
        nPathSegments  = this._cache.path.concat(this).map(urlm => urlm._segments.length - 1).reduce((a, x) => a + x),
        values = {};

    if (nPathSegments !== match.length - 1)
      throw new Error(`Unbalanced capture group in route '${this.pattern}'`);

    function decodePathArray(string: string) {
      const reverseString = (str: string) => str.split("").reverse().join("");
      const unquoteDashes = (str: string) => str.replace(/\\-/g, "-");

      var split = reverseString(string).split(/-(?!\\)/);
      var allReversed = map(split, reverseString);
      return map(allReversed, unquoteDashes).reverse();
    }

    for (var i = 0; i < nPathSegments; i++) {
      var param: Param = pathParams[i];
      var value: (any|any[]) = match[i + 1];

      // if the param value matches a pre-replace pair, replace the value before decoding.
      for (var j = 0; j < param.replace; j++) {
        if (param.replace[j].from === value) value = param.replace[j].to;
      }
      if (value && param.array === true) value = decodePathArray(value);
      values[param.id] = param.value(value);
    }
    forEach(searchParams, param => {
      values[param.id] = param.value(search[param.id])
    });

    if (hash) values["#"] = hash;

    return values;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#parameters
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Returns the names of all path and search parameters of this pattern in order of appearance.
   *
   * @returns {Array.<Param>}  An array of parameter names. Must be treated as read-only. If the
   *    pattern has no parameters, an empty array is returned.
   */
  parameters(opts: any = {}): Param[] {
    if (opts.inherit === false) return this._params;
    return unnest(this._cache.path.concat(this).map(prop('_params')));
  }

  parameter(id: string, opts: any = {}): Param {
    const parent = tail(this._cache.path);

    return (
      find(this._params, propEq('id', id)) ||
      (opts.inherit !== false && parent && parent.parameter(id)) ||
      null
    );
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#validates
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Checks an object hash of parameters to validate their correctness according to the parameter
   * types of this `UrlMatcher`.
   *
   * @param {Object} params The object hash of parameters to validate.
   * @returns {boolean} Returns `true` if `params` validates, otherwise `false`.
   */
  validates(params): boolean {
    const validParamVal = (param: Param, val) => !param || param.validates(val);
    return pairs(params || {}).map(([key, val]) => validParamVal(this.parameter(key), val)).reduce(allTrueR, true);
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#format
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Creates a URL that matches this pattern by substituting the specified values
   * for the path and search parameters. Null values for path parameters are
   * treated as empty strings.
   *
   * @example
   * <pre>
   * new UrlMatcher('/user/{id}?q').format({ id:'bob', q:'yes' });
   * // returns '/user/bob?q=yes'
   * </pre>
   *
   * @param {Object} values  the values to substitute for the parameters in this pattern.
   * @returns {string}  the formatted URL (path and optionally search part).
   */
  format(values = {}) {
    var segments: string[] = this._segments,
        result: string = segments[0],
        search: boolean = false,
        params: Param[] = this.parameters({inherit: false}),
        parent: UrlMatcher = tail(this._cache.path);

    if (!this.validates(values)) return null;

    function encodeDashes(str) { // Replace dashes with encoded "\-"
      return encodeURIComponent(str).replace(/-/g, c => `%5C%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    // TODO: rewrite as reduce over params with result as initial
    params.map((param: Param, i) => {
      var isPathParam = i < segments.length - 1;
      var value = param.value(values[param.id]);
      var isDefaultValue = param.isDefaultValue(value);
      var squash = isDefaultValue ? param.squash : false;
      var encoded = param.type.encode(value);

      if (!isPathParam) {
        if (encoded == null || (isDefaultValue && squash !== false)) return;
        if (!isArray(encoded)) encoded = [<string> encoded];

        encoded = map(<string[]> encoded, encodeURIComponent).join(`&${param.id}=`);
        result += (search ? '&' : '?') + (`${param.id}=${encoded}`);
        search = true;
        return;
      }

      result += ((segment, result) => {
        if (squash === true) return segment.match(result.match(/\/$/) ? /\/?(.*)/ : /(.*)/)[1];
        if (isString(squash)) return squash + segment;
        if (squash !== false) return "";
        if (encoded == null) return segment;
        if (isArray(encoded)) return map(<string[]> encoded, encodeDashes).join("-") + segment;
        if (param.type.raw) return encoded + segment;
        return encodeURIComponent(<string> encoded) + segment;
      })(segments[i + 1], result);
    });

    if (values["#"]) result += "#" + values["#"];

    var processedParams = ['#'].concat(params.map(prop('id')));
    return (parent && parent.format(omit(values, processedParams)) || '') + result;
  }
}
