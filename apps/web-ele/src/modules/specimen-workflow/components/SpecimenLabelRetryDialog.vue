<script setup lang="ts">
import type {
  LabelPrintRetryResult,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { toRef } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElTag,
} from 'element-plus';

import { useSpecimenLabelRetryDialog } from '../composables/useSpecimenLabelRetryDialog';
import { formatCurrentNode, formatNullable } from '../utils/format';

const props = withDefaults(
  defineProps<{
    applicationId: string;
    modelValue: boolean;
    registerResult?: null | SpecimenRegisterResult;
    retryResult?: LabelPrintRetryResult | null;
  }>(),
  {
    registerResult: null,
    retryResult: null,
  },
);

const emit = defineEmits<{
  retried: [
    {
      applicationId: string;
      retryResult: LabelPrintRetryResult;
    },
  ];
  'update:modelValue': [boolean];
}>();

const {
  applicationDetail,
  canQueryApplicationDetail,
  closeDialog,
  currentApplicationId,
  currentRetryResult,
  detailStatusType,
  dialogVisible,
  hasFailedLabels,
  latestRegisterResult,
  loadingDetail,
  loadingResult,
  pageError,
  refreshDialog,
  retryForm,
  retryingLabelPrint,
  submitRetryLabelPrint,
} = useSpecimenLabelRetryDialog({
  applicationId: toRef(props, 'applicationId'),
  modelValue: toRef(props, 'modelValue'),
  onRetried: (payload) => emit('retried', payload),
  registerResult: toRef(props, 'registerResult'),
  retryResult: toRef(props, 'retryResult'),
  updateModelValue: (value: boolean) => emit('update:modelValue', value),
});
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    :close-on-click-modal="false"
    destroy-on-close
    title="标签补打"
    top="6vh"
    width="1280px"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <ElAlert
        v-if="!canQueryApplicationDetail"
        :closable="false"
        title="当前账号没有申请单详情查询权限，弹窗中仅展示本次缓存的补打上下文。"
        type="info"
        show-icon
      />

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-4">
          <div class="text-base font-semibold text-foreground">当前上下文</div>
          <ElButton
            :loading="loadingDetail || loadingResult"
            @click="refreshDialog()"
          >
            刷新详情
          </ElButton>
        </div>

        <ElDescriptions :column="3" border>
          <ElDescriptionsItem label="申请单编号">
            {{ currentApplicationId || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(applicationDetail?.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="当前节点">
            {{ formatCurrentNode(applicationDetail?.currentNode) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者姓名">
            {{ formatNullable(applicationDetail?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(applicationDetail?.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="异常标记">
            <ElTag :type="detailStatusType">
              {{ applicationDetail?.abnormalFlag ? '有异常' : '正常' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <section class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="mb-4 text-base font-semibold text-foreground">补打信息</div>

        <template v-if="latestRegisterResult">
          <ElDescriptions :column="2" border class="mb-4">
            <ElDescriptionsItem label="标签批次号">
              {{ latestRegisterResult.labelPrintBatchNo }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="原始打印结果">
              <ElTag
                :type="
                  latestRegisterResult.labelPrintSuccess ? 'success' : 'warning'
                "
              >
                {{
                  latestRegisterResult.labelPrintSuccess ? '成功' : '存在失败'
                }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="原始消息" :span="2">
              {{ formatNullable(latestRegisterResult.labelPrintMessage) }}
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElAlert
            v-if="!hasFailedLabels"
            :closable="false"
            title="最近一次登记批次没有失败标签，无需再次补打。"
            type="info"
            show-icon
            class="mb-4"
          />

          <ElForm inline label-width="96px">
            <ElFormItem label="操作人" required>
              <ElInput :model-value="retryForm.operatorName" disabled />
            </ElFormItem>
            <ElFormItem label="打印机编码" required>
              <ElInput
                v-model="retryForm.printerCode"
                placeholder="请输入打印机编码"
              />
            </ElFormItem>
            <ElFormItem label="终端编码">
              <ElInput
                v-model="retryForm.terminalCode"
                placeholder="终端编码"
              />
            </ElFormItem>
          </ElForm>

          <ElForm label-width="96px">
            <ElFormItem label="备注">
              <ElInput v-model="retryForm.remarks" placeholder="补打说明" />
            </ElFormItem>
          </ElForm>

          <div class="flex justify-end">
            <ElButton
              :disabled="!hasFailedLabels"
              :loading="retryingLabelPrint"
              type="primary"
              @click="submitRetryLabelPrint"
            >
              发起补打
            </ElButton>
          </div>

          <ElDescriptions
            v-if="currentRetryResult"
            :column="2"
            border
            class="mt-4"
          >
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
        </template>

        <ElEmpty v-else description="当前申请单暂无可补打的登记结果" />
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <ElButton @click="closeDialog">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
