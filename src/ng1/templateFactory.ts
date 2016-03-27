/** @module view */ /** for typedoc */
import {isDefined, isFunction} from "../common/predicates";
import {services} from "../common/coreservices";
import {Ng1ViewDeclaration} from "./interface";
import {IInjectable} from "../common/common";

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
   * @param injectFn Function to which an injectable function may be passed.
   *        If templateProvider is defined, this injectFn will be used to invoke it.
   *
   * @return {string|object}  The template html as a string, or a promise for 
   * that string,or `null` if no template is configured.
   */
  fromConfig(config: Ng1ViewDeclaration, params: any, injectFn: Function) {
    return (
      isDefined(config.template) ? this.fromString(config.template, params) :
      isDefined(config.templateUrl) ? this.fromUrl(config.templateUrl, params) :
      isDefined(config.templateProvider) ? this.fromProvider(config.templateProvider, params, injectFn) :
      null
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
  fromString(template: (string|Function), params?) {
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
  fromProvider(provider: IInjectable, params: any, injectFn: Function) {
    return injectFn(provider);
  };
}