/** @module params */ /** for typedoc */
import {fromJson, toJson, identity, equals, inherit, map, extend} from "../common/common";
import {isDefined} from "../common/predicates";
import {is, val} from "../common/hof";
import {services} from "../common/coreservices";
import {ParamType} from "./type";
import {ParamTypeDefinition} from "./interface";

// Use tildes to pre-encode slashes.
// If the slashes are simply URLEncoded, the browser can choose to pre-decode them,
// and bidirectional encoding/decoding fails.
// Tilde was chosen because it's not a RFC 3986 section 2.2 Reserved Character
function valToString(val: any) { return val != null ? val.toString().replace(/~/g, "~~").replace(/\//g, "~2F") : val; }
function valFromString(val: string) { return val != null ? val.toString().replace(/~2F/g, "/").replace(/~~/g, "~") : val; }

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
      equals: (a: any, b: any) => a == b // allow coersion for null/undefined/""
    },
    "string": {
      encode: valToString,
      decode: valFromString,
      is: is(String),
      pattern: /[^/]*/
    },
    "int": {
      encode: valToString,
      decode(val: string) { return parseInt(val, 10); },
      is(val: any) { return isDefined(val) && this.decode(val.toString()) === val; },
      pattern: /-?\d+/
    },
    "bool": {
      encode: (val: any) => val && 1 || 0,
      decode: (val: string) => parseInt(val, 10) !== 0,
      is: is(Boolean),
      pattern: /0|1/
    },
    "date": {
      encode(val: any) {
        return !this.is(val) ? undefined : [
          val.getFullYear(),
          ('0' + (val.getMonth() + 1)).slice(-2),
          ('0' + val.getDate()).slice(-2)
        ].join("-");
      },
      decode(val: string) {
        if (this.is(val)) return <any> val as Date;
        let match = this.capture.exec(val);
        return match ? new Date(match[1], match[2] - 1, match[3]) : undefined;
      },
      is: (val: any) => val instanceof Date && !isNaN(val.valueOf()),
      equals(l: any, r: any) {
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
    const makeType = (definition: ParamTypeDefinition, name: string) => new ParamType(extend({ name }, definition));
    this.types = inherit(map(this.defaultTypes, makeType), {});
  }

  type(name: string, definition?: ParamTypeDefinition, definitionFn?: () => ParamTypeDefinition) {
    if (!isDefined(definition)) return this.types[name];
    if (this.types.hasOwnProperty(name)) throw new Error(`A type named '${name}' has already been defined.`);

    this.types[name] = new ParamType(extend({ name }, definition));

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
