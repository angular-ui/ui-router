/** @module params */ /** for typedoc */
import {fromJson, toJson, identity, equals, inherit, map, extend} from "../common/common";
import {isDefined} from "../common/predicates";
import {is, val} from "../common/hof";
import {services} from "../common/coreservices";
import {Type} from "./type";

// Use tildes to pre-encode slashes.
// If the slashes are simply URLEncoded, the browser can choose to pre-decode them,
// and bidirectional encoding/decoding fails.
// Tilde was chosen because it's not a RFC 3986 section 2.2 Reserved Character
function valToString(val) { return val != null ? val.toString().replace(/~/g, "~~").replace(/\//g, "~2F") : val; }
function valFromString(val) { return val != null ? val.toString().replace(/~2F/g, "/").replace(/~~/g, "~") : val; }

export class ParamTypes {
  types: any;
  enqueue: boolean = true;
  typeQueue: any[] = [];

  private defaultTypes: any = {
    "hash": {
      encode: valToString,
      decode: valFromString,
      is: is(String),
      pattern: /.*/,
      equals: val(true)
    },
    "string": {
      encode: valToString,
      decode: valFromString,
      is: is(String),
      pattern: /[^/]*/
    },
    "int": {
      encode: valToString,
      decode(val) { return parseInt(val, 10); },
      is(val) { return isDefined(val) && this.decode(val.toString()) === val; },
      pattern: /-?\d+/
    },
    "bool": {
      encode: val => val && 1 || 0,
      decode: val => parseInt(val, 10) !== 0,
      is: is(Boolean),
      pattern: /0|1/
    },
    "date": {
      encode(val) {
        return !this.is(val) ? undefined : [
          val.getFullYear(),
          ('0' + (val.getMonth() + 1)).slice(-2),
          ('0' + val.getDate()).slice(-2)
        ].join("-");
      },
      decode(val) {
        if (this.is(val)) return val;
        let match = this.capture.exec(val);
        return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
      },
      is: (val) => val instanceof Date && !isNaN(val.valueOf()),
      equals(l, r) {
        return ['getFullYear', 'getMonth', 'getDate']
            .reduce((acc, fn) => acc && l[fn]() === r[fn](), true)
      },
      pattern: /[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,
      capture: /([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
    },
    "json": {
      encode: toJson,
      decode: fromJson,
      is: is(Object),
      equals: equals,
      pattern: /[^/]*/
    },
    "any": { // does not encode/decode
      encode: identity,
      decode: identity,
      equals: equals,
      pattern: /.*/
    }
  };

  constructor() {
    // Register default types. Store them in the prototype of this.types.
    const makeType = (definition, name) => new Type(extend({ name }, definition));
    this.types = inherit(map(this.defaultTypes, makeType), {});
  }

  type(name, definition?: any, definitionFn?: Function) {
    if (!isDefined(definition)) return this.types[name];
    if (this.types.hasOwnProperty(name)) throw new Error(`A type named '${name}' has already been defined.`);

    this.types[name] = new Type(extend({ name }, definition));

    if (definitionFn) {
      this.typeQueue.push({ name, def: definitionFn });
      if (!this.enqueue) this._flushTypeQueue();
    }
    return this;
  }

  _flushTypeQueue() {
    while (this.typeQueue.length) {
      let type = this.typeQueue.shift();
      if (type.pattern) throw new Error("You cannot override a type's .pattern at runtime.");
      extend(this.types[type.name], services.$injector.invoke(type.def));
    }
  }
}

export let paramTypes = new ParamTypes();
