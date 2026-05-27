<script setup lang="ts">
defineProps<{
  description?: string;
  title: string;
}>();
</script>

<template>
  <section class="rounded-2xl border border-border bg-card shadow-sm">
    <header
      class="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h3 class="text-base font-semibold text-foreground">{{ title }}</h3>
        <p v-if="description" class="mt-1 text-sm text-muted-foreground">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.extra" class="flex flex-wrap items-center gap-2">
        <slot name="extra"></slot>
      </div>
    </header>
    <div class="p-5">
      <slot></slot>
    </div>
  </section>
</template>
