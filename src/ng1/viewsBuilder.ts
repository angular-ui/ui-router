/** @module ng1 */ /** */
import {State} from "../state/stateObject";
import {pick, forEach} from "../common/common";
import {ViewConfig, ViewContext} from "../view/interface";
import {Ng1ViewDeclaration} from "./interface";
import {ViewService} from "../view/view";
import {isInjectable} from "../common/predicates";
import {services} from "../common/coreservices";
import {trace} from "../common/trace";
import {Node} from "../path/node";
import {TemplateFactory} from "../view/templateFactory";
import {ResolveContext} from "../resolve/resolveContext";

export const ng1ViewConfigFactory = (node, view) => new Ng1ViewConfig(node, view);

/**
 * This is a [[StateBuilder.builder]] function for angular1 `views`.
 *
 * When the [[StateBuilder]] builds a [[State]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to angular-ui-router (ng1).
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object
 * and applies the state-level configuration to a view named `$default`.
 */
export function ng1ViewsBuilder(state: State) {
  let tplKeys = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'],
      ctrlKeys = ['component', 'controller', 'controllerProvider', 'controllerAs', 'resolveAs'],
      allKeys = tplKeys.concat(ctrlKeys);

  let views = {}, viewsObject = state.views || {"$default": pick(state, allKeys)};

  forEach(viewsObject, function (config: Ng1ViewDeclaration, name) {
    name = name || "$default"; // Account for views: { "": { template... } }
    // Allow controller settings to be defined at the state level for all views
    forEach(ctrlKeys, (key) => {
      if (state[key] && !config[key]) config[key] = state[key];
    });
    if (!Object.keys(config).length) return;

    config.resolveAs = config.resolveAs || '$resolve';
    config.$type = "ng1";
    config.$context = state;
    config.$name = name;

    let normalized = ViewService.normalizeUiViewTarget(config.$context, config.$name);
    config.$uiViewName = normalized.uiViewName;
    config.$uiViewContextAnchor = normalized.uiViewContextAnchor;

    views[name] = config;
  });
  return views;
}

export class Ng1ViewConfig implements ViewConfig {
  loaded: boolean = false;
  controller: Function;
  template: string;
  locals: any; // TODO: delete me

  constructor(public node: Node, public viewDecl: Ng1ViewDeclaration) { }
  get context(): ViewContext { return this.viewDecl.$context; }
  get controllerAs() { return this.viewDecl.controllerAs; }
  get resolveAs() { return this.viewDecl.resolveAs; }

  load() {
    let $q = services.$q;
    if (!this.hasTemplate())
      throw new Error(`No template configuration specified for '${this.viewDecl.$uiViewName}@${this.viewDecl.$uiViewContextAnchor}'`);

    let injector = this.node.resolveContext;
    let params = this.node.paramValues;
    let promises: any = {
      template: $q.when(this.getTemplate(params, new TemplateFactory(), injector)),
      controller: $q.when(this.getController(injector))
    };

    return $q.all(promises).then((results) => {
      trace.traceViewServiceEvent("Loaded", this);
      this.controller = results.controller;
      this.template = results.template;
    });
  }

  /**
   * Checks a view configuration to ensure that it specifies a template.
   *
   * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
   */
  hasTemplate() {
    return !!(this.viewDecl.template || this.viewDecl.templateUrl || this.viewDecl.templateProvider);
  }

  getTemplate(params, $factory, injector: ResolveContext) {
    return $factory.fromConfig(this.viewDecl, params, injector.invokeLater.bind(injector));
  }

  /**
   * Gets the controller for a view configuration.
   *
   * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
   */
  getController(injector: ResolveContext) {
    //* @param {Object} locals A context object from transition.context() to invoke a function in the correct context
    let provider = this.viewDecl.controllerProvider;
    return isInjectable(provider) ? injector.invokeLater(provider, {}) : this.viewDecl.controller;
  }
}
