/** @module resolve */ /** for typedoc */
import {Resolvable} from "./resolvable";

export interface Resolvables {
  [key: string]: Resolvable;
}

export interface IOptions1 {
  omitOwnLocals ?: string[];
  resolvePolicy ?: string;
}

// Defines the available policies and their ordinals.
export enum ResolvePolicy {
  LAZY, // Lazy resolves are resolved before their state is entered.
  EAGER // Eager resolves are resolved before the transition starts.
}