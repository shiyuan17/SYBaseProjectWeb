<script lang="ts" setup>
defineProps<{
  description?: string;
  title: string;
}>();
</script>

<template>
  <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 class="text-base font-semibold text-foreground">{{ title }}</h3>
      </div>
      <div v-if="$slots.extra" class="shrink-0">
        <slot name="extra" />
      </div>
    </header>
    <slot />
  </section>
</template>
