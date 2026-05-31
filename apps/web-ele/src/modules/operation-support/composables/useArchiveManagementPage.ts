import type {
  ArchiveCabinetView,
  ArchivePositionView,
  ArchiveRecordView,
  MaterialLoanView,
} from '../types/operation-support';
import type {
  ArchiveFormState,
  CabinetFormState,
  LoanFormState,
  OperatorDefaults,
  ReturnFormState,
} from '../utils/archive-forms';
import type { PositionWorkbenchRow } from '../utils/archive-workbench';

import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  archiveApplicationForm,
  archiveEmbeddingBox,
  archiveSlide,
  createArchiveCabinet,
  createMaterialLoan,
  listArchiveCabinets,
  listAvailableArchivePositions,
  listPendingMaterialLoans,
  returnMaterialLoan,
  searchArchiveRecords,
  updateArchiveCabinet,
} from '../api/operation-support-service';
import { M5_ARCHIVE_PAGE_AUTHORITIES, M5_PERMISSION_CODES } from '../constants';
import {
  buildArchiveApplicationFormRequest,
  buildArchiveEmbeddingBoxRequest,
  buildArchiveSlideRequest,
  buildCreateCabinetRequest,
  buildCreateMaterialLoanRequest,
  buildReturnMaterialLoanRequest,
  buildUpdateCabinetRequest,
  createArchiveFormDefaults,
  createCabinetFormDefaults,
  createCabinetFormStateFromCabinet,
  createLoanFormDefaults,
  createReturnFormDefaults,
  validateArchiveForm as getArchiveFormValidationMessage,
  validateCabinetForm as getCabinetFormValidationMessage,
  validateLoanForm as getLoanFormValidationMessage,
  validateReturnForm as getReturnFormValidationMessage,
} from '../utils/archive-forms';
import {
  buildArchivePositionRows,
  buildPositionCode,
  getArchiveStatusTagType,
  getCabinetStatusTagType,
  getLoanStatusTagType,
  getPositionStatusTagType,
  getToggleCabinetActionLabel,
  summarizeArchivePositions,
} from '../utils/archive-workbench';
import { getOperationSupportPageErrorMessage } from '../utils/error';

export function useArchiveManagementPage() {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
  const canViewArchivePage = computed(() =>
    M5_ARCHIVE_PAGE_AUTHORITIES.some((code) => accessCodeSet.value.has(code)),
  );
  const canQueryCabinets = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY),
  );
  const canCreateCabinet = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE),
  );
  const canUpdateCabinet = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE),
  );
  const canArchiveApplicationForm = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE),
  );
  const canArchiveEmbeddingBox = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE),
  );
  const canArchiveSlide = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.SLIDE_ARCHIVE),
  );
  const canQueryRecords = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_QUERY),
  );
  const canCreateLoan = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_CREATE),
  );
  const canQueryLoans = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_QUERY),
  );
  const canReturnLoan = computed(() =>
    accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_RETURN),
  );

  const currentOperatorName = computed(
    () => userStore.userInfo?.realName?.trim() ?? '',
  );
  const currentOperatorUserId = computed(
    () => userStore.userInfo?.userId?.trim() ?? '',
  );

  function getCurrentOperatorDefaults(): OperatorDefaults {
    return {
      operatorName: currentOperatorName.value,
      operatorUserId: currentOperatorUserId.value,
    };
  }

  const loading = reactive({
    cabinets: false,
    loans: false,
    positions: false,
    records: false,
  });
  const submitting = ref(false);
  const cabinetError = ref('');
  const loanError = ref('');
  const positionError = ref('');
  const recordError = ref('');

  const cabinets = ref<ArchiveCabinetView[]>([]);
  const availablePositions = ref<ArchivePositionView[]>([]);
  const records = ref<ArchiveRecordView[]>([]);
  const pendingLoans = ref<MaterialLoanView[]>([]);
  const selectedPositionCode = ref('');
  const editingCabinet = ref<ArchiveCabinetView | null>(null);
  const returningLoan = ref<MaterialLoanView | null>(null);
  const cabinetDialogMode = ref<'create' | 'edit' | null>(null);

  const cabinetDialogVisible = computed({
    get: () => cabinetDialogMode.value !== null,
    set: (visible: boolean) => {
      if (!visible) {
        closeCabinetDialog();
      }
    },
  });
  const returnDialogVisible = computed({
    get: () => returningLoan.value !== null,
    set: (visible: boolean) => {
      if (!visible) {
        closeReturnDialog();
      }
    },
  });
  const isEditingCabinet = computed(() => cabinetDialogMode.value === 'edit');

  const cabinetForm = reactive<CabinetFormState>(
    createCabinetFormDefaults(getCurrentOperatorDefaults()),
  );

  const archiveForm = reactive<ArchiveFormState>(
    createArchiveFormDefaults(getCurrentOperatorDefaults()),
  );

  const loanForm = reactive<LoanFormState>(
    createLoanFormDefaults(getCurrentOperatorDefaults()),
  );

  const returnForm = reactive<ReturnFormState>(
    createReturnFormDefaults(getCurrentOperatorDefaults()),
  );

  const positionFilters = reactive({
    cabinetId: '',
    cabinetType: '',
  });

  const recordFilters = reactive({
    caseId: '',
    keyword: '',
    objectType: '',
  });

  const loanFilters = reactive({
    keyword: '',
    materialType: '',
  });

  const filteredCabinets = computed(() =>
    cabinets.value
      .filter((cabinet) => {
        if (
          positionFilters.cabinetId &&
          cabinet.id !== positionFilters.cabinetId
        ) {
          return false;
        }
        if (
          positionFilters.cabinetType &&
          cabinet.cabinetType !== positionFilters.cabinetType
        ) {
          return false;
        }
        return true;
      })
      .toSorted((left, right) =>
        left.cabinetCode.localeCompare(right.cabinetCode),
      ),
  );

  const positionRows = computed<PositionWorkbenchRow[]>(() =>
    buildArchivePositionRows(filteredCabinets.value, availablePositions.value),
  );

  const selectedPosition = computed(
    () =>
      positionRows.value.find(
        (position) =>
          position.positionCode === selectedPositionCode.value &&
          position.selectable,
      ) ?? null,
  );

  const positionSummary = computed(() =>
    summarizeArchivePositions(positionRows.value),
  );

  const cabinetCapacityPreview = computed(
    () => cabinetForm.layerCount * cabinetForm.slotCountPerLayer,
  );
  const cabinetPositionRulePreview = computed(() =>
    cabinetForm.cabinetCode
      ? buildPositionCode(cabinetForm.cabinetCode.trim(), 1, 1)
      : 'CAB-01-L1-S1',
  );
  const selectedPositionLabel = computed(
    () => selectedPosition.value?.positionCode || '未选择柜位',
  );
  const selectedReturnPositionId = computed(() => selectedPosition.value?.id);
  const selectedReturnPositionDescription = computed(() => {
    if (!selectedPosition.value) {
      return '未指定替代柜位时，系统默认归还到原始归档柜位；若原柜位不可用，后端会要求选择新的可用柜位。';
    }
    return `当前会将 ${selectedPosition.value.positionCode} 作为归还替代柜位。`;
  });
  const archiveSubmitButtonText = computed(() => {
    if (archiveForm.objectType === 'EMBEDDING_BOX') {
      return '提交蜡块归档';
    }
    if (archiveForm.objectType === 'SLIDE') {
      return '提交玻片归档';
    }
    return '提交申请单归档';
  });
  const archivePermissionWarning = computed(() => {
    if (
      archiveForm.objectType === 'EMBEDDING_BOX' &&
      !canArchiveEmbeddingBox.value
    ) {
      return '当前账号缺少蜡块归档权限。';
    }
    if (archiveForm.objectType === 'SLIDE' && !canArchiveSlide.value) {
      return '当前账号缺少玻片归档权限。';
    }
    if (
      archiveForm.objectType === 'APPLICATION_FORM' &&
      !canArchiveApplicationForm.value
    ) {
      return '当前账号缺少申请单归档权限。';
    }
    if (!canQueryCabinets.value) {
      return '当前账号缺少归档柜查询权限，无法选择归档柜位。';
    }
    return '';
  });
  const canSubmitArchive = computed(() => !archivePermissionWarning.value);

  watch(
    () => currentOperatorName.value,
    (operatorName) => {
      populateOperatorDefaults(operatorName, currentOperatorUserId.value);
    },
    { immediate: true },
  );

  watch(
    () => currentOperatorUserId.value,
    (operatorUserId) => {
      populateOperatorDefaults(currentOperatorName.value, operatorUserId);
    },
    { immediate: true },
  );

  watch(positionRows, (rows) => {
    if (
      selectedPositionCode.value &&
      !rows.some(
        (row) =>
          row.positionCode === selectedPositionCode.value && row.selectable,
      )
    ) {
      selectedPositionCode.value = '';
    }
  });

  watch(
    () => archiveForm.objectType,
    () => {
      archiveForm.caseId = '';
      archiveForm.embeddingBoxId = '';
      archiveForm.fileName = '';
      archiveForm.fileUrl = '';
      archiveForm.remarks = '';
      archiveForm.slideId = '';
    },
  );

  function populateOperatorDefaults(
    operatorName: string,
    operatorUserId: string,
  ) {
    if (!cabinetForm.operatorName && operatorName) {
      cabinetForm.operatorName = operatorName;
    }
    if (!cabinetForm.operatorUserId && operatorUserId) {
      cabinetForm.operatorUserId = operatorUserId;
    }
    if (!archiveForm.operatorName && operatorName) {
      archiveForm.operatorName = operatorName;
    }
    if (!archiveForm.operatorUserId && operatorUserId) {
      archiveForm.operatorUserId = operatorUserId;
    }
    if (!loanForm.operatorName && operatorName) {
      loanForm.operatorName = operatorName;
    }
    if (!loanForm.operatorUserId && operatorUserId) {
      loanForm.operatorUserId = operatorUserId;
    }
    if (!returnForm.operatorName && operatorName) {
      returnForm.operatorName = operatorName;
    }
    if (!returnForm.operatorUserId && operatorUserId) {
      returnForm.operatorUserId = operatorUserId;
    }
  }

  function applyCabinetFormState(nextState: CabinetFormState) {
    Object.assign(cabinetForm, nextState);
  }

  function closeCabinetDialog() {
    cabinetDialogMode.value = null;
    editingCabinet.value = null;
    applyCabinetFormState(
      createCabinetFormDefaults(getCurrentOperatorDefaults()),
    );
  }

  function openCreateCabinetDialog() {
    cabinetDialogMode.value = 'create';
    editingCabinet.value = null;
    applyCabinetFormState(
      createCabinetFormDefaults(getCurrentOperatorDefaults()),
    );
  }

  function openEditCabinetDialog(cabinet: ArchiveCabinetView) {
    cabinetDialogMode.value = 'edit';
    editingCabinet.value = cabinet;
    applyCabinetFormState(
      createCabinetFormStateFromCabinet(cabinet, getCurrentOperatorDefaults()),
    );
  }

  function closeReturnDialog() {
    returningLoan.value = null;
    Object.assign(
      returnForm,
      createReturnFormDefaults(getCurrentOperatorDefaults()),
    );
  }

  function openReturnDialog(loan: MaterialLoanView) {
    returningLoan.value = loan;
    Object.assign(
      returnForm,
      createReturnFormDefaults(getCurrentOperatorDefaults()),
    );
  }

  function selectPosition(position: PositionWorkbenchRow) {
    if (!position.selectable) {
      return;
    }

    selectedPositionCode.value = position.positionCode;
    ElMessage.success(`已选择柜位 ${position.positionCode}`);
  }

  function clearSelectedPosition() {
    selectedPositionCode.value = '';
  }

  function getArchivePermissionForObjectType(objectType: string) {
    if (objectType === 'EMBEDDING_BOX') {
      return canArchiveEmbeddingBox.value;
    }
    if (objectType === 'SLIDE') {
      return canArchiveSlide.value;
    }
    return canArchiveApplicationForm.value;
  }

  async function loadCabinets() {
    if (!canQueryCabinets.value) {
      cabinets.value = [];
      cabinetError.value = '';
      return;
    }

    loading.cabinets = true;
    cabinetError.value = '';

    try {
      cabinets.value = await listArchiveCabinets();
    } catch (error) {
      cabinetError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.cabinets = false;
    }
  }

  async function loadPositions() {
    if (!canQueryCabinets.value) {
      availablePositions.value = [];
      positionError.value = '';
      return;
    }

    loading.positions = true;
    positionError.value = '';

    try {
      availablePositions.value = await listAvailableArchivePositions({
        cabinetId: positionFilters.cabinetId || undefined,
        cabinetType: positionFilters.cabinetType || undefined,
      });
    } catch (error) {
      positionError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.positions = false;
    }
  }

  async function loadRecords() {
    if (!canQueryRecords.value) {
      records.value = [];
      recordError.value = '';
      return;
    }

    loading.records = true;
    recordError.value = '';

    try {
      records.value = await searchArchiveRecords({
        caseId: recordFilters.caseId.trim() || undefined,
        keyword: recordFilters.keyword.trim() || undefined,
        objectType: recordFilters.objectType || undefined,
      });
    } catch (error) {
      recordError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.records = false;
    }
  }

  async function loadLoans() {
    if (!canQueryLoans.value) {
      pendingLoans.value = [];
      loanError.value = '';
      return;
    }

    loading.loans = true;
    loanError.value = '';

    try {
      pendingLoans.value = await listPendingMaterialLoans({
        keyword: loanFilters.keyword.trim() || undefined,
        materialType: loanFilters.materialType || undefined,
      });
    } catch (error) {
      loanError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.loans = false;
    }
  }

  function validateCabinetForm() {
    const validationMessage = getCabinetFormValidationMessage(
      cabinetForm,
      cabinetDialogMode.value,
    );
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateArchiveForm() {
    const validationMessage = getArchiveFormValidationMessage({
      canArchiveObjectType: getArchivePermissionForObjectType(
        archiveForm.objectType,
      ),
      canQueryCabinets: canQueryCabinets.value,
      form: archiveForm,
      hasSelectedPosition: Boolean(selectedPosition.value),
      permissionWarning: archivePermissionWarning.value,
    });
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateLoanForm() {
    const validationMessage = getLoanFormValidationMessage(
      loanForm,
      canCreateLoan.value,
    );
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateReturnForm() {
    const validationMessage = getReturnFormValidationMessage({
      canReturnLoan: canReturnLoan.value,
      form: returnForm,
      hasReturningLoan: Boolean(returningLoan.value),
    });
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function resetArchiveForm() {
    Object.assign(
      archiveForm,
      createArchiveFormDefaults(getCurrentOperatorDefaults()),
    );
  }

  function resetLoanForm() {
    Object.assign(
      loanForm,
      createLoanFormDefaults(getCurrentOperatorDefaults()),
    );
  }

  async function refreshArchiveWorkspace() {
    const tasks: Array<Promise<unknown>> = [];

    if (canQueryCabinets.value) {
      tasks.push(loadPositions());
    }
    if (canQueryRecords.value) {
      tasks.push(loadRecords());
    }
    if (canQueryLoans.value) {
      tasks.push(loadLoans());
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  async function submitCabinet() {
    if (!validateCabinetForm()) {
      return;
    }

    submitting.value = true;

    try {
      if (cabinetDialogMode.value === 'edit' && editingCabinet.value) {
        await updateArchiveCabinet(
          editingCabinet.value.id,
          buildUpdateCabinetRequest(cabinetForm),
        );
        ElMessage.success('归档柜信息已更新。');
      } else {
        await createArchiveCabinet(buildCreateCabinetRequest(cabinetForm));
        ElMessage.success('归档柜已创建，系统已同步生成柜位。');
      }

      closeCabinetDialog();
      await Promise.all([loadCabinets(), loadPositions()]);
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  async function toggleCabinetStatus(cabinet: ArchiveCabinetView) {
    if (!currentOperatorName.value) {
      ElMessage.warning(
        '当前登录账号缺少操作人姓名，请通过编辑弹窗补充后再执行启停。',
      );
      return;
    }

    submitting.value = true;

    try {
      await updateArchiveCabinet(cabinet.id, {
        cabinetName: cabinet.cabinetName,
        cabinetStatus:
          cabinet.cabinetStatus === 'DISABLED' ? 'ACTIVE' : 'DISABLED',
        locationDescription: cabinet.locationDescription ?? undefined,
        operatorName: currentOperatorName.value,
        operatorUserId: currentOperatorUserId.value || undefined,
        remarks: cabinet.remarks ?? undefined,
      });

      ElMessage.success(
        `归档柜已${cabinet.cabinetStatus === 'DISABLED' ? '启用' : '停用'}。`,
      );
      await Promise.all([loadCabinets(), loadPositions()]);
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  async function submitArchive() {
    if (!validateArchiveForm() || !selectedPosition.value) {
      return;
    }

    submitting.value = true;

    try {
      if (archiveForm.objectType === 'APPLICATION_FORM') {
        await archiveApplicationForm(
          buildArchiveApplicationFormRequest(
            archiveForm,
            selectedPosition.value.id,
          ),
        );
        ElMessage.success('申请单归档已完成。');
      } else if (archiveForm.objectType === 'EMBEDDING_BOX') {
        await archiveEmbeddingBox(
          buildArchiveEmbeddingBoxRequest(
            archiveForm,
            selectedPosition.value.id,
          ),
        );
        ElMessage.success('蜡块归档已完成。');
      } else {
        await archiveSlide(
          buildArchiveSlideRequest(archiveForm, selectedPosition.value.id),
        );
        ElMessage.success('玻片归档已完成。');
      }

      resetArchiveForm();
      await refreshArchiveWorkspace();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  async function submitLoan() {
    if (!validateLoanForm()) {
      return;
    }

    submitting.value = true;

    try {
      await createMaterialLoan(buildCreateMaterialLoanRequest(loanForm));
      ElMessage.success('材料借出已登记。');
      resetLoanForm();
      await refreshArchiveWorkspace();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  async function submitReturn() {
    if (!validateReturnForm() || !returningLoan.value) {
      return;
    }

    submitting.value = true;

    try {
      await returnMaterialLoan(
        returningLoan.value.loanId,
        buildReturnMaterialLoanRequest(
          returnForm,
          selectedReturnPositionId.value,
        ),
      );
      ElMessage.success('材料归还已完成。');
      closeReturnDialog();
      await refreshArchiveWorkspace();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      submitting.value = false;
    }
  }

  async function initializePage() {
    if (!canViewArchivePage.value) {
      return;
    }

    const tasks: Array<Promise<unknown>> = [];

    if (canQueryCabinets.value) {
      tasks.push(loadCabinets(), loadPositions());
    }
    if (canQueryRecords.value) {
      tasks.push(loadRecords());
    }
    if (canQueryLoans.value) {
      tasks.push(loadLoans());
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  void initializePage();

  return {
    archiveForm,
    archivePermissionWarning,
    archiveSubmitButtonText,
    cabinetCapacityPreview,
    cabinetDialogMode,
    cabinetDialogVisible,
    cabinetError,
    cabinetForm,
    cabinetPositionRulePreview,
    cabinets,
    canCreateCabinet,
    canCreateLoan,
    canUpdateCabinet,
    canQueryCabinets,
    canQueryLoans,
    canQueryRecords,
    canReturnLoan,
    canSubmitArchive,
    canViewArchivePage,
    clearSelectedPosition,
    filteredCabinets,
    getArchiveStatusTagType,
    getCabinetStatusTagType,
    getLoanStatusTagType,
    getPositionStatusTagType,
    getToggleCabinetActionLabel,
    isEditingCabinet,
    loadLoans,
    loadPositions,
    loadRecords,
    loanError,
    loanFilters,
    loanForm,
    loading,
    openCreateCabinetDialog,
    openEditCabinetDialog,
    openReturnDialog,
    pendingLoans,
    positionError,
    positionFilters,
    positionRows,
    positionSummary,
    recordError,
    recordFilters,
    records,
    returnDialogVisible,
    returnForm,
    returningLoan,
    selectedPosition,
    selectedPositionCode,
    selectedPositionLabel,
    selectedReturnPositionDescription,
    selectPosition,
    submitArchive,
    submitCabinet,
    submitLoan,
    submitReturn,
    submitting,
    toggleCabinetStatus,
  };
}
