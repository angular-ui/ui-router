import {extend, inherit, forEach, objectKeys, indexOf, isString} from "./common";

export class ParamSet {
  constructor(params?: any) {
    extend(this, params || {});
  }

  $$new(params) {
    return inherit(this, extend(new ParamSet(), { $$parent: this}, params || {}));
  }

  $$keys() {
    var keys = [], chain = [], parent = this,
        ignore = ['$$parent'].concat(objectKeys(ParamSet.prototype));
    while (parent) { chain.push(parent); parent = parent.$$parent; }
    chain.reverse();
    forEach(chain, function(paramset) {
      forEach(objectKeys(paramset), function(key) {
        if (indexOf(keys, key) === -1 && indexOf(ignore, key) === -1) keys.push(key);
      });
    });
    return keys;
  }

  $$values(paramValues) {
    var values = {};
    forEach(this.$$keys(), key => {
      values[key] = this[key].value(paramValues && paramValues[key]);
    });
    return values;
  }

  $$equals(paramValues1, paramValues2) {
    var equal = true, self = this;
    forEach(self.$$keys(), function(key) {
      var left = paramValues1 && paramValues1[key], right = paramValues2 && paramValues2[key];
      if (!self[key].type.equals(left, right)) equal = false;
    });
    return equal;
  }

  $$validates(paramValues) {
    var keys = this.$$keys(), i, param, rawVal, normalized, encoded;
    paramValues = paramValues || {};
    for (i = 0; i < keys.length; i++) {
      param = this[keys[i]];
      rawVal = paramValues[keys[i]];
      if ((rawVal === undefined || rawVal === null) && param.isOptional)
        continue; // There was no parameter value, but the param is optional
      normalized = param.type.$normalize(rawVal);
      if (!param.type.is(normalized))
        return false; // The value was not of the correct Type, and could not be decoded to the correct Type
      encoded = param.type.encode(normalized);
      if (isString(encoded) && !param.type.pattern.exec(encoded))
        return false; // The value was of the correct type, but when encoded, did not match the Type's regexp
    }
    return true;
  }

  $$filter(filterFn) {
    var self = this, subset = new ParamSet();
    forEach(this.$$keys(), function(key) {
      if (filterFn(self[key]))
        subset[key] = self[key];
    });
    return subset;
  }

  $$parent: any = undefined
}
