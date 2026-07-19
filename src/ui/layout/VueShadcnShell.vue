<script setup lang="ts">
import type { EndgeEnvId, EndgeProjectId } from '@endge/core'

import ShadcnMenuRoot from '@/ui/overlay/ShadcnMenuRoot.vue'

defineOptions({ name: 'EndgeVueShadcnShell' })

defineProps<{
  project: EndgeProjectId
  env: EndgeEnvId
}>()
</script>

<template>
  <slot />
  <ShadcnMenuRoot />
</template>
