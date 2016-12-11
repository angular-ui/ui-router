/** @module ng1 */ /** */
import { ng as angular } from "./angular";
import { IServiceProviderFactory } from "angular";
import IAnchorScrollService = angular.IAnchorScrollService;
import ITimeoutService = angular.ITimeoutService;

export interface UIViewScrollProvider {
  /**
   * Uses standard anchorScroll behavior
   *
   * Reverts [[$uiViewScroll]] back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
   * service for scrolling based on the url anchor.
   */
  useAnchorScroll(): void;
}


/** @hidden */
function $ViewScrollProvider() {

  var useAnchorScroll = false;

  this.useAnchorScroll = function () {
    useAnchorScroll = true;
  };

  this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll: IAnchorScrollService, $timeout: ITimeoutService): Function {
    if (useAnchorScroll) {
      return $anchorScroll;
    }

    return function ($element: JQuery) {
      return $timeout(function () {
        $element[0].scrollIntoView();
      }, 0, false);
    };
  }];
}

angular.module('ui.router.state').provider('$uiViewScroll', <IServiceProviderFactory> $ViewScrollProvider);
