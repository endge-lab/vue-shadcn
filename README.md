# @endge/ui-vue-shadcn

System `shadcn-vue` visual adapter for the Endge Vue SFC renderer.

The package owns its primitive source and CSS, so configurator previews do not depend on customer aliases such as `@/components/ui`. Its controls use the same shadcn-vue tokens and restrained visual language as Starter Template.

It implements every visual SFC adapter tag. The compound `Table` tag uses TanStack Table and supports nested SFC cell components, sorting, pinning, resizing, column order and visibility, fixed-row virtualization, runtime-state persistence, EndgeCSS surfaces, context menus, and runtime boundary patches. Adapter renderers remain display-only: runtime update callbacks and two-way bindings stay owned by the render host.

```ts
import '@endge/ui-vue-shadcn/shadcn-vue.css'

import { Endge } from '@endge/core'
import { EndgeShadcnVuePlugin } from '@endge/ui-vue-shadcn'
import { EndgeVuePlugin } from '@endge/ui-vue'

Endge.use(EndgeVuePlugin)
Endge.use(EndgeShadcnVuePlugin)

await Endge.boot(context)
```

Use `shadcn-vue` as the workspace `defaultSfcAdapterId`. The package only registers the adapter; workspace selection remains owned by Endge.

This is an independent visual adapter, not a fallback layer over `native-vue`. The current execution engine and shell are still supplied by `@endge/ui-vue`; moving that engine to a renderer-neutral package is a separate architecture step.
