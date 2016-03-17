/** @module ng2 */ /** */
import {_ViewDeclaration} from "../state/interface";
import {Type} from "angular2/core";

export interface Ng2ViewDeclaration extends _ViewDeclaration {
  component: Type;
}