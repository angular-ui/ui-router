/** @module ng2_directives */ /** */
import {Directive, Input, ElementRef, Host, Renderer} from "angular2/core";
import {UiSrefStatus, SrefStatus} from "./uiSrefStatus";

/**
 * A directive that adds a CSS class when a `uiSref` is active.
 *
 * ### Purpose
 *
 * This directive should be paired with a [[UiSref]], and is used to apply a CSS class to the element when
 * the state that the `uiSref` targets is active.
 *
 * ### Selectors
 *
 * - `[uiSrefActive]`: When this selector is used, the class is added when the target state or any
 * child of the target state is active
 * - `[uiSrefActiveEq]`: When this selector is used, the class is added when the target state is directly active
 *
 * ### Inputs
 *
 * - `uiSrefActive`/`uiSrefActiveEq`: one or more CSS classes to add to the element, when active
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
