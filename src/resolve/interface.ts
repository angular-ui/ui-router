/** @module resolve */ /** for typedoc */
import {Resolvable} from "./resolvable";

export interface Resolvables {
  [key: string]: Resolvable;
}

/**
 * A plain object used to describe a [[Resolvable]]
 *
 * These objects may be defined in [[StateDefinition.resolve]] blocks to declare
 * async data that the state or substates require.
 */
export interface ResolvableLiteral {
  /** The Dependency Injection token that will be used to inject/access the resolvable */
  token: any;

  /**
   * The function that returns one of:
   *
   * - The resolved value (synchronously)
   * - A promise for the resolved value
   * - An Observable of the resolved value(s)
   *
   * This function will be provided the dependencies listed in [[deps]] as its arguments.
   * The resolve system will asynchronously fetch the dependencies before invoking this function.
   */
  resolveFn: Function;

  /** A policy that defines when to invoke the resolve, and whether to wait for async and unwrap the data */
  policy?: ResolvePolicy;

  /**
   * The Dependency Injection tokens for dependencies of the [[resolveFn]].
   * The DI tokens are references to other `Resolvables`, or to global services.
   */
  deps?: any[];

  /** Pre-resolved value. */
  data?: any
}

/**
 * Defines how a resolve is processed during a transition
 *
 * This object is the [[StateDeclaration.resolvePolicy]] property.
 *
 * @example
 * ```js
 *
 * // Fetched when the resolve's state is being entered.
 * // Wait for the promise to resolve.
 * var policy1 = { when: "LAZY", async: "WAIT" }
 *
 * // Fetched when the Transition is starting.
 * // Do not wait for the returned promise to resolve.
 * // Inject the raw promise/value
 * var policy2 = { when: "EAGER", async: "NOWAIT" }
 * ```
 *
 * The policy for a given Resolvable is merged from three sources (highest priority first):
 *
 * 1) Individual resolve definition
 * 2) State definition
 * 3) Global default
 *
 * @example
 * ```js
 *
 * // Wait for an Observable to emit one item.
 * // Since `wait` is not specified, it uses the `wait`
 * // policy defined on the state, or the global default
 * // if no `wait` policy is defined on the state
 * var myResolvablePolicy = { async: "RXWAIT" }
 * ```
 */
export interface ResolvePolicy {
  /**
   * Defines when a Resolvable is resolved (fetched) during a transition
   *
   * - `LAZY` (default) resolved as the resolve's state is being entered
   * - `EAGER` resolved as the transition is starting
   */
  when?: PolicyWhen;

  /**
   * Determines the unwrapping behavior of asynchronous resolve values.
   *
   * - `WAIT` (default) if a promise is returned from the resolveFn, wait for the promise before proceeding
   * - `NOWAIT` if a promise is returned from the resolve, do not wait for the promise.
   *            The promise will not be unwrapped.
   *            The promise itself will be provided when the resolve is injected or bound elsewhere.
   * - `RXWAIT` When an Observable is returned from the resolveFn, wait until the Observable emits at least one item.
   *            The Observable item will not be unwrapped.
   *            The Observable stream itself will be provided when the resolve is injected or bound elsewhere.
   */
  async?: PolicyAsync;
}

export type PolicyWhen = "LAZY" | "EAGER" ;
export type PolicyAsync = "WAIT" | "NOWAIT" | "RXWAIT" ;

export let resolvePolicies = {
  when: {
    LAZY: "LAZY",
    EAGER: "EAGER"
  },
  async: {
    WAIT: "WAIT",
    NOWAIT: "NOWAIT",
    RXWAIT: "RXWAIT"
  }
};
