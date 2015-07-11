import {isDefined, fromJson, toJson, isObject, identity, equals, inherit, map, extend} from "../common/common";
import {Type} from "./type";
import {runtime} from "../common/angular1";

function valToString(val) { return val != null ? val.toString().replace(/\//g, "%2F") : val; }
function valFromString(val) { return val != null ? val.toString().replace(/%2F/g, "/") : val; }

class ParamTypes {
  types: any;
  enqueue: boolean = true;
  typeQueue: any[] = [];

  private defaultTypes:any = {
    hash: {
      encode: valToString,
      decode: valFromString,
      is: function(val) { return typeof val === "string"; },
      pattern: /.*/,
      equals: function() { return true; }
    },
    string: {
      encode: valToString,
      decode: valFromString,
      is: function(val) { return typeof val === "string"; },
      pattern: /[^/]*/
    },
    int: {
      encode: valToString,
      decode: function(val) { return parseInt(val, 10); },
      is: function(val) { return isDefined(val) && this.decode(val.toString()) === val; },
      pattern: /\d+/
    },
    bool: {
      encode: function(val) { return val ? 1 : 0; },
      decode: function(val) { return parseInt(val, 10) !== 0; },
      is: function(val) { return val === true || val === false; },
      pattern: /0|1/
    },
    date: {
      encode: function (val) {
        if (!this.is(val))
          return undefined;
        return [ val.getFullYear(),
          ('0' + (val.getMonth() + 1)).slice(-2),
          ('0' + val.getDate()).slice(-2)
        ].join("-");
      },
      decode: function (val) {
        if (this.is(val)) return val;
        var match = this.capture.exec(val);
        return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
      },
      is: function(val) { return val instanceof Date && !isNaN(val.valueOf()); },
      equals: function (a, b) { return this.is(a) && this.is(b) && a.toISOString() === b.toISOString(); },
      pattern: /[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,
      capture: /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
    },
    json: {
      encode: toJson,
      decode: fromJson,
      is: isObject,
      equals: equals,
      pattern: /[^/]*/
    },
    any: { // does not encode/decode
      encode: identity,
      decode: identity,
      equals: equals,
      pattern: /.*/
    }
  };

  constructor() {
    // Register default types. Store them in the prototype of this.types.
    const makeType = (definition, name) => new Type(extend({name: name}, definition));
    this.types = inherit(map(this.defaultTypes, makeType), {});
  }

  type(name, definition?: any, definitionFn?: Function) {
    if (!isDefined(definition)) return this.types[name];
    if (this.types.hasOwnProperty(name)) throw new Error("A type named '" + name + "' has already been defined.");

    this.types[name] = new Type(extend({ name: name }, definition));
    if (definitionFn) {
      this.typeQueue.push({ name: name, def: definitionFn });
      if (!this.enqueue) this._flushTypeQueue();
    }
    return this;
  }

  _flushTypeQueue() {
    while(this.typeQueue.length) {
      var type = this.typeQueue.shift();
      if (type.pattern) throw new Error("You cannot override a type's .pattern at runtime.");
      extend(this.types[type.name], runtime.$injector.invoke(type.def));
    }
  }
}

export var paramTypes: ParamTypes = new ParamTypes();
