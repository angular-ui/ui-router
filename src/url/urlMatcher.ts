import {map, extend, inherit, isDefined, isObject, isArray, isString} from "../common/common";
import matcherConfig from "./urlMatcherConfig"
import paramTypes from "../params/paramTypes"
import ParamSet from "../params/paramSet"
import Param from "../params/param"

interface params {
  $$validates: (params: string) => Array<string>;
}

function quoteRegExp(string, pattern?: any, squash?: any, optional?: any) {
  var surroundPattern = ['',''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
  if (!pattern) return result;

  switch (squash) {
    case false: surroundPattern = ['(', ')' + (optional ? "?" : "")]; break;
    case true:  surroundPattern = ['?(', ')?']; break;
    default:    surroundPattern = [`(${squash}|`, ')?']; break;
  }
  return result + surroundPattern[0] + pattern + surroundPattern[1];
}

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
 * @param {Object} config  A configuration object hash:
 * @param {Object=} parentMatcher Used to concatenate the pattern/config onto
 *   an existing UrlMatcher
 *
 * * `caseInsensitive` - `true` if URL matching should be case insensitive, otherwise `false`, the default value (for backward compatibility) is `false`.
 * * `strict` - `false` if matching against a URL with a trailing slash should be treated as equivalent to a URL without a trailing slash, the default value is `true`.
 *
 * @property {string} prefix  A static prefix of this pattern. The matcher guarantees that any
 *   URL matching this matcher (i.e. any string for which {@link ui.router.util.type:UrlMatcher#methods_exec exec()} returns
 *   non-null) will start with this prefix.
 *
 * @property {string} source  The pattern that was passed into the constructor
 *
 * @property {string} sourcePath  The path portion of the source property
 *
 * @property {string} sourceSearch  The search portion of the source property
 *
 * @property {string} regex  The constructed regex that will be used to match against the url when
 *   it is time to determine which url will match.
 *
 * @returns {Object}  New `UrlMatcher` object
 */
export default class UrlMatcher {
  params: ParamSet;
  prefix: string;
  regexp: RegExp;
  segments: Array<string>;
  source: string;
  sourceSearch: string;
  sourcePath: string;
  $$paramNames: Array<string>;

  constructor(pattern, config, parentMatcher?: any) {
    config = extend({ params: {} }, isObject(config) ? config : {});

    // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
    //   '*' name
    //   ':' name
    //   '{' name '}'
    //   '{' name ':' regexp '}'
    // The regular expression is somewhat complicated due to the need to allow curly braces
    // inside the regular expression. The placeholder regexp breaks down as follows:
    //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
    //    \{([\w\[\]]+)(?:\:( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
    //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
    //    [^{}\\]+                       - anything other than curly braces or backslash
    //    \\.                            - a backslash escape
    //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
    var placeholder       = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
        searchPlaceholder = /([:]?)([\w\[\]-]+)|\{([\w\[\]-]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
        compiled = '^', last = 0, m,
        segments = this.segments = [],
        parentParams = parentMatcher ? parentMatcher.params : {},
        params = this.params = parentMatcher ? parentMatcher.params.$$new() : new ParamSet(),
        paramNames = [];

    function addParameter(id, type, config, location) {
      paramNames.push(id);
      if (parentParams[id]) return parentParams[id];
      if (!/^\w+(-+\w+)*(?:\[\])?$/.test(id)) throw new Error(`Invalid parameter name '${id}' in pattern '${pattern}'`);
      if (params[id]) throw new Error(`Duplicate parameter name '${id}' in pattern '${pattern}'`);
      params[id] = new Param(id, type, config, location);
      return params[id];
    }

    this.source = pattern;

    // Split into static segments separated by path parameter placeholders.
    // The number of segments is always 1 more than the number of parameters.
    function matchDetails(m, isSearch) {
      var id, regexp, segment, type, cfg, arrayMode;
      id          = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
      cfg         = config.params[id];
      segment     = pattern.substring(last, m.index);
      regexp      = isSearch ? m[4] : m[4] || (m[1] == '*' ? '.*' : null);
      type        = paramTypes.type(regexp || "string") || inherit(paramTypes.type("string"), { pattern: new RegExp(regexp, config.caseInsensitive ? 'i' : undefined) });
      return {id, regexp, segment, type, cfg};
    }

    var p, param, segment;

    while ((m = placeholder.exec(pattern))) {
      p = matchDetails(m, false);
      if (p.segment.indexOf('?') >= 0) break; // we're into the search part

      param = addParameter(p.id, p.type, p.cfg, "path");
      compiled += quoteRegExp(p.segment, param.type.pattern.source, param.squash, param.isOptional);
      segments.push(p.segment);
      last = placeholder.lastIndex;
    }
    segment = pattern.substring(last);

    // Find any search parameter names and remove them from the last segment
    var i = segment.indexOf('?');

    if (i >= 0) {
      var search = this.sourceSearch = segment.substring(i);
      segment = segment.substring(0, i);
      this.sourcePath = pattern.substring(0, last + i);

      if (search.length > 0) {
        last = 0;
        while ((m = searchPlaceholder.exec(search))) {
          p = matchDetails(m, true);
          param = addParameter(p.id, p.type, p.cfg, "search");
          last = placeholder.lastIndex;
          // check if ?&
        }
      }
    } else {
      this.sourcePath = pattern;
      this.sourceSearch = '';
    }

    compiled += quoteRegExp(segment) + (config.strict === false ? '\/?' : '') + '$';
    segments.push(segment);

    this.regexp = new RegExp(compiled, config.caseInsensitive ? 'i' : undefined);
    this.prefix = segments[0];
    this.$$paramNames = paramNames;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#concat
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Returns a new matcher for a pattern constructed by appending the path part and adding the
   * search parameters of the specified pattern to this pattern. The current pattern is not
   * modified. This can be understood as creating a pattern for URLs that are relative to (or
   * suffixes of) the current pattern.
   *
   * @example
   * The following two matchers are equivalent:
   * <pre>
   * new UrlMatcher('/user/{id}?q').concat('/details?date');
   * new UrlMatcher('/user/{id}/details?q&date');
   * </pre>
   *
   * @param {string} pattern  The pattern to append.
   * @param {Object} config  An object hash of the configuration for the matcher.
   * @returns {UrlMatcher}  A matcher for the concatenated pattern.
   */
  concat(pattern, config) {
    // Because order of search parameters is irrelevant, we can add our own search
    // parameters to the end of the new pattern. Parse the new pattern by itself
    // and then join the bits together, but it's much easier to do this on a string level.
    var defaultConfig = {
      caseInsensitive: matcherConfig.caseInsensitive(),
      strict: matcherConfig.strictMode(),
      squash: matcherConfig.defaultSquashPolicy()
    };
    return new UrlMatcher(this.sourcePath + pattern + this.sourceSearch, extend(defaultConfig, config), this);
  }

  toString() {
    return this.source;
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
   * they are not present in `searchParams`. This means that search parameters are always treated
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
   * @param {Object} searchParams  URL search parameters, e.g. `$location.search()`.
   * @returns {Object}  The captured parameter values.
   */
  exec(path, searchParams, hash) {
    var m = this.regexp.exec(path);
    if (!m) return null;
    searchParams = searchParams || {};

    var paramNames = this.parameters(), nTotal = paramNames.length,
        nPath = this.segments.length - 1,
        values = {}, i, j, cfg, paramName;

    if (nPath !== m.length - 1) throw new Error(`Unbalanced capture group in route '${this.source}'`);

    function decodePathArray(string: string) {
      const reverseString = (str: string) => str.split("").reverse().join("");
      const unquoteDashes = (str: string) => str.replace(/\\-/g, "-");

      var split = reverseString(string).split(/-(?!\\)/);
      var allReversed = map(split, reverseString);
      return map(allReversed, unquoteDashes).reverse();
    }

    for (i = 0; i < nPath; i++) {
      paramName = paramNames[i];
      var param = this.params[paramName];
      var paramVal: (any|any[]) = m[i+1];
      // if the param value matches a pre-replace pair, replace the value before decoding.
      for (j = 0; j < param.replace; j++) {
        if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
      }
      if (paramVal && param.array === true) paramVal = decodePathArray(paramVal);
      values[paramName] = param.value(paramVal);
    }
    for (/**/; i < nTotal; i++) {
      paramName = paramNames[i];
      values[paramName] = this.params[paramName].value(searchParams[paramName]);
    }

    if (hash) values["#"] = hash;

    return values;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#parameters
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Returns the names of all path and search parameters of this pattern in an unspecified order.
   *
   * @returns {Array.<string>}  An array of parameter names. Must be treated as read-only. If the
   *    pattern has no parameters, an empty array is returned.
   */
  parameters(param?: string) {
    if (!isDefined(param)) return this.$$paramNames;
    return this.params[param] || null;
  }

  /**
   * @ngdoc function
   * @name ui.router.util.type:UrlMatcher#validate
   * @methodOf ui.router.util.type:UrlMatcher
   *
   * @description
   * Checks an object hash of parameters to validate their correctness according to the parameter
   * types of this `UrlMatcher`.
   *
   * @param {Object} params The object hash of parameters to validate.
   * @returns {boolean} Returns `true` if `params` validates, otherwise `false`.
   */
  validates(params) {
    return this.params.$$validates(params);
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
    const url = {
      params:   this.parameters(),
      paramSet: this.params,
      nPath:    this.segments.length - 1
    };
    var i, search = false, result = this.segments[0];

    if (!this.validates(values)) return null;

    function encodeDashes(str) { // Replace dashes with encoded "\-"
      return encodeURIComponent(str).replace(/-/g, c => `%5C%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    url.params.map((name, i) => {
      var isPathParam = i < url.nPath;
      var param: Param = url.paramSet[name], value = param.value(values[name]);
      var isDefaultValue = param.isDefaultValue(value);
      var squash = isDefaultValue ? param.squash : false;
      var encoded = param.type.encode(value);

      if (!isPathParam) {
        if (encoded == null || (isDefaultValue && squash !== false)) return;
        if (!isArray(encoded)) encoded = [<string> encoded];

        encoded = map(<string[]> encoded, encodeURIComponent).join(`&${name}=`);
        result += (search ? '&' : '?') + (`${name}=${encoded}`);
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
      })(this.segments[i + 1], result);
    });

    if (values["#"]) result += "#" + values["#"];

    return result;
  }
}
