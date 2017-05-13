/** @module ng1 */ /** */
import { ng as angular } from "./angular";
/** @hidden */
function $ViewScrollProvider() {
    var useAnchorScroll = false;
    this.useAnchorScroll = function () {
        useAnchorScroll = true;
    };
    this.$get = ['$anchorScroll', '$timeout', function ($anchorScroll, $timeout) {
            if (useAnchorScroll) {
                return $anchorScroll;
            }
            return function ($element) {
                return $timeout(function () {
                    $element[0].scrollIntoView();
                }, 0, false);
            };
        }];
}
angular.module('ui.router.state').provider('$uiViewScroll', $ViewScrollProvider);
//# sourceMappingURL=viewScroll.js.map