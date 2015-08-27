import {IPromise} from "angular";
import Resolvable from "./resolvable";

export interface IResolvables {
  [key: string]: Resolvable;
}

export interface IPromises {
  [key: string]: IPromise<any>;
}

export interface IOptions1 {
  omitOwnLocals ?: string[];
  resolvePolicy ?: string;
  trace         ?: boolean;
}

interface IOrdinals { [key: string]: number; }
interface IPolicies { [key: string]: string; }

// TODO: convert to enum
// Defines the available policies and their ordinals.
export enum ResolvePolicy {
  JIT, // JIT resolves are resolved just-in-time, right before an injected function that depends on them is invoked.
  LAZY, // Lazy resolves are resolved before their state is entered.
  EAGER // Eager resolves are resolved before the transition starts.
}