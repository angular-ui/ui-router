import {Injector} from "@angular/core";

export class MergeInjector implements Injector {
  static NOT_FOUND = {};
  private injectors: Injector[];
  constructor(...injectors: Injector[]) {
    if (injectors.length < 2) throw new Error("pass at least two injectors");
    this.injectors = injectors;
  }

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