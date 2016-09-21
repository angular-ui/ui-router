/** @module ng2_directives */ /** */
import {
    Component, ComponentFactoryResolver, ViewContainerRef, Input, ComponentRef, Type,
    ReflectiveInjector, ViewChild, Injector, Inject
} from '@angular/core';

import {UIRouter} from "../../router";
import {trace} from "../../common/trace";
import {ViewContext, ViewConfig, ActiveUIView} from "../../view/interface";
import {Ng2ViewConfig} from "../statebuilders/views";
import {ResolveContext, NATIVE_INJECTOR_TOKEN} from "../../resolve/resolveContext";
import {flattenR} from "../../common/common";
import {MergeInjector} from "../mergeInjector";

/** @hidden */
let id = 0;

// These are provide()d as the string UIView.PARENT_INJECT
export interface ParentUIViewInject {
  context: ViewContext;
  fqn: string;
}

interface InputMapping {
  token: string;
  prop: string;
}

declare var Reflect: any;

/** @hidden */
const ng2ComponentInputs = (ng2CompClass: Type<any>) => {
  /** Get "@Input('foo') _foo" inputs */
  let props = Reflect['getMetadata']('propMetadata', ng2CompClass);
  let _props = Object.keys(props || {})
      // -> [ { key: string, anno: annotations[] } ] tuples
      .map(key => ({ key, annoArr: props[key] }))
      // -> flattened to [ { key: string, anno: annotation } ] tuples
      .reduce((acc, tuple) => acc.concat(tuple.annoArr.map(anno => ({ key: tuple.key, anno }))), [])
      // Only Inputs
      .filter(tuple => tuple.anno instanceof Input)
      // If they have a bindingPropertyName, i.e. "@Input('foo') _foo", then foo, else _foo
      .map(tuple => ({ token: tuple.anno.bindingPropertyName || tuple.key, prop: tuple.key }));

  /** Get "inputs: ['foo']" inputs */
  let inputs = Reflect['getMetadata']('annotations', ng2CompClass)
      // Find the ComponentMetadata class annotation
      .filter(x => x instanceof Component && !!x.inputs)
      // Get the .inputs string array
      .map(x => x.inputs)
      .reduce(flattenR, [])
      .map(input => ({ token: input, prop: input }));

  return _props.concat(inputs) as InputMapping[];
};

/**
 * A UI-Router viewport directive, which is filled in by a view (component) on a state.
 *
 * ### Selector
 *
 * A `ui-view` directive can be created as an element: `<ui-view></ui-view>` or as an attribute: `<div ui-view></div>`.
 *
 * ### Purpose
 *
 * This directive is used in a Component template (or as the root component) to create a viewport.  The viewport
 * is filled in by a view (as defined by a [[Ng2ViewDeclaration]] inside a [[Ng2StateDeclaration]]) when the view's
 * state has been activated.
 *
 * @example
 * ```js
 *
 * // This app has two states, 'foo' and 'bar'
 * stateRegistry.register({ name: 'foo', url: '/foo', component: FooComponent });
 * stateRegistry.register({ name: 'bar', url: '/bar', component: BarComponent });
 * ```
 * ```html
 * <!-- This ui-view will be filled in by the foo state's component or
 *      the bar state's component when the foo or bar state is activated -->
 * <ui-view></ui-view>
 * ```
 *
 * ### Named ui-views
 *
 * A `ui-view` may optionally be given a name via the attribute value: `<div ui-view='header'></div>`.  *Note:
 * an unnamed `ui-view` is internally named `$default`*.   When a `ui-view` has a name, it will be filled in
 * by a matching named view.
 *
 * @example
 * ```js
 *
 * stateRegistry.register({
 *   name: 'foo',
 *   url: '/foo',
 *   views: { header: HeaderComponent, $default: FooComponent });
 * ```
 * ```html
 * <!-- When 'foo' state is active, filled by HeaderComponent -->
 * <div ui-view="header"></div>
 *
 * <!-- When 'foo' state is active, filled by FooComponent -->
 * <ui-view></ui-view>
 * ```
 */
@Component({
  selector: 'ui-view, [ui-view]',
  template: `<template #componentTarget></template>`
  // styles: [`
  //   .done-true {
  //     text-decoration: line-through;
  //     color: grey;
  //   }`
  // ],
  // template: `
  // <div style="padding: 1em; border: 1px solid lightgrey;">
  //
  //   <div #content style="color: lightgrey; font-size: smaller;">
  //     <div>ui-view #{{uiViewData?.id}} created by '{{ parentContext?.name || "(root)" }}' state</div>
  //     <div>name: (absolute) '{{uiViewData?.fqn}}' (contextual) '{{uiViewData?.name}}@{{parentContext?.name}}' </div>
  //     <div>currently filled by: '{{(uiViewData?.config && uiViewData?.config?.viewDecl?.$context) || 'empty...'}}'</div>
  //   </div>
  //
  // </div>`
})
export class UIView {
  @ViewChild('componentTarget', {read: ViewContainerRef}) componentTarget: ViewContainerRef;
  @Input('name') name: string;
  @Input('ui-view') set _name(val: string) { this.name = val; }
  componentRef: ComponentRef<any>;
  deregister: Function;
  uiViewData: ActiveUIView = <any> {};

  static PARENT_INJECT = "UIView.PARENT_INJECT";

  constructor(
      public router: UIRouter,
      @Inject(UIView.PARENT_INJECT) public parent: ParentUIViewInject,
      public viewContainerRef: ViewContainerRef
  ) { }

  ngOnInit() {
    let parentFqn = this.parent.fqn;
    let name = this.name || '$default';

    this.uiViewData = {
      $type: 'ng2',
      id: id++,
      name: name,
      fqn: parentFqn ? parentFqn + "." + name : name,
      creationContext: this.parent.context,
      configUpdated: this.viewConfigUpdated.bind(this),
      config: undefined
    };

    this.deregister = this.router.viewService.registerUIView(this.uiViewData);
  }

  disposeLast() {
    if (this.componentRef) this.componentRef.destroy();
    this.componentRef = null;
  }

  ngOnDestroy() {
    if (this.deregister) this.deregister();
    this.disposeLast();
  }

  /**
   * The view service is informing us of an updated ViewConfig
   * (usually because a transition activated some state and its views)
   */
  viewConfigUpdated(config: ViewConfig) {
    // The config may be undefined if there is nothing currently targeting this UIView.
    // Dispose the current component, if there is one
    if (!config) return this.disposeLast();

    // Only care about Ng2 configs
    if (!(config instanceof Ng2ViewConfig)) return;

    // The "new" viewconfig is already applied, so exit early
    if (this.uiViewData.config === config) return;

    // This is a new ViewConfig.  Dispose the previous component
    this.disposeLast();
    trace.traceUIViewConfigUpdated(this.uiViewData, config && config.viewDecl.$context);

    this.applyUpdatedConfig(config);
  }

  applyUpdatedConfig(config: Ng2ViewConfig) {
    this.uiViewData.config = config;
    // Create the Injector for the routed component
    let context = new ResolveContext(config.path);
    let componentInjector = this.getComponentInjector(context);

    // Get the component class from the view declaration. TODO: allow promises?
    let componentClass = config.viewDecl.component;

    // Create the component
    let compFactoryResolver = componentInjector.get(ComponentFactoryResolver);
    let compFactory = compFactoryResolver.resolveComponentFactory(componentClass);
    this.componentRef = this.componentTarget.createComponent(compFactory, undefined, componentInjector);

    // Wire resolves to @Input()s
    this.applyInputBindings(this.componentRef, context, componentClass);

    // TODO: wire uiCanExit and uiOnParamsChanged callbacks
  }

  /**
   * Creates a new Injector for a routed component.
   *
   * Adds resolve values to the Injector
   * Adds providers from the NgModule for the state
   * Adds providers from the parent Component in the component tree
   * Adds a PARENT_INJECT view context object
   *
   * @returns an Injector
   */
  getComponentInjector(context: ResolveContext): Injector {
    // Map resolves to "useValue: providers"
    let resolvables = context.getTokens().map(token => context.getResolvable(token)).filter(r => r.resolved);
    let newProviders = resolvables.map(r => ({ provide: r.token, useValue: r.data }));

    var parentInject = { context: this.uiViewData.config.viewDecl.$context, fqn: this.uiViewData.fqn };
    newProviders.push({ provide: UIView.PARENT_INJECT, useValue: parentInject });

    let parentComponentInjector = this.viewContainerRef.injector;
    let moduleInjector = context.getResolvable(NATIVE_INJECTOR_TOKEN).data;
    let mergedParentInjector = new MergeInjector(moduleInjector, parentComponentInjector);

    return ReflectiveInjector.resolveAndCreate(newProviders, mergedParentInjector);
  }

  /**
   * Supplies component inputs with resolve data
   *
   * Finds component inputs which match resolves (by name) and sets the input value
   * to the resolve data.
   */
  applyInputBindings(ref: ComponentRef<any>, context: ResolveContext, componentClass) {
    let bindings = this.uiViewData.config.viewDecl['bindings'] || {};

    var addResolvable = (tuple: InputMapping) => ({
      prop: tuple.prop,
      resolvable: context.getResolvable(bindings[tuple.prop] || tuple.token)
    });

    // Supply resolve data to matching @Input('prop') or inputs: ['prop']
    let inputTuples = ng2ComponentInputs(componentClass);
    inputTuples.map(addResolvable)
        .filter(tuple => tuple.resolvable && tuple.resolvable.resolved)
        .forEach(tuple => { ref.instance[tuple.prop] = tuple.resolvable.data });

    // Initiate change detection for the newly created component
    ref.changeDetectorRef.detectChanges();
  }
}
