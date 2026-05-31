<script setup lang="ts">
import type { EquipmentFormState } from '../utils/equipment-ledger';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  EQUIPMENT_CATEGORY_OPTIONS,
  EQUIPMENT_STATUS_OPTIONS,
} from '../constants';

const props = defineProps<{
  isEditingEquipment: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const equipmentForm = defineModel<EquipmentFormState>('equipmentForm', {
  required: true,
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="设备档案维护" width="680px">
    <ElForm label-width="120px">
      <ElFormItem label="设备编码" required>
        <ElInput
          v-model="equipmentForm.equipmentCode"
          :disabled="props.isEditingEquipment"
        />
      </ElFormItem>
      <ElFormItem label="设备名称" required>
        <ElInput v-model="equipmentForm.equipmentName" />
      </ElFormItem>
      <ElFormItem label="设备类别">
        <ElSelect v-model="equipmentForm.equipmentCategory" clearable>
          <ElOption
            v-for="option in EQUIPMENT_CATEGORY_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="型号">
        <ElInput v-model="equipmentForm.modelNo" />
      </ElFormItem>
      <ElFormItem label="状态" required>
        <ElSelect v-model="equipmentForm.equipmentStatus">
          <ElOption
            v-for="option in EQUIPMENT_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="位置">
        <ElInput v-model="equipmentForm.locationDescription" />
      </ElFormItem>
      <ElFormItem label="启用时间">
        <ElInput
          v-model="equipmentForm.enabledAt"
          placeholder="YYYY-MM-DDTHH:mm:ss"
        />
      </ElFormItem>
      <ElFormItem label="下次保养">
        <ElInput
          v-model="equipmentForm.nextMaintenanceAt"
          placeholder="YYYY-MM-DDTHH:mm:ss"
        />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="equipmentForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="equipmentForm.remarks" type="textarea" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton
        :loading="props.submitting"
        type="primary"
        @click="emit('submit')"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
