import {
  Endge,
  EndgeModule,
  type EndgePlugin,
} from '@endge/core'

import { ShadcnVueSFCAdapter } from '@/model/render/sfc/shadcn-vue-sfc-adapter'

/** Регистрирует системный shadcn-vue adapter в общем UI registry. */
export class EndgeShadcnVueModule extends EndgeModule {
  public override setup(): void {
    Endge.uiRegistry.adapters.register(ShadcnVueSFCAdapter)
  }
}

/** Подключает shadcn-vue adapter к federation до Endge.boot(). */
export const EndgeShadcnVuePlugin: EndgePlugin = {
  id: '@endge/ui-vue-shadcn',
  install(): void {
    Endge.defineModule({
      key: 'shadcnVue',
      module: new EndgeShadcnVueModule(),
      before: 'runtime',
    })
  },
}

