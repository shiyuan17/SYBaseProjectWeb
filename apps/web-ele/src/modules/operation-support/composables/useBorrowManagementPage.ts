import { computed, reactive, ref } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_BORROW_PAGE_AUTHORITIES,
  M5_PERMISSION_CODES,
} from '../constants';
import {
  getArchiveStatusTagType,
  getLoanStatusTagType,
  getPositionStatusTagType,
} from '../utils/archive-workbench';
import { useArchiveCabinetWorkspace } from './internal/useArchiveCabinetWorkspace';
import { useArchiveLoanWorkspace } from './internal/useArchiveLoanWorkspace';
import { useWhiteSlideLoanWorkspace } from './internal/useWhiteSlideLoanWorkspace';

export function useBorrowManagementPage() {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
  const capabilities = {
    canArchiveApplicationForm: computed(() => false),
    canArchiveEmbeddingBox: computed(() => false),
    canArchiveSlide: computed(() => false),
    canArchiveSpecimen: computed(() => false),
    canCreateCabinet: computed(() => false),
    canCreateLoan: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_CREATE),
    ),
    canCreateWhiteSlideLoan: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.WHITE_SLIDE_CREATE),
    ),
    canQueryCabinets: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY),
    ),
    canQueryLoans: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_QUERY),
    ),
    canQueryRecords: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_QUERY),
    ),
    canQueryWhiteSlideLoans: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.WHITE_SLIDE_QUERY),
    ),
    canRegisterLoanAbnormal: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_ABNORMAL_REGISTER),
    ),
    canReturnLoan: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_RETURN),
    ),
    canReturnWhiteSlideLoan: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.WHITE_SLIDE_RETURN),
    ),
    canUpdateCabinet: computed(() => false),
    canViewArchivePage: computed(() =>
      M5_ARCHIVE_PAGE_AUTHORITIES.some((code) => accessCodeSet.value.has(code)),
    ),
    canViewBorrowPage: computed(() =>
      M5_BORROW_PAGE_AUTHORITIES.some((code) => accessCodeSet.value.has(code)),
    ),
  };

  const operatorContext = {
    currentOperatorName: computed(
      () => userStore.userInfo?.realName?.trim() ?? '',
    ),
    currentOperatorUserId: computed(
      () => userStore.userInfo?.userId?.trim() ?? '',
    ),
    getCurrentOperatorDefaults() {
      return {
        operatorName: operatorContext.currentOperatorName.value,
        operatorUserId: operatorContext.currentOperatorUserId.value,
      };
    },
  };

  const mutationState = {
    submitting: ref(false),
  };

  const cabinetWorkspaceState = useArchiveCabinetWorkspace({
    capabilities,
    mutationState,
    operatorContext,
  });
  const loanWorkspaceState = useArchiveLoanWorkspace({
    capabilities,
    mutationState,
    operatorContext,
    refreshArchiveWorkspace: refreshBorrowWorkspace,
    selectedPosition: cabinetWorkspaceState.selectedPosition,
  });
  const whiteSlideWorkspaceState = useWhiteSlideLoanWorkspace({
    capabilities,
    mutationState,
    operatorContext,
  });

  async function refreshBorrowWorkspace() {
    const tasks: Array<Promise<unknown>> = [];

    if (capabilities.canQueryCabinets.value) {
      tasks.push(cabinetWorkspaceState.loadPositions());
    }
    if (capabilities.canQueryLoans.value) {
      tasks.push(loanWorkspaceState.loadLoans());
    }
    if (capabilities.canQueryRecords.value) {
      tasks.push(loanWorkspaceState.loadMaterialObjects());
    }
    if (capabilities.canQueryWhiteSlideLoans.value) {
      tasks.push(whiteSlideWorkspaceState.reloadAll());
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  async function initializePage() {
    if (!capabilities.canViewBorrowPage.value) {
      return;
    }

    const tasks: Array<Promise<unknown>> = [];

    if (capabilities.canQueryCabinets.value) {
      tasks.push(
        cabinetWorkspaceState.loadCabinets(),
        cabinetWorkspaceState.loadPositions(),
      );
    }
    if (capabilities.canQueryLoans.value) {
      tasks.push(loanWorkspaceState.loadLoans());
    }
    if (capabilities.canQueryRecords.value) {
      tasks.push(loanWorkspaceState.loadMaterialObjects());
    }
    if (capabilities.canQueryWhiteSlideLoans.value) {
      tasks.push(whiteSlideWorkspaceState.reloadAll());
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  void initializePage();

  return {
    cabinetWorkspace: reactive(cabinetWorkspaceState),
    capabilities: reactive(capabilities),
    display: {
      getArchiveStatusTagType,
      getLoanStatusTagType,
      getPositionStatusTagType,
    },
    loanWorkspace: reactive(loanWorkspaceState),
    pageState: reactive(mutationState),
    whiteSlideWorkspace: reactive(whiteSlideWorkspaceState),
  };
}
