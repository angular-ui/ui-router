
import { IAugmentedJQuery } from "angular";
import { IInjectable, ResolveContext, RawParams } from "@uirouter/core";
import { Ng1ViewDeclaration, TemplateFactoryProvider } from "./interface";
/**
 * Service which manages loading of templates from a ViewConfig.
 */
export declare class TemplateFactory implements TemplateFactoryProvider {
    /** @hidden */ private _useHttp;
    /** @hidden */ private $templateRequest;
    /** @hidden */ private $templateCache;
    /** @hidden */ private $http;
    /** @hidden */ $get: (string | (($http: any, $templateCache: any, $injector: any) => this))[];
    /** @hidden */
    useHttpService(value: boolean): void;
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
    fromConfig(config: Ng1ViewDeclaration, params: any, context: ResolveContext): Promise<{
        template?: string;
        component?: string;
    }>;
    /**
     * Creates a template from a string or a function returning a string.
     *
     * @param template html template as a string or function that returns an html template as a string.
     * @param params Parameters to pass to the template function.
     *
     * @return {string|object} The template html as a string, or a promise for that
     * string.
     */
    fromString(template: (string | Function), params?: RawParams): any;
    /**
     * Loads a template from the a URL via `$http` and `$templateCache`.
     *
     * @param {string|Function} url url of the template to load, or a function
     * that returns a url.
     * @param {Object} params Parameters to pass to the url function.
     * @return {string|Promise.<string>} The template html as a string, or a promise
     * for that string.
     */
    fromUrl(url: (string | Function), params: any): any;
    /**
     * Creates a template by invoking an injectable provider function.
     *
     * @param provider Function to invoke via `locals`
     * @param {Function} injectFn a function used to invoke the template provider
     * @return {string|Promise.<string>} The template html as a string, or a promise
     * for that string.
     */
    fromProvider(provider: IInjectable, params: any, context: ResolveContext): Promise<any>;
    /**
     * Creates a component's template by invoking an injectable provider function.
     *
     * @param provider Function to invoke via `locals`
     * @param {Function} injectFn a function used to invoke the template provider
     * @return {string} The template html as a string: "<component-name input1='::$resolve.foo'></component-name>".
     */
    fromComponentProvider(provider: IInjectable, params: any, context: ResolveContext): Promise<any>;
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
    makeComponentTemplate(uiView: IAugmentedJQuery, context: ResolveContext, component: string, bindings?: any): string;
}
