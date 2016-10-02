/** @module ng2_directives */ /** */
import {Directive, Input, ElementRef, Host, Renderer} from "@angular/core";
import {UISrefStatus, SrefStatus} from "./uiSrefStatus";
import {Subscription} from "rxjs/Rx";

/**
 * A directive that adds a CSS class when its associated `uiSref` link is active.
 *
 * ### Purpose
 *
 * This directive should be paired with one (or more) [[UISref]] directives.
 * It will apply a CSS class to its element when the state the `uiSref` targets is activated.
 *
 * This can be used to create navigation UI where the active link is highlighted.
 *
 * ### Selectors
 *
 * - `[uiSrefActive]`: When this selector is used, the class is added when the target state or any
 * child of the target state is active
 * - `[uiSrefActiveEq]`: When this selector is used, the class is added when the target state is
 * exactly active (the class is not added if a child of the target state is active).
 *
 * ### Inputs
 *
 * - `uiSrefActive`/`uiSrefActiveEq`: one or more CSS classes to add to the element, when the `uiSref` is active
 *
 * #### Example:
 * The anchor tag has the `active` class added when the `foo` state is active.
 * ```html
 * <a uiSref="foo" uiSrefActive="active">Foo</a>
 * ```
 *
 * ### Matching parameters
 *
 * If the `uiSref` includes parameters, the current state must be active, *and* the parameter values must match.
 *
 * #### Example:
 * The first anchor tag has the `active` class added when the `foo.bar` state is active and the `id` parameter
 * equals 25.
 * The second anchor tag has the `active` class added when the `foo.bar` state is active and the `id` parameter
 * equals 32.
 * ```html
 * <a uiSref="foo.bar" [uiParams]="{ id: 25 }" uiSrefActive="active">Bar #25</a>
 * <a uiSref="foo.bar" [uiParams]="{ id: 32 }" uiSrefActive="active">Bar #32</a>
 * ```
 *
 * #### Example:
 * A list of anchor tags are created for a list of `bar` objects.
 * An anchor tag will have the `active` class when `foo.bar` state is active and the `id` parameter matches
 * that object's `id`.
 * ```html
 * <li *ngFor="let bar of bars">
 *   <a uiSref="foo.bar" [uiParams]="{ id: bar.id }" uiSrefActive="active">Bar #{{ bar.id }}</a>
 * </li>
 * ```
 *
 * ### Multiple uiSrefs
 *
 * A single `uiSrefActive` can be used for multiple `uiSref` links.
 * This can be used to create (for example) a drop down navigation menu, where the menui is highlighted
 * if *any* of its inner links are active.
 *
 * The `uiSrefActive` should be placed on an ancestor element of the `uiSref` list.
 * If anyof the `uiSref` links are activated, the class will be added to the ancestor element.
 *
 * #### Example:
 * This is a dropdown nagivation menu for "Admin" states.
 * When any of `admin.users`, `admin.groups`, `admin.settings` are active, the `<li>` for the dropdown
 * has the `dropdown-child-active` class applied.
 * Additionally, the active anchor tag has the `active` class applied.
 * ```html
 * <ul class="dropdown-menu">
 *   <li uiSrefActive="dropdown-child-active" class="dropdown admin">
 *     Admin
 *     <ul>
 *       <li><a uiSref="admin.users" uiSrefActive="active">Users</a></li>
 *       <li><a uiSref="admin.groups" uiSrefActive="active">Groups</a></li>
 *       <li><a uiSref="admin.settings" uiSrefActive="active">Settings</a></li>
 *     </ul>
 *   </li>
 * </ul>
 * ```
 *
 * ---
 *
 * As
 */
@Directive({
  selector: '[uiSrefActive],[uiSrefActiveEq]'
})
export class UISrefActive {

  private _classes: string[] = [];
  @Input('uiSrefActive') set active(val: string) { this._classes = val.split("\s+")};

  private _classesEq: string[] = [];
  @Input('uiSrefActiveEq') set activeEq(val: string) { this._classesEq = val.split("\s+")};

  private _subscription: Subscription;
  constructor(uiSrefStatus: UISrefStatus, rnd: Renderer, @Host() host: ElementRef) {
    this._subscription = uiSrefStatus.uiSrefStatus.subscribe((next: SrefStatus) => {
      this._classes.forEach(cls => rnd.setElementClass(host.nativeElement, cls, next.active));
      this._classesEq.forEach(cls => rnd.setElementClass(host.nativeElement, cls, next.exact));
    });
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }
}
