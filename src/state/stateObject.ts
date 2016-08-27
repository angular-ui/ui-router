/** @module state */ /** for typedoc */

import {StateDeclaration, _ViewDeclaration} from "./interface";
import {extend, defaults, values, find} from "../common/common";
import {propEq} from "../common/hof";
import {Param} from "../params/param";
import {UrlMatcher} from "../url/urlMatcher";
import {Resolvable} from "../resolve/resolvable";
import {TransitionStateHookFn} from "../transition/interface";
import {TargetState} from "./targetState";
import {Transition} from "../transition/transition";

/**
 * @ngdoc object
 * @name ui.router.state.type:State
 *
 * @description
 * Definition object for states. Includes methods for manipulating the state heirarchy.
 *
 * @param {Object} config  A configuration object hash that includes the results of user-supplied
 *        values, as well as values from `StateBuilder`.
 *
 * @returns {Object}  Returns a new `State` object.
 */
export class State {

  public parent: State;
  public name: string;
  public abstract: boolean;
  public resolve: ({ [key: string]: (string|any[]|Function) }|any[]);
  public resolvables: Resolvable[];
  public resolvePolicy: any;
  public url: UrlMatcher;
  /** @hidden temporary place to put the rule registered with $urlRouter.when() */
  public _urlRule: any;
  public params: { [key: string]: Param };
  public views: { [key: string]: _ViewDeclaration; };
  public self: StateDeclaration;
  public navigable: State;
  public path: State[];
  public data: any;
  public includes: { [name: string] : boolean };

  public onExit: TransitionStateHookFn;
  public onRetain: TransitionStateHookFn;
  public onEnter: TransitionStateHookFn;
  public lazyLoad: (transition: Transition) => Promise<StateDeclaration[]>;

  redirectTo: (
      string |
      (($transition$: Transition) => TargetState) |
      { state: (string|StateDeclaration), params: { [key: string]: any }}
  );


  constructor(config?: StateDeclaration) {
    extend(this, config);
    // Object.freeze(this);
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:State#is
   * @methodOf ui.router.state.type:State
   *
   * @description
   * Compares the identity of the state against the passed value, which is either an object
   * reference to the actual `State` instance, the original definition object passed to
   * `$stateProvider.state()`, or the fully-qualified name.
   *
   * @param {Object} ref Can be one of (a) a `State` instance, (b) an object that was passed
   *        into `$stateProvider.state()`, (c) the fully-qualified name of a state as a string.
   * @returns {boolean} Returns `true` if `ref` matches the current `State` instance.
   */
  is(ref: State|StateDeclaration|string): boolean {
    return this === ref || this.self === ref || this.fqn() === ref;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:State#fqn
   * @methodOf ui.router.state.type:State
   *
   * @description
   * Returns the fully-qualified name of the state, based on its current position in the tree.
   *
   * @returns {string} Returns a dot-separated name of the state.
   */
  fqn(): string {
    if (!this.parent || !(this.parent instanceof this.constructor)) return this.name;
    let name = this.parent.fqn();
    return name ? name + "." + this.name : this.name;
  }

  /**
   * @ngdoc function
   * @name ui.router.state.type:State#root
   * @methodOf ui.router.state.type:State
   *
   * @description
   * Returns the root node of this state's tree.
   *
   * @returns {State} The root of this state's tree.
   */
  root(): State {
    return this.parent && this.parent.root() || this;
  }

  parameters(opts?: { inherit: boolean }): Param[] {
    opts = defaults(opts, { inherit: true });
    let inherited = opts.inherit && this.parent && this.parent.parameters() || [];
    return inherited.concat(values(this.params));
  }

  parameter(id: string, opts: any = {}): Param {
    return (
        this.url && this.url.parameter(id, opts) ||
        find(values(this.params), propEq('id', id)) ||
        opts.inherit && this.parent && this.parent.parameter(id)
    );
  }

  toString() {
    return this.fqn();
  }
}
