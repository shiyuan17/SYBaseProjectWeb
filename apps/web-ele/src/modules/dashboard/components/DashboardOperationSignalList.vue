<script setup lang="ts">
import type { DashboardOperationSignal } from '../types/dashboard';

import { ElEmpty, ElSkeleton } from 'element-plus';

import { getVisualToneClasses } from '../utils/dashboard-visualization';

withDefaults(
  defineProps<{
    loading?: boolean;
    signals: DashboardOperationSignal[];
  }>(),
  {
    loading: false,
  },
);
</script>

<template>
  <ElSkeleton v-if="loading" :rows="6" animated />
  <div v-else-if="signals.length > 0" class="grid gap-4">
    <article
      v-for="signal in signals"
      :key="signal.code"
      class="rounded-[24px] border border-border bg-card/80 p-4 text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-foreground">
            {{ signal.label }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ signal.description }}
          </div>
        </div>
        <div class="text-right">
          <div
            class="text-[11px] uppercase tracking-[0.18em] text-[var(--el-text-color-secondary)]"
          >
            {{ signal.emphasis }}
          </div>
          <div class="mt-1 text-lg font-semibold text-foreground">
            {{ signal.value }}
            <span class="ml-1 text-xs font-normal text-muted-foreground">{{
              signal.unit
            }}</span>
          </div>
        </div>
      </div>
      <div class="mt-4 h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="getVisualToneClasses(signal.tone).line"
          :style="{ width: `${signal.progress}%` }"
        ></div>
      </div>
    </article>
  </div>
  <ElEmpty v-else description="暂无运营信号数据" />
</template>
