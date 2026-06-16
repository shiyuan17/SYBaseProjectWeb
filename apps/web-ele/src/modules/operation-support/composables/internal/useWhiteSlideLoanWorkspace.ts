import type { ComputedRef } from 'vue';

import type {
  WhiteSlideLoanView,
  WhiteSlideStockView,
} from '../../types/operation-support';
import type {
  WhiteSlideBorrowFormState,
  WhiteSlideReturnFormState,
} from '../../utils/white-slide-borrow';
import type {
  ArchiveMutationState,
  ArchiveOperatorContext,
} from './archive-management-shared';

import { computed, reactive, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  createWhiteSlideLoan,
  listWhiteSlideLoans,
  listWhiteSlideStocks,
  returnWhiteSlideLoan,
} from '../../api/operation-support-service';
import { getOperationSupportPageErrorMessage } from '../../utils/error';
import {
  applyWhiteSlideStockDefaults,
  buildCreateWhiteSlideLoanRequest,
  buildDraftWhiteSlideLoanView,
  buildReturnWhiteSlideLoanRequest,
  calculateWhiteSlideAmount,
  createWhiteSlideBorrowFormDefaults,
  createWhiteSlideReturnFormDefaults,
  openWhiteSlideBorrowPrintWindow,
  validateWhiteSlideBorrowForm,
} from '../../utils/white-slide-borrow';

type WhiteSlideCapabilities = {
  canCreateWhiteSlideLoan: ComputedRef<boolean>;
  canQueryWhiteSlideLoans: ComputedRef<boolean>;
  canReturnWhiteSlideLoan: ComputedRef<boolean>;
};

interface UseWhiteSlideLoanWorkspaceOptions {
  capabilities: WhiteSlideCapabilities;
  mutationState: ArchiveMutationState;
  operatorContext: ArchiveOperatorContext;
}

export function useWhiteSlideLoanWorkspace(
  options: UseWhiteSlideLoanWorkspaceOptions,
) {
  const { capabilities, mutationState } = options;

  const loading = ref(false);
  const listError = ref('');
  const stocks = ref<WhiteSlideStockView[]>([]);
  const loans = ref<WhiteSlideLoanView[]>([]);
  const selectedLoan = ref<null | WhiteSlideLoanView>(null);
  const borrowDialogVisible = ref(false);
  const returnDialogVisible = ref(false);

  const filters = reactive({
    keyword: '',
    loanStatus: 'BORROWED',
    stockStatus: 'ACTIVE',
  });

  const borrowForm = reactive<WhiteSlideBorrowFormState>(
    createWhiteSlideBorrowFormDefaults(),
  );
  const returnForm = reactive<WhiteSlideReturnFormState>(
    createWhiteSlideReturnFormDefaults(),
  );

  const selectedStock = computed(
    () => stocks.value.find((item) => item.id === borrowForm.stockId) ?? null,
  );
  const calculatedAmount = computed(() =>
    calculateWhiteSlideAmount(borrowForm),
  );

  watch(
    calculatedAmount,
    (amount) => {
      borrowForm.amount = amount;
    },
    { immediate: true },
  );

  watch(
    selectedStock,
    (stock) => {
      if (!stock && stocks.value.length > 0 && !borrowForm.stockId) {
        applyWhiteSlideStockDefaults(borrowForm, stocks.value[0] ?? null);
      }
    },
    { immediate: true },
  );

  function resetBorrowForm() {
    Object.assign(borrowForm, createWhiteSlideBorrowFormDefaults());
    applyWhiteSlideStockDefaults(borrowForm, stocks.value[0] ?? null);
  }

  function resetReturnForm() {
    Object.assign(returnForm, createWhiteSlideReturnFormDefaults());
  }

  async function loadWhiteSlideStocks() {
    if (!capabilities.canQueryWhiteSlideLoans.value) {
      stocks.value = [];
      return;
    }

    stocks.value = await listWhiteSlideStocks({
      keyword: filters.keyword.trim() || undefined,
      status: filters.stockStatus || undefined,
    });
    if (!borrowForm.stockId) {
      applyWhiteSlideStockDefaults(borrowForm, stocks.value[0] ?? null);
    }
  }

  async function loadWhiteSlideLoans() {
    if (!capabilities.canQueryWhiteSlideLoans.value) {
      loans.value = [];
      listError.value = '';
      return;
    }

    loading.value = true;
    listError.value = '';
    try {
      loans.value = await listWhiteSlideLoans({
        keyword: filters.keyword.trim() || undefined,
        loanStatus: filters.loanStatus || undefined,
      });
    } catch (error) {
      listError.value = getOperationSupportPageErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  async function reloadAll() {
    loading.value = true;
    try {
      await Promise.all([loadWhiteSlideStocks(), loadWhiteSlideLoans()]);
    } finally {
      loading.value = false;
    }
  }

  function openBorrowDialog(row?: null | WhiteSlideLoanView) {
    resetBorrowForm();
    if (row) {
      borrowForm.caseId = row.caseId ?? '';
      borrowForm.pathologyNo = row.pathologyNo ?? '';
      borrowForm.patientName = row.patientName ?? '';
      borrowForm.embeddingBoxNo = row.embeddingBoxNo ?? '';
      borrowForm.slicePurpose = row.slicePurpose ?? '';
      borrowForm.sliceThickness = row.sliceThickness ?? '';
      borrowForm.waxBlockUsage = row.waxBlockUsage ?? '';
    }
    borrowDialogVisible.value = true;
  }

  function closeBorrowDialog() {
    borrowDialogVisible.value = false;
    resetBorrowForm();
  }

  function openReturnDialog(row: WhiteSlideLoanView) {
    selectedLoan.value = row;
    resetReturnForm();
    returnDialogVisible.value = true;
  }

  function selectLoan(row?: WhiteSlideLoanView) {
    selectedLoan.value = row ?? null;
  }

  function closeReturnDialog() {
    returnDialogVisible.value = false;
    selectedLoan.value = null;
    resetReturnForm();
  }

  function query() {
    return reloadAll();
  }

  async function submitBorrow() {
    const message = validateWhiteSlideBorrowForm(borrowForm);
    if (message) {
      ElMessage.warning(message);
      return;
    }

    mutationState.submitting.value = true;
    try {
      const saveDirectPrint = borrowForm.saveDirectPrint;
      const savedLoan = await createWhiteSlideLoan(
        buildCreateWhiteSlideLoanRequest(borrowForm),
      );
      ElMessage.success('白片借记已保存');
      closeBorrowDialog();
      await reloadAll();
      if (saveDirectPrint) {
        openWhiteSlideBorrowPrintWindow(savedLoan);
      }
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  async function submitReturn() {
    if (!selectedLoan.value) {
      ElMessage.warning('请选择需要归还的白片借记记录');
      return;
    }
    mutationState.submitting.value = true;
    try {
      await returnWhiteSlideLoan(
        selectedLoan.value.id,
        buildReturnWhiteSlideLoanRequest(returnForm),
      );
      ElMessage.success('白片借记已归还');
      closeReturnDialog();
      await reloadAll();
    } catch (error) {
      ElMessage.error(getOperationSupportPageErrorMessage(error));
    } finally {
      mutationState.submitting.value = false;
    }
  }

  function printLoan(row: WhiteSlideLoanView) {
    const opened = openWhiteSlideBorrowPrintWindow(row);
    if (!opened) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
    }
  }

  function printDraftLoan() {
    const message = validateWhiteSlideBorrowForm(borrowForm);
    if (message) {
      ElMessage.warning(message);
      return;
    }
    const opened = openWhiteSlideBorrowPrintWindow(
      buildDraftWhiteSlideLoanView(borrowForm),
    );
    if (!opened) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
    }
  }

  return {
    borrowDialogVisible,
    borrowForm,
    calculatedAmount,
    closeBorrowDialog,
    closeReturnDialog,
    filters,
    listError,
    loadWhiteSlideLoans,
    loadWhiteSlideStocks,
    loading,
    loans,
    openBorrowDialog,
    openReturnDialog,
    printDraftLoan,
    printLoan,
    query,
    reloadAll,
    returnDialogVisible,
    returnForm,
    selectLoan,
    selectedLoan,
    selectedStock,
    stocks,
    submitBorrow,
    submitReturn,
  };
}
