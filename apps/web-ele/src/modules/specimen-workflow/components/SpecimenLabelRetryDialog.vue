<script setup lang="ts">
import type {
  ApplicationDetailView,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

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
  ElMessage,
  ElTag,
} from 'element-plus';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
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

const accessStore = useAccessStore();
const userStore = useUserStore();

const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const canQueryApplicationDetail = computed(() =>
  accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
);

const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value);
  },
});

const applicationDetail = ref<ApplicationDetailView | null>(null);
const currentApplicationId = ref('');
const latestRegisterResult = ref<
  LatestSpecimenRegistrationResult | null | SpecimenRegisterResult
>(null);
const currentRetryResult = ref<LabelPrintRetryResult | null>(null);
const loadingDetail = ref(false);
const loadingResult = ref(false);
const pageError = ref('');
const retryingLabelPrint = ref(false);

const retryForm = reactive({
  operatorName: currentUserName.value,
  operatorUserId: currentUserId.value,
  printerCode: '',
  remarks: '',
  terminalCode: '',
});

function resetRetryForm() {
  Object.assign(retryForm, {
    operatorName: currentUserName.value,
    operatorUserId: currentUserId.value,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });
}

function resetDialogState() {
  pageError.value = '';
  applicationDetail.value = null;
  currentApplicationId.value = props.applicationId.trim();
  latestRegisterResult.value = props.registerResult;
  currentRetryResult.value = props.retryResult ?? null;
  resetRetryForm();
}

async function loadApplicationDetail() {
  if (!currentApplicationId.value) {
    return;
  }
  if (!canQueryApplicationDetail.value) {
    return;
  }

  loadingDetail.value = true;
  pageError.value = '';
  try {
    applicationDetail.value = await getApplicationDetail(
      currentApplicationId.value,
    );
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loadingDetail.value = false;
  }
}

async function loadLatestRegisterResult() {
  if (!currentApplicationId.value) {
    return;
  }
  loadingResult.value = true;
  try {
    const result = await getLatestRegistrationResult(
      currentApplicationId.value,
    );
    latestRegisterResult.value = result.labelPrintBatchNo
      ? result
      : props.registerResult;
  } catch (error) {
    if (!props.registerResult) {
      pageError.value = getWorkflowPageErrorMessage(error);
    }
    latestRegisterResult.value = props.registerResult;
  } finally {
    loadingResult.value = false;
  }
}

async function submitRetryLabelPrint() {
  const batchNo = latestRegisterResult.value?.labelPrintBatchNo?.trim();
  if (!batchNo) {
    return;
  }
  if (!retryForm.operatorName.trim()) {
    ElMessage.warning('当前登录人信息缺失');
    return;
  }
  if (!retryForm.printerCode.trim()) {
    ElMessage.warning('请填写打印机编码');
    return;
  }

  retryingLabelPrint.value = true;
  pageError.value = '';
  try {
    const result = await retryLabelPrint(batchNo, {
      operatorName: retryForm.operatorName.trim(),
      operatorUserId: retryForm.operatorUserId.trim() || null,
      printerCode: retryForm.printerCode.trim(),
      remarks: retryForm.remarks.trim() || null,
      terminalCode: retryForm.terminalCode.trim() || null,
    });
    currentRetryResult.value = result;
    emit('retried', {
      applicationId: currentApplicationId.value,
      retryResult: result,
    });
    ElMessage.success('标签补打请求已提交');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    retryingLabelPrint.value = false;
  }
}

function closeDialog() {
  dialogVisible.value = false;
}

const detailStatusType = computed(() =>
  applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
);

const hasFailedLabels = computed(
  () =>
    latestRegisterResult.value?.specimens.some(
      (item) => item.labelPrintStatus === 'FAILED',
    ) ?? false,
);

async function refreshDialog() {
  await Promise.all([loadApplicationDetail(), loadLatestRegisterResult()]);
}

watch(
  () => [props.applicationId, props.modelValue, props.retryResult],
  async ([, visible]) => {
    if (!visible) {
      return;
    }
    resetDialogState();
    await refreshDialog();
  },
  { immediate: true },
);
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
