/** @module state */ /** for typedoc */
import {Transition} from "../../transition/transition";

export class EnterExitHooks {
  private transition: Transition;

  constructor(transition: Transition) {
    this.transition = transition;
  }

  registerHooks() {
    this.registerOnEnterHooks();
    this.registerOnRetainHooks();
    this.registerOnExitHooks();
  }

  registerOnEnterHooks() {
    this.transition.entering().filter(state => !!state.onEnter)
        .forEach(state => this.transition.onEnter({entering: state.name}, state.onEnter));
  }

  registerOnRetainHooks() {
    this.transition.retained().filter(state => !!state.onRetain)
        .forEach(state => this.transition.onRetain({retained: state.name}, state.onRetain));
  }

  registerOnExitHooks() {
    this.transition.exiting().filter(state => !!state.onExit)
        .forEach(state => this.transition.onExit({exiting: state.name}, state.onExit));
  }
}
