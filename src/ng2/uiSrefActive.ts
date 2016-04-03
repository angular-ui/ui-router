import {Directive, Input, ElementRef, Host, Renderer} from "angular2/core";
import {UiSrefStatus, SrefStatus} from "./uiSrefStatus";

/**
 * A directive that pairs with a [[UiSref]] and adds a CSS classes when the state which the UiSref targets  (or any
 * child state) is currently active.
 *
 * If the `uiSrefActiveEq` selector is used instead, the class is not added when a child state is active.
 *
 * @selector [uiSrefActive],[uiSrefActiveEq]
 *
 * @example
 * ```html
 *
 * <a uiSref="foo" uiSrefActive="active">Foo</a>
 * <a uiSref="foo.bar" [uiParams]="{ id: bar.id }" uiSrefActive="active">Foo Bar #{{bar.id}}</a>
 * ```
 */
@Directive({
  selector: '[uiSrefActive],[uiSrefActiveEq]'
})
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
