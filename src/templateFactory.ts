/** @module view */
/** for typedoc */
import { ng as angular } from "./angular";
import { IAugmentedJQuery } from "angular";
import {
  isArray, isDefined, isFunction, isObject, services, Obj, IInjectable, tail, kebobString, unnestR, ResolveContext,
  Resolvable, RawParams
} from "@uirouter/core";
import { Ng1ViewDeclaration, TemplateFactoryProvider } from "./interface";

/**
 * Service which manages loading of templates from a ViewConfig.
 */
export class TemplateFactory implements TemplateFactoryProvider {
  /** @hidden */ private _useHttp = angular.version.minor < 3;
  /** @hidden */ private $templateRequest;
  /** @hidden */ private $templateCache;
  /** @hidden */ private $http;

  /** @hidden */ $get = ['$http', '$templateCache', '$injector', ($http, $templateCache, $injector) => {
    this.$templateRequest = $injector.has && $injector.has('$templateRequest') && $injector.get('$templateRequest');
    this.$http = $http;
    this.$templateCache = $templateCache;
    return this;
  }];

  /** @hidden */
  useHttpService(value: boolean) {
    this._useHttp = value;
  };

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

    const asTemplate = (result) => services.$q.when(result).then(str => ({ template: str }));
    const asComponent = (result) => services.$q.when(result).then(str => ({ component: str }));

    return (
        isDefined(config.template) ? asTemplate(this.fromString(config.template, params)) :
            isDefined(config.templateUrl) ? asTemplate(this.fromUrl(config.templateUrl, params)) :
                isDefined(config.templateProvider) ? asTemplate(this.fromProvider(config.templateProvider, params, context)) :
                    isDefined(config.component) ? asComponent(config.component) :
                        isDefined(config.componentProvider) ? asComponent(this.fromComponentProvider(config.componentProvider, params, context)) :
                            asTemplate(defaultTemplate)
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
  fromString(template: (string | Function), params?: RawParams) {
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
  fromUrl(url: (string | Function), params: any) {
    if (isFunction(url)) url = (<any> url)(params);
    if (url == null) return null;

    if (this._useHttp) {
      return this.$http.get(url, { cache: this.$templateCache, headers: { Accept: 'text/html' } })
          .then(function (response) {
            return response.data;
          });
    }

    return this.$templateRequest(url);
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
    return resolvable.get(context);
  };

  /**
   * Creates a template from a component's name
   *
   * This implements route-to-component.
   * It works by retrieving the component (directive) metadata from the injector.
   * It analyses the component's bindings, then constructs a template that instantiates the component.
   * The template wires input and output bindings to resolves or from the parent component.
   *
   * @param uiView {object} The parent ui-view (for binding outputs to callbacks)
   * @param context The ResolveContext (for binding outputs to callbacks returned from resolves)
   * @param component {string} Component's name in camel case.
   * @param bindings An object defining the component's bindings: {foo: '<'}
   * @return {string} The template as a string: "<component-name input1='::$resolve.foo'></component-name>".
   */
  makeComponentTemplate(uiView: IAugmentedJQuery, context: ResolveContext, component: string, bindings?: any) {
    bindings = bindings || {};

    // Bind once prefix
    const prefix = angular.version.minor >= 3 ? "::" : "";
    // Convert to kebob name. Add x- prefix if the string starts with `x-` or `data-`
    const kebob = (camelCase: string) => {
      const kebobed = kebobString(camelCase);
      return /^(x|data)-/.exec(kebobed) ? `x-${kebobed}` : kebobed;
    };


    const attributeTpl = (input: BindingTuple) => {
      let { name, type } = input;
      let attrName = kebob(name);
      // If the ui-view has an attribute which matches a binding on the routed component
      // then pass that attribute through to the routed component template.
      // Prefer ui-view wired mappings to resolve data, unless the resolve was explicitly bound using `bindings:`
      if (uiView.attr(attrName) && !bindings[name])
        return `${attrName}='${uiView.attr(attrName)}'`;

      let resolveName = bindings[name] || name;
      // Pre-evaluate the expression for "@" bindings by enclosing in {{ }}
      // some-attr="{{ ::$resolve.someResolveName }}"
      if (type === '@')
        return `${attrName}='{{${prefix}$resolve.${resolveName}}}'`;

      // Wire "&" callbacks to resolves that return a callback function
      // Get the result of the resolve (should be a function) and annotate it to get its arguments.
      // some-attr="$resolve.someResolveResultName(foo, bar)"
      if (type === '&') {
        let res = context.getResolvable(resolveName);
        let fn = res && res.data;
        let args = fn && services.$injector.annotate(fn) || [];
        // account for array style injection, i.e., ['foo', function(foo) {}]
        let arrayIdxStr = isArray(fn) ? `[${fn.length - 1}]` : '';
        return `${attrName}='$resolve.${resolveName}${arrayIdxStr}(${args.join(",")})'`;
      }

      // some-attr="::$resolve.someResolveName"
      return `${attrName}='${prefix}$resolve.${resolveName}'`;
    };

    let attrs = getComponentBindings(component).map(attributeTpl).join(" ");
    let kebobName = kebob(component);
    return `<${kebobName} ${attrs}></${kebobName}>`;
  };
}

// Gets all the directive(s)' inputs ('@', '=', and '<') and outputs ('&')
function getComponentBindings(name: string) {
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
    .map(key => [key, /^([=<@&])[?]?(.*)/.exec(bindingsObj[key])])
    // skip malformed values
    .filter(tuple => isDefined(tuple) && isArray(tuple[1]))
    // { name: ('foo' || 'input'), type: '=' }
    .map(tuple => ({ name: tuple[1][2] || tuple[0], type: tuple[1][1] } as BindingTuple));

