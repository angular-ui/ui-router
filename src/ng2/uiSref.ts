/** @module ng2 */ /** */
import {UIRouter} from "../router";
import {Directive, Inject} from "angular2/core";
import {Optional} from "angular2/core";
import {ElementRef} from "angular2/core";
import {Renderer} from "angular2/core";
import {UiView} from "./uiView";
import {ViewContext} from "../view/interface";
import {extend} from "../common/common";

@Directive({ selector: 'a[uiSref]' })
export class AnchorUiSref {
  constructor(public _el: ElementRef, public _renderer: Renderer) { }
  update(href) {
    this._renderer.setElementProperty(this._el.nativeElement, 'href', href);
  }
}

@Directive({
  selector: '[uiSref]',
  inputs: ['uiSref', 'uiParams', 'uiOptions'],
  host: { '(click)': 'go()' }
})
export class UiSref {
  state: string;
  params: any;
  options: any;

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


