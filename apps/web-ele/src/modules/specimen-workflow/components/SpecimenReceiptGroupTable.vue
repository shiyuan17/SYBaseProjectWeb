<script setup lang="ts">
import type { TransportReceiptGroup } from '../utils/specimen-receipt';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { formatDateTime } from '../utils/format';
import { formatGroupContainerNames } from '../utils/specimen-receipt';

defineProps<{
  groups: TransportReceiptGroup[];
  loading: boolean;
}>();

const emit = defineEmits<{
  prepare: [group: TransportReceiptGroup];
  reprint: [group: TransportReceiptGroup];
}>();
</script>

<template>
  <ElTable v-loading="loading" :data="groups" border>
    <ElTableColumn label="转运单号" min-width="180" prop="transportOrderId" />
    <ElTableColumn label="申请单号" min-width="150" prop="applicationNo" />
    <ElTableColumn label="患者姓名" min-width="120">
      <template #default="{ row }">
        {{ row.patientName ?? '-' }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本数" min-width="100">
      <template #default="{ row }">
        {{ row.items.length }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="提醒/未接收" min-width="140">
      <template #default="{ row }">
        <div class="flex flex-col gap-1 text-sm">
          <span>提醒: {{ row.reminderCount }}</span>
          <span>未接收: {{ row.unreceivedCount }}</span>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="容器名称" min-width="180">
      <template #default="{ row }">
        {{ formatGroupContainerNames(row.items) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="最近追踪时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.latestTrackingAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本条码" min-width="240">
      <template #default="{ row }">
        <div class="flex flex-wrap gap-1">
          <ElTag v-if="row.batchAbnormalFlag" effect="dark" type="danger">
            异常批次
          </ElTag>
          <ElTag
            v-for="barcode in row.barcodes"
            :key="barcode"
            effect="plain"
            type="info"
          >
            {{ barcode }}
          </ElTag>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn fixed="right" label="操作" width="120">
      <template #default="{ row }">
        <div class="flex flex-col items-start gap-1">
          <ElButton link type="primary" @click="emit('prepare', row)">
            接收
          </ElButton>
          <ElButton link type="info" @click="emit('reprint', row)">
            补打申请单
          </ElButton>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
