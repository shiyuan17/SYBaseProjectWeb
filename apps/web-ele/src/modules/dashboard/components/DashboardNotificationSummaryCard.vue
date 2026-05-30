<script setup lang="ts">
import type {
  DashboardNotificationItem,
  DashboardNotificationSummary,
} from '../types/dashboard';

import { ElButton, ElSkeleton, ElTag } from 'element-plus';

import { getVisualToneClasses } from '../utils/dashboard-visualization';
import DashboardSectionCard from './DashboardSectionCard.vue';

const props = withDefaults(
  defineProps<{
    error?: string;
    loading?: boolean;
    summary: DashboardNotificationSummary;
    userName: string;
  }>(),
  {
    error: '',
    loading: false,
  },
);

const emit = defineEmits<{
  open: [item: DashboardNotificationItem];
  openCenter: [];
  retry: [];
}>();

function handleOpen(item: DashboardNotificationItem) {
  emit('open', item);
}
</script>

<template>
  <DashboardSectionCard
    title="通知与协同"
    :description="`展示 ${userName} 的站内通知和协同动作。`"
    card-class="dashboard-surface border-0"
    body-class="px-5 pb-5 pt-2"
  >
    <template #header-extra>
      <ElTag :type="summary.unreadCount > 0 ? 'warning' : 'info'">
        未读 {{ summary.unreadCount }}
      </ElTag>
    </template>

    <div v-if="props.error" class="flex items-center justify-between gap-4">
      <span class="text-sm text-danger">{{ props.error }}</span>
      <ElButton @click="$emit('retry')">重试</ElButton>
    </div>
    <ElSkeleton v-else-if="loading" :rows="5" animated />
    <div v-else-if="summary.items.length > 0" class="flex flex-col gap-3">
      <article
        v-for="item in summary.items"
        :key="item.id"
        class="rounded-[22px] border border-border bg-card/80 p-4 text-foreground shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-foreground">
              {{ item.title }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ item.createdAt || '-' }}
            </div>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[11px] font-medium"
            :class="
              getVisualToneClasses(
                item.status === 'UNREAD' ? 'warning' : 'neutral',
              ).badge
            "
          >
            {{ item.status === 'UNREAD' ? '未读' : '已读' }}
          </span>
        </div>
        <div class="mt-3 text-sm leading-6 text-muted-foreground">
          {{ item.summary }}
        </div>
        <div class="mt-4 flex gap-3">
          <button
            class="text-sm text-primary transition-colors hover:text-primary/80"
            type="button"
            @click="handleOpen(item)"
          >
            查看 →
          </button>
          <button
            class="text-sm text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            @click="$emit('openCenter')"
          >
            通知中心
          </button>
        </div>
      </article>
    </div>
    <div
      v-else
      class="rounded-[22px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
    >
      暂无通知消息
    </div>
  </DashboardSectionCard>
</template>
