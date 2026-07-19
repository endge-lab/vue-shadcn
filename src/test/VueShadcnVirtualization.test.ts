import type { EndgeStyleMatchNode } from '@endge/core'
import type {
  SFCVueRenderContext,
} from '@/domain/types/sfc-render.type'
import type {
  SFCTableColumnStyleSurfaces,
  SFCTablePublicPart,
  SFCTablePublicSurface,
  SFCTableStyleContract,
} from '@/ui/render/sfc/SFCRender_TableStyle'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'

import type { EndgeShadcnTableColumn } from '@/ui/table/table.types'
import ShadcnSfcDataTable from '@/ui/table/ShadcnSfcDataTable.vue'

describe('VueShadcnSfcDataTable virtualization', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses pagination defaults with lazy and virtualizes the active page', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)

    const rows = Array.from({ length: 6_000 }, (_, index) => ({
      id: String(index),
      flight: `SU ${String(index).padStart(4, '0')}`,
      gate: `A${index % 30}`,
    }))
    const root = document.createElement('div')
    const app = createApp({
      render: () => h(ShadcnSfcDataTable, {
        boundaryId: 'virtualization-test',
        tableId: 'flights',
        runtimeState: null,
        columns: createColumns(),
        source: rows,
        styleContract: createStyleContract(),
        rowKey: 'id',
        sortMode: 'multiple',
        pinMode: 'disabled',
        columnMenu: { mode: 'disabled', menu: null, diagnostics: [] },
        defaultSort: [],
        defaultPin: [],
        rowSize: 40,
        lazy: true,
        renderVersion: 0,
        renderCell: (column, row) => h('span', String(row[column.key] ?? '')),
      }),
    })

    app.mount(root)
    await nextTick()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const table = root.querySelector<HTMLTableElement>('[data-virtualized="true"]')
    const initialRows = root.querySelectorAll<HTMLElement>('.endge-shadcn-table__row')
    expect(table?.dataset.rowCount).toBe('6000')
    expect(table?.dataset.pageRowCount).toBe('10')
    expect(root.querySelector('.endge-shadcn-table')?.getAttribute('data-paging')).toBe('pages')
    expect(root.querySelector('.endge-shadcn-table')?.getAttribute('data-lazy')).toBe('true')
    expect(root.querySelector('.endge-shadcn-table__page-label')?.textContent).toContain('Page 1 of 600')
    expect(initialRows.length).toBeGreaterThan(0)
    expect(initialRows.length).toBeLessThan(40)

    root.querySelector<HTMLButtonElement>('[aria-label="Last page"]')?.click()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const lastPageIndexes = [...root.querySelectorAll<HTMLElement>('.endge-shadcn-table__row')]
      .map(row => Number(row.dataset.index))
    expect(root.querySelector('.endge-shadcn-table__page-label')?.textContent).toContain('Page 600 of 600')
    expect(Math.min(...lastPageIndexes)).toBeGreaterThanOrEqual(5_990)
    expect(lastPageIndexes.length).toBeLessThan(40)

    app.unmount()
  })

  it('virtualizes the complete local collection without rendering pagination', async () => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(400)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800)

    const rows = Array.from({ length: 6_000 }, (_, index) => ({
      id: String(index),
      flight: `SU ${String(index).padStart(4, '0')}`,
      gate: `A${index % 30}`,
    }))
    const root = document.createElement('div')
    const app = createApp({
      render: () => h(ShadcnSfcDataTable, {
        boundaryId: 'virtualization-all-rows-test',
        tableId: 'flights-virtual',
        runtimeState: null,
        columns: createColumns(),
        source: rows,
        styleContract: createStyleContract(),
        rowKey: 'id',
        sortMode: 'multiple',
        pinMode: 'disabled',
        columnMenu: { mode: 'disabled', menu: null, diagnostics: [] },
        defaultSort: [],
        defaultPin: [],
        rowSize: 40,
        paging: 'virtual',
        renderVersion: 0,
        renderCell: (column, row) => h('span', String(row[column.key] ?? '')),
      }),
    })

    app.mount(root)
    await nextTick()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const table = root.querySelector<HTMLTableElement>('[data-virtualized="true"]')
    const initialRows = root.querySelectorAll<HTMLElement>('.endge-shadcn-table__row')
    expect(table?.dataset.rowCount).toBe('6000')
    expect(table?.dataset.pageRowCount).toBe('6000')
    expect(root.querySelector('.endge-shadcn-table')?.getAttribute('data-paging')).toBe('virtual')
    expect(root.querySelector('.endge-shadcn-table__pagination')).toBeNull()
    expect(initialRows.length).toBeGreaterThan(0)
    expect(initialRows.length).toBeLessThan(40)

    const viewport = root.querySelector<HTMLElement>('.endge-shadcn-table__viewport')!
    viewport.scrollTop = 5_000 * 40
    viewport.dispatchEvent(new Event('scroll'))
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    const scrolledIndexes = [...root.querySelectorAll<HTMLElement>('.endge-shadcn-table__row')]
      .map(row => Number(row.dataset.index))
    expect(Math.min(...scrolledIndexes)).toBeGreaterThan(4_980)
    expect(scrolledIndexes.length).toBeLessThan(40)

    app.unmount()
  })
})

function createColumns(): EndgeShadcnTableColumn[] {
  return ['flight', 'gate'].map((key, index) => ({
    index,
    key,
    title: key === 'flight' ? 'Flight' : 'Gate',
    width: 160,
    minWidth: 80,
    maxWidth: 400,
    pinnable: false,
    sort: null,
    cellNodes: [],
    styleSurfaces: {
      headerCell: createSurface('header-cell', index + 1, 2),
      headerContent: createSurface('header-content'),
    } satisfies SFCTableColumnStyleSurfaces,
  }))
}

function createStyleContract(): SFCTableStyleContract {
  const context = {
    props: {},
    locals: {},
    iteration: null,
    renderVersion: 0,
    host: null,
    runtimeState: null,
    componentStack: [],
    consumerScope: 'virtualization-test',
    styleArtifacts: [],
    styleParent: undefined,
    styleSiblings: [],
    styleSiblingCount: 0,
    styleOwnerScopeId: undefined,
    runtimeScopeIds: [],
  } satisfies SFCVueRenderContext

  return {
    context,
    grid: createSurface('grid'),
    header: createSurface('header'),
    body: createSurface('body'),
    groupRow: createSurface('group-row'),
  }
}

function createSurface(
  part: SFCTablePublicPart,
  index = 1,
  siblingCount = 1,
): SFCTablePublicSurface {
  const node: EndgeStyleMatchNode = {
    tag: 'Table',
    classes: new Set(),
    attributes: {},
    states: new Set(),
    parts: new Set([part]),
    index,
    siblingCount,
  }
  return {
    node,
    attrs: {
      part,
      'data-endge-part': part,
      class: [],
    },
  }
}
