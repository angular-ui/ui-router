/** @module ng2_directives */ /** */
import {UIRouter} from "../router";
import {Directive, Inject, Input} from "angular2/core";
import {Optional} from "angular2/core";
import {ElementRef} from "angular2/core";
import {Renderer} from "angular2/core";
import {UiView, ParentUiViewInject} from "./uiView";
import {extend} from "../common/common";

/** @hidden */
@Directive({ selector: 'a[uiSref]' })
export class AnchorUiSref {
  constructor(public _el: ElementRef, public _renderer: Renderer) { }
  update(href) {
    this._renderer.setElementProperty(this._el.nativeElement, 'href', href);
  }
}

/**
 * A directive when clicked, initiates a [[Transition]] to a [[TargetState]].
 *
 * ### Purpose
 *
 * This directive is applied to anchor tags (`<a>`) or any other clickable element.  It is a state reference (or sref --
 * similar to an href).  When clicked, the directive will transition to that state by calling [[StateService.go]], 
 * and optionally supply state parameter values and transition options.
 *
 * When this directive is on an anchor tag, it will also add an `href` attribute to the anchor.
 *
 * ### Selector
 *
 * - `[uiSref]`: The directive is created as an attribute on an element, e.g., `<a uiSref></a>`
 * 
 * ### Inputs
 * 
 * - `uiSref`: the target state's name, e.g., `uiSref="foostate"`.  If a component template uses a relative `uiSref`,
 * e.g., `uiSref=".child"`, the reference is relative to that component's state.
 *
 * - `uiParams`: any target state parameter values, as an object, e.g., `[uiParams]="{ fooId: bar.fooId }"`
 *
 * - `uiOptions`: [[TransitionOptions]], e.g., `[uiOptions]="{ inherit: false }"`
 *
 * @example
 * ```html
 *
 * <!-- Targets bar state' -->
 * <a uiSref="bar">Bar</a>
 *
 * <!-- Assume this component's state is "foo".
 *      Relatively targets "foo.child" -->
 * <a uiSref=".child">Foo Child</a>
 *
 * <!-- Targets "bar" state and supplies parameter value -->
 * <a uiSref="bar" [uiParams]="{ barId: foo.barId }">Bar {{foo.barId}}</a>
 *
 * <!-- Targets "bar" state and parameter, doesn't inherit existing parameters-->
 * <a uiSref="bar" [uiParams]="{ barId: foo.barId }" [uiOptions]="{ inherit: false }">Bar {{foo.barId}}</a>
 * ```
 */
@Directive({
  selector: '[uiSref]',
  host: { '(click)': 'go()' }
})
export class UiSref {
  @Input('uiSref') state: string;
  @Input('uiParams') params: any;
  @Input('uiOptions') options: any;

  constructor(
      private _router: UIRouter,
      @Inject(UiView.PARENT_INJECT) public parent: ParentUiViewInject,
      @Optional() private _anchorUiSref: AnchorUiSref
  ) { }

  set "uiSref"(val) { this.state = val; this.update(); }
  set "uiParams"(val) { this.params = val; this.update(); }
  set "uiOptions"(val) { this.options = val; this.update(); }

  ngOnInit() {
    this.update();
  }

  update() {
    if (this._anchorUiSref) {
      this._anchorUiSref.update(this._router.stateService.href(this.state, this.params, this.getOptions()));
    }
  }

  getOptions() {
    let defOpts = { relative: this.parent && this.parent.context && this.parent.context.name, inherit: true };
    return extend(defOpts, this.options || {});
  }

  go() {
    this._router.stateService.go(this.state, this.params, this.getOptions());
    return false;
  }
}


