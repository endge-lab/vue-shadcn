import type {
  RComponentSFC_IR_ElementNode,
  RComponentSFC_IR_Tag,
  RComponentSFC_IR_Value,
} from '@endge/core'
import {
  DEFAULT_ENDGE_WORKSPACE,
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
  ENDGE_SFC_RENDER_ADAPTER_REQUIRED_KEYS,
  Endge,
} from '@endge/core'
import {
  createSFCVueRenderContext,
  EndgeVueModule,
  NativeVueSFCAdapter,
  renderSFCNode,
  SFC_Renderer,
} from '@endge/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, isVNode, nextTick, type VNode } from 'vue'

import { EndgeShadcnVueModule } from '@/domain/core/endge-shadcn-vue'
import {
  SHADCN_VUE_SFC_ADAPTER_ID,
  ShadcnVueSFCAdapter,
} from '@/model/render/sfc/shadcn-vue-sfc-adapter'

describe('ShadcnVueSFCAdapter', () => {
  beforeEach(() => {
    Endge.uiRegistry.adapters.reset()
    new EndgeShadcnVueModule().setup()
    Endge.uiRegistry.adapters.activate({
      id: SHADCN_VUE_SFC_ADAPTER_ID,
      protocol: ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
      protocolVersion: ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
      renderer: 'vue',
      requiredRendererKeys: ENDGE_SFC_RENDER_ADAPTER_REQUIRED_KEYS,
    })
  })

  afterEach(() => {
    Endge.uiRegistry.adapters.reset()
    Endge.workspace.apply(DEFAULT_ENDGE_WORKSPACE)
  })

  it('registers the complete Vue adapter contract', () => {
    expect(Endge.uiRegistry.adapters.active?.id).toBe('shadcn-vue')
    expect(Object.keys(ShadcnVueSFCAdapter.renderers)).toEqual(ENDGE_SFC_RENDER_ADAPTER_REQUIRED_KEYS)
  })

  it.each([
    ['String', 'text', 'SU 1402'],
    ['Number', 'number', '15'],
    ['Date', 'date', '2026-07-13'],
    ['Time', 'time', '12:34'],
    ['DateTime', 'datetime-local', '2026-07-13T10:20'],
  ])('renders %s through the shadcn input primitive', async (type, nativeType, expectedValue) => {
    const sourceValue = type === 'Date'
      ? '2026-07-13T00:00:00.000Z'
      : type === 'Time'
        ? '12:34:56'
        : type === 'DateTime'
          ? '2026-07-13T10:20'
          : expectedValue
    const mounted = await mountControl('Input', { type, value: sourceValue })
    const input = mounted.root.querySelector('input')

    expect(input?.type).toBe(nativeType)
    expect(input?.value).toBe(expectedValue)
    expect(input?.classList.contains('endge-shadcn-input')).toBe(true)
    mounted.unmount()
  })

  it('renders textarea, checkbox and single/multiple select values', async () => {
    const textarea = await mountControl('Textarea', {
      value: 'Комментарий',
      rows: 4,
    })
    expect(textarea.root.querySelector('textarea')?.value).toBe('Комментарий')
    textarea.unmount()

    const checkbox = await mountControl('Checkbox', {
      checked: true,
      label: 'Отменённые',
    })
    expect(checkbox.root.querySelector('input')?.checked).toBe(true)
    expect(checkbox.root.textContent).toContain('Отменённые')
    checkbox.unmount()

    const options = [
      { value: 1, label: 'Один' },
      { value: 2, label: 'Два' },
      { value: true, label: 'Да' },
    ]
    const single = await mountControl('Select', { value: '2', options })
    expect(selectedOptions(single.root)).toEqual(['2'])
    single.unmount()

    const multiple = await mountControl('Select', {
      multiple: true,
      value: ['1', true],
      options,
    })
    expect(selectedOptions(multiple.root)).toEqual(['1', 'true'])
    multiple.unmount()
  })

  it('does not expose runtime update callbacks from adapter renderers', () => {
    const controls: Array<[Extract<RComponentSFC_IR_Tag, 'Input' | 'Textarea' | 'Checkbox' | 'Select'>, Record<string, unknown>]> = [
      ['Input', { value: 'SU' }],
      ['Textarea', { value: 'Комментарий' }],
      ['Checkbox', { checked: true }],
      ['Select', { value: 'active', options: [{ value: 'active' }] }],
    ]

    for (const [tag, props] of controls) {
      const vnode = renderControl(tag, props)
      expect(Object.keys(vnode.props ?? {}).filter(key => key.startsWith('on'))).toEqual([])
    }
  })

  it('reactivates the workspace adapter after the workspace changes', () => {
    const vueModule = new EndgeVueModule()
    vueModule.setup()
    Endge.workspace.apply({
      ...DEFAULT_ENDGE_WORKSPACE,
      sfcAdapterIds: ['native-vue', 'shadcn-vue'],
      defaultSfcAdapterId: 'native-vue',
    })
    vueModule.build()
    vueModule.start()

    Endge.workspace.apply({
      ...DEFAULT_ENDGE_WORKSPACE,
      sfcAdapterIds: ['native-vue', 'shadcn-vue'],
      defaultSfcAdapterId: 'shadcn-vue',
    })

    expect(Endge.uiRegistry.adapters.active?.id).toBe('shadcn-vue')
    vueModule.reset()
  })

  it('rerenders a mounted SFC when the active adapter changes', async () => {
    Endge.uiRegistry.adapters.register(NativeVueSFCAdapter)
    Endge.uiRegistry.adapters.activate('native-vue')

    const ir = {
      version: 1 as const,
      script: { props: [], locals: [] },
      template: {
        roots: [{
          id: 'switch-input',
          kind: 'element' as const,
          tag: 'Input' as const,
          props: { value: literal('SU 1402') },
          directives: {},
          children: [],
        }],
      },
      style: null,
    }
    const root = document.createElement('div')
    const app = createApp({ render: () => h(SFC_Renderer, { ir }) })
    app.mount(root)
    await nextTick()
    expect(root.querySelector('input')?.classList.contains('endge-shadcn-input')).toBe(false)

    Endge.uiRegistry.adapters.activate('shadcn-vue')
    await nextTick()
    expect(root.querySelector('input')?.classList.contains('endge-shadcn-input')).toBe(true)
    app.unmount()
  })
})

function renderControl(
  tag: Extract<RComponentSFC_IR_Tag, 'Input' | 'Textarea' | 'Checkbox' | 'Select'>,
  props: Record<string, unknown>,
): VNode {
  const node: RComponentSFC_IR_ElementNode = {
    id: `test-${tag}`,
    kind: 'element',
    tag,
    props: Object.fromEntries(Object.entries(props).map(([key, value]) => [key, literal(value)])),
    directives: {},
    children: [],
  }
  const result = renderSFCNode(h, node, createSFCVueRenderContext({}))
  if (!isVNode(result)) throw new Error(`${tag} did not render a VNode`)
  return result
}

async function mountControl(
  tag: Extract<RComponentSFC_IR_Tag, 'Input' | 'Textarea' | 'Checkbox' | 'Select'>,
  props: Record<string, unknown>,
): Promise<{ root: HTMLDivElement; unmount: () => void }> {
  const vnode = renderControl(tag, props)
  const root = document.createElement('div')
  const app = createApp({ render: () => vnode })
  app.mount(root)
  await nextTick()

  return {
    root,
    unmount: () => app.unmount(),
  }
}

function selectedOptions(root: HTMLElement): string[] {
  const select = root.querySelector('select')
  return select ? [...select.selectedOptions].map(option => option.value) : []
}

function literal(value: unknown): RComponentSFC_IR_Value {
  return { kind: 'literal', value }
}
