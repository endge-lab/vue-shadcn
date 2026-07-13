import type { SourceFieldOption, SourceFieldType } from '@endge/core'
import { isoToDateInput, isoToDateTimeLocalInput, timeToTimeInput } from '@endge/utils'
import type { SFCVueRenderAdapterFunction } from '@endge/vue'

import ShadcnCheckbox from '@/ui/primitives/ShadcnCheckbox.vue'
import ShadcnInput from '@/ui/primitives/ShadcnInput.vue'
import ShadcnSelect from '@/ui/primitives/ShadcnSelect.vue'
import ShadcnTextarea from '@/ui/primitives/ShadcnTextarea.vue'

type SFCInputType = Extract<SourceFieldType, 'String' | 'Number' | 'Date' | 'Time' | 'DateTime'>

export const ShadcnVueRender_Text: SFCVueRenderAdapterFunction = (input) => {
  const content = input.props.value == null ? input.children : String(input.props.value)

  return input.h('span', {
    ...input.attrs,
    class: ['endge-sfc-text', 'endge-shadcn-text', input.props.class],
  }, content)
}

export const ShadcnVueRender_DateTime: SFCVueRenderAdapterFunction = (input) => {
  return input.h('time', {
    ...input.attrs,
    class: ['endge-sfc-datetime', 'endge-shadcn-datetime', input.props.class],
    datetime: input.props.value == null ? undefined : String(input.props.value),
  }, formatDateTime(input.props.value, input.props.format))
}

export const ShadcnVueRender_Number: SFCVueRenderAdapterFunction = (input) => {
  return input.h('span', {
    ...input.attrs,
    class: ['endge-sfc-number', 'endge-shadcn-number', input.props.class],
  }, formatNumber(input.props.value, input.props))
}

export const ShadcnVueRender_Icon: SFCVueRenderAdapterFunction = (input) => {
  const name = input.props.name ?? input.props.icon ?? ''

  return input.h('span', {
    ...input.attrs,
    class: ['endge-sfc-icon', 'endge-shadcn-icon', input.props.class],
    'aria-label': name ? String(name) : undefined,
    role: 'img',
  }, String(name))
}

export const ShadcnVueRender_Badge: SFCVueRenderAdapterFunction = (input) => {
  return input.h('span', {
    ...input.attrs,
    class: ['endge-sfc-badge', 'endge-shadcn-badge', input.props.class],
    'data-tone': normalizeTone(input.props.tone),
  }, input.children)
}

export const ShadcnVueRender_Dot: SFCVueRenderAdapterFunction = (input) => {
  const size = Number(input.props.size ?? 8)

  return input.h('span', {
    ...input.attrs,
    class: ['endge-sfc-dot', 'endge-shadcn-dot', input.props.class],
    'data-tone': normalizeTone(input.props.tone),
    style: {
      ...(input.attrs.style as Record<string, string> | undefined),
      width: `${Number.isFinite(size) ? size : 8}px`,
      height: `${Number.isFinite(size) ? size : 8}px`,
    },
  })
}

export const ShadcnVueRender_Box: SFCVueRenderAdapterFunction = (input) => {
  return input.h('div', {
    ...input.attrs,
    class: ['endge-sfc-box', 'endge-shadcn-box', input.props.class],
  }, input.children)
}

export const ShadcnVueRender_Flex: SFCVueRenderAdapterFunction = (input) => {
  const isColumn = input.props.col === true || input.props.direction === 'column'

  return input.h('div', {
    ...input.attrs,
    class: ['endge-sfc-flex', 'endge-shadcn-flex', input.props.class],
    style: {
      ...(input.attrs.style as Record<string, string> | undefined),
      display: 'flex',
      flexDirection: isColumn ? 'column' : 'row',
      gap: normalizeGap(input.props.gap),
      alignItems: input.props.align == null ? undefined : String(input.props.align),
      justifyContent: input.props.justify == null ? undefined : String(input.props.justify),
      flexWrap: input.props.wrap === true ? 'wrap' : undefined,
    },
  }, input.children)
}

export const ShadcnVueRender_Divider: SFCVueRenderAdapterFunction = (input) => {
  const vertical = input.props.vertical === true || input.props.orientation === 'vertical'

  return input.h('div', {
    ...input.attrs,
    class: ['endge-sfc-divider', 'endge-shadcn-divider', input.props.class],
    role: 'separator',
    'aria-orientation': vertical ? 'vertical' : 'horizontal',
    'data-orientation': vertical ? 'vertical' : 'horizontal',
    style: input.attrs.style,
  })
}

export const ShadcnVueRender_Input: SFCVueRenderAdapterFunction = (input) => {
  const type = normalizeInputType(input.props.type)

  return input.h(ShadcnInput, {
    ...input.attrs,
    class: ['endge-sfc-input', 'endge-shadcn-input', input.props.class],
    type: toNativeInputType(type),
    value: normalizeInputValue(type, input.props.value),
    placeholder: toOptionalString(input.props.placeholder),
    min: input.props.min,
    max: input.props.max,
    step: input.props.step,
    readonly: input.props.readonly === true,
    disabled: input.props.disabled === true,
  })
}

export const ShadcnVueRender_Textarea: SFCVueRenderAdapterFunction = (input) => {
  return input.h(ShadcnTextarea, {
    ...input.attrs,
    class: ['endge-sfc-textarea', 'endge-shadcn-textarea', input.props.class],
    value: input.props.value == null ? '' : String(input.props.value),
    placeholder: toOptionalString(input.props.placeholder),
    rows: input.props.rows == null ? undefined : String(input.props.rows),
    readonly: input.props.readonly === true,
    disabled: input.props.disabled === true,
  })
}

export const ShadcnVueRender_Checkbox: SFCVueRenderAdapterFunction = (input) => {
  return input.h(ShadcnCheckbox, {
    ...input.attrs,
    class: ['endge-sfc-checkbox-field', 'endge-shadcn-checkbox-field', input.props.class],
    checked: input.props.checked === true,
    label: toOptionalString(input.props.label),
    readonly: input.props.readonly === true,
    disabled: input.props.disabled === true,
  })
}

export const ShadcnVueRender_Select: SFCVueRenderAdapterFunction = (input) => {
  const multiple = input.props.multiple === true

  return input.h(ShadcnSelect, {
    ...input.attrs,
    class: ['endge-sfc-select', input.props.class],
    options: normalizeOptions(input.props.options),
    selectedValues: normalizeSelectedValues(input.props.value, multiple),
    placeholder: multiple ? undefined : toOptionalString(input.props.placeholder),
    multiple,
    readonly: input.props.readonly === true,
    disabled: input.props.disabled === true,
  })
}

function normalizeInputType(value: unknown): SFCInputType {
  if (value === 'Number' || value === 'Date' || value === 'Time' || value === 'DateTime')
    return value

  return 'String'
}

function toNativeInputType(type: SFCInputType): string {
  if (type === 'Number') return 'number'
  if (type === 'Date') return 'date'
  if (type === 'Time') return 'time'
  if (type === 'DateTime') return 'datetime-local'
  return 'text'
}

function normalizeInputValue(type: SFCInputType, value: unknown): string | number {
  if (value == null) return ''
  if (type === 'Number') {
    if (typeof value === 'string' && value.trim() === '') return ''
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : ''
  }
  if (type === 'Date') return isoToDateInput(value)
  if (type === 'Time') return timeToTimeInput(value)
  if (type === 'DateTime') return isoToDateTimeLocalInput(value)
  return String(value)
}

function normalizeOptions(value: unknown): SourceFieldOption[] {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is SourceFieldOption => {
    if (!item || typeof item !== 'object' || !Object.prototype.hasOwnProperty.call(item, 'value'))
      return false

    const optionValue = (item as SourceFieldOption).value
    return typeof optionValue === 'string' || typeof optionValue === 'number' || typeof optionValue === 'boolean'
  })
}

function normalizeSelectedValues(value: unknown, multiple: boolean): string[] {
  const values = multiple ? (Array.isArray(value) ? value : []) : [value]
  return values.filter(item => item != null).map(item => String(item))
}

function formatDateTime(value: unknown, format: unknown): string {
  if (value == null) return ''

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  if (format === 'HH:mm') {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }
  if (format === 'date') return new Intl.DateTimeFormat().format(date)

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatNumber(value: unknown, props: Record<string, unknown>): string {
  if (value == null) return ''

  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return String(value)
  const minimumFractionDigits = toOptionalNumber(props.minFractionDigits)
  const maximumFractionDigits = toOptionalNumber(props.maxFractionDigits ?? props.decimals)
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numberValue)

  return `${props.prefix ?? ''}${formatted}${props.suffix ?? ''}`
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

function toOptionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value)
}

function normalizeGap(value: unknown): string | undefined {
  if (value == null || value === false) return undefined
  if (typeof value === 'number') return `${value * 4}px`

  const source = String(value).trim()
  if (source === '') return undefined
  if (/^-?\d+(\.\d+)?$/.test(source)) return `${Number(source) * 4}px`
  return source
}

function normalizeTone(value: unknown): string | undefined {
  return value == null ? undefined : String(value).trim().toLowerCase()
}

