import { StateObject, ViewConfig, ViewConfigFactory, PathNode, ResolveContext, IInjectable } from "@uirouter/core";
import { Ng1ViewDeclaration } from "../interface";
import { TemplateFactory } from "../templateFactory";
export declare function getNg1ViewConfigFactory(): ViewConfigFactory;
/**
 * This is a [[StateBuilder.builder]] function for angular1 `views`.
 *
 * When the [[StateBuilder]] builds a [[StateObject]] object from a raw [[StateDeclaration]], this builder
 * handles the `views` property with logic specific to @uirouter/angularjs (ng1).
 *
 * If no `views: {}` property exists on the [[StateDeclaration]], then it creates the `views` object
 * and applies the state-level configuration to a view named `$default`.
 */
export declare function ng1ViewsBuilder(state: StateObject): {};
export declare class Ng1ViewConfig implements ViewConfig {
    path: PathNode[];
    viewDecl: Ng1ViewDeclaration;
    factory: TemplateFactory;
    $id: number;
    loaded: boolean;
    controller: Function;
    template: string;
    component: string;
    locals: any;
    constructor(path: PathNode[], viewDecl: Ng1ViewDeclaration, factory: TemplateFactory);
    load(): Promise<this>;
    getTemplate: (uiView: any, context: ResolveContext) => string;
    /**
     * Gets the controller for a view configuration.
     *
     * @returns {Function|Promise.<Function>} Returns a controller, or a promise that resolves to a controller.
     */
    getController(context: ResolveContext): (IInjectable | string | Promise<IInjectable | string>);
}
