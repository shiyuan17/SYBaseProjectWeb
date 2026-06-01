<script setup lang="ts">
import type { SpecimenManagementListItem } from '../types/specimen-workflow';
import type { VerifyAction } from '../utils/specimen-management';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';

import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

import { formatNullable } from '../utils/format';

type VerifyFormModel = {
  fixationLiquidType: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  specimenBarcode: string;
  terminalCode: string;
};

type WorkflowReferenceOptionsLike = {
  fixationLiquidTypes: Array<{ label: string; value: string }>;
};

defineProps<{
  action: VerifyAction;
  submitting: boolean;
  targetRow: null | SpecimenManagementListItem;
  workflowReferenceOptions: WorkflowReferenceOptionsLike;
}>();

const emit = defineEmits<{
  (event: 'submitVerify'): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<VerifyFormModel>('form', { required: true });

function formatContainerRatio(row: SpecimenManagementListItem) {
  return `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}`;
}

</script>

<template>
  <ElDialog
    v-model="visible"
    :close-on-click-modal="false"
    destroy-on-close
    :title="action === 'start' ? '开始核验' : '完成核验'"
    width="760px"
  >
    <div class="flex flex-col gap-4">
      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="标本编号">
            {{ targetRow?.specimenNo || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="条码">
            {{ targetRow?.barcode || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="容器名称">
            {{ formatNullable(targetRow?.containerName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="容器数/标本数">
            {{ targetRow ? formatContainerRatio(targetRow) : '-' }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2">
            <ElFormItem label="核验人" required>
              <ElInput :model-value="form.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="固定液">
              <ReferenceOptionSelect
                v-model="form.fixationLiquidType"
                :options="workflowReferenceOptions.fixationLiquidTypes"
                placeholder="请选择或输入固定液"
              />
            </ElFormItem>
            <ElFormItem label="终端编号">
              <ElInput
                v-model="form.terminalCode"
                placeholder="工作站或扫码设备编号"
              />
            </ElFormItem>
          </div>
          <ElFormItem label="备注">
            <ElInput
              v-model="form.remarks"
              :rows="2"
              placeholder="必要时补充核验说明"
              type="textarea"
            />
          </ElFormItem>
        </ElForm>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton
          :loading="submitting"
          type="primary"
          @click="emit('submitVerify')"
        >
          {{ action === 'start' ? '开始核验' : '完成核验' }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
