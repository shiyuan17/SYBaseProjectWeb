<script setup lang="ts">
import type { ReagentView } from '../types/operation-support';
import type { ReagentStockFormState } from '../utils/reagent-ledger';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
} from 'element-plus';

import { REAGENT_STOCK_STATUS_OPTIONS } from '../constants';

const props = defineProps<{
  isEditingStock: boolean;
  reagents: ReagentView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const stockForm = defineModel<ReagentStockFormState>('stockForm', {
  required: true,
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="库存批次维护" width="680px">
    <ElForm label-width="120px">
      <ElFormItem label="试剂" required>
        <ElSelect
          v-model="stockForm.reagentId"
          :disabled="props.isEditingStock"
          filterable
        >
          <ElOption
            v-for="reagent in props.reagents"
            :key="reagent.id"
            :label="`${reagent.reagentCode} ${reagent.reagentName}`"
            :value="reagent.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="批号" required>
        <ElInput v-model="stockForm.batchNo" :disabled="props.isEditingStock" />
      </ElFormItem>
      <ElFormItem label="数量">
        <ElInputNumber v-model="stockForm.stockQuantity" :min="0" />
      </ElFormItem>
      <ElFormItem label="状态" required>
        <ElSelect v-model="stockForm.stockStatus">
          <ElOption
            v-for="option in REAGENT_STOCK_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="有效期">
        <ElInput v-model="stockForm.expiryDate" placeholder="YYYY-MM-DD" />
      </ElFormItem>
      <ElFormItem label="存放位置">
        <ElInput v-model="stockForm.storageLocation" />
      </ElFormItem>
      <ElFormItem label="低库存阈值">
        <ElInputNumber v-model="stockForm.lowStockThreshold" :min="0" />
      </ElFormItem>
      <ElFormItem label="近效期天数">
        <ElInputNumber v-model="stockForm.nearExpiryDays" :min="0" />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="stockForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="stockForm.remarks" type="textarea" />
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
