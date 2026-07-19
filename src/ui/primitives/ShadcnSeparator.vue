<script setup lang="ts">
defineOptions({ name: 'EndgeShadcnSeparator', inheritAttrs: false })

withDefaults(defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>(), {
  orientation: 'horizontal',
})
</script>

<template>
  <div
    v-bind="$attrs"
    data-slot="separator"
    class="endge-shadcn-divider"
    role="separator"
    :aria-orientation="orientation"
    :data-orientation="orientation"
  />
</template>
