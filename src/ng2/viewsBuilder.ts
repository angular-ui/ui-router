/** @module ng2 */ /** */
import {State} from "../state/stateObject";
import {Node} from "../path/node";
import {pick, forEach} from "../common/common";
import {ViewConfig} from "../view/interface";
import {Ng2ViewDeclaration} from "./interface";
import {services} from "../common/coreservices";
import {ViewService} from "../view/view";

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
    if (Object.keys(config).length == 0) return;

    config.$type = "ng2";
    config.$context = state;
    config.$name = name;

    let normalized = ViewService.normalizeUiViewTarget(config.$context, config.$name);
    config.$uiViewName = normalized.uiViewName;
    config.$uiViewContextAnchor = normalized.uiViewContextAnchor;

    views[name] = config;
  });
  return views;
}

export class Ng2ViewConfig implements ViewConfig {
  loaded: boolean = true;

  constructor(public node: Node, public viewDecl: Ng2ViewDeclaration) { }

  load() {
    return services.$q.when(this);
  }
}
