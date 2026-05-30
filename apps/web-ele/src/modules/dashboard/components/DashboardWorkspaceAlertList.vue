<script setup lang="ts">
import type { DashboardWorkspaceAlert } from '../types/dashboard';

import { ElButton, ElEmpty, ElSkeleton } from 'element-plus';

import { getVisualToneClasses } from '../utils/dashboard-visualization';
import DashboardSectionCard from './DashboardSectionCard.vue';

const props = withDefaults(
  defineProps<{
    error?: string;
    items: DashboardWorkspaceAlert[];
    loading?: boolean;
  }>(),
  {
    error: '',
    loading: false,
  },
);

const emit = defineEmits<{
  open: [item: DashboardWorkspaceAlert];
  retry: [];
}>();

function handleOpen(item: DashboardWorkspaceAlert) {
  emit('open', item);
}
</script>

<template>
  <DashboardSectionCard
    title="异常 / 预警流"
    description="按严重度展示异常和预警。"
    card-class="dashboard-surface border-0"
    body-class="px-5 pb-5 pt-2"
  >
    <div v-if="props.error" class="flex items-center justify-between gap-4">
      <span class="text-sm text-danger">{{ props.error }}</span>
      <ElButton @click="$emit('retry')">重试</ElButton>
    </div>
    <ElSkeleton v-else-if="loading" :rows="7" animated />
    <div v-else-if="items.length > 0" class="flex flex-col gap-3">
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-[22px] border border-border bg-card/80 p-4 text-foreground shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div
              class="text-xs uppercase tracking-[0.16em] text-[var(--el-text-color-secondary)]"
            >
              {{ item.domainTitle }}
            </div>
            <div class="mt-2 text-sm font-semibold text-foreground">
              {{ item.title }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ item.source }}
            </div>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[11px] font-medium"
            :class="
              getVisualToneClasses(
                item.severity === 'danger'
                  ? 'danger'
                  : item.severity === 'warning'
                    ? 'warning'
                    : 'info',
              ).badge
            "
          >
            {{
              item.severity === 'danger'
                ? '高风险'
                : item.severity === 'warning'
                  ? '提醒'
                  : '关注'
            }}
          </span>
        </div>
        <div class="mt-3 text-sm leading-6 text-muted-foreground">
          {{ item.description }}
        </div>
        <button
          class="mt-4 text-sm text-primary transition-colors hover:text-primary/80"
          type="button"
          @click="handleOpen(item)"
        >
          {{ item.actionLabel || '查看详情' }} →
        </button>
      </article>
    </div>
    <ElEmpty v-else description="当前没有异常或预警" />
  </DashboardSectionCard>
</template>
