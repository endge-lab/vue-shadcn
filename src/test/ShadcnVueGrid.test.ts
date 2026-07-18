import { ENDGE_SFC_RENDER_ADAPTER_REQUIRED_KEYS, Endge } from '@endge/core'
import { describe, expect, it } from 'vitest'
import { h, isVNode } from 'vue'

import { ShadcnVueSFCAdapter } from '@/model/render/sfc/shadcn-vue-sfc-adapter'
import { ShadcnVueRender_Grid } from '@/model/render/sfc/shadcn-vue-renderers'

describe('ShadcnVueRender_Grid', () => {
  it('completes the required adapter contract', () => {
    expect(Object.keys(ShadcnVueSFCAdapter.renderers))
      .toEqual(ENDGE_SFC_RENDER_ADAPTER_REQUIRED_KEYS)
    Endge.uiRegistry.adapters.reset()
    expect(() => Endge.uiRegistry.adapters.register(ShadcnVueSFCAdapter)).not.toThrow()
    Endge.uiRegistry.adapters.reset()
  })

  it('renders Grid tracks and spacing', () => {
    const grid = ShadcnVueRender_Grid({
      h,
      props: { columns: 12, gap: 2, autoRows: '28px' },
      attrs: {},
      children: [],
    })

    expect(isVNode(grid)).toBe(true)
    if (!isVNode(grid)) return
    expect(grid.props?.class).toContain('endge-shadcn-grid')
    expect(grid.props?.style).toMatchObject({
      display: 'grid',
      gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
      gridAutoRows: '28px',
      gap: '8px',
    })
  })
})
