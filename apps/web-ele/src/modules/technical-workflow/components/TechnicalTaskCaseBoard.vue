<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  TechnicalTaskCaseGroup,
} from '../types/technical-workflow';

import { ElButton, ElEmpty, ElSkeleton, ElTag } from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import {
  formatCurrentNode,
  getTaskStatusTagType,
} from '../utils/task-presentation';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

withDefaults(
  defineProps<{
    groups: TechnicalTaskCaseGroup[];
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  openTracking: [group: TechnicalTaskCaseGroup];
  openWorkstation: [task: PendingTechnicalTaskItem];
}>();
</script>

<template>
  <WorkflowSectionCard
    title="连续处理视图"
    description="按病例聚合查看同一病例下的连续任务，便于现场连贯处理。"
  >
    <ElSkeleton v-if="loading" :rows="8" animated />
    <div v-else-if="groups.length > 0" class="grid gap-3">
      <article
        v-for="group in groups"
        :key="group.caseId"
        class="rounded-lg border border-border bg-card p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-foreground">
              {{ formatNullable(group.pathologyNo) }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              病例 {{ group.caseId }}，共 {{ group.taskCount }} 条任务，超时
              {{ group.timedOutCount }} 条
            </div>
          </div>
          <ElButton link type="primary" @click="emit('openTracking', group)">
            查看追踪
          </ElButton>
        </div>

        <div class="mt-4 grid gap-2">
          <button
            v-for="task in group.items"
            :key="task.id"
            class="flex items-center justify-between rounded-md border border-border px-3 py-3 text-left transition-colors hover:border-primary"
            type="button"
            @click="emit('openWorkstation', task)"
          >
            <div>
              <div class="text-sm font-medium text-foreground">
                {{ formatTaskType(task.taskType) }} /
                {{ formatNullable(task.objectId) }}
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ formatCurrentNode(task) }} /
                {{ formatDateTime(task.receivedAt || task.createdAt) }}
              </div>
            </div>
            <ElTag
              :type="
                task.timedOut ? 'danger' : getTaskStatusTagType(task.taskStatus)
              "
            >
              {{ task.timedOut ? '超时' : formatTaskStatus(task.taskStatus) }}
            </ElTag>
          </button>
        </div>
      </article>
    </div>
    <ElEmpty v-else description="当前筛选下暂无连续处理任务" />
  </WorkflowSectionCard>
</template>
