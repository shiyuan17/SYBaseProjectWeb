<script setup lang="ts">
import type { ReagentWarningView } from '../types/operation-support';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { formatNullable, formatWarningType } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  canQueryStocks: boolean;
  canQueryWarnings: boolean;
  getWarningTagType: (
    type?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  warnings: ReagentWarningView[];
}>();

const emit = defineEmits<{
  (event: 'loadWarnings'): void;
  (event: 'navigateToStockDetail', warning: ReagentWarningView): void;
}>();
</script>

<template>
  <OperationSectionCard
    v-if="canQueryWarnings"
    title="试剂预警"
    description="支持 LOW_STOCK 与 NEAR_EXPIRY 预警，并可跳转到对应批次详情。"
  >
    <template #extra>
      <ElButton :loading="loading" @click="emit('loadWarnings')">刷新</ElButton>
    </template>
    <ElTable v-loading="loading" :data="warnings" border>
      <ElTableColumn label="预警" min-width="110">
        <template #default="{ row }">
          <ElTag :type="getWarningTagType(row.warningType)">
            {{ formatWarningType(row.warningType) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="试剂" min-width="220">
        <template #default="{ row }">
          {{ row.reagentCode }} {{ row.reagentName }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="批号" min-width="140" prop="batchNo" />
      <ElTableColumn label="当前数量" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.stockQuantity) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="有效期" min-width="130">
        <template #default="{ row }">
          {{ formatNullable(row.expiryDate) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="canQueryStocks"
        fixed="right"
        label="跳转"
        width="110"
      >
        <template #default="{ row }">
          <ElButton
            link
            type="primary"
            @click="emit('navigateToStockDetail', row)"
          >
            查看批次
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
