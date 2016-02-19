import {UIRouter} from "../router";
import {Directive} from "angular2/core";
import {UiSref} from "./uiSref";

@Directive({
  selector: '[uiSrefClass]',
  inputs: ['uiSrefClass']
})
export class UiSrefClass {
  // current statuses of the bound uiSref directive
  active = false;
  exact = false;
  entering = false;
  exiting = false;
  inactive = true;

  patterns: any;
  classes: string;
  sref: UiSref;

  //constructor($transitions: TransitionService, public router: UIRouter) {
  constructor(public router: UIRouter) {
    this.ngOnDestroy = <any> router.transitionService.onSuccess({}, this._update.bind(this));
  }

  ngOnDestroy() {}

  /**
   * e.g.
   *  {
   *    active: 'active && !exiting',
   *    loading: 'entering',
   *    active: matches('admin.*')
   *  }
   */
  set uiSrefClass(val) {
    console.log(val); // [uiSrefClass]="{active: isActive}" logs as "{active: undefined}"
    this.patterns = val;
  }

  public provideUiSref(sref: UiSref) {
    this.sref = sref;
    this._update();
  }

  private _update() {
    if (!this.sref) return;
    // update classes
  }
}

