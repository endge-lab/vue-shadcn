import {
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
  ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
} from '@endge/core'
import type { SFCVueRenderAdapter } from '@endge/vue'

import {
  ShadcnVueRender_Badge,
  ShadcnVueRender_Box,
  ShadcnVueRender_Checkbox,
  ShadcnVueRender_DateTime,
  ShadcnVueRender_Divider,
  ShadcnVueRender_Dot,
  ShadcnVueRender_Flex,
  ShadcnVueRender_Icon,
  ShadcnVueRender_Input,
  ShadcnVueRender_Number,
  ShadcnVueRender_Select,
  ShadcnVueRender_Text,
  ShadcnVueRender_Textarea,
} from '@/model/render/sfc/shadcn-vue-renderers'

export const SHADCN_VUE_SFC_ADAPTER_ID = 'shadcn-vue'

/** Self-contained shadcn-vue visual adapter for the Endge Vue SFC renderer. */
export const ShadcnVueSFCAdapter: SFCVueRenderAdapter = {
  id: SHADCN_VUE_SFC_ADAPTER_ID,
  protocol: ENDGE_SFC_RENDER_ADAPTER_PROTOCOL,
  protocolVersion: ENDGE_SFC_RENDER_ADAPTER_PROTOCOL_VERSION,
  renderer: 'vue',
  renderers: {
    Text: ShadcnVueRender_Text,
    DateTime: ShadcnVueRender_DateTime,
    Number: ShadcnVueRender_Number,
    Icon: ShadcnVueRender_Icon,
    Badge: ShadcnVueRender_Badge,
    Dot: ShadcnVueRender_Dot,
    Box: ShadcnVueRender_Box,
    Flex: ShadcnVueRender_Flex,
    Divider: ShadcnVueRender_Divider,
    Input: ShadcnVueRender_Input,
    Textarea: ShadcnVueRender_Textarea,
    Checkbox: ShadcnVueRender_Checkbox,
    Select: ShadcnVueRender_Select,
  },
}

