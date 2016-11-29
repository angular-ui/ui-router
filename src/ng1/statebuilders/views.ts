/** @module ng1 */ /** */
import { ng as angular } from "../../angular";
import {
    State, pick, forEach, anyTrueR, tail, extend,
    isArray, isInjectable, isDefined, isString, services, trace,
    ViewConfig, ViewService, ViewConfigFactory, PathNode, ResolveContext, Resolvable, RawParams, IInjectable
} from "ui-router-core";
import { Ng1ViewDeclaration } from "../interface";
import { TemplateFactory } from "../templateFactory";
import IInjectorService = angular.auto.IInjectorService;

export const ng1ViewConfigFactory: ViewConfigFactory = (path, view) =>
    [new Ng1ViewConfig(path, view)];

const hasAnyKey = (keys, obj) =>
    keys.reduce((acc, key) => acc || isDefined(obj[key]), false);

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
  // Do not process root state
  if (!state.parent) return {};

  let tplKeys = ['templateProvider', 'templateUrl', 'template', 'notify', 'async'],
      ctrlKeys = ['controller', 'controllerProvider', 'controllerAs', 'resolveAs'],
      compKeys = ['component', 'bindings', 'componentProvider'],
      nonCompKeys = tplKeys.concat(ctrlKeys),
      allKeys = compKeys.concat(nonCompKeys);

  let views: { [key: string]: Ng1ViewDeclaration } = {},
      viewsObject = state.views || { "$default": pick(state, allKeys) };

  forEach(viewsObject, function (config: Ng1ViewDeclaration, name: string) {
    // Account for views: { "": { template... } }
    name = name || "$default";
    // Account for views: { header: "headerComponent" }
    if (isString(config)) config = { component: <string> config };

    if (hasAnyKey(compKeys, config) && hasAnyKey(nonCompKeys, config)) {
      throw new Error(`Cannot combine: ${compKeys.join("|")} with: ${nonCompKeys.join("|")} in stateview: '${name}@${state.name}'`);
    }

    config.resolveAs = config.resolveAs || '$resolve';
    config.$type = "ng1";
    config.$context = state;
    config.$name = name;

    let normalized = ViewService.normalizeUIViewTarget(config.$context, config.$name);
    config.$uiViewName = normalized.uiViewName;
    config.$uiViewContextAnchor = normalized.uiViewContextAnchor;

    views[name] = config;
  });
  return views;
}

let id = 0;
export class Ng1ViewConfig implements ViewConfig {
  $id = id++;
  loaded: boolean = false;
  controller: Function; // actually IInjectable|string
  template: string;
  locals: any; // TODO: delete me

  constructor(public path: PathNode[], public viewDecl: Ng1ViewDeclaration) {
  }

  load() {
    let $q = services.$q;
    let context = new ResolveContext(this.path);
    let params = this.path.reduce((acc, node) => extend(acc, node.paramValues), {});

    let promises: any = {
      template: $q.when(this.getTemplate(params, new TemplateFactory(), context)),
      controller: $q.when(this.getController(context))
    };

    return $q.all(promises).then((results) => {
      trace.traceViewServiceEvent("Loaded", this);
      this.controller = results.controller;
      this.template = results.template;
      return this;
    });
  }

  /**
   * Checks a view configuration to ensure that it specifies a template.
   *
   * @return {boolean} Returns `true` if the configuration contains a valid template, otherwise `false`.
   */
  hasTemplate() {
    var templateKeys = ['template', 'templateUrl', 'templateProvider', 'component', 'componentProvider'];
    return hasAnyKey(templateKeys, this.viewDecl);
  }

  getTemplate(params: RawParams, $factory: TemplateFactory, context: ResolveContext) {
    return $factory.fromConfig(this.viewDecl, params, context);
  }

  /**
   * Gets the controller for a view configuration.
   *
   * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
   */
  getController(context: ResolveContext): (IInjectable|string|Promise<IInjectable|string>) {
    let provider = this.viewDecl.controllerProvider;
    if (!isInjectable(provider)) return this.viewDecl.controller;
    let deps = services.$injector.annotate(provider);
    let providerFn = isArray(provider) ? tail(<any> provider) : provider;
    let resolvable = new Resolvable("", <any> providerFn, deps);
    return resolvable.get(context);
  }
}
