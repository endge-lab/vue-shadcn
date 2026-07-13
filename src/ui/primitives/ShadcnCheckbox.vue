<script setup lang="ts">
defineOptions({
  name: 'EndgeShadcnCheckbox',
  inheritAttrs: false,
})

defineProps<{
  checked?: boolean
  label?: string
  readonly?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <label v-bind="$attrs">
    <input
      class="endge-shadcn-checkbox"
      type="checkbox"
      :checked="checked"
      :readonly="readonly"
      :disabled="disabled"
    >
    <span v-if="label != null" class="endge-shadcn-checkbox-label">{{ label }}</span>
  </label>
</template>

