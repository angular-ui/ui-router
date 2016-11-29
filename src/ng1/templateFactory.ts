import { ng as angular } from "../angular";
/** @module view */ /** for typedoc */
import {
    isArray, isDefined, isFunction, isObject, services, Obj, IInjectable, tail, kebobString, unnestR, ResolveContext, Resolvable, RawParams
} from "ui-router-core";
import { Ng1ViewDeclaration } from "./interface";

/**
 * Service which manages loading of templates from a ViewConfig.
 */
export class TemplateFactory {
  /**
   * Creates a template from a configuration object.
   *
   * @param config Configuration object for which to load a template.
   * The following properties are search in the specified order, and the first one 
   * that is defined is used to create the template:
   *
   * @param params  Parameters to pass to the template function.
   * @param context The resolve context associated with the template's view
   *
   * @return {string|object}  The template html as a string, or a promise for 
   * that string,or `null` if no template is configured.
   */
  fromConfig(config: Ng1ViewDeclaration, params: any, context: ResolveContext) {
    const defaultTemplate = "<ui-view></ui-view>";

    return (
      isDefined(config.template) ? this.fromString(config.template, params) :
      isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
      isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, context) :
      isDefined(config.component) ? this.fromComponent(config.component, config.bindings) :
      isDefined(config.componentProvider) ? this.fromComponentProvider(config.componentProvider, params, context) :
      defaultTemplate
    );
  };

  /**
   * Creates a template from a string or a function returning a string.
   *
   * @param template html template as a string or function that returns an html template as a string.
   * @param params Parameters to pass to the template function.
   *
   * @return {string|object} The template html as a string, or a promise for that 
   * string.
   */
  fromString(template: (string|Function), params?: RawParams) {
    return isFunction(template) ? (<any> template)(params) : template;
  };

  /**
   * Loads a template from the a URL via `$http` and `$templateCache`.
   *
   * @param {string|Function} url url of the template to load, or a function 
   * that returns a url.
   * @param {Object} params Parameters to pass to the url function.
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  fromUrl(url: (string|Function), params: any) {
    if (isFunction(url)) url = (<any> url)(params);
    if (url == null) return null;
    return services.template.get(<string> url);
  };

  /**
   * Creates a template by invoking an injectable provider function.
   *
   * @param provider Function to invoke via `locals`
   * @param {Function} injectFn a function used to invoke the template provider
   * @return {string|Promise.<string>} The template html as a string, or a promise 
   * for that string.
   */
  fromProvider(provider: IInjectable, params: any, context: ResolveContext) {
    let deps = services.$injector.annotate(provider);
    let providerFn = isArray(provider) ? tail(<any[]> provider) : provider;
    let resolvable = new Resolvable("", <Function> providerFn, deps);
    return resolvable.get(context);
  };

  /**
   * Creates a template from a component's name
   *
   * @param component {string} Component's name in camel case.
   * @param bindings An object defining the component's bindings: {foo: '<'}
   * @return {string} The template as a string: "<component-name input1='::$resolve.foo'></component-name>".
   */
  fromComponent(component: string, bindings?: any) {
    const resolveFor = (key: string) =>
        bindings && bindings[key] || key;
    // Bind once prefix
    const prefix = angular.version.minor >= 3 ? "::" : "";
    const attributeTpl = (input: BindingTuple) => {
      var attrName = kebobString(input.name);
      var resolveName = resolveFor(input.name);
      if (input.type === '@')
        return `${attrName}='{{${prefix}$resolve.${resolveName}}}'`;
      return `${attrName}='${prefix}$resolve.${resolveName}'`;
    };

    let attrs = getComponentInputs(component).map(attributeTpl).join(" ");
    let kebobName = kebobString(component);
    return `<${kebobName} ${attrs}></${kebobName}>`;
  };

  /**
   * Creates a component's template by invoking an injectable provider function.
   *
   * @param provider Function to invoke via `locals`
   * @param {Function} injectFn a function used to invoke the template provider
   * @return {string} The template html as a string: "<component-name input1='::$resolve.foo'></component-name>".
   */
  fromComponentProvider(provider: IInjectable, params: any, context: ResolveContext) {
    let deps = services.$injector.annotate(provider);
    let providerFn = isArray(provider) ? tail(<any[]> provider) : provider;
    let resolvable = new Resolvable("", <Function> providerFn, deps);
    return resolvable.get(context).then((componentName) => {
      return this.fromComponent(componentName);
    });
  };
}

// Gets all the directive(s)' inputs ('@', '=', and '<')
function getComponentInputs(name: string) {
  let cmpDefs = <any[]> services.$injector.get(name + "Directive"); // could be multiple
  if (!cmpDefs || !cmpDefs.length) throw new Error(`Unable to find component named '${name}'`);
  return cmpDefs.map(getBindings).reduce(unnestR, []);
}

// Given a directive definition, find its object input attributes
// Use different properties, depending on the type of directive (component, bindToController, normal)
const getBindings = (def: any) => {
  if (isObject(def.bindToController)) return scopeBindings(def.bindToController);
  return scopeBindings(def.scope);
};

interface BindingTuple {
  name: string;
  type: string;
}

// for ng 1.2 style, process the scope: { input: "=foo" }
// for ng 1.3 through ng 1.5, process the component's bindToController: { input: "=foo" } object
const scopeBindings = (bindingsObj: Obj) => Object.keys(bindingsObj || {})
    // [ 'input', [ '=foo', '=', 'foo' ] ]
    .map(key => [key, /^([=<@])[?]?(.*)/.exec(bindingsObj[key])])
    // skip malformed values
    .filter(tuple => isDefined(tuple) && isArray(tuple[1]))
    // { name: ('foo' || 'input'), type: '=' }
    .map(tuple => ({ name: tuple[1][2] || tuple[0], type: tuple[1][1] } as BindingTuple));

