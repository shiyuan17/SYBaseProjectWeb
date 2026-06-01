import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
  SpecimenTrackingSummary,
} from '../types/specimen-workflow';

export type QuickFilterKey = 'ABNORMAL' | 'ALL' | 'PENDING_LABEL' | 'VERIFIED';
export type AbnormalFilterValue = '' | 'false' | 'true';

export type TrackingSpecimenListFilters = {
  abnormalFlag: AbnormalFilterValue;
  dateRange: string[];
  departmentId: string;
  keyword: string;
  labelPrintStatus: string;
  page: number;
  size: number;
  specimenStatus: string;
};

export function createEmptySpecimenManagementSummary(): SpecimenManagementListSummary {
  return {
    abnormalCount: 0,
    labelPrintedCount: 0,
    pendingLabelCount: 0,
    totalCount: 0,
    unboundCount: 0,
  };
}

export function resolveQuickFilterQuery(
  quickFilter: QuickFilterKey,
): Partial<
  Pick<
    SpecimenManagementListQuery,
    'abnormalFlag' | 'labelPrintStatus' | 'specimenStatus'
  >
> {
  if (quickFilter === 'ABNORMAL') {
    return { abnormalFlag: true };
  }
  if (quickFilter === 'PENDING_LABEL') {
    return { labelPrintStatus: 'PENDING' };
  }
  if (quickFilter === 'VERIFIED') {
    return { specimenStatus: 'FIXED' };
  }
  return {};
}

export function resolveExplicitAbnormalFlag(abnormalFlag: AbnormalFilterValue) {
  if (abnormalFlag === 'true') {
    return true;
  }
  if (abnormalFlag === 'false') {
    return false;
  }
  return undefined;
}

export function buildTrackingSpecimenListQuery(
  filters: TrackingSpecimenListFilters,
  quickFilter: QuickFilterKey,
): SpecimenManagementListQuery {
  const quickQuery = resolveQuickFilterQuery(quickFilter);

  return {
    abnormalFlag:
      resolveExplicitAbnormalFlag(filters.abnormalFlag) ??
      quickQuery.abnormalFlag,
    dateFrom: filters.dateRange[0] || undefined,
    dateTo: filters.dateRange[1] || undefined,
    departmentId: filters.departmentId.trim() || undefined,
    keyword: filters.keyword.trim() || undefined,
    labelPrintStatus: filters.labelPrintStatus || quickQuery.labelPrintStatus,
    page: filters.page,
    size: filters.size,
    specimenStatus:
      filters.specimenStatus || quickQuery.specimenStatus || undefined,
  };
}

export function resolveDetailTargetSpecimen(
  specimenId: string,
  applicationDetail: ApplicationDetailView | null,
  latestRegisterResult: LatestSpecimenRegistrationResult | null,
): null | SpecimenTrackingSummary {
  return (
    applicationDetail?.specimens.find(
      (specimen) => specimen.id === specimenId,
    ) ??
    latestRegisterResult?.specimens.find(
      (specimen) => specimen.id === specimenId,
    ) ??
    null
  );
}

export function labelTagType(status?: null | string) {
  if (status === 'SUCCESS') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'danger';
  }
  return 'info';
}

export function specimenTagType(row: SpecimenManagementListItem) {
  if (
    row.specimenStatus === 'REJECTED' ||
    row.specimenStatus === 'RETURNED'
  ) {
    return 'danger';
  }
  if (
    row.specimenStatus === 'CHECKED_IN' ||
    row.specimenStatus === 'RECEIVED'
  ) {
    return 'success';
  }
  if (
    row.specimenStatus === 'FIXED' ||
    row.specimenStatus === 'VERIFIED'
  ) {
    return 'primary';
  }
  if (
    row.specimenStatus === 'FIXING' ||
    row.specimenStatus === 'IN_TRANSIT' ||
    row.specimenStatus === 'VERIFYING'
  ) {
    return 'warning';
  }
  return 'info';
}

export function formatContainerRatio(
  row: Pick<SpecimenManagementListItem, 'containerCount' | 'specimenCount'>,
) {
  return `${row.containerCount ?? '-'} / ${row.specimenCount ?? '-'}`;
}
