<script setup lang="ts">
import type { EquipmentRecordView } from '../types/operation-support';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { EQUIPMENT_STATUS_OPTIONS } from '../constants';
import {
  formatEquipmentCategory,
  formatEquipmentStatus,
  formatNullable,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type EquipmentFiltersState = {
  equipmentStatus: string;
  keyword: string;
};

defineProps<{
  canCreateEquipment: boolean;
  canQueryEquipment: boolean;
  canUpdateEquipment: boolean;
  equipmentRecords: EquipmentRecordView[];
  getEquipmentStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: 'loadEquipmentRecords'): void;
  (event: 'openCreateEquipmentDialog'): void;
  (event: 'openEditEquipmentDialog', row: EquipmentRecordView): void;
  (event: 'selectEquipment', row: EquipmentRecordView | null): void;
}>();

const equipmentFilters = defineModel<EquipmentFiltersState>(
  'equipmentFilters',
  {
    required: true,
  },
);
</script>

<template>
  <OperationSectionCard
    v-if="canQueryEquipment || canCreateEquipment || canUpdateEquipment"
    title="设备台账"
    description="按关键字和设备状态查询设备台账，维护设备基础档案。"
  >
    <template #extra>
      <ElButton
        v-if="canCreateEquipment"
        type="primary"
        @click="emit('openCreateEquipmentDialog')"
      >
        新增设备
      </ElButton>
    </template>
    <ElAlert
      v-if="!canQueryEquipment"
      :closable="false"
      title="当前账号没有设备档案查询权限，仅可使用已开放的维护或预警能力。"
      type="warning"
    />
    <template v-else>
      <ElForm inline label-width="88px">
        <ElFormItem label="关键字">
          <ElInput
            v-model="equipmentFilters.keyword"
            clearable
            placeholder="编码/名称"
            style="width: 220px"
            @keyup.enter="emit('loadEquipmentRecords')"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect
            v-model="equipmentFilters.equipmentStatus"
            clearable
            placeholder="全部"
            style="width: 160px"
          >
            <ElOption
              v-for="option in EQUIPMENT_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton
            :loading="loading"
            type="primary"
            @click="emit('loadEquipmentRecords')"
          >
            查询
          </ElButton>
        </ElFormItem>
      </ElForm>
      <ElTable
        v-loading="loading"
        :data="equipmentRecords"
        border
        highlight-current-row
        @current-change="emit('selectEquipment', $event)"
      >
        <ElTableColumn label="设备编码" min-width="140" prop="equipmentCode" />
        <ElTableColumn label="设备名称" min-width="180" prop="equipmentName" />
        <ElTableColumn label="类别" min-width="120">
          <template #default="{ row }">
            {{ formatEquipmentCategory(row.equipmentCategory) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="型号" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.modelNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="110">
          <template #default="{ row }">
            <ElTag :type="getEquipmentStatusTagType(row.equipmentStatus)">
              {{ formatEquipmentStatus(row.equipmentStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="下次保养" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.nextMaintenanceAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="canUpdateEquipment"
          fixed="right"
          label="操作"
          width="100"
        >
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click.stop="emit('openEditEquipmentDialog', row)"
            >
              编辑
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
