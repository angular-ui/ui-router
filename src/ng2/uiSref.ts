/** @module ng2 */ /** */
import {UIRouter} from "../router";
import {Directive, Inject, Input} from "angular2/core";
import {Optional} from "angular2/core";
import {ElementRef} from "angular2/core";
import {Renderer} from "angular2/core";
import {UiView} from "./uiView";
import {ViewContext} from "../view/interface";
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
 * A directive which, when clicked, begins a [[Transition]] to a [[TargetState]].
 *
 * Has three inputs:
 *
 * @Input uiSref the target state name
 *
 * @Input uiParams target state parameters
 *
 * @Input uiOptions transition options
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
      @Inject(UiView.INJECT.context) public context: ViewContext,
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
    let defOpts = { relative: this.context.name, inherit: true };
    return extend(defOpts, this.options || {});
  }

  go() {
    this._router.stateService.go(this.state, this.params, this.getOptions());
    return false;
  }
}


