# @endge/ui-vue-shadcn

Self-contained `vue-shadcn` UI adapter for Endge.

The package owns its primitive source and CSS, so configurator previews do not depend on customer aliases such as `@/components/ui`. Its controls use the same Shadcn tokens and restrained visual language as Starter Template.

It implements every visual SFC adapter tag. The compound `Table` tag uses TanStack Table with pagination and TanStack Virtual enabled by default. The default page size is 100 rows, and virtualization is applied inside the active page. It supports nested SFC cell components, sorting, pinning, resizing, column order and visibility, runtime-state persistence, EndgeCSS surfaces, context menus, and runtime boundary patches. Adapter renderers remain display-only: runtime update callbacks and two-way bindings stay owned by the render host.

```vue
<Table
  id="flights"
  :rows="rows"
  row-key="id"
  page-size="100"
  page-sizes="10,25,50,100"
  lazy
>
  <!-- columns -->
</Table>
```

`lazy` is preserved as a renderer-neutral Table capability and both bundled adapters recognize it. At this stage it still paginates the materialized `rows` collection. Real server loading requires a Core data-request contract carrying page, page size, total row count, loading state, and a Query reload command; the adapters intentionally do not issue network requests themselves.

```ts
import '@endge/ui-vue-shadcn/vue-shadcn.css'

import { Endge } from '@endge/core'
import { EndgeVueShadcnPlugin } from '@endge/ui-vue-shadcn'

Endge.use(EndgeVueShadcnPlugin)

await Endge.boot(context)
```

Use `vue-shadcn` as the workspace `defaultSfcAdapterId`. The package only registers the adapter; workspace selection remains owned by Endge.

This package does not import or inherit `@endge/ui-vue`. It owns its SFC render engine, DOM style runtime, runtime bridge, generated Filter view, Root Shell, and a single global context-menu manager. The adapter publishes opaque `shell`, `sfc`, `sfc-runtime`, and `filter-view` roots through the Core registry, so the application host selects the complete frontend path from the workspace adapter.

The current roots are Vue components because this package is the Vue Shadcn adapter. Core treats them as opaque implementations; a future React or Canvas adapter can expose a different host contract without inheriting this package.
