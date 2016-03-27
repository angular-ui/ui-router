/** @module transition */ /** for typedoc */
"use strict";
import {extend} from "../common/common";
import {services} from "../common/coreservices";
import {stringify} from "../common/strings";

export enum RejectType {
  SUPERSEDED = 2, ABORTED = 3, INVALID = 4, IGNORED = 5
}

export class TransitionRejection {
  type: number;
  message: string;
  detail: string;
  redirected: boolean;

  constructor(type, message, detail) {
    extend(this, {
      type: type,
      message: message,
      detail: detail
    });
  }

  toString() {
    const detailString = d => d && d.toString !== Object.prototype.toString ? d.toString() : stringify(d);
    let type = this.type, message = this.message, detail = detailString(this.detail);
    return `TransitionRejection(type: ${type}, message: ${message}, detail: ${detail})`;
  }
}


export class RejectFactory {
  constructor() {}
  superseded(detail?: any, options?: any) {
    let message = "The transition has been superseded by a different transition (see detail).";
    let reason = new TransitionRejection(RejectType.SUPERSEDED, message, detail);
    if (options && options.redirected) {
      reason.redirected = true;
    }
    return extend(services.$q.reject(reason), {reason: reason});
  }

  redirected(detail?: any) {
    return this.superseded(detail, {redirected: true});
  }

  invalid(detail?: any) {
    let message = "This transition is invalid (see detail)";
    let reason = new TransitionRejection(RejectType.INVALID, message, detail);
    return extend(services.$q.reject(reason), {reason: reason});
  }

  ignored(detail?: any) {
    let message = "The transition was ignored.";
    let reason = new TransitionRejection(RejectType.IGNORED, message, detail);
    return extend(services.$q.reject(reason), {reason: reason});
  }

  aborted(detail?: any) {
    // TODO think about how to encapsulate an Error() object
    let message = "The transition has been aborted.";
    let reason = new TransitionRejection(RejectType.ABORTED, message, detail);
    return extend(services.$q.reject(reason), {reason: reason});
  }
}
