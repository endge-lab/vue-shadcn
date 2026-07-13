<script setup lang="ts">
defineOptions({
  name: 'EndgeShadcnInput',
  inheritAttrs: false,
})

defineProps<{
  type: string
  value: string | number
  placeholder?: string
  min?: unknown
  max?: unknown
  step?: unknown
  readonly?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <input
    v-bind="$attrs"
    :type="type"
    :value="value"
    :placeholder="placeholder"
    :min="min as any"
    :max="max as any"
    :step="step as any"
    :readonly="readonly"
    :disabled="disabled"
  >
</template>

