import {Directive, Output, EventEmitter} from "angular2/core";
import {StateService} from "../state/stateService";
import {UiSref} from "./uiSref";
import {UIRouter} from "../router";
import {Node} from "../path/node";
import {TransitionService} from "../transition/transitionService";
import {Transition} from "../transition/transition";
import {TargetState} from "../state/targetState";
import {TreeChanges} from "../transition/interface";
import {State} from "../state/stateObject";
import {anyTrueR, tail} from "../common/common";
import {UIRouterGlobals} from "../globals";

export interface SrefStatus {
  active: boolean;
  exact: boolean;
  entering: boolean;
  exiting: boolean;
}

/**
 * Emits events when the uiSref status changes
 *
 * This API is subject to change.
 */
@Directive({ selector: '[uiSrefStatus],[uiSrefActive],[uiSrefActiveEq]' })
export class UiSrefStatus {
  private _deregisterHook;

  // current statuses of the state/params the uiSref directive is linking to
  @Output("uiSrefStatus") uiSrefStatus = new EventEmitter<SrefStatus>();

  status: SrefStatus = {
    active: false,
    exact: false,
    entering: false,
    exiting: false
  };

  constructor(transitionService: TransitionService,
              private _globals: UIRouterGlobals,
              private _stateService: StateService,
              public sref: UiSref) {
    this._deregisterHook = transitionService.onStart({}, ($transition$) => this._transition($transition$));
  }

  ngOnInit() {
    let lastTrans = this._globals.transitionHistory.peekTail();
    if (lastTrans != null) {
      this._transition(lastTrans);
    }
  }

  ngOnDestroy() {
    this._deregisterHook()
  }

  private _setStatus(status: SrefStatus) {
    this.status = status;
    this.uiSrefStatus.emit(status);
  }

  private _transition($transition$: Transition) {
    let sref = this.sref;

    let status: SrefStatus = <any> {
      active: false,
      exact: false,
      entering: false,
      exiting: false
    };

    let srefTarget: TargetState = this._stateService.target(sref.state, sref.params, sref.options);
    if (!srefTarget.exists()) {
      return this._setStatus(status);
    }

    let tc: TreeChanges = $transition$.treeChanges();
    let state: State = srefTarget.$state();
    const isTarget = (node: Node) => node.state === state;

    status.active = tc.from.map(isTarget).reduce(anyTrueR, false);
    status.exact = tail(tc.from.map(isTarget)) === true;
    status.entering = tc.entering.map(isTarget).reduce(anyTrueR, false);
    status.exiting = tc.exiting.map(isTarget).reduce(anyTrueR, false);

    if ($transition$.isActive()) {
      this._setStatus(status);
    }

    let update = (currentPath: Node[]) => () => {
      if (!$transition$.isActive()) return; // superseded
      status.active = currentPath.map(isTarget).reduce(anyTrueR, false);
      status.exact = tail(currentPath.map(isTarget)) === true;
      status.entering = status.exiting = false;
      this._setStatus(status);
    };

    $transition$.promise.then(update(tc.to), update(tc.from));
  }
}
