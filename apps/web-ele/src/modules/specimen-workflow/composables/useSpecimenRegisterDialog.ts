import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterResult,
} from '../types/specimen-workflow';
import type {
  RegisterFormSnapshot,
  RegisterRow,
  RegisterRowSeed,
} from '../utils/specimen-register-dialog';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
  registerSpecimens,
} from '../api/specimen-workflow-service';
import { M2_PERMISSION_CODES } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { buildSpecimenAbnormalDetails } from '../utils/specimen-abnormal';
import {
  buildRegisterFormSnapshot,
  buildRegisterSubmissionRequest,
  createDefaultRegisterFormState,
  createEmptyRegisterRowSeed,
  validateRegisterItems,
} from '../utils/specimen-register-dialog';

type SpecimenRegisterDialogProps = {
  applicationId: string;
  modelValue: boolean;
};

type SpecimenRegisterDialogEmit = {
  (
    event: 'registered',
    payload: {
      applicationId: string;
      registerResult: SpecimenRegisterResult;
    },
  ): void;
  (event: 'update:modelValue', value: boolean): void;
};

function createRegisterRow(seed?: Partial<RegisterRowSeed>): RegisterRow {
  return {
    ...createEmptyRegisterRowSeed(),
    ...seed,
    key: Date.now() + Math.floor(Math.random() * 1000),
  };
}

export function useSpecimenRegisterDialog(
  props: SpecimenRegisterDialogProps,
  emit: SpecimenRegisterDialogEmit,
) {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
  const canQueryApplicationDetail = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY),
  );
  const canQueryWorkflowReference = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.WORKFLOW_REFERENCE_QUERY),
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
  const loadingDetail = ref(false);
  const loadingLatestRegistration = ref(false);
  const pageError = ref('');
  const submittingRegister = ref(false);
  const latestRegistrationResult = ref<LatestSpecimenRegistrationResult | null>(
    null,
  );
  const initialRegisterSnapshot = ref<null | RegisterFormSnapshot>(null);
  const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

  const registerForm = reactive(
    createDefaultRegisterFormState(currentUserName.value, currentUserId.value),
  );

  const registerItems = ref<RegisterRow[]>([createRegisterRow()]);

  function applyRegisterFormSnapshot(snapshot?: null | RegisterFormSnapshot) {
    const nextSnapshot = snapshot ?? {
      ...createDefaultRegisterFormState(
        currentUserName.value,
        currentUserId.value,
      ),
      items: [createEmptyRegisterRowSeed()],
    };

    Object.assign(registerForm, {
      collectionScene: nextSnapshot.collectionScene,
      operatorName: nextSnapshot.operatorName,
      operatorUserId: nextSnapshot.operatorUserId,
      printerCode: nextSnapshot.printerCode,
      remarks: nextSnapshot.remarks,
      terminalCode: nextSnapshot.terminalCode,
    });
    registerItems.value = nextSnapshot.items.map((item) =>
      createRegisterRow(item),
    );
  }

  function resetRegisterForm() {
    applyRegisterFormSnapshot(initialRegisterSnapshot.value);
  }

  function resetDialogState() {
    pageError.value = '';
    applicationDetail.value = null;
    currentApplicationId.value = props.applicationId.trim();
    latestRegistrationResult.value = null;
    initialRegisterSnapshot.value = null;
    applyRegisterFormSnapshot(null);
  }

  function addRegisterRow(afterKey?: number) {
    const nextRow = createRegisterRow();
    if (!afterKey) {
      registerItems.value.push(nextRow);
      return;
    }

    const targetIndex = registerItems.value.findIndex(
      (item) => item.key === afterKey,
    );
    if (targetIndex === -1) {
      registerItems.value.push(nextRow);
      return;
    }

    registerItems.value.splice(targetIndex + 1, 0, nextRow);
  }

  function removeRegisterRow(key: number) {
    if (registerItems.value.length === 1) {
      ElMessage.warning('至少保留一行标本登记项');
      return;
    }
    registerItems.value = registerItems.value.filter(
      (item) => item.key !== key,
    );
  }

  async function loadApplicationDetail(options: { silent?: boolean } = {}) {
    if (!currentApplicationId.value) {
      if (!options.silent) {
        ElMessage.warning('缺少申请单编号');
      }
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

  async function loadLatestRegistration(options: { silent?: boolean } = {}) {
    if (!currentApplicationId.value) {
      if (!options.silent) {
        ElMessage.warning('缺少申请单编号');
      }
      return;
    }

    loadingLatestRegistration.value = true;
    pageError.value = '';
    try {
      const result = await getLatestRegistrationResult(
        currentApplicationId.value,
      );
      latestRegistrationResult.value = result;
      initialRegisterSnapshot.value = buildRegisterFormSnapshot(
        result,
        currentUserName.value,
        currentUserId.value,
      );
      resetRegisterForm();
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      loadingLatestRegistration.value = false;
    }
  }

  async function loadWorkflowReferenceOptions() {
    workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
      enabled: canQueryWorkflowReference.value,
    });
  }

  async function refreshDialogContext() {
    await Promise.all([loadApplicationDetail(), loadLatestRegistration()]);
  }

  async function submitRegister() {
    if (!currentApplicationId.value) {
      ElMessage.warning('缺少申请单编号');
      return;
    }
    if (!registerForm.operatorName.trim()) {
      ElMessage.warning('当前登录人信息缺失');
      return;
    }

    const items = registerItems.value.map((item) => ({
      barcode: item.barcode?.trim() || null,
      clinicalSymptom: item.clinicalSymptom?.trim() || null,
      collectionMode: item.collectionMode?.trim() || null,
      containerCount: item.containerCount,
      containerName: item.containerName.trim(),
      specimenCount: item.specimenCount,
      specimenNameStandardized: item.specimenNameStandardized.trim(),
      specimenSite: item.specimenSite?.trim() || null,
      specimenType: item.specimenType?.trim() || null,
    }));

    const validationMessage = validateRegisterItems(items);
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return;
    }

    submittingRegister.value = true;
    pageError.value = '';
    try {
      const request = buildRegisterSubmissionRequest(
        currentApplicationId.value,
        registerForm,
        items,
      );
      const registrationSnapshot = {
        collectionScene: request.collectionScene ?? null,
        operatorName: registerForm.operatorName.trim() || currentUserName.value,
        operatorUserId:
          registerForm.operatorUserId.trim() || currentUserId.value || null,
        printerCode: request.printerCode ?? null,
        remarks: request.remarks ?? null,
        terminalCode: request.terminalCode ?? null,
      };
      const result = await registerSpecimens(request);
      emit('registered', {
        applicationId: currentApplicationId.value,
        registerResult: result,
      });
      latestRegistrationResult.value = {
        applicationId: currentApplicationId.value,
        labelPrintBatchNo: result.labelPrintBatchNo,
        labelPrintMessage: result.labelPrintMessage,
        labelPrintSuccess: result.labelPrintSuccess,
        registrationSnapshot,
        specimens: result.specimens,
      };
      initialRegisterSnapshot.value = buildRegisterFormSnapshot(
        latestRegistrationResult.value,
        currentUserName.value,
        currentUserId.value,
      );
      resetRegisterForm();
      ElMessage.success('标本登记成功');
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      submittingRegister.value = false;
    }
  }

  const detailStatusType = computed(() =>
    applicationDetail.value?.abnormalFlag ? 'danger' : 'success',
  );

  const loadingContext = computed(
    () => loadingDetail.value || loadingLatestRegistration.value,
  );

  const abnormalSpecimens = computed(() =>
    buildSpecimenAbnormalDetails(
      latestRegistrationResult.value?.specimens ?? [],
    ),
  );

  function closeDialog() {
    dialogVisible.value = false;
  }

  watch(
    () => [props.applicationId, props.modelValue],
    async ([, visible]) => {
      if (!visible) {
        return;
      }
      resetDialogState();
      await Promise.all([
        loadApplicationDetail({ silent: true }),
        loadLatestRegistration({ silent: true }),
        loadWorkflowReferenceOptions(),
      ]);
    },
    { immediate: true },
  );

  return {
    abnormalSpecimens,
    addRegisterRow,
    applicationDetail,
    canQueryApplicationDetail,
    closeDialog,
    currentApplicationId,
    detailStatusType,
    dialogVisible,
    latestRegistrationResult,
    loadApplicationDetail,
    loadLatestRegistration,
    loadWorkflowReferenceOptions,
    loadingContext,
    loadingDetail,
    loadingLatestRegistration,
    pageError,
    refreshDialogContext,
    registerForm,
    registerItems,
    removeRegisterRow,
    resetDialogState,
    resetRegisterForm,
    submitRegister,
    submittingRegister,
    workflowReferenceOptions,
  };
}
