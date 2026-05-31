<script setup lang="ts">
import type { SpecimenManagementListSummary } from '../types/specimen-workflow';

defineProps<{
  summary: SpecimenManagementListSummary;
}>();
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div class="text-sm text-muted-foreground">登记总数</div>
      <div class="mt-2 text-2xl font-semibold text-foreground">
        {{ summary.totalCount }}
      </div>
    </section>
    <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div class="text-sm text-muted-foreground">已贴签</div>
      <div class="mt-2 text-2xl font-semibold text-foreground">
        {{ summary.labelPrintedCount }}
      </div>
    </section>
    <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div class="text-sm text-muted-foreground">待贴签</div>
      <div class="mt-2 text-2xl font-semibold text-foreground">
        {{ summary.pendingLabelCount }}
      </div>
    </section>
    <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div class="text-sm text-muted-foreground">异常</div>
      <div class="mt-2 text-2xl font-semibold text-foreground">
        {{ summary.abnormalCount }}
      </div>
    </section>
  </div>
</template>
