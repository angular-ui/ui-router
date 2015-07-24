/// <reference path='../../typings/angularjs/angular.d.ts' />
"use strict";

import {runtime} from "../common/angular1";
import {IPromise} from "angular";
import {trace} from "../common/trace";
import {$transition, matchState, ITransitionOptions} from "./transitionService";
import TransitionHook from "./transitionHook";
import HookBuilder from "./hookBuilder";
import Resolvable from "../resolve/resolvable";
import Path from "../resolve/path";
import PathElement from "../resolve/pathElement";
import {RejectFactory} from "./rejectFactory"
import {StateParams, StateReference} from "../state/state"
import {IState, IStateDeclaration} from "../interface";
import {ViewContext} from "../view/viewContext";
import {StateViewConfig} from "../view/view";
import {defaults, eq, extend, filter, flatten, forEach, identity, invoke, is, isEq, isFunction, isObject, isPromise, isDefined,
    map, noop, not, objectKeys, parse, pattern, pipe, pluck, prop, toJson, unnest, unroll, val, pairs} from "../common/common";

var transitionCount = 0, REJECT = new RejectFactory();


interface TreeChanges {
  from: Path;
  to: Path;
  retained: Path;
  entering: Path;
  exiting: Path;
}

/**
 * @ngdoc object
 * @name ui.router.state.type:Transition
 *
 * @description
 * Represents a transition between two states, and contains all contextual information about the
 * to/from states and parameters, as well as the list of states being entered and exited as a
 * result of this transition.
 *
 * @param {Object} from The origin {@link ui.router.state.$stateProvider#state state} from which the transition is leaving.
 * @param {Object} to The target {@link ui.router.state.$stateProvider#state state} being transitioned to.
 * @param {Object} options An object hash of the options for this transition.
 *
 * @returns {Object} New `Transition` object
 */
export class Transition {
  $id: number;

  private _options: ITransitionOptions;

  private _deferreds: any;

  private _from: StateReference;
  private _to: StateReference;
  private _fromPath: Path;

  promise: IPromise<any>;
  prepromise: IPromise<any>;
  redirects: IPromise<any>;

  constructor(from: StateReference, to: StateReference, options: ITransitionOptions) {
    this.$id = transitionCount++;

    this._from = from;
    this._to = to;

    this._options = extend({current: val(this)}, options);

    this._deferreds = {
      prehooks: runtime.$q.defer(), // Resolved when the transition is complete, but success callback not run yet
      posthooks: runtime.$q.defer(), // Resolved when the transition is complete, after success callbacks
      redirects: runtime.$q.defer() // Resolved when any transition redirects are complete
    };

    var fromState = from.$state();
    var toState = to.$state();
    this._fromPath = new Path(fromState.path);

    var fromParams = extend(new StateParams(), from.params());
    var toParams = (options.inherit && toState) ? fromParams.$inherit(to.params(), fromState, toState) : to.params();
    toParams = toState ? extend(new StateParams(), toState.params.$$values(toParams)) : toParams;

    this._to = (toParams && to.params(toParams)) || to;

    this._treeChanges = this._calcTreeChanges(toParams, fromParams);
    // Expose three promises to users of Transition
    this.promise = this._deferreds.posthooks.promise;
    this.prepromise = this._deferreds.prehooks.promise;
    this.redirects = this._deferreds.redirects.promise;
  }

  _treeChanges: TreeChanges;

  _calcTreeChanges(toParams, fromParams): TreeChanges {
    function nonDynamicParams(state) {
      return state.params.$$filter(not(prop('dynamic')));
    }

    var state, keep = 0;
    var toState = this._to.$state(), fromState = this._from.$state();
    if (this._to.valid()) {
      state = toState.path[keep];
      while (state && state === fromState.path[keep] && state !== this._options.reloadState && nonDynamicParams(state).$$equals(toParams, fromParams)) {
        keep++;
        state = toState.path[keep];
      }
    }

    var from = this._fromPath;
    var retained = from.slice(0, keep);
    var exiting = from.slice(keep);
    var entering = this._to.valid() ? new Path(toState.path).slice(keep) : new Path([]);
    var to = retained.concat(entering);

    return { from, to, retained, exiting, entering };
  }

  $from() {
    return this._from;
  }

  $to() {
    return this._to;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#$from
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Returns the origin state of the current transition, as passed to the `Transition` constructor.
   *
   * @returns {StateReference} The origin state reference of the transition ("from state").
   */
  from() {
    return this._from.identifier();
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#$to
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Returns the target state of the current transition, as passed to the `Transition` constructor.
   *
   * @returns {StateReference} The state reference the transition is targetting ("to state")
   */
  to() {
    return this._to.identifier();
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#is
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Determines whether two transitions are equivalent.
   */
  is(compare) {
    if (compare instanceof Transition) {
      // TODO: Also compare parameters
      return this.is({to: compare.$to().$state().name, from: compare.$from.$state().name});
    }
    return !(
        (compare.to && !matchState(this.$to().$state(), compare.to)) ||
        (compare.from && !matchState(this.$from().$state(), compare.from))
    );
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#params
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the calculated StateParams object for the transition target.
   *
   * @returns {StateParams} the StateParams object for the transition.
   */
  params() {
    return this._to.params();
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#previous
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the previous transition from which this transition was redirected.
   *
   * @returns {Object} A `Transition` instance, or `null`.
   */
  previous(): Transition {
    return this._options.previous || null;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#options
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Returns all options passed to the constructor of this `Transition`.
   */
  options() {
    return this._options;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#entering
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the states being entered.
   *
   * @returns {Array} Returns an array of states that will be entered in this transition.
   */
  entering() {
    var entering = this._treeChanges.entering;
    return pluck(entering.elements, 'state');
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#exiting
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the states being exited.
   *
   * @returns {Array} Returns an array of states that will be exited in this transition.
   */
  exiting() {
    var exiting = this._treeChanges.exiting;
    var exitingStates = <any[]> pluck(exiting.elements, 'state');
    exitingStates.reverse();
    return exitingStates;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#retained
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Gets the states being retained.
   *
   * @returns {Array} Returns an array of states that were entered in a previous transition that
   *           will not be exited.
   */
  retained() {
    var retained = this._treeChanges.retained;
    return pluck(retained.elements, 'state');
  }

  context(pathElement) {
    return new ViewContext(pathElement, this._treeChanges.to, this._options, runtime.$injector);
  }

  /**
   * Returns a list of StateViewConfig objects;
   * Returns one StateViewConfig for each view in each state in a named path of the transition's tree changes
   */
  views(pathname: string = "entering") {
    var path = this._treeChanges[pathname];
    var states = states || path.states();
    var params = this._to.params();

    return unnest(map(states, (state) => {
      var context = state, locals = this.context(path.elementForState(state));
      const makeViewConfig = ([name, view]) => { return {name, view, context, locals, params} };
      return pairs(state.views).map(makeViewConfig)
    }));
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#redirect
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Creates a new transition that is a redirection of the current one. This transition can
   * be returned from a `$transitionProvider` hook, `$state` event, or other method, to
   * redirect a transition to a new state and/or set of parameters.
   *
   * @returns {Transition} Returns a new `Transition` instance.
   */
  redirect(newTo, newOptions) {
    return new Transition(this._from, newTo, extend(newOptions || this.options(), {
      previous: this
    }));
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:Transition#ignored
   * @methodOf ui.router.state.type:Transition
   *
   * @description
   * Indicates whether the transition should be ignored, based on whether the to and from states are the
   * same, and whether the `reload` option is set.
   *
   * @returns {boolean} Whether the transition should be ignored.
   */
  ignored() {
    return !this._options.reload &&
        this._to.$state() === this._from.$state() &&
        this._to.$state().params.$$filter(not(prop('dynamic'))).$$equals(this._to.params(), this._from.params());
  }

  run () {
    if (this._options.trace) trace.traceTransitionStart(this);
    var baseHookOptions = {
      trace: this._options.trace,
      transition: this,
      current: this._options.current
    };

    var hookBuilder = new HookBuilder($transition, this, baseHookOptions);

    if (this.ignored()) {
      if (this._options.trace) trace.traceTransitionIgnored(this);
      $transition.transition = null;
      var ignored = REJECT.ignored();
      forEach(this._deferreds, (def) => def.reject(ignored.reason));
      return ignored;
    }

    $transition.transition = this;

    var treeChanges = this._treeChanges;
    var { entering, exiting } = treeChanges;
    var toPath = treeChanges.to, fromPath = treeChanges.from;
    var to = this._to.$state(), from = this._from.$state();
    var fromParams = this._from.params();

    var options = this._options;
    var tLocals = {$transition$: this};

    var rootPE = new PathElement(this._from.$state().root());
    var rootPath = new Path([rootPE]);
    var exitingElements = exiting.slice(0).reverse().elements;
    var enteringElements = entering.elements;

    // Build a bunch of arrays of promises for each step of the transition
    // TODO: Provide makeSteps with the StateReference, not the $state().
    var onBeforeHooks = hookBuilder.makeSteps("onBefore", to, from, rootPE, tLocals, rootPath, {async: false});

    var onInvalidHooks = hookBuilder.makeSteps("onInvalid", to, from, rootPE, tLocals, rootPath);

    var onStartHooks = hookBuilder.makeSteps("onStart", to, from, rootPE, tLocals, rootPath);

    var transitionOnHooks = hookBuilder.makeSteps("on", to, from, rootPE, tLocals, rootPath);

    var exitingStateHooks = map(exitingElements, function (elem) {
      var stepLocals = {$state$: elem.state, $stateParams: elem.state.params.$$values(fromParams)};
      var locals = extend({}, tLocals, stepLocals);
      var steps = hookBuilder.makeSteps("exiting", to, elem.state, elem, locals, fromPath);

      return !elem.state.self.onExit ? steps : steps.concat([
        new TransitionHook(elem, elem.state.self.onExit, locals, fromPath, baseHookOptions)
      ]);
    });

    var enteringStateHooks = map(enteringElements, function (elem) {
      var stepLocals = {$state$: elem.state, $stateParams: elem.state.params.$$values(fromParams)};
      var locals = extend({}, tLocals, stepLocals);
      var lazyResolveStep = hookBuilder.makeLazyResolvePathElementStep(toPath, elem, locals);
      var steps = [lazyResolveStep].concat(hookBuilder.makeSteps("entering", elem.state, from, elem, locals, toPath));

      return !elem.state.self.onEnter ? steps : steps.concat([
        new TransitionHook(elem, elem.state.self.onEnter, locals, toPath, baseHookOptions)
      ]);
    });

    var eagerResolves = hookBuilder.makeEagerResolvePathStep(toPath, tLocals);

    // Set up a promise chain. Add the steps' promises in appropriate order to the promise chain.
    var invalidOrStartHooks = this.$to().valid() ? onStartHooks : onInvalidHooks;
    var asyncSteps = filter(flatten([invalidOrStartHooks, transitionOnHooks, eagerResolves, exitingStateHooks, enteringStateHooks]), identity);

    // -----------------------------------------------------------------------
    // Transition Steps
    // -----------------------------------------------------------------------

    // ---- Synchronous hooks ----
    // Run the "onBefore" hooks and save their promises
    var chain = hookBuilder.runSynchronousHooks(onBeforeHooks);

    // ---- Asynchronous section ----

    // The results of the sync hooks is a promise chain (rejected or otherwise) that begins the async portion of the transition.
    // Build the rest of the chain off the sync promise chain out of all the asynchronous steps
    forEach(asyncSteps, function (step) {
      chain = chain.then(step.invokeStep);
    });

    // When the last step of the chain has resolved or any step has rejected (i.e., the transition is completed),
    // invoke the registered success or error hooks when the transition is completed.
    chain = chain.then(hookBuilder.successHooks()).catch(hookBuilder.errorHooks());

    // Return the overall transition promise, which is resolved/rejected in successHooks/errorHooks
    return this.promise;
  }

  isActive() {
    return isEq(this._options.current, val(this))();
  }

  abort() {
    if (this.isActive()) {
      $transition.transition = null; // TODO
    }
  }

  toString () {
    var fromStateOrName = this.from();
    var toStateOrName = this.to();

    // (X) means the to state is invalid.
    var id = this.$id,
        from = isObject(fromStateOrName) ? fromStateOrName.name : fromStateOrName,
        fromParams = toJson(this.$from().params()),
        toValid = this.$to().valid() ? "" : "(X) ",
        to = isObject(toStateOrName) ? toStateOrName.name : toStateOrName,
        toParams = toJson(this.params());
    return `Transition#${id}( '${from}'${fromParams} -> ${toValid}'${to}'${toParams} )`;
  }
}