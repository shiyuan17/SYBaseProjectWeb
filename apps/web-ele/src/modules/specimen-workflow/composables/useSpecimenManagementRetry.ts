import type { ComputedRef, Ref } from 'vue';

import type {
  LabelPrintRetryResult,
  SpecimenManagementListItem,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';

import { reactive, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import { retryLabelPrint } from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  buildRetryLabelPrintRequest,
  buildRetryRowsFromLatestResult,
  createRetryFormDefaults,
  resolveRetryDialogContext,
} from '../utils/specimen-management';

type RetryFormModel = {
  operatorName: string;
  operatorUserId: string;
  printerCode: string;
  remarks: string;
  terminalCode: string;
};

export function useSpecimenManagementRetry(options: {
  currentUserId: ComputedRef<string>;
  currentUserName: ComputedRef<string>;
  detailDrawerVisible: Ref<boolean>;
  detailRow: Ref<null | SpecimenManagementListItem>;
  latestRegisterApplicationId: Ref<string>;
  latestRegisterResult: Ref<null | SpecimenRegisterResult>;
  loadSpecimens: () => Promise<void>;
  openDetailDrawer: (row: SpecimenManagementListItem) => Promise<void>;
  pageError: Ref<string>;
  selectedRows: Ref<SpecimenManagementListItem[]>;
}) {
  const retryDialogVisible = ref(false);
  const retrySubmitting = ref(false);
  const retrySelectionCount = ref(0);
  const retrySourceLabel = ref('');
  const currentRetryResult = ref<LabelPrintRetryResult | null>(null);
  const retryContext = reactive({
    applicationId: '',
    batchNo: '',
  });
  const retryForm = reactive<RetryFormModel>({
    operatorName: '',
    operatorUserId: '',
    printerCode: '',
    remarks: '',
    terminalCode: '',
  });

  function resetRetryForm() {
    Object.assign(
      retryForm,
      createRetryFormDefaults(
        options.currentUserName.value,
        options.currentUserId.value,
      ),
    );
  }

  watch(
    () => [options.currentUserId.value, options.currentUserName.value],
    () => {
      resetRetryForm();
    },
    { immediate: true },
  );

  function openRetryDialog(
    rows: SpecimenManagementListItem[],
    sourceLabel: string,
  ) {
    const context = resolveRetryDialogContext(rows, sourceLabel);
    if (!context.ok) {
      ElMessage.warning(context.errorMessage);
      return;
    }

    retryContext.applicationId = context.applicationId;
    retryContext.batchNo = context.batchNo;
    retrySelectionCount.value = context.selectionCount;
    retrySourceLabel.value = context.sourceLabel;
    currentRetryResult.value = null;
    resetRetryForm();
    retryDialogVisible.value = true;
  }

  function handleBulkRetry() {
    openRetryDialog(options.selectedRows.value, '批量补打标签');
  }

  function handleRowRetry(row: SpecimenManagementListItem) {
    openRetryDialog([row], '补打本批次');
  }

  async function submitRetry() {
    if (!retryContext.batchNo) {
      ElMessage.warning('缺少标签批次号');
      return;
    }
    if (!retryForm.printerCode.trim()) {
      ElMessage.warning('请输入打印机编号');
      return;
    }

    retrySubmitting.value = true;
    options.pageError.value = '';
    try {
      const result = await retryLabelPrint(
        retryContext.batchNo,
        buildRetryLabelPrintRequest(retryForm),
      );
      currentRetryResult.value = result;
      ElMessage.success('批次补打已提交');
      await options.loadSpecimens();
      if (
        options.detailDrawerVisible.value &&
        options.detailRow.value?.applicationId === retryContext.applicationId
      ) {
        await options.openDetailDrawer(options.detailRow.value);
      }
    } catch (error) {
      options.pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      retrySubmitting.value = false;
    }
  }

  function openRetryDialogFromLatestResult() {
    const result = options.latestRegisterResult.value;
    if (!result?.labelPrintBatchNo) {
      return;
    }

    openRetryDialog(
      buildRetryRowsFromLatestResult(
        result,
        options.latestRegisterApplicationId.value,
      ),
      '登记结果补打',
    );
  }

  return {
    currentRetryResult,
    handleBulkRetry,
    handleRowRetry,
    openRetryDialogFromLatestResult,
    retryContext,
    retryDialogVisible,
    retryForm,
    retrySelectionCount,
    retrySourceLabel,
    retrySubmitting,
    submitRetry,
  };
}
