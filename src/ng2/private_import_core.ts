/** @module ng2 */
/**
 * @Kamshak It's imported like this in @angular/compiler as well.
 * Was going to mark it injectable as in
 * https://github.com/angular/angular/blob/42a287fabf6b035d51e00cf3006c27fec00f054a/modules/%40angular/compiler/src/ng_module_resolver.ts
 * but unfortunately not all platforms (namely browser-dynamic) provide it.
 */

import { __core_private__ as r} from '@angular/core';
export type ReflectorReader = typeof r._ReflectorReader;
export var reflector: typeof r.reflector = r.reflector;
