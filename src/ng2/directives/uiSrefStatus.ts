/** @module ng2_directives */ /** */
import {Directive, Output, EventEmitter, ContentChildren, QueryList, Inject} from "@angular/core";
import {UISref} from "./uiSref";
import {PathNode} from "../../path/node";
import {Transition} from "../../transition/transition";
import {TargetState} from "../../state/targetState";
import {State} from "../../state/stateObject";
import {anyTrueR, tail, unnestR, Predicate} from "../../common/common";
import {Globals, UIRouterGlobals} from "../../globals";
import {Param} from "../../params/param";
import {PathFactory} from "../../path/pathFactory";
import {Subscription, Observable} from "rxjs/Rx";

interface TransEvt { evt: string, trans: Transition }

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

const inactiveStatus: SrefStatus = {
  active: false,
  exact: false,
  entering: false,
  exiting: false
};

/**
 * Returns a Predicate<PathNode[]>
 *
 * The predicate returns true when the target state (and param values)
 * match the (tail of) the path, and the path's param values
 */
const pathMatches = (target: TargetState): Predicate<PathNode[]> => {
  if (!target.exists()) return () => false;
  let state: State = target.$state();
  let targetParamVals = target.params();
  let targetPath: PathNode[] = PathFactory.buildPath(target);
  let paramSchema: Param[] = targetPath.map(node => node.paramSchema)
      .reduce(unnestR, [])
      .filter((param: Param) => targetParamVals.hasOwnProperty(param.id));

  return (path: PathNode[]) => {
    let tailNode = tail(path);
    if (!tailNode || tailNode.state !== state) return false;
    var paramValues = PathFactory.paramValues(path);
    return Param.equals(paramSchema, paramValues, targetParamVals);
  };
};

/**
 * Given basePath: [a, b], appendPath: [c, d]),
 * Expands the path to [c], [c, d]
 * Then appends each to [a,b,] and returns: [a, b, c], [a, b, c, d]
 */
function spreadToSubPaths(basePath: PathNode[], appendPath: PathNode[]): PathNode[][] {
  return appendPath.map(node => basePath.concat(PathFactory.subPath(appendPath, n => n.state === node.state)));
}

/**
 * Given a TransEvt (Transition event: started, success, error)
 * and a UISref Target State, return a SrefStatus object
 * which represents the current status of that Sref: 
 * active, activeEq (exact match), entering, exiting
 */
function getSrefStatus(event: TransEvt, srefTarget: TargetState): SrefStatus {
  const pathMatchesTarget = pathMatches(srefTarget);
  const tc = event.trans.treeChanges();

  let isStartEvent = event.evt === 'start';
  let isSuccessEvent = event.evt === 'success';
  let activePath: PathNode[] = isSuccessEvent ? tc.to : tc.from;

  const isActive = () =>
      spreadToSubPaths([], activePath)
          .map(pathMatchesTarget)
          .reduce(anyTrueR, false);

  const isExact = () =>
      pathMatchesTarget(activePath);

  const isEntering = () =>
      spreadToSubPaths(tc.retained, tc.entering)
          .map(pathMatchesTarget)
          .reduce(anyTrueR, false);

  const isExiting = () =>
      spreadToSubPaths(tc.retained, tc.exiting)
          .map(pathMatchesTarget)
          .reduce(anyTrueR, false);

  return {
    active: isActive(),
    exact: isExact(),
    entering: isStartEvent ? isEntering() : false,
    exiting: isStartEvent ? isExiting() : false,
  } as SrefStatus;
}

/**
 * A directive (which pairs with a [[UISref]]) and emits events when the UISref status changes.
 *
 * This directive is used by the [[UISrefActive]] directive.
 * 
 * The event emitted is of type [[SrefStatus]], and has boolean values for `active`, `exact`, `entering`, and `exiting`
 * 
 * The values from this event can be captured and stored on a component, then applied (perhaps using ngClass).
 *
 * This API is subject to change.
 */
@Directive({ selector: '[uiSrefStatus],[uiSrefActive],[uiSrefActiveEq]' })
export class UISrefStatus {
  /** current statuses of the state/params the uiSref directive is linking to */
  @Output("uiSrefStatus") uiSrefStatus = new EventEmitter<SrefStatus>(false);
  /** Monitor all child components for UISref(s) */
  @ContentChildren(UISref, {descendants: true}) srefs: QueryList<UISref>;

  /** The current status */
  status: SrefStatus;

  private _subscription: Subscription;

  constructor(@Inject(Globals) private _globals: UIRouterGlobals) {
    this.status = Object.assign({}, inactiveStatus);
  }

  ngAfterContentInit() {
    // Map each transition start event to a stream of:
    // start -> (success|error)
    let transEvents$: Observable<TransEvt> = this._globals.start$.switchMap((trans: Transition) => {
      const event = (evt: string) => ({evt, trans} as TransEvt);

      let transStart$ = Observable.of(event("start"));
      let transResult = trans.promise.then(() => event("success"), () => event("error"));
      let transFinish$ = Observable.fromPromise(transResult);

      return transStart$.concat(transFinish$);
    });

    // Watch the children UISref components and get their target states
    let srefs$: Observable<UISref[]> = Observable.of(this.srefs.toArray()).concat(this.srefs.changes);
    let targetStates$: Observable<TargetState[]> =
        srefs$.switchMap((srefs: UISref[]) =>
            Observable.combineLatest<TargetState[]>(srefs.map(sref => sref.targetState$)));

    // Calculate the status of each UISref based on the transition event.
    // Reduce the statuses (if multiple) by or-ing each flag.
    this._subscription = transEvents$.mergeMap((evt: TransEvt) => {
      return targetStates$.map((targets: TargetState[]) => {
        let statuses: SrefStatus[] = targets.map(target => getSrefStatus(evt, target));

        return statuses.reduce((acc: SrefStatus, val: SrefStatus) => ({
          active: acc.active || val.active,
          exact: acc.active || val.active,
          entering: acc.active || val.active,
          exiting: acc.active || val.active,
        }))
      })
    }).subscribe(this._setStatus.bind(this));
  }

  ngOnDestroy() {
    if (this._subscription) this._subscription.unsubscribe();
  }

  private _setStatus(status: SrefStatus) {
    this.status = status;
    this.uiSrefStatus.emit(status);
  }
}
