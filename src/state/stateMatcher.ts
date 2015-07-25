import {extend, isString} from "../common/common"
import StateReference from "./stateReference"

export default function StateMatcher(states) {
  extend(this, {
    isRelative: function(stateName) {
      stateName = stateName || "";
      return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
    },

    find: function(stateOrName, base) {
      if (!stateOrName && stateOrName !== "") return undefined;
      var isStr = isString(stateOrName), name = isStr ? stateOrName : stateOrName.name;

      if (this.isRelative(name)) name = this.resolvePath(name, base);
      var state = states[name];

      if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
        return state;
      }
      return undefined;
    },

    reference: function(identifier, base, params) {
      return new StateReference(identifier, this.find(identifier, base), params, base);
    },

    resolvePath: function(name, base) {
      if (!base) throw new Error(`No reference point given for path '${name}'`);
      base = this.find(base);

      var rel = name.split("."), i = 0, pathLength = rel.length, current = base;

      for (; i < pathLength; i++) {
        if (rel[i] === "" && i === 0) {
          current = base;
          continue;
        }
        if (rel[i] === "^") {
          if (!current.parent) throw new Error(`Path '${name}' not valid for state '${base.name}'`);
          current = current.parent;
          continue;
        }
        break;
      }
      rel = rel.slice(i).join(".");
      return current.name + (current.name && rel ? "." : "") + rel;
    }
  });
}
