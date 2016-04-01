
import {Directive, Input, ElementRef, Host, Renderer} from "angular2/core";
import {UiSrefStatus, SrefStatus} from "./uiSrefStatus";

@Directive({ selector: '[uiSrefActive],[uiSrefActiveEq]' })
export class UiSrefActive {
  private _classes: string[] = [];
  @Input('uiSrefActive') set active(val) { this._classes = val.split("\s+")};

  private _classesEq: string[] = [];
  @Input('uiSrefActiveEq') set activeEq(val) { this._classesEq = val.split("\s+")};

  constructor(uiSrefStatus: UiSrefStatus, rnd: Renderer, @Host() host: ElementRef) {
    uiSrefStatus.uiSrefStatus.subscribe((next: SrefStatus) => {
      this._classes.forEach(cls => rnd.setElementClass(host.nativeElement, cls, next.active));
      this._classesEq.forEach(cls => rnd.setElementClass(host.nativeElement, cls, next.exact));
    });
  }
}

