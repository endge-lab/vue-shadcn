import type {
  ComponentSFCTableColumnMenuDescriptor,
  ComponentSFCTableColumnPinMode,
  ComponentSFCTableColumnPinStateItem,
  ComponentSFCTableSortComparator,
  ComponentSFCTableSortMode,
  ComponentSFCTableSortStateItem,
  RComponentSFC_IR_Node,
} from '@endge/core'
import type {
  SFCVueRenderResult,
  SFCVueRuntimeStateController,
} from '@/domain/types/sfc-render.type'
import type { SFCTableColumnStyleSurfaces, SFCTableStyleContract } from '@/ui/render/sfc/SFCRender_TableStyle'

export interface EndgeShadcnTableColumnSort {
  sortable: boolean
  comparator: ComponentSFCTableSortComparator
  paths: string[]
}

export interface EndgeShadcnTableColumn {
  index: number
  key: string
  title: string
  width: number | null
  minWidth: number
  maxWidth: number
  pinnable: boolean
  sort: EndgeShadcnTableColumnSort | null
  cellNodes: RComponentSFC_IR_Node[]
  styleSurfaces: SFCTableColumnStyleSurfaces
}

export type EndgeShadcnTablePaging = 'pages' | 'virtual'

export interface EndgeShadcnTableProps {
  boundaryId: string
  tableId: string
  runtimeState: SFCVueRuntimeStateController | null
  columns: EndgeShadcnTableColumn[]
  source: Record<string, unknown>[]
  styleContract: SFCTableStyleContract
  rowKey: string
  sortMode: ComponentSFCTableSortMode
  pinMode: ComponentSFCTableColumnPinMode
  columnMenu: ComponentSFCTableColumnMenuDescriptor
  defaultSort: ComponentSFCTableSortStateItem[]
  defaultPin: ComponentSFCTableColumnPinStateItem[]
  rowSize: number
  paging?: EndgeShadcnTablePaging
  pageSize?: number
  pageSizes?: number[]
  lazy?: boolean
  renderVersion: number
  renderCell: (
    column: EndgeShadcnTableColumn,
    row: Record<string, unknown>,
    rowIndex: number,
    rowId: string,
  ) => SFCVueRenderResult
}
