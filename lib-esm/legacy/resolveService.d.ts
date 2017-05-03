/** @module ng1 */ /** */
import { Obj } from "@uirouter/core";
/** @hidden */
export declare const resolveFactory: () => {
    resolve: (invocables: {
        [key: string]: Function;
    }, locals?: {}, parent?: Promise<any>) => Promise<Obj>;
};
