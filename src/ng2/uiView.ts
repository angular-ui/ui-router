/** @module ng2_directives */ /** */
import {
    Component, ComponentResolver, ComponentFactory,
    ViewContainerRef, ReflectiveInjector
} from '@angular/core';
import {provide} from "@angular/core";
import {Input} from "@angular/core";
import {ComponentRef} from "@angular/core";
import {Type} from "@angular/core";

import {UIRouter} from "../router";
import {trace} from "../common/trace";
import {Inject} from "@angular/core";
import {ViewContext, ViewConfig} from "../view/interface";
import {Ng2ViewDeclaration} from "./interface";
import {ng2ComponentInputs} from "./componentUtil";
import {Ng2ViewConfig} from "./viewsBuilder";

/** @hidden */
let id = 0;

// These are provide()d as the string UiView.PARENT_INJECT
export interface ParentUiViewInject {
  context: ViewContext;
  fqn: string;
}

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
  template: ''
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
export class UiView {
  @Input('name') name: string;
  @Input('ui-view') set _name(val) { this.name = val; }
  componentRef: ComponentRef<any>;
  deregister: Function;
  uiViewData: any = {};

  static PARENT_INJECT = "UiView.PARENT_INJECT";

  constructor(
      public router: UIRouter,
      @Inject(UiView.PARENT_INJECT) public parent: ParentUiViewInject,
      public compResolver: ComponentResolver,
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

    this.deregister = this.router.viewService.registerUiView(this.uiViewData);
  }

  disposeLast() {
    if (this.componentRef) this.componentRef.destroy();
    this.componentRef = null;
  }

  ngOnDestroy() {
    if (this.deregister) this.deregister();
    this.disposeLast();
  }

  viewConfigUpdated(config: ViewConfig) {
    if (!config) return this.disposeLast();
    if (!(config instanceof Ng2ViewConfig)) return;

    let uiViewData = this.uiViewData;
    let viewDecl = <Ng2ViewDeclaration> config.viewDecl;

    // The "new" viewconfig is already applied, so exit early
    if (uiViewData.config === config) return;
    // This is a new viewconfig.  Destroy the old component
    this.disposeLast();
    trace.traceUiViewConfigUpdated(uiViewData, config && config.viewDecl.$context);
    uiViewData.config = config;
    // The config may be undefined if there is nothing state currently targeting this UiView.
    if (!config) return;

    // Map resolves to "useValue providers"
    let rc = config.node.resolveContext;
    let resolvables = rc.getResolvables();
    let rawProviders = Object.keys(resolvables).map(key => provide(key, { useValue: resolvables[key].data }));
    rawProviders.push(provide(UiView.PARENT_INJECT, { useValue: { context: config.viewDecl.$context, fqn: uiViewData.fqn } }));

    // Get the component class from the view declaration. TODO: allow promises?
    let componentType = <Type> viewDecl.component;

    let createComponent = (factory: ComponentFactory<any>) => {
      let parentInjector = this.viewContainerRef.injector;
      let childInjector = ReflectiveInjector.resolveAndCreate(rawProviders, parentInjector);
      let ref = this.componentRef = this.viewContainerRef.createComponent(factory, undefined, childInjector);

      // TODO: wire uiCanExit and uiOnParamsChanged callbacks

      // Supply resolve data to matching @Input('prop') or inputs: ['prop']
      let inputs = ng2ComponentInputs(componentType);
      let bindings = viewDecl['bindings'] || {};

      inputs.map(tuple => ({ prop: tuple.prop, resolve: bindings[tuple.prop] || tuple.resolve }))
          .filter(tuple => resolvables[tuple.resolve] !== undefined)
          .forEach(tuple => { ref.instance[tuple.prop] = resolvables[tuple.resolve].data });
          
      // Initiate change detection for the newly created component
      ref.changeDetectorRef.detectChanges();
    };

    this.compResolver.resolveComponent(componentType).then(createComponent);
  }
}

