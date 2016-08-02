/** @module transition */ /** for typedoc */
"use strict";
import {extend, silentRejection} from "../common/common";
import {stringify} from "../common/strings";

export enum RejectType {
  SUPERSEDED = 2, ABORTED = 3, INVALID = 4, IGNORED = 5, ERROR = 6
}

export class Rejection {
  type: number;
  message: string;
  detail: string;
  redirected: boolean;

  constructor(type: number, message?: string, detail?: string) {
    this.type = type;
    this.message = message;
    this.detail = detail;
  }

  toString() {
    const detailString = (d: any) => 
        d && d.toString !== Object.prototype.toString ? d.toString() : stringify(d);
    let type = this.type, message = this.message, detail = detailString(this.detail);
    return `TransitionRejection(type: ${type}, message: ${message}, detail: ${detail})`;
  }

  toPromise() {
    return extend(silentRejection(this), { _transitionRejection: this });
  }

  /** Returns true if the obj is a rejected promise created from the `asPromise` factory */
  static isTransitionRejectionPromise(obj: any) {
    return obj && (typeof obj.then === 'function') && obj._transitionRejection instanceof Rejection;
  }

  /** Returns a TransitionRejection due to transition superseded */
  static superseded(detail?: any, options?: any) {
    let message = "The transition has been superseded by a different transition";
    let rejection = new Rejection(RejectType.SUPERSEDED, message, detail);
    if (options && options.redirected) {
      rejection.redirected = true;
    }
    return rejection;
  }

  /** Returns a TransitionRejection due to redirected transition */
  static redirected(detail?: any) {
    return Rejection.superseded(detail, {redirected: true});
  }

  /** Returns a TransitionRejection due to invalid transition */
  static invalid(detail?: any) {
    let message = "This transition is invalid";
    return new Rejection(RejectType.INVALID, message, detail);
  }

  /** Returns a TransitionRejection due to ignored transition */
  static ignored(detail?: any) {
    let message = "The transition was ignored";
    return new Rejection(RejectType.IGNORED, message, detail);
  }

  /** Returns a TransitionRejection due to aborted transition */
  static aborted(detail?: any) {
    // TODO think about how to encapsulate an Error() object
    let message = "The transition has been aborted";
    return new Rejection(RejectType.ABORTED, message, detail);
  }

  /** Returns a TransitionRejection due to aborted transition */
  static errored(detail?: any) {
    // TODO think about how to encapsulate an Error() object
    let message = "The transition errored";
    return new Rejection(RejectType.ERROR, message, detail);
  }
}
