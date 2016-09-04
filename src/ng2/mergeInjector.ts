/** @module ng2 */ /** */
import {Injector} from "@angular/core";

/**
 * Merge two injectors
 *
 * This class implements the Injector ng2 interface but delegates
 * to the Injectors provided in the constructor.
 */
export class MergeInjector implements Injector {
  static NOT_FOUND = {};
  private injectors: Injector[];
  constructor(...injectors: Injector[]) {
    if (injectors.length < 2) throw new Error("pass at least two injectors");
    this.injectors = injectors;
  }

  /**
   * Get the token from the first injector which contains it.
   *
   * Delegates to the first Injector.get().
   * If not found, then delegates to the second Injector (and so forth).
   * If no Injector contains the token, return the `notFoundValue`, or throw.
   *
   * @param token the DI token
   * @param notFoundValue the value to return if none of the Injectors contains the token.
   * @returns {any} the DI value
   */
  get(token: any, notFoundValue?: any): any {
    for (let i = 0; i < this.injectors.length; i++) {
      let val = this.injectors[i].get(token, MergeInjector.NOT_FOUND);
      if (val !== MergeInjector.NOT_FOUND) return val;
    }

    if (arguments.length >= 2) return notFoundValue;

    // This will throw the DI Injector error
    this.injectors[0].get(token);
  }
}