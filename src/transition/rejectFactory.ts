"use strict";
import {filter, extend, forEach, isNumber} from "../common/common";

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
    function detailString(d) {
      return d && d.toString !== Object.prototype.toString ? d.toString() : JSON.stringify(d);
    }
    var type = this.type, message = this.message, detail = detailString(this.detail);
    return `TransitionRejection(type: ${type}, message: ${message}, detail: ${detail})`;
  }
}


export class RejectFactory {
  constructor($q) {
    this.$q = $q;
  }

  $q;

  superseded(detail, options) {
    var message = "The transition has been superseded by a different transition (see detail).";
    var reason = new TransitionRejection(RejectType.SUPERSEDED, message, detail);
    if (options && options.redirected) {
      reason.redirected = true;
    }
    return extend(this.$q.reject(reason), {reason: reason});
  }

  redirected(detail) {
    return this.superseded(detail, {redirected: true});
  }

  invalid(detail) {
    var message = "This transition is invalid (see detail)";
    var reason = new TransitionRejection(RejectType.INVALID, message, detail);
    return extend(this.$q.reject(reason), {reason: reason});
  }

  ignored(detail) {
    var message = "The transition was ignored.";
    var reason = new TransitionRejection(RejectType.IGNORED, message, detail);
    return extend(this.$q.reject(reason), {reason: reason});
  }

  aborted(detail) {
    // TODO think about how to encapsulate an Error() object
    var message = "The transition has been aborted.";
    var reason = new TransitionRejection(RejectType.ABORTED, message, detail);
    return extend(this.$q.reject(reason), {reason: reason});
  }
}
