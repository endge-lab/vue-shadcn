<script setup lang="ts">
defineOptions({
  name: 'EndgeShadcnTextarea',
  inheritAttrs: false,
})

defineProps<{
  value: string
  placeholder?: string
  rows?: string | number
  readonly?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <textarea
    v-bind="$attrs"
    data-slot="textarea"
    :value="value"
    :placeholder="placeholder"
    :rows="rows"
    :readonly="readonly"
    :disabled="disabled"
  />
</template>
