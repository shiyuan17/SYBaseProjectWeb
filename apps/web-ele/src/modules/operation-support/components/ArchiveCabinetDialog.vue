<script setup lang="ts">
import type { CabinetFormState } from '../utils/archive-forms';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  ARCHIVE_CABINET_STATUS_OPTIONS,
  ARCHIVE_CABINET_TYPE_OPTIONS,
} from '../constants';

defineProps<{
  cabinetCapacityPreview: number;
  cabinetDialogMode: 'create' | 'edit' | null;
  cabinetPositionRulePreview: string;
  isEditingCabinet: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const cabinetForm = defineModel<CabinetFormState>('cabinetForm', {
  required: true,
});
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="cabinetDialogMode === 'edit' ? '更新归档柜' : '新增归档柜'"
    width="720px"
  >
    <ElForm label-width="118px">
      <ElFormItem label="归档柜编号" required>
        <ElInput
          v-model="cabinetForm.cabinetCode"
          :disabled="cabinetDialogMode === 'edit'"
        />
      </ElFormItem>
      <ElFormItem label="归档柜名称" required>
        <ElInput v-model="cabinetForm.cabinetName" />
      </ElFormItem>
      <ElFormItem label="柜体类型" required>
        <ElSelect
          v-model="cabinetForm.cabinetType"
          :disabled="cabinetDialogMode === 'edit'"
        >
          <ElOption
            v-for="option in ARCHIVE_CABINET_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="层数" required>
        <ElInputNumber
          v-model="cabinetForm.layerCount"
          :disabled="cabinetDialogMode === 'edit'"
          :min="1"
        />
      </ElFormItem>
      <ElFormItem label="每层柜位数" required>
        <ElInputNumber
          v-model="cabinetForm.slotCountPerLayer"
          :disabled="cabinetDialogMode === 'edit'"
          :min="1"
        />
      </ElFormItem>
      <ElFormItem label="归档柜状态" required>
        <ElSelect
          v-model="cabinetForm.cabinetStatus"
          :disabled="!isEditingCabinet"
        >
          <ElOption
            v-for="option in ARCHIVE_CABINET_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="位置说明">
        <ElInput v-model="cabinetForm.locationDescription" />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="cabinetForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="终端编码">
        <ElInput v-model="cabinetForm.terminalCode" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="cabinetForm.remarks" type="textarea" />
      </ElFormItem>
    </ElForm>

    <ElAlert :closable="false" class="mt-4" type="info">
      <template #title>
        柜位生成预览：{{ cabinetCapacityPreview }} 个柜位，编码示例
        {{ cabinetPositionRulePreview }}
      </template>
      <template #default>
        新增归档柜后，系统会按“层数 ×
        每层柜位数”自动初始化柜位，初始状态固定为“启用”；更新时仅允许维护基础信息和启停状态，不会重建已有柜位。
      </template>
    </ElAlert>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
