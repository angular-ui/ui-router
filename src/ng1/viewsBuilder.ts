/** @module ng1 */ /** */
import {State} from "../state/stateObject";
import {pick, forEach, anyTrueR, unnestR} from "../common/common";
import {kebobString} from "../common/strings";
import {ViewConfig} from "../view/interface";
import {Ng1ViewDeclaration} from "./interface";
import {ViewService} from "../view/view";
import {isInjectable, isDefined, isString, isObject} from "../common/predicates";
import {services} from "../common/coreservices";
import {trace} from "../common/trace";
import {Node} from "../path/node";
import {TemplateFactory} from "./templateFactory";
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
      ctrlKeys = ['controller', 'controllerProvider', 'controllerAs', 'resolveAs'],
      compKeys = ['component', 'bindings'],
      nonCompKeys = tplKeys.concat(ctrlKeys),
      allKeys = compKeys.concat(nonCompKeys);

  let views = {}, viewsObject = state.views || {"$default": pick(state, allKeys)};

  forEach(viewsObject, function (config: Ng1ViewDeclaration, name) {
    // Account for views: { "": { template... } }
    name = name || "$default";
    // Account for views: { header: "headerComponent" }
    if (isString(config)) config = { component: <string> config };
    if (!Object.keys(config).length) return;

    // Configure this view for routing to an angular 1.5+ style .component (or any directive, really)
    if (config.component) {
      if (nonCompKeys.map(key => isDefined(config[key])).reduce(anyTrueR, false)) {
        throw new Error(`Cannot combine: ${compKeys.join("|")} with: ${nonCompKeys.join("|")} in stateview: 'name@${state.name}'`);
      }

      // Dynamically build a template like "<component-name input1='$resolve.foo'></component-name>"
      config.templateProvider = ['$injector', function($injector) {
        const resolveFor = key => config.bindings && config.bindings[key] || key;
        const prefix = angular.version.minor >= 3 ? "::" : "";
        let attrs = getComponentInputs($injector, config.component).map(key => `${kebobString(key)}='${prefix}$resolve.${resolveFor(key)}'`).join(" ");
        let kebobName = kebobString(config.component);
        return `<${kebobName} ${attrs}></${kebobName}>`;
      }];
    }

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

// for ng 1.2 style, process the scope: { input: "=foo" } object
const scopeBindings = bindingsObj => Object.keys(bindingsObj || {})
      .map(key => [key, /^[=<](.*)/.exec(bindingsObj[key])])
      .filter(tuple => isDefined(tuple[1]))
      .map(tuple => tuple[1][1] || tuple[0]);

// for ng 1.3+ bindToController or 1.5 component style, process a $$bindings object
const bindToCtrlBindings = bindingsObj => Object.keys(bindingsObj || {})
      .filter(key => !!/[=<]/.exec(bindingsObj[key].mode))
      .map(key => bindingsObj[key].attrName);

// Given a directive definition, find its object input attributes
// Use different properties, depending on the type of directive (component, bindToController, normal)
const getBindings = def => {
  if (isObject(def.bindToController)) return scopeBindings(def.bindToController);
  if (def.$$bindings && def.$$bindings.bindToController) return bindToCtrlBindings(def.$$bindings.bindToController);
  if (def.$$isolateBindings) return bindToCtrlBindings(def.$$isolateBindings);
  return <any> scopeBindings(def.scope);
};

// Gets all the directive(s)' inputs ('=' and '<')
function getComponentInputs($injector, name) {
  let cmpDefs = $injector.get(name + "Directive"); // could be multiple
  if (!cmpDefs || !cmpDefs.length) throw new Error(`Unable to find component named '${name}'`);
  return cmpDefs.map(getBindings).reduce(unnestR, []);
}

export class Ng1ViewConfig implements ViewConfig {
  loaded: boolean = false;
  controller: Function;
  template: string;
  locals: any; // TODO: delete me

  constructor(public node: Node, public viewDecl: Ng1ViewDeclaration) { }

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
