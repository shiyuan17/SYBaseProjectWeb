<script setup lang="ts">
import type { LoanFormState } from '../utils/archive-forms';

import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

import { formatMaterialType, formatNullable } from '../utils/format';

defineProps<{
  materialSummary: string;
  selectedCount: number;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const loanForm = defineModel<LoanFormState>('loanForm', {
  required: true,
});
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :title="selectedCount > 1 ? `批量借记（${selectedCount} 条）` : '借记'"
    width="720px"
  >
    <ElForm label-width="112px">
      <ElFormItem label="材料类型">
        <span>{{ formatMaterialType(loanForm.materialType) }}</span>
      </ElFormItem>
      <ElFormItem label="材料">
        <span>{{
          formatNullable(materialSummary || loanForm.materialId)
        }}</span>
      </ElFormItem>
      <ElFormItem label="借阅人姓名" required>
        <ElInput v-model="loanForm.borrowedByName" />
      </ElFormItem>
      <ElFormItem label="借阅人电话">
        <ElInput v-model="loanForm.borrowerPhone" />
      </ElFormItem>
      <ElFormItem label="借阅人单位">
        <ElInput v-model="loanForm.borrowerUnit" />
      </ElFormItem>
      <ElFormItem label="押金">
        <ElInput v-model="loanForm.depositAmount" />
      </ElFormItem>
      <ElFormItem label="用途">
        <ElInput v-model="loanForm.borrowPurpose" />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="loanForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="loanForm.remarks" :rows="3" type="textarea" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
