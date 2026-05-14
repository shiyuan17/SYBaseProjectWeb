<template>
  <div
    class="flex flex-col items-start gap-3 rounded-custom-sm border border-dashed p-6"
    :class="panelClasses"
  >
    <div class="space-y-1">
      <h3 class="text-base font-semibold text-g-900">
        {{ title }}
      </h3>
      <p class="text-sm text-g-600">
        {{ description }}
      </p>
    </div>

    <div
      v-if="$slots.actions"
      class="flex items-center gap-3"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  state: 'loading' | 'empty' | 'error' | 'success'
  title: string
  description: string
}>()

const panelClasses = computed(() => {
  if (props.state === 'error') {
    return 'border-red-200 bg-red-50/80'
  }

  if (props.state === 'loading') {
    return 'border-teal-200 bg-teal-50'
  }

  if (props.state === 'success') {
    return 'border-emerald-200 bg-emerald-50/70'
  }

  return 'border-g-300 bg-g-100'
})
</script>
