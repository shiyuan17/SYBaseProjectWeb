<script setup lang="ts">
import type { WorkstationQueueItem } from '../types/technical-workflow';

import { computed } from 'vue';

import { ElEmpty, ElSkeleton, ElTag } from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatObjectType,
  formatTaskStatus,
} from '../utils/format';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = withDefaults(
  defineProps<{
    description?: string;
    items: WorkstationQueueItem[];
    loading?: boolean;
    selectedTaskId?: string;
    title: string;
  }>(),
  {
    description: '',
    loading: false,
    selectedTaskId: '',
  },
);

const emit = defineEmits<{
  select: [taskId: string];
}>();

const hasItems = computed(() => props.items.length > 0);

function getItemStyle(item: WorkstationQueueItem) {
  if (item.task.id === props.selectedTaskId) {
    return {
      backgroundColor: 'color-mix(in srgb, var(--el-color-primary) 8%, white)',
      borderColor: 'var(--el-color-primary)',
    };
  }
  if (item.alertLevel === 'danger') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--el-color-danger) 6%, white)',
      borderColor: 'color-mix(in srgb, var(--el-color-danger) 35%, var(--el-border-color))',
    };
  }
  if (item.alertLevel === 'warning') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--el-color-warning) 6%, white)',
      borderColor: 'color-mix(in srgb, var(--el-color-warning) 35%, var(--el-border-color))',
    };
  }
  return undefined;
}
</script>

<template>
  <WorkflowSectionCard :description="description" :title="title">
    <div class="mb-4 flex items-center justify-between gap-3">
      <slot name="filters"></slot>
      <slot name="extra"></slot>
    </div>

    <ElSkeleton v-if="loading && !hasItems" :rows="6" animated />

    <div v-else-if="hasItems" class="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
      <button
        v-for="item in items"
        :key="item.task.id"
        class="rounded-lg border border-border bg-card p-3 text-left transition-colors"
        :style="getItemStyle(item)"
        type="button"
        @click="emit('select', item.task.id)"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-foreground">
              {{ formatNullable(item.task.pathologyNo) }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ formatObjectType(item.task.objectType) }} / {{ formatNullable(item.task.objectId) }}
            </div>
          </div>
          <ElTag :type="item.alertLevel === 'danger' ? 'danger' : item.alertLevel === 'warning' ? 'warning' : 'info'">
            {{ formatTaskStatus(item.task.taskStatus) }}
          </ElTag>
        </div>

        <div class="mb-2 flex flex-wrap gap-2">
          <ElTag
            v-for="badge in item.badges"
            :key="badge"
            effect="plain"
            size="small"
            :type="badge === '超时' ? 'danger' : badge === '处理中' ? 'warning' : 'info'"
          >
            {{ badge }}
          </ElTag>
        </div>

        <div class="space-y-1 text-xs text-muted-foreground">
          <div>任务号：{{ item.task.id }}</div>
          <div>创建时间：{{ formatDateTime(item.task.createdAt) }}</div>
          <div v-if="item.task.remarks">备注：{{ item.task.remarks }}</div>
        </div>
      </button>
    </div>

    <ElEmpty v-else description="当前筛选下暂无任务" />
  </WorkflowSectionCard>
</template>
