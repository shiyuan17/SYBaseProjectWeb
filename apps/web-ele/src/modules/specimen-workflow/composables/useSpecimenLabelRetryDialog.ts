import type { Ref } from 'vue';

import type {
  ApplicationDetailView,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
  retryLabelPrint,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';

type DialogRegisterResult =
  | LatestSpecimenRegistrationResult
  | null
  | SpecimenRegisterResult;

type RetryFormModel = {
  operatorName: string;
  operatorUserId: string;
  printerCode: string;
  remarks: string;
  terminalCode: string;
};

function createRetryFormDefaults(
  operatorName: string,
  operatorUserId: string,
): RetryFormModel {
  return {
    operatorName,
    operatorUserId,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  };
}

export function useSpecimenLabelRetryDialog(options: {
  applicationId: Readonly<Ref<string>>;
  modelValue: Readonly<Ref<boolean>>;
  onRetried: (payload: {
    applicationId: string;
    retryResult: LabelPrintRetryResult;
  }) => void;
  registerResult: Readonly<Ref<null | SpecimenRegisterResult | undefined>>;
  retryResult: Readonly<Ref<LabelPrintRetryResult | null | undefined>>;
  updateModelValue: (value: boolean) => void;
}) {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
  const canQueryApplicationDetail = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
  );

  const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
  const currentUserId = computed(() => userStore.userInfo?.userId ?? '');

  const dialogVisible = computed({
    get: () => options.modelValue.value,
    set: (value: boolean) => {
      options.updateModelValue(value);
    },
  });

  const applicationDetail = ref<ApplicationDetailView | null>(null);
  const currentApplicationId = ref('');
  const latestRegisterResult = ref<DialogRegisterResult>(null);
  const currentRetryResult = ref<LabelPrintRetryResult | null>(null);
  const loadingDetail = ref(false);
  const loadingResult = ref(false);
  const pageError = ref('');
  const retryingLabelPrint = ref(false);

  const retryForm = reactive<RetryFormModel>(
    createRetryFormDefaults(currentUserName.value, currentUserId.value),
  );

  function resetRetryForm() {
    Object.assign(
      retryForm,
      createRetryFormDefaults(currentUserName.value, currentUserId.value),
    );
  }

  function resetDialogState() {
    pageError.value = '';
    applicationDetail.value = null;
    currentApplicationId.value = options.applicationId.value.trim();
    latestRegisterResult.value = options.registerResult.value ?? null;
    currentRetryResult.value = options.retryResult.value ?? null;
    resetRetryForm();
  }

  async function loadApplicationDetail() {
    const applicationId = currentApplicationId.value;
    if (!applicationId || !canQueryApplicationDetail.value) {
      return;
    }

    loadingDetail.value = true;
    pageError.value = '';
    try {
      const detail = await getApplicationDetail(applicationId);
      if (currentApplicationId.value === applicationId) {
        applicationDetail.value = detail;
      }
    } catch (error) {
      if (currentApplicationId.value === applicationId) {
        pageError.value = getWorkflowPageErrorMessage(error);
      }
    } finally {
      loadingDetail.value = false;
    }
  }

  async function loadLatestRegisterResult() {
    const applicationId = currentApplicationId.value;
    if (!applicationId) {
      return;
    }

    loadingResult.value = true;
    try {
      const result = await getLatestRegistrationResult(applicationId);
      if (currentApplicationId.value !== applicationId) {
        return;
      }
      latestRegisterResult.value = result.labelPrintBatchNo
        ? result
        : (options.registerResult.value ?? null);
    } catch (error) {
      if (currentApplicationId.value !== applicationId) {
        return;
      }
      if (!options.registerResult.value) {
        pageError.value = getWorkflowPageErrorMessage(error);
      }
      latestRegisterResult.value = options.registerResult.value ?? null;
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
        printerCode: retryForm.printerCode.trim(),
        remarks: retryForm.remarks.trim() || null,
        terminalCode: retryForm.terminalCode.trim() || null,
      });
      currentRetryResult.value = result;
      options.onRetried({
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
    () =>
      [
        options.applicationId.value,
        options.modelValue.value,
        options.retryResult.value,
      ] as const,
    async ([, visible]) => {
      if (!visible) {
        return;
      }
      resetDialogState();
      await refreshDialog();
    },
    { immediate: true },
  );

  return {
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
  };
}
