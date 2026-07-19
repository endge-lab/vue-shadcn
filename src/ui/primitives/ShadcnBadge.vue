<script setup lang="ts">
defineOptions({ name: 'EndgeShadcnBadge', inheritAttrs: false })

withDefaults(defineProps<{
  tone?: string
}>(), {
  tone: 'default',
})
</script>

<template>
  <span
    v-bind="$attrs"
    data-slot="badge"
    class="endge-shadcn-badge"
    :data-tone="tone"
  >
    <slot />
  </span>
</template>
