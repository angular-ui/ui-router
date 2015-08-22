import ParamValues from "./paramValues";

export interface IRawParams {
    [key: string]: any
}
export type IParamsOrArray = (IRawParams|IRawParams[]|ParamValues);