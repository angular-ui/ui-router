/** @module state */ /** for typedoc */
import {isString} from "../common/predicates";
import {StateOrName} from "./interface";
import {State} from "./stateObject";
import {Glob} from "../common/glob";
import {values} from "../common/common";

export class StateMatcher {
  constructor (private _states: { [key: string]: State }) { }
  
  isRelative(stateName: string) {
    stateName = stateName || "";
    return stateName.indexOf(".") === 0 || stateName.indexOf("^") === 0;
  }


  find(stateOrName: StateOrName, base?: StateOrName): State {
    if (!stateOrName && stateOrName !== "") return undefined;
    let isStr = isString(stateOrName);
    let name: string = isStr ? stateOrName : (<any>stateOrName).name;

    if (this.isRelative(name)) name = this.resolvePath(name, base);
    let state = this._states[name];

    if (state && (isStr || (!isStr && (state === stateOrName || state.self === stateOrName)))) {
      return state;
    } else if (isStr) {
      let matches = values(this._states)
          .map(state => ({ state, glob: new Glob(state.name)}))
          .filter(({state, glob}) => glob.matches(name))
          .map(({state, glob}) => state);

      if (matches.length > 1) {
        console.log(`stateMatcher.find: Found multiple matches for ${name} using glob: `, matches.map(match => match.name));
      }
      return matches[0];
    }
    return undefined;
  }

  resolvePath(name: string, base: StateOrName) {
    if (!base) throw new Error(`No reference point given for path '${name}'`);
    
    let baseState: State = this.find(base);

    let splitName = name.split("."), i = 0, pathLength = splitName.length, current = baseState;

    for (; i < pathLength; i++) {
      if (splitName[i] === "" && i === 0) {
        current = baseState;
        continue;
      }
      if (splitName[i] === "^") {
        if (!current.parent) throw new Error(`Path '${name}' not valid for state '${baseState.name}'`);
        current = current.parent;
        continue;
      }
      break;
    }
    let relName = splitName.slice(i).join(".");
    return current.name + (current.name && relName ? "." : "") + relName;
  }
}
