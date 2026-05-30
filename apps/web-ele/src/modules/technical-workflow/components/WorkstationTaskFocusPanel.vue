<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTag,
} from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatObjectType,
  formatTaskStatus,
} from '../utils/format';

withDefaults(
  defineProps<{
    actionTitle: string;
    emptyDescription?: string;
    nextFlowLabel?: string;
    objectTitle: string;
    reminderTitle: string;
    task: null | PendingTechnicalTaskItem;
  }>(),
  {
    emptyDescription: '左侧选中任务后，这里展示当前处理对象和操作入口。',
    nextFlowLabel: '按任务状态流转',
  },
);
</script>

<template>
  <template v-if="task">
    <div class="mb-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      <article class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">我现在处理谁</div>
        <div class="mt-1 text-sm font-semibold text-foreground">
          {{ objectTitle }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ formatObjectType(task.objectType) }} /
          {{ formatNullable(task.objectId) }}
        </div>
      </article>
      <article class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">我现在要做什么</div>
        <div class="mt-1 text-sm font-semibold text-foreground">
          {{ actionTitle }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          状态：{{ formatTaskStatus(task.taskStatus) }}
        </div>
      </article>
      <article class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">有什么需要注意</div>
        <div class="mt-1 text-sm font-semibold text-foreground">
          {{ reminderTitle }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{
            task.timedOut ? '该任务已超时' : task.remarks || '当前无额外备注'
          }}
        </div>
      </article>
      <article class="rounded-lg border border-border bg-card p-3">
        <div class="text-xs text-muted-foreground">做完后流向哪里</div>
        <div class="mt-1 text-sm font-semibold text-foreground">
          {{ nextFlowLabel }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          完成后刷新队列并查看生产轨迹
        </div>
      </article>
    </div>

    <ElDescriptions :column="2" border>
      <ElDescriptionsItem label="任务号">{{ task.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="病理号">
        {{ formatNullable(task.pathologyNo) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="对象类型">
        {{ formatObjectType(task.objectType) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="对象编号">
        {{ formatNullable(task.objectId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="任务状态">
        <ElTag
          :type="
            task.taskStatus === 'IN_PROGRESS'
              ? 'warning'
              : task.timedOut
                ? 'danger'
                : 'info'
          "
        >
          {{ formatTaskStatus(task.taskStatus) }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间">
        {{ formatDateTime(task.createdAt) }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <slot></slot>
  </template>

  <ElEmpty v-else :description="emptyDescription" />
</template>
