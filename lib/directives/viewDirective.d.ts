import { ActiveUIView } from "ui-router-core";
import { Ng1ViewConfig } from "../statebuilders/views";
import { ng1_directive } from "./stateDirectives";
export declare type UIViewData = {
    $cfg: Ng1ViewConfig;
    $uiView: ActiveUIView;
};
export declare type UIViewAnimData = {
    $animEnter: Promise<any>;
    $animLeave: Promise<any>;
    $$animLeave: {
        resolve: () => any;
    };
};
export declare let uiView: ng1_directive;
