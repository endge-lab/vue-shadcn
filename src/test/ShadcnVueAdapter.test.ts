import type {
  EndgeWorkspaceDefinition,
  EndgeDiagnosticsConfiguration,
  FilterViewRuntimeHost,
  RComponentSFC_IR_ElementNode,
  RComponentSFC_IR_Tag,
  RComponentSFC_IR_Value,
} from '@endge/core'
import {
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
  Endge,
} from '@endge/core'
import {
  createSFCVueRenderContext,
  EndgeFilterRenderer,
  EndgeVueModule,
  NativeVueSFCAdapter,
  renderSFCNode,
  SFC_Renderer,
  SFC_VUE_RENDER_ADAPTER_REQUIRED_KEYS,
} from '@endge/ui-vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, isVNode, nextTick, type VNode } from 'vue'

import { EndgeShadcnVueModule } from '@/domain/core/endge-shadcn-vue'
import {
  SHADCN_VUE_SFC_ADAPTER_ID,
  ShadcnVueSFCAdapter,
} from '@/model/render/sfc/shadcn-vue-sfc-adapter'

const TEST_WORKSPACE: EndgeWorkspaceDefinition = {
  identity: 'workspace-test',
  displayName: 'Test Workspace',
  managedBy: 'user',
  managedById: null,
  installedIntegrations: [],
  configuration: {
    vars: [],
    locales: [{ code: 'en', displayName: 'English', shortLabel: 'EN', direction: 'ltr' }],
    defaultLocale: 'en',
    fallbackLocale: 'en',
    themes: [
      { identity: 'light', displayName: 'Light' },
      { identity: 'dark', displayName: 'Dark' },
    ],
    defaultTheme: 'light',
    defaultAuthProfileIdentity: null,
    sfcAdapterIds: ['native-vue', 'shadcn-vue'],
    defaultSfcAdapterId: 'shadcn-vue',
    diagnostics: createDiagnosticsConfiguration(),
  },
}

describe('ShadcnVueSFCAdapter', () => {
  beforeEach(() => {
    Endge.uiRegistry.adapters.reset()
    Endge.workspace.apply(TEST_WORKSPACE)
    new EndgeShadcnVueModule().setup()
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
    Endge.workspace.apply(TEST_WORKSPACE)
  })

  it('registers the complete Vue adapter contract', () => {
    expect(Endge.uiRegistry.adapters.active?.id).toBe('shadcn-vue')
    expect(Object.keys(ShadcnVueSFCAdapter.renderers)).toEqual(SFC_VUE_RENDER_ADAPTER_REQUIRED_KEYS)
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
    expect(multiple.root.querySelector('.endge-shadcn-multiselect-content')).toBeNull()

    const trigger = multiple.root.querySelector('.endge-shadcn-multiselect-trigger') as HTMLButtonElement
    trigger.click()
    await nextTick()

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(multiple.root.querySelector('.endge-shadcn-multiselect-content')).not.toBeNull()
    expect(multiple.root.querySelectorAll('.endge-shadcn-multiselect-option')).toHaveLength(options.length)
    expect(multiple.root.querySelectorAll('.endge-shadcn-multiselect-option[aria-selected="true"]')).toHaveLength(2)
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
      ...TEST_WORKSPACE,
      configuration: {
        ...TEST_WORKSPACE.configuration,
        sfcAdapterIds: ['native-vue', 'shadcn-vue'],
        defaultSfcAdapterId: 'native-vue',
      },
    })
    vueModule.build()
    vueModule.start()

    Endge.workspace.apply({
      ...TEST_WORKSPACE,
      configuration: {
        ...TEST_WORKSPACE.configuration,
        sfcAdapterIds: ['native-vue', 'shadcn-vue'],
        defaultSfcAdapterId: 'shadcn-vue',
      },
    })

    expect(Endge.uiRegistry.adapters.active?.id).toBe('shadcn-vue')
    vueModule.reset()
  })

  it('rerenders a mounted SFC when the active adapter changes', async () => {
    Endge.uiRegistry.adapters.register(NativeVueSFCAdapter)
    Endge.uiRegistry.adapters.activate('native-vue')

    const ir = {
      version: 1 as const,
      script: {
        props: [],
        locals: [],
        ports: {
          require: { computations: [], components: [], actions: [] },
          provides: { actions: [] },
          emits: { events: [] },
          forward: { rules: [] },
        },
        portCalls: [],
      },
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

  it('renders the same generated Filter view through native and shadcn adapters', async () => {
    Endge.uiRegistry.adapters.register(NativeVueSFCAdapter)
    Endge.uiRegistry.adapters.activate('native-vue')
    const setValue = vi.fn().mockResolvedValue(undefined)
    const runtime = {
      getRenderModel: () => ({
        implementation: { kind: 'generated' as const },
        props: {
          showLabels: true,
          labels: {
            search: 'Поиск рейса',
            airports: 'Аэропорты',
          },
        },
        fields: [
          {
            key: 'search', type: 'String' as const, optional: false, array: false,
            control: { type: 'Input' as const }, value: 'SU', options: [],
          },
          {
            key: 'airports', type: 'String' as const, optional: false, array: true,
            control: { type: 'Select' as const }, value: ['SVO'],
            options: [
              { value: 'SVO', label: 'Шереметьево' },
              { value: 'LED', label: 'Пулково' },
            ],
          },
          {
            key: 'cancelled', type: 'Boolean' as const, optional: false, array: false,
            control: { type: 'Checkbox' as const }, value: true, options: [],
          },
        ],
      }),
      setValue,
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as FilterViewRuntimeHost
    const root = document.createElement('div')
    const app = createApp({ render: () => h(EndgeFilterRenderer, { runtime }) })
    app.mount(root)
    await nextTick()

    expect(root.querySelector('input')?.classList.contains('endge-shadcn-input')).toBe(false)
    expect(root.querySelector('select')?.multiple).toBe(true)
    expect((root.querySelector('input[type="checkbox"]') as HTMLInputElement | null)?.checked).toBe(true)
    expect([...root.querySelectorAll('.endge-filter-field__label')].map(node => node.textContent)).toEqual([
      'Поиск рейса',
      'Аэропорты',
    ])

    Endge.uiRegistry.adapters.activate('shadcn-vue')
    await nextTick()
    expect(root.querySelector('input')?.classList.contains('endge-shadcn-input')).toBe(true)
    expect(root.querySelector('.endge-shadcn-select')).not.toBeNull()
    expect(root.querySelector('.endge-shadcn-checkbox')).not.toBeNull()
    expect(root.textContent).toContain('Поиск рейса')

    const multiselectTrigger = root.querySelector('.endge-shadcn-multiselect-trigger') as HTMLButtonElement
    multiselectTrigger.click()
    await nextTick()
    const pulkovo = [...root.querySelectorAll<HTMLButtonElement>('.endge-shadcn-multiselect-option')]
      .find(option => option.textContent?.includes('Пулково'))
    pulkovo?.click()
    await nextTick()
    expect(setValue).toHaveBeenCalledWith('airports', ['SVO', 'LED'])

    const input = root.querySelector('input[type="text"]') as HTMLInputElement
    input.value = 'S7'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(setValue).toHaveBeenCalledWith('search', 'S7')

    app.unmount()
  })

  it('allows the generated Filter view to hide labels above fields', async () => {
    const runtime = {
      getRenderModel: () => ({
        implementation: { kind: 'generated' as const },
        props: {
          showLabels: false,
          labels: { search: 'Поиск рейса' },
        },
        fields: [{
          key: 'search', type: 'String' as const, optional: false, array: false,
          control: { type: 'Input' as const }, value: 'SU', options: [],
        }],
      }),
      setValue: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as FilterViewRuntimeHost
    const root = document.createElement('div')
    const app = createApp({ render: () => h(EndgeFilterRenderer, { runtime }) })
    app.mount(root)
    await nextTick()

    expect(root.querySelector('.endge-filter-field__label')).toBeNull()
    expect(root.querySelector('input[type="text"]')).not.toBeNull()
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

function createDiagnosticsConfiguration(): EndgeDiagnosticsConfiguration {
  return {
    telemetry: {
      collection: {
        enabled: false,
        signals: ['log' as const],
        minSeverity: 9,
        maxRecords: 2_000,
      },
      outputs: [],
      routes: [],
    },
    snapshots: {
      content: { telemetry: true, problems: true, configuration: false },
      automatic: {
        enabled: false,
        errorCount: 10,
        windowSeconds: 60,
        cooldownSeconds: 300,
        outputIds: [],
      },
    },
  }
}
