<template>
  <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
    <div class="space-y-2">
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-theme">
        {{ eyebrow }}
      </p>
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold text-g-900">
          {{ title }}
        </h1>
        <p class="max-w-3xl text-sm text-g-600">
          {{ description }}
        </p>
      </div>
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
withDefaults(
  defineProps<{
    title: string
    description: string
    eyebrow?: string
  }>(),
  {
    eyebrow: 'Workspace'
  }
)
</script>
