<script setup lang="ts">
import type { ReagentStockEventView } from '../types/operation-support';

import { ElDialog, ElTable, ElTableColumn } from 'element-plus';

import { formatNullable } from '../utils/format';

defineProps<{
  events: ReagentStockEventView[];
  loading: boolean;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
</script>

<template>
  <ElDialog v-model="dialogVisible" title="消耗明细" width="860px">
    <ElTable v-loading="loading" :data="events" border>
      <ElTableColumn label="事件类型" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.eventType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="变更数量" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.quantityDelta) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="变更前" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.quantityBefore) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="变更后" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.quantityAfter) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作时间" min-width="170">
        <template #default="{ row }">
          {{ formatNullable(row.occurredAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.operatorName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="180">
        <template #default="{ row }">
          {{ formatNullable(row.remarks) }}
        </template>
      </ElTableColumn>
    </ElTable>
  </ElDialog>
</template>
