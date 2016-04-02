import {UiSref, AnchorUiSref} from "../ng2/uiSref";
import {UiSrefActive} from "../ng2/uiSrefActive";
import {UiView} from "../ng2/uiView";
import {UiSrefStatus} from "./uiSrefStatus";

export * from "./uiView";
export * from "./uiSref";
export * from "./uiSrefStatus";
export * from "./uiSrefActive";

export let UIROUTER_DIRECTIVES = [UiSref, AnchorUiSref, UiView, UiSrefActive, UiSrefStatus];
