import type { ComponentSFCRuntimeHost } from '@endge/core'
import {
  compileComponentSFC,
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
  Endge,
} from '@endge/core'
import {
  SFC_Renderer,
  SFC_VUE_RENDER_ADAPTER_REQUIRED_KEYS,
} from '@endge/ui-vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

import {
  SHADCN_VUE_SFC_ADAPTER_ID,
  ShadcnVueSFCAdapter,
} from '@/model/render/sfc/shadcn-vue-sfc-adapter'

const TABLE_SOURCE = `<script setup lang="ts">
defineProps<{
  rows: unknown[]
}>()
</script>

<template>
  <Table id="flights" :rows="rows" row-key="id" sort-mode="multiple">
    <Column key="flight" title="Flight" sortable>
      <Cell><Badge tone="info">{{ row.flight }}</Badge></Cell>
    </Column>
    <Column key="gate" title="Gate">
      <Cell><Text>{{ row.gate }}</Text></Cell>
    </Column>
  </Table>
</template>`

const ROWS = [
  { id: '2', flight: 'SU 200', gate: 'B12' },
  { id: '1', flight: 'SU 100', gate: 'A04' },
]

describe('ShadcnVueRender_Table', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
    })
    Endge.uiRegistry.adapters.reset()
    Endge.uiRegistry.adapters.register(ShadcnVueSFCAdapter)
    Endge.uiRegistry.adapters.activate({
      id: SHADCN_VUE_SFC_ADAPTER_ID,
      protocol: ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
      protocolVersion: ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
      renderer: 'vue',
      requiredRendererKeys: SFC_VUE_RENDER_ADAPTER_REQUIRED_KEYS,
    })
  })

  afterEach(() => {
    Endge.uiRegistry.adapters.reset()
    vi.unstubAllGlobals()
  })

  it('renders nested SFC primitives inside TanStack cells and sorts rows', async () => {
    const mounted = await mountTable()

    expect(mounted.root.querySelectorAll('.endge-shadcn-badge')).toHaveLength(2)
    expect(readFlights(mounted.root)).toEqual(['SU 200', 'SU 100'])

    const sortButton = mounted.root.querySelector<HTMLButtonElement>('.endge-shadcn-table__sort')
    sortButton?.click()
    await nextTick()

    expect(readFlights(mounted.root)).toEqual(['SU 100', 'SU 200'])
    expect(mounted.root.querySelector('.endge-shadcn-table__sort-index')).toBeNull()
    mounted.unmount()
  })

  it('restores column order and allows visibility changes from the column manager', async () => {
    const runtimeState = {
      runtimeId: 'runtime-test',
      storageKey: 'runtime-test',
      get: vi.fn((_entity: string, section: string, fallback: unknown) => {
        return section === 'order' ? ['gate', 'flight'] : fallback
      }),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    }
    const host = {
      id: 'host-test',
      entityIdentity: 'table-test',
      runtimeState,
    } as unknown as ComponentSFCRuntimeHost
    const mounted = await mountTable(host)

    expect(readHeaders(mounted.root)).toEqual(['Gate', 'Flight'])

    mounted.root.querySelector<HTMLButtonElement>('.endge-shadcn-table-column-manager__trigger')?.click()
    await nextTick()
    const gateVisibility = [...mounted.root.querySelectorAll<HTMLButtonElement>('[role="checkbox"]')]
      .find(button => button.textContent?.includes('Gate'))
    gateVisibility?.click()
    await nextTick()

    expect(readHeaders(mounted.root)).toEqual(['Flight'])
    expect(runtimeState.set).toHaveBeenCalledWith('table:flights', 'visibility', { gate: false })
    mounted.unmount()
  })
})

async function mountTable(host: ComponentSFCRuntimeHost | null = null) {
  const result = compileComponentSFC(TABLE_SOURCE)
  if (!result.ir)
    throw new Error(`Table source failed to compile: ${JSON.stringify(result.diagnostics)}`)

  const root = document.createElement('div')
  const app = createApp({
    render: () => h(SFC_Renderer, {
      ir: result.ir,
      props: { rows: ROWS },
      host,
    }),
  })
  app.mount(root)
  await nextTick()

  return { root, unmount: () => app.unmount() }
}

function readFlights(root: HTMLElement): string[] {
  return [...root.querySelectorAll('.endge-shadcn-table__row .endge-shadcn-badge')]
    .map(cell => cell.textContent?.trim() ?? '')
}

function readHeaders(root: HTMLElement): string[] {
  return [...root.querySelectorAll('.endge-shadcn-table__head-title')]
    .map(cell => cell.textContent?.trim() ?? '')
}
