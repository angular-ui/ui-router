 // Without importing something, TSC complains that this file isn't a module
import {noop} from "../common/common"; 

export interface IRawParams {
	[key: string]: any
}