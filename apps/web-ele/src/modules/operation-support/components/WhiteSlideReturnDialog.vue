<script setup lang="ts">
import type { WhiteSlideLoanView } from '../types/operation-support';
import type { WhiteSlideReturnFormState } from '../utils/white-slide-borrow';

import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

import { formatNullable } from '../utils/format';

defineProps<{
  loan: null | WhiteSlideLoanView;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const form = defineModel<WhiteSlideReturnFormState>('form', {
  required: true,
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="归还白片" width="560px">
    <ElForm label-width="112px">
      <ElFormItem label="借阅单号">
        <span>{{ formatNullable(loan?.loanNo) }}</span>
      </ElFormItem>
      <ElFormItem label="患者姓名">
        <span>{{ formatNullable(loan?.patientName) }}</span>
      </ElFormItem>
      <ElFormItem label="检查号">
        <span>{{ formatNullable(loan?.pathologyNo) }}</span>
      </ElFormItem>
      <ElFormItem label="归还备注">
        <ElInput v-model="form.remarks" :rows="3" type="textarea" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        确认归还
      </ElButton>
    </template>
  </ElDialog>
</template>
