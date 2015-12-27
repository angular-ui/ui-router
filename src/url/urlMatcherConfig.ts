/** @module url */ /** for typedoc */
import {isDefined, isString} from "../common/common";

class MatcherConfig {
  _isCaseInsensitive: boolean = false;
  _isStrictMode: boolean = true;
  _defaultSquashPolicy: (boolean|string) = false;

  caseInsensitive(value?: boolean): boolean {
    return this._isCaseInsensitive = isDefined(value) ? value : this._isCaseInsensitive;
  }

  strictMode(value?: boolean): boolean {
    return this._isStrictMode = isDefined(value) ? value : this._isStrictMode;
  }

  defaultSquashPolicy(value?: (boolean|string)): (boolean|string) {
    if (isDefined(value) && value !== true && value !== false && !isString(value))
      throw new Error(`Invalid squash policy: ${value}. Valid policies: false, true, arbitrary-string`);
    return this._defaultSquashPolicy = isDefined(value) ? value : this._defaultSquashPolicy;
  }
}

export let matcherConfig = new MatcherConfig();
