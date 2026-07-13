<script setup lang="ts">
import type { SourceFieldOption } from '@endge/core'
import { computed } from 'vue'

defineOptions({
  name: 'EndgeShadcnSelect',
  inheritAttrs: false,
})

const props = defineProps<{
  options: SourceFieldOption[]
  selectedValues: string[]
  placeholder?: string
  multiple?: boolean
  readonly?: boolean
  disabled?: boolean
}>()

const selectedValues = computed(() => new Set(props.selectedValues))
const hasSelectedOption = computed(() => props.options.some(option => selectedValues.value.has(String(option.value))))
</script>

<template>
  <span
    v-bind="$attrs"
    class="endge-shadcn-select-field"
    :data-multiple="multiple ? '' : undefined"
  >
    <select
      class="endge-shadcn-select"
      :multiple="multiple"
      :disabled="disabled"
      :aria-readonly="readonly ? 'true' : undefined"
    >
      <option
        v-if="!multiple && !hasSelectedOption"
        value=""
        :disabled="placeholder != null"
        selected
      >
        {{ placeholder ?? '' }}
      </option>
      <option
        v-for="(option, index) in options"
        :key="`${index}:${String(option.value)}`"
        :value="String(option.value)"
        :selected="selectedValues.has(String(option.value))"
      >
        {{ option.label ?? String(option.value) }}
      </option>
    </select>
  </span>
</template>

