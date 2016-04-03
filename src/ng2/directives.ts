/**
 * The UI-Router Angular 2 directives:
 *
 * - [[UiView]]: A viewport for routed components
 * - [[UiSref]]: A state ref to a target state; navigates when clicked
 * - [[UiSrefActive]]: (and `UiSrefActiveEq`) Adds a css class when a UiSref's target state (or a child state) is active
 *
 * @preferred @module ng2_directives
 */ /** */
import {UiSref, AnchorUiSref} from "../ng2/uiSref";
import {UiSrefActive} from "../ng2/uiSrefActive";
import {UiView} from "../ng2/uiView";
import {UiSrefStatus} from "./uiSrefStatus";

export * from "./uiView";
export * from "./uiSref";
export * from "./uiSrefStatus";
export * from "./uiSrefActive";

/**
 * References to the UI-Router directive classes, for use within a @Component's `directives:` property
 *
 * @example
 * ```js
 *
 * Component({
 *   selector: 'my-cmp',
 *   directives: [UIROUTER_DIRECTIVES],
 *   template: '<a uiSref="foo">Foo</a>'
 * })
 * ```
 */
export let UIROUTER_DIRECTIVES = [UiSref, AnchorUiSref, UiView, UiSrefActive, UiSrefStatus];
