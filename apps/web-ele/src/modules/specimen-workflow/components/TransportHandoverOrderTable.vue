<script setup lang="ts">
import type { PendingTransportOrderItem } from '../types/specimen-workflow';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatTransportStatus,
} from '../utils/format';
import { canHandoverTransportOrder } from '../utils/transport-handover';

defineProps<{
  loading: boolean;
  orders: PendingTransportOrderItem[];
}>();

const emit = defineEmits<{
  handover: [order: PendingTransportOrderItem];
  print: [order: PendingTransportOrderItem];
  selectionChange: [rows: PendingTransportOrderItem[]];
}>();
</script>

<template>
  <ElTable
    v-loading="loading"
    :data="orders"
    border
    @selection-change="emit('selectionChange', $event)"
  >
    <ElTableColumn type="selection" width="38" />
    <ElTableColumn label="转运单号" min-width="160" prop="transportOrderNo" />
    <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
    <ElTableColumn label="患者姓名" min-width="120">
      <template #default="{ row }">
        {{ formatNullable(row.patientName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="交接科室" min-width="160">
      <template #default="{ row }">
        {{ formatNullable(row.handoverDepartmentName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="接收科室" min-width="160">
      <template #default="{ row }">
        {{ formatNullable(row.receiverDepartmentName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="状态" min-width="120">
      <template #default="{ row }">
        <ElTag :type="row.status === 'HANDED_OVER' ? 'success' : 'warning'">
          {{ formatTransportStatus(row.status) }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="待转运时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.toBeTransportedAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="交接时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.handedOverAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="出库人" min-width="120">
      <template #default="{ row }">
        {{ formatNullable(row.outboundUserName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本条码" min-width="220">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-1">
          <ElTag
            v-for="barcode in row.specimenBarcodes"
            :key="barcode"
            effect="plain"
            type="info"
          >
            {{ barcode }}
          </ElTag>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn fixed="right" label="操作" min-width="180">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-2">
          <ElButton link type="primary" @click="emit('print', row)">
            打印
          </ElButton>
          <ElButton
            :disabled="!canHandoverTransportOrder(row)"
            link
            type="success"
            @click="emit('handover', row)"
          >
            交接
          </ElButton>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
