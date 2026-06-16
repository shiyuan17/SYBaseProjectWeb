<script setup lang="ts">
import type { ArchiveRecordView } from '../types/operation-support';
import type { LoanFormState } from '../utils/archive-forms';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { formatNullable } from '../utils/format';

defineProps<{
  selectedCount: number;
  selectedRecords: ArchiveRecordView[];
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
    :title="selectedCount > 1 ? `蜡块借记（${selectedCount} 条）` : '蜡块借记'"
    width="860px"
  >
    <ElForm class="grid grid-cols-2 gap-x-10" label-width="96px">
      <ElFormItem label="借阅人姓名" required>
        <ElInput v-model="loanForm.borrowedByName" />
      </ElFormItem>
      <ElFormItem label="借阅人电话">
        <ElInput v-model="loanForm.borrowerPhone" />
      </ElFormItem>
      <ElFormItem label="借阅人单位">
        <ElInput v-model="loanForm.borrowerUnit" />
      </ElFormItem>
      <ElFormItem label="押金(元)">
        <ElInput v-model="loanForm.depositAmount" />
      </ElFormItem>
      <ElFormItem class="col-span-2" label="备注">
        <ElInput v-model="loanForm.remarks" :rows="4" type="textarea" />
      </ElFormItem>
    </ElForm>

    <ElTable
      border
      class="mt-4"
      :data="selectedRecords"
      height="240"
      row-key="objectId"
    >
      <ElTableColumn label="序" type="index" width="52" />
      <ElTableColumn label="病理号" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.pathologyNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="蜡块号" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.objectCode || row.objectId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人ID" min-width="130" prop="caseId" />
      <ElTableColumn label="病人姓名" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <template #footer>
      <ElButton @click="dialogVisible = false">退出</ElButton>
      <ElButton :loading="submitting" type="primary" @click="emit('submit')">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
