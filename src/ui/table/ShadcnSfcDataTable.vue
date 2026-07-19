<script setup lang="ts">
import type {
  Column,
  ColumnDef,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  PaginationState,
  Row,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/vue-table'
import type { VirtualItem } from '@tanstack/vue-virtual'
import type {
  ComponentSFCTableColumnPinStateItem,
  ComponentSFCTableSortStateItem,
  ContextMenuDescriptor,
  RuntimeBoundaryPatch,
  TableColumnActionContext,
  TableColumnPinSide,
  TableRuntimeActionTarget,
  TableSortDirection,
} from '@endge/core'
import type { CSSProperties } from 'vue'
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { useVirtualizer } from '@tanstack/vue-virtual'
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from '@lucide/vue'
import { Endge, TABLE_RUNTIME_ACTION_IDS } from '@endge/core'
import {
  decorateSFCTableRowWindow,
  getSFCTableCellStyleSurfaces,
  SFC_TABLE_ROW_CLASS_FIELD,
} from '@/ui/render/sfc/SFCRender_TableStyle'
import { SFCVueBoundaryRegistryKey } from '@/ui/render/sfc/SFCRender_BoundaryRegistry'
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
} from 'vue'

import type { EndgeShadcnTableColumn, EndgeShadcnTableProps } from './table.types'
import {
  closeShadcnMenu,
  elementMenuAnchor,
  openShadcnMenu,
  pointMenuAnchor,
} from '@/ui/overlay/shadcn-menu-manager'
import ShadcnTableColumnManager from './ShadcnTableColumnManager.vue'

defineOptions({ name: 'EndgeShadcnSfcDataTable' })

const props = withDefaults(defineProps<EndgeShadcnTableProps>(), {
  paging: 'pages',
  pageSize: 10,
  pageSizes: () => [10, 25, 50, 100],
  lazy: false,
})
const boundaryRegistry = inject(SFCVueBoundaryRegistryKey, null)
const scrollRoot = ref<HTMLElement | null>(null)
const baseRows = shallowRef(copyRows(props.source))

const tableStateKey = computed(() => props.tableId ? `table:${props.tableId}` : null)
const sorting = ref<SortingState>(readInitialSorting())
const columnPinning = ref<ColumnPinningState>(readInitialPinning())
const columnOrder = ref<ColumnOrderState>(readTableState('order', props.columns.map(column => column.key)))
const columnVisibility = ref<VisibilityState>(readTableState('visibility', {}))
const columnSizing = ref<ColumnSizingState>(readTableState('sizing', {}))
const pagination = ref<PaginationState>(readInitialPagination())
const columnDefinitions = computed<ColumnDef<Record<string, unknown>>[]>(() => props.columns.map(column => ({
  id: column.key,
  accessorFn: row => row[column.key],
  header: column.title,
  size: column.width ?? 150,
  minSize: column.minWidth,
  maxSize: column.maxWidth,
  enableHiding: true,
  enablePinning: props.pinMode !== 'disabled' && column.pinnable,
  enableSorting: props.sortMode !== 'disabled' && column.sort?.sortable === true,
  sortingFn: (left, right) => compareRows(left.original, right.original, column),
  cell: ({ row }) => renderTableCell(column, row),
  meta: {
    title: column.title,
    endgeColumn: column,
  },
})))

const table = useVueTable({
  get data() { return baseRows.value },
  get columns() { return columnDefinitions.value },
  getRowId: (row, index) => normalizeRowId(row[props.rowKey], index),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  enableMultiSort: props.sortMode === 'multiple',
  enableSortingRemoval: props.sortMode !== 'fixed',
  isMultiSortEvent: () => props.sortMode === 'multiple',
  columnResizeMode: 'onChange',
  state: {
    get sorting() { return sorting.value },
    get columnPinning() { return columnPinning.value },
    get columnOrder() { return columnOrder.value },
    get columnVisibility() { return columnVisibility.value },
    get columnSizing() { return columnSizing.value },
    get pagination() { return pagination.value },
  },
  onSortingChange: updater => updateSorting(updater),
  onColumnPinningChange: updater => updatePinning(updater),
  onColumnOrderChange: updater => updateState(columnOrder, updater, 'order'),
  onColumnVisibilityChange: updater => updateState(columnVisibility, updater, 'visibility'),
  onColumnSizingChange: updater => updateState(columnSizing, updater, 'sizing'),
  onPaginationChange: updatePagination,
})

const tableRows = computed(() => props.paging === 'virtual'
  ? table.getPrePaginationRowModel().rows
  : table.getRowModel().rows)
const totalRowCount = computed(() => table.getPrePaginationRowModel().rows.length)
const pageCount = computed(() => Math.max(1, table.getPageCount()))
const currentPage = computed(() => Math.min(pagination.value.pageIndex + 1, pageCount.value))
const pageSizeOptions = computed(() => [...new Set([...props.pageSizes, pagination.value.pageSize])]
  .filter(size => Number.isFinite(size) && size > 0)
  .sort((left, right) => left - right))
const pageOffset = computed(() => props.paging === 'pages'
  ? pagination.value.pageIndex * pagination.value.pageSize
  : 0)
const rowVirtualizer = useVirtualizer<HTMLElement, HTMLTableRowElement>(computed(() => ({
  count: tableRows.value.length,
  estimateSize: () => props.rowSize,
  getItemKey: index => tableRows.value[index]?.id ?? index,
  getScrollElement: () => scrollRoot.value,
  initialRect: { width: 0, height: Math.max(360, props.rowSize * 10) },
  overscan: 10,
})))
const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems())
const virtualRows = computed<VirtualTableRow[]>(() => {
  const items = virtualItems.value
  if (items.length === 0) return []

  const rows = items
    .map(item => tableRows.value[item.index])
    .filter((row): row is Row<Record<string, unknown>> => row != null)
  const styledRows = decorateSFCTableRowWindow(
    rows.map(row => row.original),
    props.columns.length,
    props.styleContract,
    pageOffset.value + items[0]!.index,
    totalRowCount.value,
  )

  return rows.map((row, index) => ({
    virtualItem: items[index]!,
    row,
    styledRow: styledRows[index] ?? row.original,
    rowIndex: pageOffset.value + items[index]!.index,
  }))
})
const virtualRowContexts = computed(() => new Map(
  virtualRows.value.map(entry => [entry.row.id, entry] as const),
))
const virtualBodyHeight = computed(() => tableRows.value.length === 0 ? 96 : rowVirtualizer.value.getTotalSize())
const visibleColumnCount = computed(() => Math.max(1, table.getVisibleLeafColumns().length))
const tableWidth = computed(() => {
  columnSizing.value
  columnVisibility.value
  return `${table.getTotalSize()}px`
})

interface VirtualTableRow {
  virtualItem: VirtualItem
  row: Row<Record<string, unknown>>
  styledRow: Record<string, unknown>
  rowIndex: number
}

const defaultColumnMenu: ContextMenuDescriptor = {
  kind: 'context-menu',
  items: [
    menuItem(TABLE_RUNTIME_ACTION_IDS.sortSetColumnAsc, 'Sort ascending', 'arrow-up'),
    menuItem(TABLE_RUNTIME_ACTION_IDS.sortSetColumnDesc, 'Sort descending', 'arrow-down'),
    { kind: 'separator', id: 'sort-visibility-separator' },
    menuItem(TABLE_RUNTIME_ACTION_IDS.columnHide, 'Hide', 'eye-off'),
  ],
}

const tableActionTarget: TableRuntimeActionTarget = {
  setColumnVisibility: async (columnKey, visible) => {
    table.getColumn(columnKey)?.toggleVisibility(visible)
  },
  setColumnPin: async (columnKey, side) => {
    table.getColumn(columnKey)?.pin(side === 'none' ? false : side)
  },
  resetColumnPin: async (columnKey) => {
    const fallback = props.defaultPin.find(item => item.key === columnKey)?.side ?? false
    table.getColumn(columnKey)?.pin(fallback)
  },
  resetAllPins: async () => {
    columnPinning.value = toTanStackPinning(props.defaultPin)
    persistTableState('pin', toEndgePinning(columnPinning.value))
  },
  setColumnSort: async (columnKey, direction) => setColumnSort(columnKey, direction),
  clearColumnSort: async columnKey => setSorting(sorting.value.filter(item => item.id !== columnKey)),
  clearAllSort: async () => setSorting([]),
}

const unregisterBoundary = boundaryRegistry?.register(props.boundaryId, {
  applyPatch: applyRuntimePatch,
})

watch(
  () => [props.source, props.renderVersion] as const,
  async ([source]) => {
    baseRows.value = copyRows(source)
    await nextTick()
    clampPagination()
  },
)
watch(
  () => props.columns.map(column => column.key).join('|'),
  () => reconcileColumnState(),
)

onBeforeUnmount(() => {
  unregisterBoundary?.()
  closeShadcnMenu(props.boundaryId)
})

function renderTableCell(
  column: EndgeShadcnTableColumn,
  row: Row<Record<string, unknown>>,
) {
  const virtualRow = virtualRowContexts.value.get(row.id)
  return props.renderCell(
    column,
    virtualRow?.styledRow ?? row.original,
    virtualRow?.rowIndex ?? row.index,
    row.id,
  )
}

function updatePagination(updater: Updater<PaginationState>): void {
  const next = resolveUpdater(updater, pagination.value)
  const pageSize = normalizePositiveInteger(next.pageSize, props.pageSize)
  const maxPageIndex = Math.max(0, Math.ceil(totalRowCount.value / pageSize) - 1)
  pagination.value = {
    pageIndex: Math.min(Math.max(0, Math.floor(next.pageIndex)), maxPageIndex),
    pageSize,
  }
  persistTableState('pagination', pagination.value)
  if (scrollRoot.value)
    scrollRoot.value.scrollTop = 0
}

function setPageSize(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  updatePagination({ pageIndex: 0, pageSize: Number(target.value) })
}

function clampPagination(): void {
  updatePagination(pagination.value)
}

function readInitialPagination(): PaginationState {
  const fallback = { pageIndex: 0, pageSize: props.pageSize }
  const stored = readTableState<PaginationState>('pagination', fallback)
  const pageSize = normalizePositiveInteger(stored.pageSize, props.pageSize)
  return {
    pageIndex: Math.min(
      normalizeNonNegativeInteger(stored.pageIndex, 0),
      Math.max(0, Math.ceil(baseRows.value.length / pageSize) - 1),
    ),
    pageSize,
  }
}

function updateSorting(updater: Updater<SortingState>): void {
  if (props.sortMode === 'disabled' || props.sortMode === 'fixed')
    return
  const next = resolveUpdater(updater, sorting.value)
  setSorting(props.sortMode === 'single' ? next.slice(0, 1) : next)
}

function setSorting(next: SortingState): void {
  sorting.value = next
  persistTableState('sort', next.map(item => ({ key: item.id, direction: item.desc ? 'desc' : 'asc' })))
}

function updatePinning(updater: Updater<ColumnPinningState>): void {
  if (props.pinMode === 'disabled')
    return
  columnPinning.value = resolveUpdater(updater, columnPinning.value)
  persistTableState('pin', toEndgePinning(columnPinning.value))
}

function updateState<T>(target: { value: T }, updater: Updater<T>, section: string): void {
  target.value = resolveUpdater(updater, target.value)
  persistTableState(section, target.value)
}

function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === 'function'
    ? (updater as (previous: T) => T)(current)
    : updater
}

function readInitialSorting(): SortingState {
  const fallback = props.sortMode === 'disabled' ? [] : props.defaultSort
  const persisted = readTableState<ComponentSFCTableSortStateItem[]>('sort', fallback)
  const allowed = new Set(props.columns.filter(column => column.sort?.sortable).map(column => column.key))
  const normalized = persisted
    .filter(item => allowed.has(item.key) && (item.direction === 'asc' || item.direction === 'desc'))
    .map(item => ({ id: item.key, desc: item.direction === 'desc' }))
  return props.sortMode === 'single' ? normalized.slice(0, 1) : normalized
}

function readInitialPinning(): ColumnPinningState {
  if (props.pinMode === 'disabled') return { left: [], right: [] }
  return toTanStackPinning(readTableState('pin', props.defaultPin))
}

function readTableState<T>(section: string, fallback: T): T {
  const key = tableStateKey.value
  if (!props.runtimeState || !key)
    return fallback
  return props.runtimeState.get(key, section, fallback)
}

function persistTableState<T>(section: string, value: T): void {
  const key = tableStateKey.value
  if (!props.runtimeState || !key)
    return
  props.runtimeState.set(key, section, value)
}

function reconcileColumnState(): void {
  const keys = props.columns.map(column => column.key)
  columnOrder.value = [
    ...columnOrder.value.filter(key => keys.includes(key)),
    ...keys.filter(key => !columnOrder.value.includes(key)),
  ]
  columnPinning.value = {
    left: (columnPinning.value.left ?? []).filter(key => keys.includes(key)),
    right: (columnPinning.value.right ?? []).filter(key => keys.includes(key)),
  }
}

function setColumnSort(columnKey: string, direction: TableSortDirection): void {
  if (props.sortMode === 'disabled' || props.sortMode === 'fixed') return
  const next = { id: columnKey, desc: direction === 'desc' }
  if (props.sortMode === 'single') {
    setSorting([next])
    return
  }
  const existing = sorting.value.findIndex(item => item.id === columnKey)
  setSorting(existing < 0
    ? [...sorting.value, next]
    : sorting.value.map(item => item.id === columnKey ? next : item))
}

function openColumnMenu(
  column: Column<Record<string, unknown>>,
  event: MouseEvent,
  anchorKind: 'element' | 'point',
): void {
  const descriptor = getColumnDescriptor(column)
  const menu = resolveColumnMenu(descriptor)
  if (!menu) return
  const context = createColumnActionContext(column, descriptor)
  if (!menu.items.some(item => item.kind === 'item' && Endge.runtime.actions.canExecute(item.action, context, item.input)))
    return
  event.preventDefault()
  event.stopPropagation()
  openShadcnMenu({
    ownerId: props.boundaryId,
    anchor: anchorKind === 'element'
      ? elementMenuAnchor(event.currentTarget as Element)
      : pointMenuAnchor(event.clientX, event.clientY),
    menu,
    context,
  })
}

function onColumnHeaderClick(column: Column<Record<string, unknown>>, event: MouseEvent): void {
  if (resolveColumnMenu(getColumnDescriptor(column))) {
    openColumnMenu(column, event, 'element')
    return
  }
  if (column.getCanSort() && props.sortMode !== 'fixed') column.toggleSorting()
}

function resolveColumnMenu(_column: EndgeShadcnTableColumn): ContextMenuDescriptor | null {
  if (props.columnMenu.mode === 'disabled') return null
  if (props.columnMenu.mode === 'inline') return props.columnMenu.menu
  return defaultColumnMenu
}

function createColumnActionContext(
  column: Column<Record<string, unknown>>,
  descriptor: EndgeShadcnTableColumn,
): TableColumnActionContext {
  const sortIndex = sorting.value.findIndex(item => item.id === column.id)
  const defaultPin = props.defaultPin.find(item => item.key === column.id)?.side ?? 'none'
  return {
    surface: 'table-column-header',
    runtimeId: props.runtimeState?.runtimeId ?? props.boundaryId,
    tableRuntimeId: props.runtimeState?.runtimeId ?? props.boundaryId,
    tableId: props.tableId || props.boundaryId,
    target: tableActionTarget,
    columnKey: column.id,
    columnIndex: descriptor.index,
    hideable: column.getCanHide(),
    pinnable: descriptor.pinnable,
    pinMode: props.pinMode,
    pinState: (column.getIsPinned() || 'none') as TableColumnPinSide,
    defaultPinState: defaultPin,
    hasPinChanges: JSON.stringify(toEndgePinning(columnPinning.value)) !== JSON.stringify(props.defaultPin),
    sortable: descriptor.sort?.sortable === true,
    sortMode: props.sortMode,
    sortState: {
      active: sortIndex >= 0,
      direction: sortIndex >= 0 ? (sorting.value[sortIndex]?.desc ? 'desc' : 'asc') : undefined,
      index: sortIndex >= 0 ? sortIndex : undefined,
    },
    activeSortCount: sorting.value.length,
  }
}

async function applyRuntimePatch(patch: RuntimeBoundaryPatch): Promise<boolean> {
  if (patch.kind !== 'collection-projection-update' || patch.boundaryId !== props.boundaryId)
    return false
  const next = copyRows(baseRows.value)
  const rowIndex = resolvePatchedRowIndex(next, patch)
  if (rowIndex < 0) return false
  if (!isPlainObject(patch.itemSnapshot)) return false
  next[rowIndex] = { ...patch.itemSnapshot }
  baseRows.value = next
  await nextTick()
  return true
}

function resolvePatchedRowIndex(rows: Record<string, unknown>[], patch: RuntimeBoundaryPatch): number {
  const key = isPlainObject(patch.itemSnapshot) ? patch.itemSnapshot[props.rowKey] : undefined
  if (key != null) {
    const index = rows.findIndex(row => row[props.rowKey] === key)
    if (index >= 0) return index
  }
  return patch.itemIndex != null && patch.itemIndex >= 0 && patch.itemIndex < rows.length ? patch.itemIndex : -1
}

function getColumnDescriptor(column: Column<Record<string, unknown>>): EndgeShadcnTableColumn {
  return (column.columnDef.meta as any).endgeColumn as EndgeShadcnTableColumn
}

function getPinnedStyle(column: Column<Record<string, unknown>>): CSSProperties {
  const pinned = column.getIsPinned()
  return {
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: pinned ? 'sticky' : 'relative',
    width: `${column.getSize()}px`,
    minWidth: `${column.getSize()}px`,
    maxWidth: `${column.getSize()}px`,
    flex: `0 0 ${column.getSize()}px`,
    zIndex: pinned ? 3 : 1,
  }
}

function getVirtualRowStyle(virtualItem: VirtualItem): CSSProperties {
  return {
    display: 'flex',
    height: `${virtualItem.size}px`,
    position: 'absolute',
    transform: `translateY(${virtualItem.start}px)`,
    width: '100%',
  }
}

function getCellAttrs(row: Record<string, unknown>, column: EndgeShadcnTableColumn): Record<string, unknown> {
  return getSFCTableCellStyleSurfaces(row, column.index)?.cell.attrs ?? {
    part: 'cell',
    'data-endge-part': 'cell',
    class: [],
  }
}

function getRowClass(row: Record<string, unknown>): string | string[] | undefined {
  const value = row[SFC_TABLE_ROW_CLASS_FIELD]
  if (typeof value === 'string') return value
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) return value
  return undefined
}

function getSortIndex(columnId: string): number | null {
  const index = sorting.value.findIndex(item => item.id === columnId)
  return index < 0 ? null : index + 1
}

function compareRows(left: Record<string, unknown>, right: Record<string, unknown>, column: EndgeShadcnTableColumn): number {
  if (!column.sort) return 0
  for (const path of column.sort.paths) {
    const result = compareValues(readPath(left, path), readPath(right, path), column.sort.comparator)
    if (result !== 0) return result
  }
  return 0
}

function compareValues(left: unknown, right: unknown, comparator: string): number {
  const leftEmpty = left == null || left === ''
  const rightEmpty = right == null || right === ''
  if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? 0 : leftEmpty ? 1 : -1
  if (comparator === 'number') return compareNumber(left, right)
  if (comparator === 'date') return compareNumber(Date.parse(String(left)), Date.parse(String(right)))
  if (comparator === 'time') return compareNumber(parseTime(left), parseTime(right))
  if (comparator === 'boolean') return Number(Boolean(left)) - Number(Boolean(right))
  return new Intl.Collator(undefined, { numeric: comparator !== 'text', sensitivity: 'base' })
    .compare(String(left), String(right))
}

function compareNumber(left: unknown, right: unknown): number {
  const a = Number(left)
  const b = Number(right)
  if (!Number.isFinite(a) || !Number.isFinite(b))
    return String(left).localeCompare(String(right), undefined, { numeric: true })
  return a - b
}

function parseTime(value: unknown): number {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0) : Number.NaN
}

function readPath(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').filter(Boolean).reduce<unknown>((value, segment) => {
    return value && typeof value === 'object' ? (value as Record<string, unknown>)[segment] : undefined
  }, row)
}

function toTanStackPinning(value: ComponentSFCTableColumnPinStateItem[]): ColumnPinningState {
  return {
    left: value.filter(item => item.side === 'left').map(item => item.key),
    right: value.filter(item => item.side === 'right').map(item => item.key),
  }
}

function toEndgePinning(value: ColumnPinningState): ComponentSFCTableColumnPinStateItem[] {
  return [
    ...(value.left ?? []).map(key => ({ key, side: 'left' as const })),
    ...(value.right ?? []).map(key => ({ key, side: 'right' as const })),
  ]
}

function copyRows(rows: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  return [...rows]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeRowId(value: unknown, index: number): string {
  const normalized = String(value ?? '').trim()
  return normalized || String(index)
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const normalized = Math.floor(Number(value))
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  const normalized = Math.floor(Number(value))
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : fallback
}

function menuItem(id: string, label: string, icon: string) {
  return { kind: 'item' as const, id, label, action: id, icon }
}
</script>

<template>
  <div
    class="endge-shadcn-table"
    :data-paging="paging"
    :data-lazy="lazy ? 'true' : undefined"
    :style="{ '--endge-table-row-size': `${rowSize}px` }"
  >
    <div class="endge-shadcn-table__toolbar">
      <div class="endge-shadcn-table__summary">
        <span>{{ totalRowCount }}</span>
        <span class="endge-shadcn-table__summary-label">строк</span>
      </div>
      <ShadcnTableColumnManager v-if="columns.length > 1" :table="table" />
    </div>

    <div
      ref="scrollRoot"
      v-bind="styleContract.grid.attrs"
      class="endge-shadcn-table__viewport"
    >
      <table
        data-slot="table"
        data-virtualized="true"
        :data-row-count="totalRowCount"
        :data-page-row-count="tableRows.length"
        class="endge-shadcn-table__table"
        :style="{ width: tableWidth }"
      >
        <thead v-bind="styleContract.header.attrs" class="endge-shadcn-table__header">
          <tr>
            <th
              v-for="header in table.getFlatHeaders()"
              :key="header.id"
              v-bind="getColumnDescriptor(header.column).styleSurfaces.headerCell.attrs"
              class="endge-shadcn-table__head"
              :class="{ 'endge-shadcn-table__head--pinned': header.column.getIsPinned() }"
              :style="getPinnedStyle(header.column)"
              @contextmenu="openColumnMenu(header.column, $event, 'point')"
            >
              <button
                type="button"
                class="endge-shadcn-table__sort"
                :class="{ 'endge-shadcn-table__sort--enabled': header.column.getIsSorted() }"
                :disabled="!header.column.getCanSort() && !resolveColumnMenu(getColumnDescriptor(header.column))"
                @click="onColumnHeaderClick(header.column, $event)"
              >
                <span v-bind="getColumnDescriptor(header.column).styleSurfaces.headerContent.attrs" class="endge-shadcn-table__head-title">
                  <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                </span>
                <span v-if="header.column.getCanSort()" class="endge-shadcn-table__sort-icon">
                  <ArrowUp v-if="header.column.getIsSorted() === 'asc'" :size="14" />
                  <ArrowDown v-else-if="header.column.getIsSorted() === 'desc'" :size="14" />
                  <ChevronsUpDown v-else :size="14" />
                  <span v-if="getSortIndex(header.column.id) != null && sorting.length > 1" class="endge-shadcn-table__sort-index">
                    {{ getSortIndex(header.column.id) }}
                  </span>
                </span>
              </button>
              <div
                v-if="header.column.getCanResize()"
                class="endge-shadcn-table__resizer"
                :class="{ 'endge-shadcn-table__resizer--active': header.column.getIsResizing() }"
                @mousedown="header.getResizeHandler()($event)"
                @touchstart="header.getResizeHandler()($event)"
                @dblclick="header.column.resetSize()"
              />
            </th>
          </tr>
        </thead>

        <tbody
          v-bind="styleContract.body.attrs"
          class="endge-shadcn-table__body"
          :style="{ height: `${virtualBodyHeight}px` }"
        >
          <tr
            v-for="virtualRow in virtualRows"
            :key="String(virtualRow.virtualItem.key)"
            :data-index="virtualRow.rowIndex"
            class="endge-shadcn-table__row"
            :class="getRowClass(virtualRow.styledRow)"
            :style="getVirtualRowStyle(virtualRow.virtualItem)"
          >
            <td
              v-for="cell in virtualRow.row.getVisibleCells()"
              :key="cell.id"
              v-bind="getCellAttrs(virtualRow.styledRow, getColumnDescriptor(cell.column))"
              class="endge-shadcn-table__cell"
              :class="{ 'endge-shadcn-table__cell--pinned': cell.column.getIsPinned() }"
              :style="getPinnedStyle(cell.column)"
            >
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
          <tr v-if="tableRows.length === 0">
            <td :colspan="visibleColumnCount" class="endge-shadcn-table__empty">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer v-if="paging === 'pages'" class="endge-shadcn-table__pagination" aria-label="Table pagination">
      <div class="endge-shadcn-table__pagination-controls">
        <label class="endge-shadcn-table__page-size">
          <span>Rows per page</span>
          <span class="endge-shadcn-table__page-size-select">
            <select :value="pagination.pageSize" aria-label="Rows per page" @change="setPageSize">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </span>
        </label>

        <span class="endge-shadcn-table__page-label">Page {{ currentPage }} of {{ pageCount }}</span>

        <div class="endge-shadcn-table__page-buttons">
          <button
            type="button"
            aria-label="First page"
            :disabled="!table.getCanPreviousPage()"
            @click="table.setPageIndex(0)"
          >
            <ChevronsLeft :size="16" />
          </button>
          <button
            type="button"
            aria-label="Previous page"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            <ChevronLeft :size="16" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            <ChevronRight :size="16" />
          </button>
          <button
            type="button"
            aria-label="Last page"
            :disabled="!table.getCanNextPage()"
            @click="table.setPageIndex(pageCount - 1)"
          >
            <ChevronsRight :size="16" />
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>
