import type { ComputedRef, Ref } from 'vue';

import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
} from '../types/specimen-workflow';
import type { VerifyAction } from '../utils/specimen-management';

import { reactive, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';

import {
  completeFixation,
  getApplicationDetail,
  getLatestRegistrationResult,
  startFixation,
} from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  buildSpecimenVerificationRequest,
  createVerifyFormDefaults,
} from '../utils/specimen-management';

type VerifyFormModel = {
  fixationLiquidType: string;
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  specimenBarcode: string;
  terminalCode: string;
};

export function useSpecimenManagementVerify(options: {
  canQueryApplicationDetail: ComputedRef<boolean>;
  canQueryWorkflowReference: ComputedRef<boolean>;
  currentUserId: ComputedRef<string>;
  currentUserName: ComputedRef<string>;
  detailDrawerVisible: Ref<boolean>;
  detailLoading: Ref<boolean>;
  detailRow: Ref<null | SpecimenManagementListItem>;
  items: Ref<SpecimenManagementListItem[]>;
  loadSpecimens: () => Promise<void>;
  pageError: Ref<string>;
}) {
  const verifyDialogVisible = ref(false);
  const verifySubmitting = ref(false);
  const verifyAction = ref<VerifyAction>('start');
  const verifyTargetRow = ref<null | SpecimenManagementListItem>(null);
  const detailApplicationDetail = ref<ApplicationDetailView | null>(null);
  const detailLatestRegisterResult =
    ref<LatestSpecimenRegistrationResult | null>(null);
  const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());
  const verifyForm = reactive<VerifyFormModel>({
    fixationLiquidType: '',
    operatorName: '',
    operatorUserId: '',
    remarks: '',
    specimenBarcode: '',
    terminalCode: '',
  });

  function resetVerifyForm() {
    Object.assign(
      verifyForm,
      createVerifyFormDefaults(
        options.currentUserName.value,
        options.currentUserId.value,
      ),
    );
  }

  watch(
    () => [options.currentUserId.value, options.currentUserName.value],
    () => {
      resetVerifyForm();
    },
    { immediate: true },
  );

  async function openDetailDrawer(row: SpecimenManagementListItem) {
    options.detailDrawerVisible.value = true;
    options.detailRow.value = row;
    detailApplicationDetail.value = null;
    detailLatestRegisterResult.value = null;
    options.detailLoading.value = true;
    options.pageError.value = '';
    try {
      const [applicationDetail, latestResult] = await Promise.all([
        options.canQueryApplicationDetail.value
          ? getApplicationDetail(row.applicationId)
          : Promise.resolve(null),
        getLatestRegistrationResult(row.applicationId).catch(() => null),
      ]);
      detailApplicationDetail.value = applicationDetail;
      detailLatestRegisterResult.value = latestResult;
    } catch (error) {
      options.pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      options.detailLoading.value = false;
    }
  }

  async function openVerifyDialog(
    row: SpecimenManagementListItem,
    action: VerifyAction,
  ) {
    verifyAction.value = action;
    verifyTargetRow.value = row;
    verifyDialogVisible.value = true;
    verifyForm.specimenBarcode = row.barcode ?? '';
    verifyForm.fixationLiquidType = '';
    verifyForm.remarks = '';
    verifyForm.terminalCode = '';
    workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
      enabled: options.canQueryWorkflowReference.value,
    });
  }

  async function submitVerify() {
    const barcode = verifyForm.specimenBarcode.trim();
    if (!barcode) {
      ElMessage.warning('缺少标本条码');
      return;
    }
    if (!verifyForm.operatorName.trim()) {
      ElMessage.warning('请选择核验人');
      return;
    }

    verifySubmitting.value = true;
    options.pageError.value = '';
    try {
      const payload = buildSpecimenVerificationRequest(verifyForm);

      if (verifyAction.value === 'start') {
        await startFixation(payload);
        ElMessage.success(`条码 ${barcode} 已开始核验`);
      } else {
        await completeFixation(payload);
        ElMessage.success(`条码 ${barcode} 已完成核验`);
      }

      verifyDialogVisible.value = false;
      await options.loadSpecimens();
      if (
        options.detailDrawerVisible.value &&
        options.detailRow.value?.specimenId ===
          verifyTargetRow.value?.specimenId
      ) {
        const latestRow = options.items.value.find(
          (item) => item.specimenId === verifyTargetRow.value?.specimenId,
        );
        if (latestRow) {
          await openDetailDrawer(latestRow);
        }
      }
    } catch (error) {
      options.pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      verifySubmitting.value = false;
    }
  }

  return {
    detailApplicationDetail,
    detailLatestRegisterResult,
    openDetailDrawer,
    openVerifyDialog,
    submitVerify,
    verifyAction,
    verifyDialogVisible,
    verifyForm,
    verifySubmitting,
    verifyTargetRow,
    workflowReferenceOptions,
  };
}
