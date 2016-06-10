import {pick, extend, forEach, omit} from "../src/core";

let stateProps = ["resolve", "resolvePolicy", "data", "template", "templateUrl", "url", "name", "params"];

export function tree2Array(tree, inheritName) {

  function processState(parent, state, name) {
    var substates = omit.apply(null, [state].concat(stateProps));
    var thisState = pick.apply(null, [state].concat(stateProps));
    thisState = extend(thisState, {name: name, parent: parent});

    return [thisState].concat(processChildren(thisState, substates));
  }

  function processChildren(parent, substates) {
    let states = [];
    forEach(substates, function (value, key) {
      if (inheritName && parent.name) key = `${parent.name}.${key}`;
      states = states.concat(processState(parent, value, key));
    });
    return states;
  }

  return processChildren("", tree);
}


