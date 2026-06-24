import { computed, reactive, ref } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_BORROW_PAGE_AUTHORITIES,
  M5_PERMISSION_CODES,
} from '../constants';
import {
  getArchiveStatusTagType,
  getCabinetStatusTagType,
  getLoanStatusTagType,
  getPositionStatusTagType,
  getToggleCabinetActionLabel,
} from '../utils/archive-workbench';
import { useArchiveCabinetWorkspace } from './internal/useArchiveCabinetWorkspace';
import { useArchiveLoanWorkspace } from './internal/useArchiveLoanWorkspace';
import { useArchiveRecordWorkspace } from './internal/useArchiveRecordWorkspace';
import { useArchiveSubmissionWorkspace } from './internal/useArchiveSubmissionWorkspace';

export function useArchiveManagementPage() {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
  const capabilities = {
    canArchiveApplicationForm: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE),
    ),
    canArchiveEmbeddingBox: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE),
    ),
    canArchiveSlide: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.SLIDE_ARCHIVE),
    ),
    canArchiveSpecimen: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.SPECIMEN_ARCHIVE),
    ),
    canCreateCabinet: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE),
    ),
    canDeleteCabinet: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_DELETE),
    ),
    canCreateLoan: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_CREATE),
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
    canRegisterLoanAbnormal: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_ABNORMAL_REGISTER),
    ),
    canReturnLoan: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.LOAN_RETURN),
    ),
    canUpdateCabinet: computed(() =>
      accessCodeSet.value.has(M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE),
    ),
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
  const recordWorkspaceState = useArchiveRecordWorkspace({ capabilities });
  const loanWorkspaceState = useArchiveLoanWorkspace({
    capabilities,
    mutationState,
    operatorContext,
    refreshArchiveWorkspace,
    selectedPosition: cabinetWorkspaceState.selectedPosition,
  });
  const archiveWorkspaceState = useArchiveSubmissionWorkspace({
    capabilities,
    clearSelectedArchiveObjectRecords:
      recordWorkspaceState.clearSelectedArchiveObjectRecords,
    clearSelectedApplicationFormRecords:
      recordWorkspaceState.clearSelectedApplicationFormRecords,
    getSelectedArchiveObjectRecords:
      recordWorkspaceState.getSelectedArchiveObjectRecords,
    getSelectedApplicationFormRecords:
      recordWorkspaceState.getSelectedApplicationFormRecords,
    mutationState,
    operatorContext,
    refreshArchiveWorkspace,
    selectedPosition: cabinetWorkspaceState.selectedPosition,
  });

  async function refreshArchiveWorkspace() {
    const tasks: Array<Promise<unknown>> = [];

    if (capabilities.canQueryCabinets.value) {
      tasks.push(
        cabinetWorkspaceState.loadPositions(),
        cabinetWorkspaceState.loadCabinetNodes(),
      );
    }
    if (capabilities.canQueryRecords.value) {
      tasks.push(recordWorkspaceState.refreshCurrentArchiveObjects());
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  async function initializePage() {
    if (!capabilities.canViewArchivePage.value) {
      return;
    }

    if (capabilities.canQueryRecords.value) {
      await recordWorkspaceState.refreshCurrentArchiveObjects();
    }
  }

  void initializePage();

  return {
    archiveWorkspace: reactive(archiveWorkspaceState),
    cabinetWorkspace: reactive(cabinetWorkspaceState),
    capabilities: reactive(capabilities),
    display: {
      getArchiveStatusTagType,
      getCabinetStatusTagType,
      getLoanStatusTagType,
      getPositionStatusTagType,
      getToggleCabinetActionLabel,
    },
    loanWorkspace: reactive(loanWorkspaceState),
    pageState: reactive(mutationState),
    recordWorkspace: reactive(recordWorkspaceState),
  };
}
