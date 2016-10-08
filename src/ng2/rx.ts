/** @module ng2 */ /** */
import {Observable, ReplaySubject} from "rxjs/Rx";
import {Transition} from "ui-router-core";
import {UIRouter} from "ui-router-core";
import {StateDeclaration} from "ui-router-core";

export interface StatesChangedEvent {
  currentStates: StateDeclaration[];
  registered: StateDeclaration[];
  deregistered: StateDeclaration[];
}

declare module 'ui-router-core/lib/globals' {
  interface UIRouterGlobals {
    states$?: Observable<StatesChangedEvent>;
    start$?: Observable<Transition>;
    success$?: Observable<Transition>;
    params$?: Observable<{ [paramName: string]: any }>;
  }
}

/** Augments UIRouterGlobals with observables for transition starts, successful transitions, and state parameters */
export class UIRouterRx {
  private deregisterFns: Function[] = [];

  constructor(router: UIRouter) {
    let start$ = new ReplaySubject<Transition>(1);
    let success$ = <Observable<Transition>> start$.mergeMap((t: Transition) => t.promise.then(() => t));
    let params$ = success$.map((transition: Transition) => transition.params());

    let states$ = new ReplaySubject<StatesChangedEvent>(1);
    function onStatesChangedEvent(event: string, states: StateDeclaration[]) {
      let changeEvent = {
        currentStates: router.stateRegistry.get(),
        registered: [],
        deregistered: []
      };

      if (event) changeEvent[event] = states;
      states$.next(changeEvent);
    }

    this.deregisterFns.push(router.transitionService.onStart({}, transition => start$.next(transition)));
    this.deregisterFns.push(router.stateRegistry.onStatesChanged(onStatesChangedEvent));
    onStatesChangedEvent(null, null);
    Object.assign(router.globals, {start$, success$, params$, states$});
  }

  dispose() {
    this.deregisterFns.forEach(deregisterFn => deregisterFn());
    this.deregisterFns = [];
  }
}
