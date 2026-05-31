<script setup lang="ts">
import type { ReagentStockView, ReagentView } from '../types/operation-support';

import { ElAlert, ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { formatNullable, formatReagentStockStatus } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  selectedReagent: null | ReagentView;
  selectedStock: null | ReagentStockView;
}>();
</script>

<template>
  <OperationSectionCard
    id="reagent-stock-detail"
    title="批次详情"
    description="用于承接库存表选择和预警跳转，查看对应批次与试剂主数据。"
  >
    <ElAlert
      v-if="!selectedStock"
      :closable="false"
      title="请在库存批次列表中选择一条批次，或在预警列表中点击“查看批次”。"
      type="info"
    />
    <template v-else>
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="试剂编码">
          {{ formatNullable(selectedStock.reagentCode) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="试剂名称">
          {{ formatNullable(selectedStock.reagentName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="批号">
          {{ selectedStock.batchNo }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="库存状态">
          {{ formatReagentStockStatus(selectedStock.stockStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="当前数量">
          {{ formatNullable(selectedStock.stockQuantity) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="低库存阈值">
          {{ formatNullable(selectedStock.lowStockThreshold) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="近效期天数">
          {{ formatNullable(selectedStock.nearExpiryDays) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="有效期">
          {{ formatNullable(selectedStock.expiryDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="存放位置">
          {{ formatNullable(selectedStock.storageLocation) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注">
          {{ formatNullable(selectedStock.remarks) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="试剂默认阈值">
          {{ formatNullable(selectedReagent?.defaultLowStockThreshold) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="试剂默认近效期">
          {{ formatNullable(selectedReagent?.defaultNearExpiryDays) }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </template>
  </OperationSectionCard>
</template>
