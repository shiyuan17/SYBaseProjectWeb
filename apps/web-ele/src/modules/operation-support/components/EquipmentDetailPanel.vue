<script setup lang="ts">
import type {
  EquipmentMaintenanceLogView,
  EquipmentRecordView,
} from '../types/operation-support';
import type { MaintenanceLogFormState } from '../utils/equipment-ledger';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  MAINTENANCE_STATUS_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
} from '../constants';
import {
  formatEquipmentCategory,
  formatEquipmentStatus,
  formatMaintenanceStatus,
  formatMaintenanceType,
  formatNullable,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  canCreateMaintenanceLog: boolean;
  loading: boolean;
  logs: EquipmentMaintenanceLogView[];
  selectedEquipment: EquipmentRecordView | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submitMaintenanceLog'): void;
}>();

const logForm = defineModel<MaintenanceLogFormState>('logForm', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    id="equipment-detail"
    title="设备详情与保养记录"
    description="用于承接设备选择和预警跳转，查看对应设备的台账详情与保养记录。"
  >
    <ElAlert
      v-if="!selectedEquipment"
      :closable="false"
      title="请在设备台账中选择一台设备，或在预警列表中点击“查看设备”。"
      type="info"
    />
    <template v-else>
      <ElDescriptions :column="2" border class="mb-4">
        <ElDescriptionsItem label="设备编码">
          {{ selectedEquipment.equipmentCode }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="设备名称">
          {{ selectedEquipment.equipmentName }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="设备类别">
          {{ formatEquipmentCategory(selectedEquipment.equipmentCategory) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="设备状态">
          {{ formatEquipmentStatus(selectedEquipment.equipmentStatus) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="型号">
          {{ formatNullable(selectedEquipment.modelNo) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="位置">
          {{ formatNullable(selectedEquipment.locationDescription) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="启用时间">
          {{ formatNullable(selectedEquipment.enabledAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="下次保养">
          {{ formatNullable(selectedEquipment.nextMaintenanceAt) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注">
          {{ formatNullable(selectedEquipment.remarks) }}
        </ElDescriptionsItem>
      </ElDescriptions>

      <ElForm v-if="canCreateMaintenanceLog" inline label-width="88px">
        <ElFormItem label="维护类型">
          <ElSelect v-model="logForm.maintenanceType" style="width: 140px">
            <ElOption
              v-for="option in MAINTENANCE_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="维护状态">
          <ElSelect v-model="logForm.maintenanceStatus" style="width: 140px">
            <ElOption
              v-for="option in MAINTENANCE_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="执行时间">
          <ElInput
            v-model="logForm.performedAt"
            placeholder="YYYY-MM-DDTHH:mm:ss"
            style="width: 210px"
          />
        </ElFormItem>
        <ElFormItem label="下次保养">
          <ElInput
            v-model="logForm.nextMaintenanceAt"
            placeholder="YYYY-MM-DDTHH:mm:ss"
            style="width: 210px"
          />
        </ElFormItem>
        <ElFormItem label="操作人">
          <ElInput v-model="logForm.operatorName" style="width: 160px" />
        </ElFormItem>
        <ElFormItem>
          <ElButton
            :loading="submitting"
            type="success"
            @click="emit('submitMaintenanceLog')"
          >
            新增记录
          </ElButton>
        </ElFormItem>
      </ElForm>
      <ElAlert
        v-else
        :closable="false"
        class="mb-4"
        title="当前账号没有设备保养记录维护权限，仅可查看设备详情和预警。"
        type="warning"
      />
      <ElForm v-if="canCreateMaintenanceLog" label-width="88px">
        <ElFormItem label="说明">
          <ElInput v-model="logForm.description" type="textarea" />
        </ElFormItem>
      </ElForm>
      <ElTable v-loading="loading" :data="logs" border>
        <ElTableColumn label="类型" min-width="120">
          <template #default="{ row }">
            {{ formatMaintenanceType(row.maintenanceType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="120">
          <template #default="{ row }">
            {{ formatMaintenanceStatus(row.maintenanceStatus) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="执行时间" min-width="180" prop="performedAt" />
        <ElTableColumn label="执行人" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.performedByName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="下次保养" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.nextMaintenanceAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="220">
          <template #default="{ row }">
            {{ formatNullable(row.description) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
