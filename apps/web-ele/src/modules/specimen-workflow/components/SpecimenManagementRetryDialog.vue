<script setup lang="ts">
import type { LabelPrintRetryResult } from '../types/specimen-workflow';

import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElTag,
} from 'element-plus';

import { formatNullable } from '../utils/format';

type RetryFormModel = {
  operatorName: string;
  operatorUserId: string;
  printerCode: string;
  remarks: string;
  terminalCode: string;
};

defineProps<{
  batchNo: string;
  currentRetryResult: LabelPrintRetryResult | null;
  retrySelectionCount: number;
  retrySourceLabel: string;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submitRetry'): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<RetryFormModel>('form', { required: true });
</script>

<template>
  <ElDialog
    v-model="visible"
    :close-on-click-modal="false"
    destroy-on-close
    title="标签补打"
    width="760px"
  >
    <div class="flex flex-col gap-4">
      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="来源">
            {{ retrySourceLabel || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="标签批次号">
            {{ batchNo || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="涉及标本数">
            {{ retrySelectionCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="最近结果">
            <ElTag
              :type="currentRetryResult?.allSuccessful ? 'success' : 'info'"
            >
              {{
                currentRetryResult
                  ? currentRetryResult.allSuccessful
                    ? '全部成功'
                    : '已提交补打'
                  : '待执行'
              }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <ElForm label-width="96px">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ElFormItem label="操作人" required>
              <ElInput :model-value="form.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编号" required>
              <ElInput
                v-model="form.printerCode"
                placeholder="请输入打印机编号"
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
            <ElInput v-model="form.remarks" placeholder="补打说明" />
          </ElFormItem>
        </ElForm>
      </section>

      <section
        v-if="currentRetryResult"
        class="rounded-lg border border-border bg-card p-4 shadow-sm"
      >
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="批次号">
            {{ currentRetryResult.labelPrintBatchNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="整体结果">
            <ElTag
              :type="currentRetryResult.allSuccessful ? 'success' : 'warning'"
            >
              {{ currentRetryResult.allSuccessful ? '全部成功' : '部分成功' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="成功数">
            {{ currentRetryResult.successCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="失败数">
            {{ currentRetryResult.failedCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="重试数">
            {{ currentRetryResult.retriedCount }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="消息">
            {{ formatNullable(currentRetryResult.message) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="visible = false">取消</ElButton>
        <ElButton
          :loading="submitting"
          type="primary"
          @click="emit('submitRetry')"
        >
          提交补打
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>
