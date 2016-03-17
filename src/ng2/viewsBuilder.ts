import {State} from "../state/stateObject";
import {pick, forEach} from "../common/common";

/**
 * This is a [[StateBuilder.builder]] function for angular2 `views`.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to ui-router-ng2.
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object and
 * applies the state-level configuration to a view named `$default`.
 */
export function ng2ViewsBuilder(state: State) {
  let views = {}, viewsObject = state.views || {"$default": pick(state, "component")};

  forEach(viewsObject, function (config, name) {
    name = name || "$default"; // Account for views: { "": { template... } }
    if (Object.keys(config).length > 1) views[name] = config;
  });
  return views;
}
