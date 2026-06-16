import type { ComputedRef } from 'vue';

import type {
  ArchiveObjectPage,
  ArchiveRecordView,
  MaterialLoanView,
} from '../../types/operation-support';
import type {
  LoanFormState,
  MaterialLoanAbnormalFormState,
  ReturnFormState,
} from '../../utils/archive-forms';
import type { PositionWorkbenchRow } from '../../utils/archive-workbench';
import type {
  ArchiveManagementCapabilities,
  ArchiveMutationState,
  ArchiveOperatorContext,
} from './archive-management-shared';

import { computed, reactive, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  createMaterialLoan,
  createMaterialLoanAbnormalRecord,
  listArchiveObjects,
  listMaterialLoans,
  returnMaterialLoan,
} from '../../api/operation-support-service';
import {
  buildCreateMaterialLoanAbnormalRecordRequest,
  buildCreateMaterialLoanRequest,
  buildReturnMaterialLoanRequest,
  createLoanFormDefaults,
  createMaterialLoanAbnormalFormDefaults,
  createReturnFormDefaults,
  validateLoanForm as getLoanFormValidationMessage,
  validateMaterialLoanAbnormalForm as getMaterialLoanAbnormalFormValidationMessage,
  validateReturnForm as getReturnFormValidationMessage,
} from '../../utils/archive-forms';
import { getOperationSupportPageErrorMessage } from '../../utils/error';

interface UseArchiveLoanWorkspaceOptions {
  capabilities: ArchiveManagementCapabilities;
  mutationState: ArchiveMutationState;
  operatorContext: ArchiveOperatorContext;
  refreshArchiveWorkspace: () => Promise<void>;
  selectedPosition: ComputedRef<null | PositionWorkbenchRow>;
}

type BorrowMaterialType = 'EMBEDDING_BOX' | 'SLIDE';
type BorrowDialogMode = 'EMBEDDING_BOX' | 'GENERIC';
type BatchSkipItem = {
  reason: string;
  record: ArchiveRecordView;
};
type BatchFailureItem = {
  error: unknown;
  record: ArchiveRecordView;
};
type BatchOperationResult = {
  failures: BatchFailureItem[];
  skipped: BatchSkipItem[];
  successCount: number;
};

function isMaterialLoanView(
  loan: MaterialLoanView | null,
): loan is MaterialLoanView {
  return loan !== null;
}

export function useArchiveLoanWorkspace(
  options: UseArchiveLoanWorkspaceOptions,
) {
  const {
    capabilities,
    mutationState,
    operatorContext,
    refreshArchiveWorkspace,
    selectedPosition,
  } = options;

  const activeMaterialType = ref<BorrowMaterialType>('EMBEDDING_BOX');
  const archiveObjectError = ref('');
  const archiveObjectLoading = ref(false);
  const borrowDialogVisible = ref(false);
  const borrowDialogMode = ref<BorrowDialogMode>('GENERIC');
  const abnormalDialogVisible = ref(false);
  const loading = ref(false);
  const loanError = ref('');
  const pendingLoans = ref<MaterialLoanView[]>([]);
  const returningLoan = ref<MaterialLoanView | null>(null);
  const returningLoans = ref<MaterialLoanView[]>([]);
  const selectedMaterialRecords = ref<ArchiveRecordView[]>([]);

  const materialObjectFilters = reactive({
    keyword: '',
    page: 1,
    size: 20,
  });
  const materialObjectPage = reactive({
    items: [] as ArchiveRecordView[],
    total: 0,
  });
  const loanFilters = reactive({
    keyword: '',
    loanStatus: 'BORROWED',
    materialType: '',
  });
  const loanForm = reactive<LoanFormState>(
    createLoanFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );
  const returnForm = reactive<ReturnFormState>(
    createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );
  const abnormalForm = reactive<MaterialLoanAbnormalFormState>(
    createMaterialLoanAbnormalFormDefaults(),
  );

  const returnDialogVisible = computed({
    get: () => returningLoan.value !== null || returningLoans.value.length > 0,
    set: (visible: boolean) => {
      if (!visible) {
        closeReturnDialog();
      }
    },
  });
  const selectedMaterialSummary = computed(() =>
    summarizeRecords(selectedMaterialRecords.value),
  );
  const selectedReturnPositionId = computed(() => selectedPosition.value?.id);
  const selectedReturnPositionDescription = computed(() => {
    if (!selectedPosition.value) {
      return '未指定替代柜位时，系统默认归还到原始归档柜位；若原柜位不可用，后端会要求选择新的可用柜位。';
    }
    return `当前会将 ${selectedPosition.value.positionCode} 作为归还替代柜位。`;
  });

  watch(
    () => operatorContext.currentOperatorName.value,
    (operatorName) => {
      if (!loanForm.operatorName && operatorName) {
        loanForm.operatorName = operatorName;
      }
    },
    { immediate: true },
  );

  watch(
    () => operatorContext.currentOperatorUserId.value,
    (operatorUserId) => {
      if (!loanForm.operatorUserId && operatorUserId) {
        loanForm.operatorUserId = operatorUserId;
      }
    },
    { immediate: true },
  );

  function closeReturnDialog() {
    returningLoan.value = null;
    returningLoans.value = [];
    Object.assign(
      returnForm,
      createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function closeBorrowDialog() {
    borrowDialogVisible.value = false;
    borrowDialogMode.value = 'GENERIC';
    resetLoanForm();
  }

  function closeAbnormalDialog() {
    abnormalDialogVisible.value = false;
    Object.assign(abnormalForm, createMaterialLoanAbnormalFormDefaults());
  }

  function openReturnDialog(loan: MaterialLoanView) {
    returningLoan.value = loan;
    returningLoans.value = [loan];
    Object.assign(
      returnForm,
      createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function setSelectedMaterialRecords(records: ArchiveRecordView[]) {
    selectedMaterialRecords.value = [...records];
  }

  function selectMaterialRecord(record: ArchiveRecordView | null) {
    setSelectedMaterialRecords(record ? [record] : []);
  }

  function setActiveMaterialType(materialType: BorrowMaterialType) {
    activeMaterialType.value = materialType;
    loanForm.materialType = materialType;
    setSelectedMaterialRecords([]);
  }

  async function loadMaterialObjects() {
    if (!capabilities.canQueryRecords.value) {
      materialObjectPage.items = [];
      materialObjectPage.total = 0;
      archiveObjectError.value = '';
      return;
    }

    archiveObjectLoading.value = true;
    archiveObjectError.value = '';

    try {
      const page: ArchiveObjectPage = await listArchiveObjects({
        keyword: materialObjectFilters.keyword.trim() || undefined,
        objectType: activeMaterialType.value,
        page: materialObjectFilters.page,
        size: materialObjectFilters.size,
      });
      materialObjectPage.items = page.items;
      materialObjectFilters.page = page.page;
      materialObjectFilters.size = page.size;
      materialObjectPage.total = page.total;
      setSelectedMaterialRecords([]);
    } catch (error) {
      archiveObjectError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      archiveObjectLoading.value = false;
    }
  }

  async function queryMaterialObjects() {
    materialObjectFilters.page = 1;
    await loadMaterialObjects();
  }

  async function setMaterialObjectPage(page: number) {
    materialObjectFilters.page = page;
    await loadMaterialObjects();
  }

  async function setMaterialObjectSize(size: number) {
    materialObjectFilters.page = 1;
    materialObjectFilters.size = size;
    await loadMaterialObjects();
  }

  async function loadLoans() {
    if (!capabilities.canQueryLoans.value) {
      pendingLoans.value = [];
      loanError.value = '';
      return;
    }

    loading.value = true;
    loanError.value = '';

    try {
      pendingLoans.value = await listMaterialLoans({
        keyword: loanFilters.keyword.trim() || undefined,
        loanStatus: loanFilters.loanStatus || undefined,
        materialType: loanFilters.materialType || undefined,
      });
    } catch (error) {
      loanError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  function validateLoanForm() {
    const validationMessage = getLoanFormValidationMessage(
      loanForm,
      capabilities.canCreateLoan.value,
    );
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateReturnForm() {
    const validationMessage = getReturnFormValidationMessage({
      canReturnLoan: capabilities.canReturnLoan.value,
      form: returnForm,
      hasReturningLoan: Boolean(returningLoan.value),
    });
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function validateMaterialLoanAbnormalForm() {
    const validationMessage = getMaterialLoanAbnormalFormValidationMessage(
      abnormalForm,
      capabilities.canRegisterLoanAbnormal.value,
    );
    if (validationMessage) {
      ElMessage.warning(validationMessage);
      return false;
    }
    return true;
  }

  function resetLoanForm() {
    Object.assign(
      loanForm,
      createLoanFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function getRecordLabel(record: ArchiveRecordView) {
    return record.objectCode || record.pathologyNo || record.objectId;
  }

  function summarizeRecords(records: ArchiveRecordView[]) {
    if (records.length === 0) {
      return '';
    }
    const preview = records
      .slice(0, 3)
      .map((record) => getRecordLabel(record))
      .join('、');
    return records.length > 3
      ? `${records.length} 条：${preview} 等`
      : `${records.length} 条：${preview}`;
  }

  function findPendingLoanForRecord(record: ArchiveRecordView) {
    return (
      pendingLoans.value.find(
        (loan) =>
          loan.materialType === record.objectType &&
          loan.materialId === record.objectId &&
          loan.loanStatus === 'BORROWED',
      ) ?? null
    );
  }

  function showBatchResult(actionName: string, result: BatchOperationResult) {
    const skipReasons = [...new Set(result.skipped.map((item) => item.reason))];
    const reasonText =
      skipReasons.length > 0 ? `跳过原因：${skipReasons.join('、')}。` : '';
    const message = `${actionName}完成：成功 ${result.successCount} 条，跳过 ${result.skipped.length} 条，失败 ${result.failures.length} 条。${reasonText}`;
    if (result.failures.length > 0) {
      ElMessage.error(message);
      return;
    }
    if (result.skipped.length > 0) {
      ElMessage.warning(message);
      return;
    }
    ElMessage.success(message);
  }

  function openBorrowDialog(mode: BorrowDialogMode = 'GENERIC') {
    const records = selectedMaterialRecords.value;
    if (records.length === 0) {
      ElMessage.warning('请先选择需要借记的材料。');
      return;
    }
    const borrowableRecords = records.filter(
      (record) =>
        record.archiveStatus === 'IN_STORAGE' &&
        record.loanStatus !== 'BORROWED',
    );
    if (borrowableRecords.length === 0) {
      ElMessage.warning('所选材料没有可借记记录。');
      return;
    }

    Object.assign(
      loanForm,
      createLoanFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
    loanForm.materialType = activeMaterialType.value;
    loanForm.materialId = borrowableRecords[0]?.objectId ?? '';
    if (mode === 'EMBEDDING_BOX') {
      loanForm.borrowPurpose = '';
    }
    borrowDialogMode.value = mode;
    borrowDialogVisible.value = true;
  }

  function openBorrowDialogForRecords(
    materialType: BorrowMaterialType,
    records: ArchiveRecordView[],
  ) {
    openBorrowDialogForRecordsWithMode(
      materialType,
      records,
      materialType === 'EMBEDDING_BOX' ? 'EMBEDDING_BOX' : 'GENERIC',
    );
  }

  function openBorrowDialogForRecordsWithMode(
    materialType: BorrowMaterialType,
    records: ArchiveRecordView[],
    mode: BorrowDialogMode,
  ) {
    setActiveMaterialType(materialType);
    setSelectedMaterialRecords(records);
    openBorrowDialog(mode);
  }

  function openSelectedReturnDialog() {
    const records = selectedMaterialRecords.value;
    if (records.length === 0) {
      ElMessage.warning('请先选择需要归还的材料。');
      return;
    }
    const loans = records
      .filter((record) => record.loanStatus === 'BORROWED')
      .map((record) => findPendingLoanForRecord(record))
      .filter(isMaterialLoanView);
    if (loans.length === 0) {
      ElMessage.warning('请选择借阅状态为借已的材料。');
      return;
    }
    returningLoan.value = loans[0] ?? null;
    returningLoans.value = loans;
    Object.assign(
      returnForm,
      createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function openAbnormalDialog() {
    const records = selectedMaterialRecords.value;
    if (records.length === 0) {
      ElMessage.warning('请先选择需要登记异常的材料。');
      return;
    }

    const [record] = records;
    if (!record) {
      ElMessage.warning('请先选择需要登记异常的材料。');
      return;
    }
    const loan = findPendingLoanForRecord(record);
    Object.assign(abnormalForm, createMaterialLoanAbnormalFormDefaults());
    abnormalForm.materialType = activeMaterialType.value;
    abnormalForm.materialId = record.objectId;
    abnormalForm.loanId = loan?.loanId ?? '';
    abnormalForm.borrowedSlideNo = record.objectCode ?? record.objectId;
    abnormalForm.borrowerName = loan?.borrowedByName ?? '';
    abnormalForm.borrowedAt = loan?.borrowedAt ?? '';
    abnormalForm.borrowedContent = record.objectCode ?? record.objectId;
    abnormalDialogVisible.value = true;
  }

  async function submitLoan() {
    if (!validateLoanForm()) {
      return;
    }

    const selectedRecords = selectedMaterialRecords.value;
    const result: BatchOperationResult = {
      failures: [],
      skipped: [],
      successCount: 0,
    };
    const borrowableRecords = selectedRecords.filter((record) => {
      if (record.archiveStatus !== 'IN_STORAGE') {
        result.skipped.push({ reason: '非在库', record });
        return false;
      }
      if (record.loanStatus === 'BORROWED') {
        result.skipped.push({ reason: '已借出', record });
        return false;
      }
      return true;
    });

    if (borrowableRecords.length === 0) {
      ElMessage.warning('所选材料没有可借记记录。');
      return;
    }

    mutationState.submitting.value = true;

    try {
      for (const record of borrowableRecords) {
        try {
          await createMaterialLoan(
            buildCreateMaterialLoanRequest({
              ...loanForm,
              materialId: record.objectId,
              materialType: record.objectType,
            }),
          );
          result.successCount += 1;
        } catch (error) {
          result.failures.push({ error, record });
        }
      }
      showBatchResult('借记', result);
      closeBorrowDialog();
      await refreshArchiveWorkspace();
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function submitReturn() {
    if (!validateReturnForm() || returningLoans.value.length === 0) {
      return;
    }

    const selectedLoanIds = new Set(
      returningLoans.value.map((loan) => loan.loanId),
    );
    const result: BatchOperationResult = {
      failures: [],
      skipped: [],
      successCount: 0,
    };
    for (const record of selectedMaterialRecords.value) {
      if (record.loanStatus !== 'BORROWED') {
        result.skipped.push({ reason: '非借已', record });
        continue;
      }
      const loan = findPendingLoanForRecord(record);
      if (!loan || !selectedLoanIds.has(loan.loanId)) {
        result.skipped.push({ reason: '缺少待归还记录', record });
      }
    }

    mutationState.submitting.value = true;

    try {
      for (const loan of returningLoans.value) {
        try {
          await returnMaterialLoan(
            loan.loanId,
            buildReturnMaterialLoanRequest(
              returnForm,
              selectedReturnPositionId.value,
            ),
          );
          result.successCount += 1;
        } catch (error) {
          result.failures.push({
            error,
            record: {
              caseId: loan.caseId,
              objectId: loan.materialId,
              objectType: loan.materialType,
            },
          });
        }
      }
      showBatchResult('归还', result);
      closeReturnDialog();
      await refreshArchiveWorkspace();
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function submitAbnormalRecord() {
    if (!validateMaterialLoanAbnormalForm()) {
      return;
    }

    const records = selectedMaterialRecords.value;
    if (records.length === 0) {
      ElMessage.warning('请先选择需要登记异常的材料。');
      return;
    }

    const result: BatchOperationResult = {
      failures: [],
      skipped: [],
      successCount: 0,
    };
    mutationState.submitting.value = true;

    try {
      for (const record of records) {
        const loan = findPendingLoanForRecord(record);
        try {
          await createMaterialLoanAbnormalRecord(
            buildCreateMaterialLoanAbnormalRecordRequest({
              ...abnormalForm,
              borrowedContent:
                abnormalForm.borrowedContent || getRecordLabel(record),
              borrowedSlideNo:
                abnormalForm.borrowedSlideNo || getRecordLabel(record),
              loanId: loan?.loanId ?? '',
              materialId: record.objectId,
              materialType: record.objectType,
            }),
          );
          result.successCount += 1;
        } catch (error) {
          result.failures.push({ error, record });
        }
      }
      showBatchResult('异常登记', result);
      closeAbnormalDialog();
      await refreshArchiveWorkspace();
    } finally {
      mutationState.submitting.value = false;
    }
  }

  return {
    abnormalDialogVisible,
    abnormalForm,
    activeMaterialType,
    archiveObjectError,
    archiveObjectLoading,
    borrowDialogVisible,
    borrowDialogMode,
    closeAbnormalDialog,
    closeBorrowDialog,
    loadLoans,
    loadMaterialObjects,
    loading,
    loanError,
    loanFilters,
    loanForm,
    materialObjectFilters,
    materialObjectPage,
    openAbnormalDialog,
    openBorrowDialog,
    openBorrowDialogForRecords,
    openBorrowDialogForRecordsWithMode,
    openReturnDialog,
    openSelectedReturnDialog,
    pendingLoans,
    queryMaterialObjects,
    returnDialogVisible,
    returnForm,
    returningLoan,
    returningLoans,
    selectMaterialRecord,
    selectedMaterialRecords,
    selectedMaterialSummary,
    selectedReturnPositionDescription,
    setActiveMaterialType,
    setMaterialObjectPage,
    setMaterialObjectSize,
    setSelectedMaterialRecords,
    submitAbnormalRecord,
    submitLoan,
    submitReturn,
  };
}
