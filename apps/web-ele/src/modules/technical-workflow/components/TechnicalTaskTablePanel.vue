<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import {
  ElButton,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatTaskPriority,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import {
  formatCurrentNode,
  formatResponsible,
  getPriorityTagType,
  getTaskStatusTagType,
} from '../utils/task-presentation';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  items: PendingTechnicalTaskItem[];
  loading?: boolean;
  total: number;
}>();

const emit = defineEmits<{
  assign: [row: PendingTechnicalTaskItem];
  openTracking: [row: PendingTechnicalTaskItem];
  openWorkstation: [row: PendingTechnicalTaskItem];
  release: [row: PendingTechnicalTaskItem];
  selectionChange: [rows: PendingTechnicalTaskItem[]];
}>();

const currentPage = defineModel<number>('currentPage', {
  required: true,
});

const pageSize = defineModel<number>('pageSize', {
  required: true,
});
</script>

<template>
  <WorkflowSectionCard
    title="生产任务"
    description="按病理号、节点、责任技师和期望完成时间推进。"
  >
    <ElTable
      v-loading="loading"
      :data="items"
      border
      @selection-change="emit('selectionChange', $event)"
    >
      <ElTableColumn type="selection" width="48" />
      <ElTableColumn label="病理号" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.pathologyNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标本/对象" min-width="180">
        <template #default="{ row }">
          <div class="font-medium">{{ formatNullable(row.objectId) }}</div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">
            {{ formatNullable(row.specimenId) }}
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="任务类型" min-width="120">
        <template #default="{ row }">
          {{ formatTaskType(row.taskType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="优先级" min-width="100">
        <template #default="{ row }">
          <ElTag :type="getPriorityTagType(row.priority)">
            {{ formatTaskPriority(row.priority) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="接收时间" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.receivedAt || row.createdAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="当前节点" min-width="130">
        <template #default="{ row }">
          {{ formatCurrentNode(row) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="责任技师" min-width="130">
        <template #default="{ row }">
          <ElTag :type="row.assignedToUserId ? 'success' : 'info'">
            {{ formatResponsible(row) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" min-width="110">
        <template #default="{ row }">
          <ElTag :type="getTaskStatusTagType(row.taskStatus)">
            {{ formatTaskStatus(row.taskStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="期望完成" min-width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.expectedCompletedAt || row.deadlineAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="180">
        <template #default="{ row }">
          {{ formatNullable(row.productionRemarks || row.remarks) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" min-width="240">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-2">
            <ElButton link type="primary" @click="emit('assign', row)">
              分派
            </ElButton>
            <ElButton
              v-if="row.assignedToUserId"
              link
              type="warning"
              @click="emit('release', row)"
            >
              释放
            </ElButton>
            <ElButton link type="success" @click="emit('openWorkstation', row)">
              进入工位
            </ElButton>
            <ElButton link @click="emit('openTracking', row)">追踪</ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>
  </WorkflowSectionCard>
</template>
