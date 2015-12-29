/** @module params */ /** for typedoc */
import {isInjectable, extend, isDefined, isString, isArray, filter, map, pick, prop, propEq, curry, applyPairs} from "../common/common";
import {RawParams} from "../params/interface";
import {services} from "../common/coreservices";
import {matcherConfig} from "../url/urlMatcherConfig";
import {Type} from "./type";
import {paramTypes} from "./paramTypes";

let hasOwn = Object.prototype.hasOwnProperty;
let isShorthand = cfg => ["value", "type", "squash", "array", "dynamic"].filter(hasOwn.bind(cfg || {})).length === 0;

enum DefType {
  PATH, SEARCH, CONFIG
}

export class Param {
  id: string;
  type: Type;
  location: DefType;
  array: boolean;
  squash: (boolean|string);
  replace: any;
  isOptional: boolean;
  dynamic: boolean;
  config: any;

  constructor(id: string, type: Type, config: any, location: DefType) {
    config = unwrapShorthand(config);
    type = getType(config, type, location);
    var arrayMode = getArrayMode();
    type = arrayMode ? type.$asArray(arrayMode, location === DefType.SEARCH) : type;
    var isOptional = config.value !== undefined;
    var dynamic = config.dynamic === true;
    var squash = getSquashPolicy(config, isOptional);
    var replace = getReplace(config, arrayMode, isOptional, squash);

    function unwrapShorthand(config) {
      config = isShorthand(config) && { value: config } || config;

      return extend(config, {
        $$fn: isInjectable(config.value) ? config.value : () => config.value
      });
    }

    function getType(config, urlType, location) {
      if (config.type && urlType && urlType.name !== 'string') throw new Error(`Param '${id}' has two type configurations.`);
      if (config.type && urlType && urlType.name === 'string' && paramTypes.type(config.type)) return paramTypes.type(config.type);
      if (urlType) return urlType;
      if (!config.type) return (location === DefType.CONFIG ? paramTypes.type("any") : paramTypes.type("string"));
      return config.type instanceof Type ? config.type : paramTypes.type(config.type);
    }

    // array config: param name (param[]) overrides default settings.  explicit config overrides param name.
    function getArrayMode() {
      var arrayDefaults = { array: (location === DefType.SEARCH ? "auto" : false) };
      var arrayParamNomenclature = id.match(/\[\]$/) ? { array: true } : {};
      return extend(arrayDefaults, arrayParamNomenclature, config).array;
    }

    /**
     * returns false, true, or the squash value to indicate the "default parameter url squash policy".
     */
    function getSquashPolicy(config, isOptional) {
      var squash = config.squash;
      if (!isOptional || squash === false) return false;
      if (!isDefined(squash) || squash == null) return matcherConfig.defaultSquashPolicy();
      if (squash === true || isString(squash)) return squash;
      throw new Error(`Invalid squash policy: '${squash}'. Valid policies: false, true, or arbitrary string`);
    }

    function getReplace(config, arrayMode, isOptional, squash) {
      var replace, configuredKeys, defaultPolicy = [
        {from: "", to: (isOptional || arrayMode ? undefined : "")},
        {from: null, to: (isOptional || arrayMode ? undefined : "")}
      ];
      replace = isArray(config.replace) ? config.replace : [];
      if (isString(squash)) replace.push({ from: squash, to: undefined });
      configuredKeys = map(replace, prop("from"));
      return filter(defaultPolicy, item => configuredKeys.indexOf(item.from) === -1).concat(replace);
    }

    extend(this, {id, type, location, squash, replace, isOptional, dynamic, config, array: arrayMode});
  }

  isDefaultValue(value: any): boolean {
    return this.isOptional && this.type.equals(this.value(), value);
  }

  /**
   * [Internal] Gets the decoded representation of a value if the value is defined, otherwise, returns the
   * default value, which may be the result of an injectable function.
   */
  value(value?: any): any {
    /**
     * [Internal] Get the default value of a parameter, which may be an injectable function.
     */
    const $$getDefaultValue = () => {
      if (!services.$injector) throw new Error("Injectable functions cannot be called at configuration time");
      var defaultValue = services.$injector.invoke(this.config.$$fn);
      if (defaultValue !== null && defaultValue !== undefined && !this.type.is(defaultValue))
        throw new Error(`Default value (${defaultValue}) for parameter '${this.id}' is not an instance of Type (${this.type.name})`);
      return defaultValue;
    };

    const $replace = (value) => {
      var replacement: any = map(filter(this.replace, propEq('from', value)), prop("to"));
      return replacement.length ? replacement[0] : value;
    };

    value = $replace(value);
    return !isDefined(value) ? $$getDefaultValue() : this.type.$normalize(value);
  }

  isSearch(): boolean {
    return this.location === DefType.SEARCH;
  }

  validates(value: any): boolean {
    // There was no parameter value, but the param is optional
    if ((!isDefined(value) || value === null) && this.isOptional) return true;

    // The value was not of the correct Type, and could not be decoded to the correct Type
    const normalized = this.type.$normalize(value);
    if (!this.type.is(normalized)) return false;

    // The value was of the correct type, but when encoded, did not match the Type's regexp
    const encoded = this.type.encode(normalized);
    if (isString(encoded) && !this.type.pattern.exec(<string> encoded)) return false;

    return true;
  }

  toString() {
    return `{Param:${this.id} ${this.type} squash: '${this.squash}' optional: ${this.isOptional}}`;
  }

  static fromConfig(id: string, type: Type, config: any): Param {
    return new Param(id, type, config, DefType.CONFIG);
  }

  static fromPath(id: string, type: Type, config: any): Param {
    return new Param(id, type, config, DefType.PATH);
  }

  static fromSearch(id: string, type: Type, config: any): Param {
    return new Param(id, type, config, DefType.SEARCH);
  }

  static values(params: Param[], values): RawParams {
    values = values || {};
    return <RawParams> params.map(param => [param.id, param.value(values[param.id])]).reduce(applyPairs, {});
  }

  static equals(params: Param[], values1, values2): boolean {
    values1 = values1 || {};
    values2 = values2 || {};
    return params.map(param => param.type.equals(values1[param.id], values2[param.id])).indexOf(false) === -1;
  }

  static validates(params: Param[], values): boolean {
    values = values || {};
    return params.map(param => param.validates(values[param.id])).indexOf(false) === -1;
  }
}