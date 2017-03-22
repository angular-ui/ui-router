export interface UIViewScrollProvider {
    /**
     * Uses standard anchorScroll behavior
     *
     * Reverts [[$uiViewScroll]] back to using the core [`$anchorScroll`](http://docs.angularjs.org/api/ng.$anchorScroll)
     * service for scrolling based on the url anchor.
     */
    useAnchorScroll(): void;
}
