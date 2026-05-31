<script setup lang="ts">
import type { MaterialLoanView } from '../types/operation-support';
import type { ReturnFormState } from '../utils/archive-forms';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';

import { formatMaterialType, formatNullable } from '../utils/format';

defineProps<{
  returningLoan: MaterialLoanView | null;
  selectedPositionLabel: string;
  selectedReturnPositionDescription: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const returnForm = defineModel<ReturnFormState>('returnForm', {
  required: true,
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="材料归还" width="640px">
    <ElForm label-width="118px">
      <ElFormItem label="借阅单号">
        <span>{{ formatNullable(returningLoan?.loanId) }}</span>
      </ElFormItem>
      <ElFormItem label="材料类型">
        <span>{{ formatMaterialType(returningLoan?.materialType) }}</span>
      </ElFormItem>
      <ElFormItem label="材料 ID">
        <span>{{ formatNullable(returningLoan?.materialId) }}</span>
      </ElFormItem>
      <ElFormItem label="替代柜位">
        <div class="flex flex-col gap-2">
          <div class="font-medium">{{ selectedPositionLabel }}</div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">
            {{ selectedReturnPositionDescription }}
          </div>
        </div>
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="returnForm.operatorName" />
      </ElFormItem>
      <ElFormItem label="终端编码">
        <ElInput v-model="returnForm.terminalCode" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="returnForm.remarks" type="textarea" />
      </ElFormItem>
    </ElForm>

    <ElAlert :closable="false" class="mt-4" type="info">
      <template #default>
        未指定替代柜位时，系统会优先尝试归还到原始柜位；若原柜位已占用或已停用，后端会返回校验提示，请先在“柜位查询与选择”中重新选定可用柜位。
      </template>
    </ElAlert>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        确认归还
      </ElButton>
    </template>
  </ElDialog>
</template>
