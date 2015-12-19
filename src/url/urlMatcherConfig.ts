/** @module url */ /** for typedoc */
import {isDefined, isString} from "../common/common";

class MatcherConfig {
  _isCaseInsensitive: boolean = false;
  _isStrictMode: boolean = false;
  _defaultSquashPolicy: (boolean|string) = false;

  caseInsensitive(value?: boolean): boolean {
    if (!isDefined(value)) 
      return this._isCaseInsensitive;

    return this._isCaseInsensitive = value;
  }

  strictMode(value?: boolean): boolean {
    if (!isDefined(value))
      return this._isStrictMode;

    return this._isStrictMode = value;
  }

  defaultSquashPolicy(value?: (boolean|string)): (boolean|string) {
    if (!isDefined(value))
      return this._defaultSquashPolicy;

    if (value !== true && value !== false && !isString(value))
      throw new Error(`Invalid squash policy: ${value}. Valid policies: false, true, arbitrary-string`);

    return this._defaultSquashPolicy = value;
  }
}

export let matcherConfig = new MatcherConfig();
