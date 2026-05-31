<script setup lang="ts">
import type { ReagentFormState } from '../utils/reagent-ledger';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSwitch,
} from 'element-plus';

const props = defineProps<{
  isEditingReagent: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const reagentForm = defineModel<ReagentFormState>('reagentForm', {
  required: true,
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="试剂维护" width="680px">
    <ElForm label-width="120px">
      <ElFormItem label="试剂编码" required>
        <ElInput
          v-model="reagentForm.reagentCode"
          :disabled="props.isEditingReagent"
        />
      </ElFormItem>
      <ElFormItem label="试剂名称" required>
        <ElInput v-model="reagentForm.reagentName" />
      </ElFormItem>
      <ElFormItem label="规格">
        <ElInput v-model="reagentForm.specification" />
      </ElFormItem>
      <ElFormItem label="单位">
        <ElInput v-model="reagentForm.unit" />
      </ElFormItem>
      <ElFormItem label="厂家">
        <ElInput v-model="reagentForm.manufacturer" />
      </ElFormItem>
      <ElFormItem label="低库存阈值">
        <ElInputNumber
          v-model="reagentForm.defaultLowStockThreshold"
          :min="0"
        />
      </ElFormItem>
      <ElFormItem label="近效期天数">
        <ElInputNumber v-model="reagentForm.defaultNearExpiryDays" :min="0" />
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="reagentForm.enabled" />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="reagentForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="reagentForm.remarks" type="textarea" />
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
