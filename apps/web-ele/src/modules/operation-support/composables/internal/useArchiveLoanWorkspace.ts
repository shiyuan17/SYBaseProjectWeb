import type { ComputedRef } from 'vue';

import type { MaterialLoanView } from '../../types/operation-support';
import type { LoanFormState, ReturnFormState } from '../../utils/archive-forms';
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
  listPendingMaterialLoans,
  returnMaterialLoan,
} from '../../api/operation-support-service';
import {
  buildCreateMaterialLoanRequest,
  buildReturnMaterialLoanRequest,
  createLoanFormDefaults,
  createReturnFormDefaults,
  validateLoanForm as getLoanFormValidationMessage,
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

  const loading = ref(false);
  const loanError = ref('');
  const pendingLoans = ref<MaterialLoanView[]>([]);
  const returningLoan = ref<MaterialLoanView | null>(null);

  const loanFilters = reactive({
    keyword: '',
    materialType: '',
  });
  const loanForm = reactive<LoanFormState>(
    createLoanFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );
  const returnForm = reactive<ReturnFormState>(
    createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
  );

  const returnDialogVisible = computed({
    get: () => returningLoan.value !== null,
    set: (visible: boolean) => {
      if (!visible) {
        closeReturnDialog();
      }
    },
  });

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
      if (!returnForm.operatorName && operatorName) {
        returnForm.operatorName = operatorName;
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
      if (!returnForm.operatorUserId && operatorUserId) {
        returnForm.operatorUserId = operatorUserId;
      }
    },
    { immediate: true },
  );

  function closeReturnDialog() {
    returningLoan.value = null;
    Object.assign(
      returnForm,
      createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  function openReturnDialog(loan: MaterialLoanView) {
    returningLoan.value = loan;
    Object.assign(
      returnForm,
      createReturnFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
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
      pendingLoans.value = await listPendingMaterialLoans({
        keyword: loanFilters.keyword.trim() || undefined,
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

  function resetLoanForm() {
    Object.assign(
      loanForm,
      createLoanFormDefaults(operatorContext.getCurrentOperatorDefaults()),
    );
  }

  async function submitLoan() {
    if (!validateLoanForm()) {
      return;
    }

    mutationState.submitting.value = true;

    try {
      await createMaterialLoan(buildCreateMaterialLoanRequest(loanForm));
      ElMessage.success('材料借出已登记。');
      resetLoanForm();
      await refreshArchiveWorkspace();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function submitReturn() {
    if (!validateReturnForm() || !returningLoan.value) {
      return;
    }

    mutationState.submitting.value = true;

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
      mutationState.submitting.value = false;
    }
  }

  return {
    loadLoans,
    loading,
    loanError,
    loanFilters,
    loanForm,
    openReturnDialog,
    pendingLoans,
    returnDialogVisible,
    returnForm,
    returningLoan,
    selectedReturnPositionDescription,
    submitLoan,
    submitReturn,
  };
}
