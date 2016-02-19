import {UIRouter} from "../router";
import {Directive} from "angular2/core";
import {Optional} from "angular2/core";
import {Input} from "angular2/core";
import {ElementRef} from "angular2/core";
import {Renderer} from "angular2/core";

@Directive({ selector: 'a[uiSref]' })
export class AnchorUiSref {
  constructor( public _el: ElementRef, public _renderer: Renderer) { }
  update(href) {
    this._renderer.setElementProperty(this._el, 'href', href);
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
      @Optional() private _anchorUiSref: AnchorUiSref
  ) { }

  set "ui-sref"(val) { this.state = val; this.update(); }
  set "uiSref"(val) { this.state = val; this.update(); }
  set "uiParams"(val) { this.params = val; this.update(); }
  set "uiOptions"(val) { this.options = val; this.update(); }

  ngOnInit() {
    this.update();
  }

  update() {
    if (this._anchorUiSref) {
      this._anchorUiSref.update(this._router.stateService.href(this.state, this.params));
    }
    // TODO: process ui-sref-active
  }

  go() {
    this._router.stateService.go(this.state, this.params, this.options);
    return false;
  }
}


