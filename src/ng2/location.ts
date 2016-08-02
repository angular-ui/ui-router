/** @module ng2 */ /** */
import {HashLocationStrategy, PlatformLocation, LocationStrategy, UrlChangeListener} from "@angular/common";
import {Injectable} from "@angular/core";

import {services} from "../common/coreservices";
import {isDefined} from "../common/predicates";
import {applyPairs} from "../common/common";
import {beforeAfterSubstr} from "../common/strings";

const splitOnHash = beforeAfterSubstr("#");
const splitOnEquals = beforeAfterSubstr("=");
const splitOnQuestionMark = beforeAfterSubstr("?");

@Injectable()
export class UIRouterLocation {
  isHashBang: boolean;
  hashPrefix: string = "";

  constructor(
      public locationStrategy: LocationStrategy,
      public platformLocation: PlatformLocation
  ) {
    this.isHashBang = locationStrategy instanceof HashLocationStrategy;
  }

  init() {
    let loc = <any> services.location;
    let locSt = this.locationStrategy;

    if (this.isHashBang) {
      loc.path = () =>
          splitOnHash(splitOnQuestionMark(locSt.path())[0])[0];
      loc.hash = () =>
          splitOnHash(splitOnHash(this.platformLocation.hash)[1])[1];
    } else {
      let basepath = locSt.getBaseHref();
      let basepathRegExp = new RegExp("^" + basepath);
      let replace = (basepath[basepath.length - 1] === '/') ? "/" : "";
      loc.path = () =>
          splitOnHash(splitOnQuestionMark(locSt.path())[0])[0].replace(basepathRegExp, replace);
      loc.hash = () =>
          splitOnHash(this.platformLocation.hash)[1];
    }


    loc.search = () => {
      let queryString = splitOnHash(splitOnQuestionMark(locSt.path())[1])[0];
      return queryString.split("&").map(kv => splitOnEquals(kv)).reduce(applyPairs, {});
    };

    loc.url = (url: string) => {
      if(isDefined(url)) {
        let split = splitOnQuestionMark(url);
        locSt.pushState(null, null, split[0], split[1]);
      }
      return locSt.path()
    };

    loc.replace = () => {
      console.log(new Error('$location.replace() not impl'))
    };

    loc.onChange = (cb: UrlChangeListener) => locSt.onPopState(cb);

    let locCfg = <any> services.locationConfig;

    locCfg.port = () => null as number;
    locCfg.protocol = () => null as string;
    locCfg.host = () => null as string;
    locCfg.baseHref = () => locSt.getBaseHref();
    locCfg.html5Mode = () => !this.isHashBang;
    locCfg.hashPrefix = (newprefix: string): string => {
      if(isDefined(newprefix)) {
        this.hashPrefix = newprefix;
      }
      return this.hashPrefix;
    };
  }
}

