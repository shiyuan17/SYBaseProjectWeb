<script setup lang="ts">
import type { EquipmentWarningView } from '../types/operation-support';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import {
  formatEquipmentStatus,
  formatNullable,
  formatWarningType,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  canQueryEquipment: boolean;
  canQueryWarnings: boolean;
  getWarningTagType: (
    type?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  warnings: EquipmentWarningView[];
}>();

const emit = defineEmits<{
  (event: 'loadWarnings'): void;
  (event: 'navigateToEquipmentDetail', warning: EquipmentWarningView): void;
}>();
</script>

<template>
  <OperationSectionCard
    v-if="canQueryWarnings"
    title="设备预警"
    description="支持 DUE_SOON 与 OVERDUE 预警，并可跳转到对应设备详情。"
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
      <ElTableColumn label="设备编码" min-width="140" prop="equipmentCode" />
      <ElTableColumn label="设备名称" min-width="180" prop="equipmentName" />
      <ElTableColumn label="状态" min-width="120">
        <template #default="{ row }">
          {{ formatEquipmentStatus(row.equipmentStatus) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="下次保养" min-width="180">
        <template #default="{ row }">
          {{ formatNullable(row.nextMaintenanceAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="canQueryEquipment"
        fixed="right"
        label="跳转"
        width="110"
      >
        <template #default="{ row }">
          <ElButton
            link
            type="primary"
            @click="emit('navigateToEquipmentDetail', row)"
          >
            查看设备
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
