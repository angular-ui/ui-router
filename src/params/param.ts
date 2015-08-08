import {isInjectable, extend, isDefined, isString, isArray, filter, map, prop, indexOf} from "../common/common";
import {runtime} from "../common/angular1";
import matcherConfig from "../url/urlMatcherConfig";
import paramTypes from "./paramTypes";
import Type from "./type";

export default class Param {
  id: string;
  type: Type;
  location: string;
  array: boolean;
  squash: (boolean|string);
  replace: any;
  isOptional: boolean;
  dynamic: boolean;
  config: any;

  constructor(id, type, config, location) {
    config = unwrapShorthand(config);
    type = getType(config, type, location);
    var arrayMode = getArrayMode();
    type = arrayMode ? type.$asArray(arrayMode, location === "search") : type;
    var isOptional = config.value !== undefined;
    var dynamic = config.dynamic === true;
    var squash = getSquashPolicy(config, isOptional);
    var replace = getReplace(config, arrayMode, isOptional, squash);

    function unwrapShorthand(config) {
      var configKeys = ["value", "type", "squash", "array", "dynamic"].filter(function (key) {
        return (config || {}).hasOwnProperty(key);
      });
      var isShorthand = configKeys.length === 0;
      if (isShorthand) config = {value: config};
      config.$$fn = isInjectable(config.value) ? config.value : function () {
        return config.value;
      };
      return config;
    }

    function getType(config, urlType, location) {
      if (config.type && urlType) throw new Error(`Param '${id}' has two type configurations.`);
      if (urlType) return urlType;
      if (!config.type) return (location === "config" ? paramTypes.type("any") : paramTypes.type("string"));
      return config.type instanceof Type ? config.type : paramTypes.type(config.type);
    }

    // array config: param name (param[]) overrides default settings.  explicit config overrides param name.
    function getArrayMode() {
      var arrayDefaults = {array: (location === "search" ? "auto" : false)};
      var arrayParamNomenclature = id.match(/\[\]$/) ? {array: true} : {};
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
      throw new Error("Invalid squash policy: '" + squash + "'. Valid policies: false, true, or arbitrary string");
    }

    function getReplace(config, arrayMode, isOptional, squash) {
      var replace, configuredKeys, defaultPolicy = [
        {from: "", to: (isOptional || arrayMode ? undefined : "")},
        {from: null, to: (isOptional || arrayMode ? undefined : "")}
      ];
      replace = isArray(config.replace) ? config.replace : [];
      if (isString(squash))
        replace.push({from: squash, to: undefined});
      configuredKeys = map(replace, prop("from"));
      return filter(defaultPolicy, function (item) {
        return indexOf(configuredKeys, item.from) === -1;
      }).concat(replace);
    }

    extend(this, {
      id: id,
      type: type,
      location: location,
      array: arrayMode,
      squash: squash,
      replace: replace,
      isOptional: isOptional,
      dynamic: dynamic,
      config: config
    });
  }

  /**
   * [Internal] Gets the decoded representation of a value if the value is defined, otherwise, returns the
   * default value, which may be the result of an injectable function.
   */
  value(value?: any) {
    /**
     * [Internal] Get the default value of a parameter, which may be an injectable function.
     */
    const $$getDefaultValue = () => {
      if (!runtime.$injector) throw new Error("Injectable functions cannot be called at configuration time");
      var defaultValue = runtime.$injector.invoke(this.config.$$fn);
      if (defaultValue !== null && defaultValue !== undefined && !this.type.is(defaultValue))
        throw new Error(`Default value (${defaultValue}) for parameter '${this.id}' is not an instance of Type (${this.type.name})`);
      return defaultValue;
    };

    function hasReplaceVal(val) { return function(obj) { return obj.from === val; }; }
    const $replace = (value) => {
      var replacement: any = map(filter(this.replace, hasReplaceVal(value)), prop("to"));
      return replacement.length ? replacement[0] : value;
    };
    value = $replace(value);
    return !isDefined(value) ? $$getDefaultValue() : this.type.$normalize(value);
  }

  toString() { return `{Param:${this.id} ${this.type} squash: '${this.squash}' optional: ${this.isOptional}}`; }

}
