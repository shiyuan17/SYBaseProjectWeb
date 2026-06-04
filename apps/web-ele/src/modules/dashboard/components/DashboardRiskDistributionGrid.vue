<script setup lang="ts">
import type { DashboardRiskDistribution } from '../types/dashboard';

import { ElButton, ElSkeleton } from 'element-plus';

import { getVisualToneClasses } from '../utils/dashboard-visualization';

withDefaults(
  defineProps<{
    hasError?: boolean;
    items: DashboardRiskDistribution[];
    loading?: boolean;
  }>(),
  {
    hasError: false,
    loading: false,
  },
);

const emit = defineEmits<{
  open: [item: DashboardRiskDistribution];
}>();

function handleOpen(item: DashboardRiskDistribution) {
  emit('open', item);
}
</script>

<template>
  <ElSkeleton v-if="loading" :rows="5" animated />
  <div
    v-else-if="items.length > 0"
    class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
  >
    <article
      v-for="card in items"
      :key="card.id"
      class="group relative overflow-hidden rounded-[26px] border border-border bg-card/90 p-5 text-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80"
        :class="getVisualToneClasses(card.tone).glow"
      ></div>
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--el-bg-color)_82%,transparent),color-mix(in_srgb,var(--el-bg-color-page)_36%,transparent))]"
      ></div>
      <div class="relative">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-foreground">
              {{ card.label }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              当前识别 {{ card.valueText }} 项需要跟进的风险信号
            </div>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[11px] font-medium"
            :class="getVisualToneClasses(card.tone).badge"
          >
            {{
              card.severity === 'danger'
                ? '高风险'
                : card.severity === 'warning'
                  ? '需关注'
                  : '观察中'
            }}
          </span>
        </div>
        <div class="mt-6 flex items-end justify-between">
          <div class="text-4xl font-semibold tracking-tight text-foreground">
            {{ card.valueText }}
          </div>
          <div class="text-xs text-muted-foreground">{{ card.unit }}</div>
        </div>
        <ElButton class="mt-6 w-full" @click="handleOpen(card)">
          查看详情
        </ElButton>
      </div>
    </article>
  </div>
  <div
    v-else
    class="rounded-[24px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
  >
    当前没有风险项
  </div>
</template>
