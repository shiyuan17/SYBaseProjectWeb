import type {
  ApplicationCreateRequest,
  ApplicationDetailView,
  ImportClinicalApplicationRequest,
} from '../types/specimen-workflow';
import type {
  ApplicationManageDialogMode,
  ApplicationManageDialogTabName,
  ApplicationManageSubmitMode,
} from '../utils/application-manage-dialog';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  createEmptyWorkflowReferenceOptions,
  loadWorkflowReferenceOptionsSafely,
} from '#/modules/system-management/api/workflow-reference-service';

import {
  createApplication,
  duplicateCheckApplications,
  getApplicationDetail,
  importClinicalApplication,
  lookupApplicationPatientByIdentifier,
  updateApplication,
} from '../api/specimen-workflow-service';
import {
  APPLICATION_FORM_STATUS_OPTIONS,
  M2_PERMISSION_CODES,
} from '../constants';
import {
  buildCreateApplicationPayload,
  buildDuplicateCheckRequest,
  buildImportClinicalApplicationPayload,
  createApplicationCreateFormDefaults,
  createImportClinicalApplicationFormDefaults,
  resolveInitialDialogTab,
  validateDuplicateCheckInputs,
} from '../utils/application-manage-dialog';
import { getWorkflowPageErrorMessage } from '../utils/error';

type ApplicationManageDialogProps = {
  applicationId?: null | string;
  mode?: ApplicationManageDialogMode;
  modelValue: boolean;
};

type ApplicationManageDialogEmit = {
  (
    event: 'submitted',
    payload: {
      applicationId: string;
      mode: ApplicationManageSubmitMode;
    },
  ): void;
  (event: 'update:modelValue', value: boolean): void;
};

type PatientLookupStatus = 'failed' | 'idle' | 'matched' | 'missing';

export function useApplicationManageDialog(
  props: ApplicationManageDialogProps,
  emit: ApplicationManageDialogEmit,
) {
  const accessStore = useAccessStore();

  const CREATE_TAB: ApplicationManageDialogTabName = 'create';
  const IMPORT_TAB: ApplicationManageDialogTabName = 'import';

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));

  const canCreateApplication = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_CREATE),
  );
  const canUpdateApplication = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.APPLICATION_UPDATE),
  );
  const canImportClinicalApplication = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.CLINICAL_IMPORT),
  );
  const canQueryWorkflowReference = computed(() =>
    accessCodeSet.value.has(M2_PERMISSION_CODES.WORKFLOW_REFERENCE_QUERY),
  );
  const hasManageCapability = computed(
    () => canCreateApplication.value || canImportClinicalApplication.value,
  );
  const isEditMode = computed(() => props.mode === 'edit');
  const canSubmitCreateForm = computed(() =>
    isEditMode.value ? canUpdateApplication.value : canCreateApplication.value,
  );
  const canShowCreateForm = computed(() => canSubmitCreateForm.value);
  const canShowImportTab = computed(
    () => !isEditMode.value && canImportClinicalApplication.value,
  );
  const hasDialogCapability = computed(() =>
    isEditMode.value ? canUpdateApplication.value : hasManageCapability.value,
  );
  const dialogTitle = computed(() =>
    isEditMode.value ? '编辑申请单' : '申请单详情',
  );
  const createFormTitle = computed(() =>
    isEditMode.value ? '编辑申请单' : '手工创建申请单',
  );
  const createFormDescription = computed(() =>
    isEditMode.value
      ? '仅允许未进入下游流程的申请单保存修改。'
      : '创建成功后可留在申请列表，也可继续进入标本登记。',
  );

  const editableApplicationFormStatusOptions = computed(() =>
    APPLICATION_FORM_STATUS_OPTIONS.filter(
      (option) => option.value !== 'VOIDED',
    ),
  );

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => {
      emit('update:modelValue', value);
    },
  });

  const pageError = ref('');
  const activeTab = ref<ApplicationManageDialogTabName>(CREATE_TAB);
  const creatingApplication = ref(false);
  const importingClinicalApplication = ref(false);
  const loadingApplicationDetail = ref(false);
  const duplicateChecking = ref(false);
  const duplicateCheckMessage = ref('');
  const duplicateSuggestedAction = ref('ALLOW');
  const duplicateConfirmed = ref(false);
  const clinicalSymptomSuggestion = ref('');
  const patientLookupLoading = ref(false);
  const patientLookupStatus = ref<PatientLookupStatus>('idle');
  const lastResolvedIdentifier = ref('');
  const workflowReferenceOptions = ref(createEmptyWorkflowReferenceOptions());

  const createForm = reactive<ApplicationCreateRequest>(
    createApplicationCreateFormDefaults(),
  );
  const importForm = reactive<ImportClinicalApplicationRequest>(
    createImportClinicalApplicationFormDefaults(),
  );

  function getInitialTab() {
    return resolveInitialDialogTab(
      isEditMode.value,
      canCreateApplication.value,
    );
  }

  function resetCreateForm() {
    Object.assign(createForm, createApplicationCreateFormDefaults());
    clinicalSymptomSuggestion.value = '';
    duplicateCheckMessage.value = '';
    duplicateSuggestedAction.value = 'ALLOW';
    duplicateConfirmed.value = false;
    patientLookupStatus.value = 'idle';
    lastResolvedIdentifier.value = '';
  }

  function resetImportForm() {
    Object.assign(importForm, createImportClinicalApplicationFormDefaults());
  }

  function resetDialogState() {
    pageError.value = '';
    activeTab.value = getInitialTab();
    resetCreateForm();
    resetImportForm();
  }

  function fillCreateForm(detail: ApplicationDetailView) {
    Object.assign(createForm, {
      applicationDate: detail.applicationDate,
      applicationNo: detail.applicationNo,
      applicationFormStatus: detail.applicationFormStatus ?? 'PENDING',
      applicationType: detail.applicationType ?? 'ROUTINE',
      clinicalDiagnosis: detail.clinicalDiagnosis ?? '',
      clinicalSymptom: detail.clinicalSymptom,
      externalOrderNo: detail.externalOrderNo,
      patientAge: detail.patientAge,
      patientGender: detail.patientGender,
      patientId: detail.patientIdentifier ?? detail.patientId,
      patientName: detail.patientName,
      remarks: detail.remarks,
      sourceHospitalId: detail.sourceHospitalId,
      sourceHospitalName: detail.sourceHospitalName,
      status: detail.status,
      submissionDate: detail.submissionDate,
      thirdPartySource: detail.thirdPartySource,
    });
    clinicalSymptomSuggestion.value = detail.clinicalSymptom ?? '';
    lastResolvedIdentifier.value = createForm.patientId?.trim() ?? '';
  }

  async function loadApplicationForEdit() {
    if (!isEditMode.value || !props.applicationId) {
      return;
    }

    loadingApplicationDetail.value = true;
    pageError.value = '';
    try {
      fillCreateForm(await getApplicationDetail(props.applicationId));
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      loadingApplicationDetail.value = false;
    }
  }

  async function loadWorkflowReferenceOptions() {
    workflowReferenceOptions.value = await loadWorkflowReferenceOptionsSafely({
      enabled: canQueryWorkflowReference.value,
    });
  }

  function closeDialog() {
    dialogVisible.value = false;
  }

  function handleClinicalSymptomSuggestionChange(value: string) {
    clinicalSymptomSuggestion.value = value;
    createForm.clinicalSymptom = value || null;
  }

  async function handlePatientIdentifierLookup() {
    const normalizedIdentifier = createForm.patientId?.trim() ?? '';
    if (!normalizedIdentifier) {
      patientLookupStatus.value = 'idle';
      lastResolvedIdentifier.value = '';
      return null;
    }
    if (!canCreateApplication.value) {
      return null;
    }
    if (
      !patientLookupLoading.value &&
      patientLookupStatus.value !== 'failed' &&
      normalizedIdentifier === lastResolvedIdentifier.value
    ) {
      return null;
    }

    patientLookupLoading.value = true;
    try {
      const patient =
        await lookupApplicationPatientByIdentifier(normalizedIdentifier);
      if (!patient) {
        patientLookupStatus.value = 'missing';
        lastResolvedIdentifier.value = normalizedIdentifier;
        ElMessage.warning('未找到对应患者，保存申请单时将自动创建');
        return null;
      }

      createForm.patientId = patient.patientIdentifier ?? normalizedIdentifier;
      createForm.patientName = patient.patientName ?? null;
      createForm.patientGender = patient.patientGender ?? null;
      createForm.patientAge = patient.patientAge ?? null;
      patientLookupStatus.value = 'matched';
      lastResolvedIdentifier.value = createForm.patientId?.trim() ?? '';
      return patient;
    } catch (error) {
      patientLookupStatus.value = 'failed';
      lastResolvedIdentifier.value = '';
      ElMessage.warning(getWorkflowPageErrorMessage(error));
      return null;
    } finally {
      patientLookupLoading.value = false;
    }
  }

  function confirmDuplicateWarning() {
    duplicateConfirmed.value = true;
    ElMessage.success('已确认疑似重复申请，保存时将继续提交');
  }

  async function handleDuplicateCheck() {
    const validationMessage = validateDuplicateCheckInputs(createForm);
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }

    duplicateChecking.value = true;
    pageError.value = '';
    duplicateConfirmed.value = false;
    try {
      const result = await duplicateCheckApplications(
        buildDuplicateCheckRequest(createForm),
      );
      const duplicateItems = isEditMode.value
        ? result.items.filter((item) => item.id !== props.applicationId)
        : result.items;
      if (duplicateItems.length === 0) {
        duplicateSuggestedAction.value = 'ALLOW';
      } else if (duplicateItems.length === 1) {
        duplicateSuggestedAction.value = 'CONFIRM';
      } else {
        duplicateSuggestedAction.value = result.suggestedAction;
      }

      if (duplicateItems.length === 0) {
        duplicateCheckMessage.value = '未发现疑似重复申请';
        duplicateConfirmed.value = true;
        ElMessage.success(duplicateCheckMessage.value);
        return true;
      }

      duplicateCheckMessage.value =
        duplicateSuggestedAction.value === 'BLOCK'
          ? '命中强拦截级重复申请，请核对后停止创建或调整申请信息'
          : `发现 ${duplicateItems.length} 条疑似重复申请，确认无误后可继续保存`;
      if (duplicateSuggestedAction.value === 'BLOCK') {
        ElMessage.warning(duplicateCheckMessage.value);
        return false;
      }

      ElMessage.info(duplicateCheckMessage.value);
      return false;
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
      return false;
    } finally {
      duplicateChecking.value = false;
    }
  }

  async function handleSubmitSuccess(
    applicationId: string,
    mode: ApplicationManageSubmitMode,
  ) {
    closeDialog();
    emit('submitted', { applicationId, mode });
  }

  async function submitCreateApplication(mode: ApplicationManageSubmitMode) {
    if (!canSubmitCreateForm.value) {
      return;
    }
    if (!createForm.patientId?.trim() && !createForm.patientName?.trim()) {
      ElMessage.warning('患者编号与患者姓名至少填写一项');
      return;
    }
    if (!createForm.applicationDate?.trim()) {
      ElMessage.warning('请选择申请日期');
      return;
    }
    if (!createForm.submissionDate?.trim()) {
      ElMessage.warning('请选择送检日期');
      return;
    }
    if (!createForm.sourceHospitalName?.trim()) {
      ElMessage.warning('请填写来源医院');
      return;
    }
    if (!createForm.clinicalDiagnosis.trim()) {
      ElMessage.warning('请填写临床诊断');
      return;
    }
    if (!duplicateConfirmed.value) {
      const duplicatePassed = await handleDuplicateCheck();
      if (!duplicatePassed) {
        return;
      }
    }

    creatingApplication.value = true;
    pageError.value = '';
    try {
      const payload = buildCreateApplicationPayload(createForm);
      const result =
        isEditMode.value && props.applicationId
          ? await updateApplication(props.applicationId, payload)
          : await createApplication(payload);
      let submitSuccessMessage = '申请单创建成功，正在前往标本登记';
      if (isEditMode.value) {
        submitSuccessMessage = '申请单更新成功';
      } else if (mode === 'save') {
        submitSuccessMessage = '申请单创建成功';
      }
      ElMessage.success(submitSuccessMessage);
      await handleSubmitSuccess(result.id, mode);
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      creatingApplication.value = false;
    }
  }

  async function submitImportClinicalApplication(
    mode: ApplicationManageSubmitMode,
  ) {
    if (!canImportClinicalApplication.value) {
      return;
    }
    if (!importForm.thirdPartySource.trim()) {
      ElMessage.warning('请填写第三方来源编码');
      return;
    }
    if (!importForm.externalOrderNo.trim()) {
      ElMessage.warning('请填写外部申请单号');
      return;
    }

    importingClinicalApplication.value = true;
    pageError.value = '';
    try {
      const result = await importClinicalApplication(
        buildImportClinicalApplicationPayload(importForm),
      );
      ElMessage.success(
        mode === 'save'
          ? '临床申请导入成功'
          : '临床申请导入成功，正在前往标本登记',
      );
      await handleSubmitSuccess(result.id, mode);
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      importingClinicalApplication.value = false;
    }
  }

  watch(
    () => createForm.patientId,
    (value) => {
      const normalizedIdentifier = value?.trim() ?? '';
      if (!normalizedIdentifier) {
        patientLookupStatus.value = 'idle';
        lastResolvedIdentifier.value = '';
        return;
      }
      if (normalizedIdentifier !== lastResolvedIdentifier.value) {
        patientLookupStatus.value = 'idle';
      }
    },
  );

  watch(
    () => [
      createForm.patientId,
      createForm.patientName,
      createForm.externalOrderNo,
      createForm.applicationDate,
      createForm.applicationType,
    ],
    () => {
      if (duplicateCheckMessage.value || duplicateConfirmed.value) {
        duplicateCheckMessage.value = '';
        duplicateSuggestedAction.value = 'ALLOW';
        duplicateConfirmed.value = false;
      }
    },
  );

  watch(
    () => props.modelValue,
    (visible) => {
      if (visible) {
        resetDialogState();
        void loadWorkflowReferenceOptions();
        void loadApplicationForEdit();
        return;
      }

      if (
        !creatingApplication.value &&
        !importingClinicalApplication.value &&
        !loadingApplicationDetail.value
      ) {
        resetDialogState();
      }
    },
    { immediate: true },
  );

  return {
    CREATE_TAB,
    IMPORT_TAB,
    activeTab,
    canShowCreateForm,
    canShowImportTab,
    canSubmitCreateForm,
    closeDialog,
    clinicalSymptomSuggestion,
    confirmDuplicateWarning,
    createForm,
    createFormDescription,
    createFormTitle,
    creatingApplication,
    dialogTitle,
    dialogVisible,
    duplicateCheckMessage,
    duplicateChecking,
    duplicateConfirmed,
    duplicateSuggestedAction,
    editableApplicationFormStatusOptions,
    handleClinicalSymptomSuggestionChange,
    handleDuplicateCheck,
    handlePatientIdentifierLookup,
    hasDialogCapability,
    importForm,
    importingClinicalApplication,
    isEditMode,
    lastResolvedIdentifier,
    loadingApplicationDetail,
    pageError,
    patientLookupLoading,
    patientLookupStatus,
    resetCreateForm,
    resetImportForm,
    submitCreateApplication,
    submitImportClinicalApplication,
    workflowReferenceOptions,
  };
}
