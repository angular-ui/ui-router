/**
 * The UI-Router Angular 2 directives:
 *
 * - [[UIView]]: A viewport for routed components
 * - [[UISref]]: A state ref to a target state; navigates when clicked
 * - [[UISrefActive]]: (and `UISrefActiveEq`) Adds a css class when a UISref's target state (or a child state) is active
 *
 * @preferred @module ng2_directives
 */ /** */
import {UISref, AnchorUISref} from "./uiSref";
import {UISrefActive} from "./uiSrefActive";
import {UIView} from "./uiView";
import {UISrefStatus} from "./uiSrefStatus";

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
export let UIROUTER_DIRECTIVES = [UISref, AnchorUISref, UIView, UISrefActive, UISrefStatus];
