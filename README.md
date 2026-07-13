# @endge/shadcn-vue

System `shadcn-vue` visual adapter for the Endge Vue SFC renderer.

The package owns its primitive source and CSS so configurator previews do not depend on customer aliases such as `@/components/ui`. It follows shadcn-vue theme tokens and keeps the SFC controls display-only: no runtime update callbacks or two-way bindings are registered.

```ts
import '@endge/shadcn-vue/shadcn-vue.css'

import { Endge } from '@endge/core'
import { EndgeShadcnVuePlugin } from '@endge/shadcn-vue'
import { EndgeVuePlugin } from '@endge/vue'

Endge.use(EndgeVuePlugin)
Endge.use(EndgeShadcnVuePlugin)

await Endge.boot(context)
```

Use `shadcn-vue` as the workspace `defaultSfcAdapterId`. The package only registers the adapter; workspace selection remains owned by Endge.

