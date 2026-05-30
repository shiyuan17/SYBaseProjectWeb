<script setup lang="ts">
import type { TechnicalTaskStatCard } from '../types/technical-workflow';

defineProps<{
  items: TechnicalTaskStatCard[];
}>();
</script>

<template>
  <div class="grid gap-4 md:grid-cols-4">
    <section
      v-for="item in items"
      :key="item.label"
      class="rounded border border-border bg-background p-4"
    >
      <div class="text-sm text-[var(--el-text-color-secondary)]">
        {{ item.label }}
      </div>
      <div class="mt-2 text-2xl font-semibold text-foreground">
        {{ item.value }}
      </div>
    </section>
  </div>
</template>
