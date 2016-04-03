/** @module ng2_directives */ /** */
import {Directive, Output, EventEmitter} from "angular2/core";
import {StateService} from "../state/stateService";
import {UiSref} from "./uiSref";
import {Node} from "../path/node";
import {TransitionService} from "../transition/transitionService";
import {Transition} from "../transition/transition";
import {TargetState} from "../state/targetState";
import {TreeChanges} from "../transition/interface";
import {State} from "../state/stateObject";
import {anyTrueR, tail, unnestR} from "../common/common";
import {UIRouterGlobals} from "../globals";
import {Param} from "../params/param";
import {PathFactory} from "../path/pathFactory";

/**
 * uiSref status booleans 
 */
export interface SrefStatus {
  /** The sref's target state (or one of its children) is currently active */
  active: boolean;
  /** The sref's target state is currently active */
  exact: boolean;
  /** A transition is entering the sref's target state */
  entering: boolean;
  /** A transition is exiting the sref's target state */
  exiting: boolean;
}

/**
 * A directive (which pairs with a [[UiSref]]) and emits events when the UiSref status changes.
 *
 * This directive is used by the [[UiSrefActive]] directive.
 * 
 * The event emitted is of type [[SrefStatus]], and has boolean values for `active`, `exact`, `entering`, and `exiting`
 * 
 * The values from this event can be captured and stored on a component, then applied (perhaps using ngClass).
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
    this._deregisterHook = transitionService.onStart({}, $transition$ => this.processTransition($transition$));
  }

  ngOnInit() {
    let lastTrans = this._globals.transitionHistory.peekTail();
    if (lastTrans != null) {
      this.processTransition(lastTrans);
    }
  }

  ngOnDestroy() {
    if (this._deregisterHook) {
      this._deregisterHook();
    }
    this._deregisterHook = null;
  }

  private _setStatus(status: SrefStatus) {
    this.status = status;
    this.uiSrefStatus.emit(status);
  }

  private processTransition($transition$: Transition) {
    let sref = this.sref;

    let status: SrefStatus = <any> {
      active: false,
      exact: false,
      entering: false,
      exiting: false
    };

    let srefTarget: TargetState = this._stateService.target(sref.state, sref.params, sref.getOptions());
    if (!srefTarget.exists()) {
      return this._setStatus(status);
    }


    /**
     * Returns a Predicate<Node[]> that returns true when the target state (and any param values)
     * match the (tail of) the path, and the path's param values
     */
    const pathMatches = (target: TargetState) => {
      let state: State = target.$state();
      let targetParamVals = target.params();
      let targetPath: Node[] = PathFactory.buildPath(target);
      let paramSchema: Param[] = targetPath.map(node => node.paramSchema)
          .reduce(unnestR, [])
          .filter((param: Param) => targetParamVals.hasOwnProperty(param.id));

      return (path: Node[]) => {
        let tailNode = tail(path);
        if (!tailNode || tailNode.state !== state) return false;
        var paramValues = PathFactory.paramValues(path);
        return Param.equals(paramSchema, paramValues, targetParamVals);
      };
    };

    const isTarget = pathMatches(srefTarget);

    /**
     * Given path: [c, d] appendTo: [a, b]),
     * Expands the path to [c], [c, d]
     * Then appends each to [a,b,] and returns: [a, b, c], [a, b, c, d]
     */
    function spreadToSubPaths (path: Node[], appendTo: Node[] = []): Node[][] {
      return path.map(node => appendTo.concat(PathFactory.subPath(path, node.state)));
    }

    let tc: TreeChanges = $transition$.treeChanges();
    status.active = spreadToSubPaths(tc.from).map(isTarget).reduce(anyTrueR, false);
    status.exact = isTarget(tc.from);
    status.entering = spreadToSubPaths(tc.entering, tc.retained).map(isTarget).reduce(anyTrueR, false);
    status.exiting = spreadToSubPaths(tc.exiting, tc.retained).map(isTarget).reduce(anyTrueR, false);

    if ($transition$.isActive()) {
      this._setStatus(status);
    }

    let update = (currentPath: Node[]) => () => {
      if (this._deregisterHook == null) return; // destroyed
      if (!$transition$.isActive()) return; // superseded
      status.active = spreadToSubPaths(currentPath).map(isTarget).reduce(anyTrueR, false);
      status.exact = isTarget(currentPath);
      status.entering = status.exiting = false;
      this._setStatus(status);
    };

    $transition$.promise.then(update(tc.to), update(tc.from));
  }
}
