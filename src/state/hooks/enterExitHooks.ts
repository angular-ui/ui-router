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
    let onEnterRegistration = (state) => this.transition.onEnter({to: state.name}, state.onEnter);
    this.transition.entering().filter(state => !!state.onEnter).forEach(onEnterRegistration);
  }

  registerOnRetainHooks() {
    let onRetainRegistration = (state) => this.transition.onRetain({}, state.onRetain);
    this.transition.retained().filter(state => !!state.onRetain).forEach(onRetainRegistration);
  }

  registerOnExitHooks() {
    let onExitRegistration = (state) => this.transition.onExit({from: state.name}, state.onExit);
    this.transition.exiting().filter(state => !!state.onExit).forEach(onExitRegistration);
  }
}
