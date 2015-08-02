import Resolvable from "./resolvable";
import {IPromise} from "angular"

export interface IResolvables { 
	[key:string]: Resolvable 
}

export interface IPromises {
	[key:string]: IPromise<any>
}