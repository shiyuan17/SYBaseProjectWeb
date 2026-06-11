import type { ComputedRef, Ref } from 'vue';

import type { OperatorDefaults } from '../../utils/archive-forms';

export interface ArchiveManagementCapabilities {
  canArchiveApplicationForm: ComputedRef<boolean>;
  canArchiveEmbeddingBox: ComputedRef<boolean>;
  canArchiveSlide: ComputedRef<boolean>;
  canArchiveSpecimen: ComputedRef<boolean>;
  canCreateCabinet: ComputedRef<boolean>;
  canCreateLoan: ComputedRef<boolean>;
  canQueryCabinets: ComputedRef<boolean>;
  canQueryLoans: ComputedRef<boolean>;
  canQueryRecords: ComputedRef<boolean>;
  canReturnLoan: ComputedRef<boolean>;
  canUpdateCabinet: ComputedRef<boolean>;
  canViewArchivePage: ComputedRef<boolean>;
  canViewBorrowPage: ComputedRef<boolean>;
}

export interface ArchiveOperatorContext {
  currentOperatorName: ComputedRef<string>;
  currentOperatorUserId: ComputedRef<string>;
  getCurrentOperatorDefaults: () => OperatorDefaults;
}

export interface ArchiveMutationState {
  submitting: Ref<boolean>;
}
