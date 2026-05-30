<script lang="ts" setup>
withDefaults(
  defineProps<{
    autoHeight?: boolean;
    description?: string;
    title: string;
  }>(),
  {
    autoHeight: false,
    description: '',
  },
);
</script>

<template>
  <section
    :class="
      autoHeight
        ? 'flex min-h-0 flex-col rounded-lg border border-border bg-card p-3 shadow-sm'
        : 'flex h-full min-h-0 flex-col rounded-lg border border-border bg-card p-3 shadow-sm'
    "
  >
    <header class="mb-3 flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-foreground">{{ title }}</h3>
      </div>
      <div v-if="$slots.extra" class="shrink-0">
        <slot name="extra"></slot>
      </div>
    </header>
    <div class="flex min-h-0 flex-1 flex-col">
      <slot></slot>
    </div>
  </section>
</template>
