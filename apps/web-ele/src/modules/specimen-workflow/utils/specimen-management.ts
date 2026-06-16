import type {
  LabelPrintRetryRequest,
  SpecimenFixationRequest,
  SpecimenManagementListItem,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
  SpecimenTrackingSummary,
} from '../types/specimen-workflow';

export type QuickFilterKey = 'ABNORMAL' | 'ALL' | 'PENDING_LABEL' | 'VERIFIED';
export type AbnormalFilterValue = '' | 'false' | 'true';
export type VerifyAction = 'complete' | 'start';
export type RetryDialogContext = {
  applicationId: string;
  batchNo: string;
  selectionCount: number;
  sourceLabel: string;
};

export function createEmptySummary(): SpecimenManagementListSummary {
  return {
    abnormalCount: 0,
    labelPrintedCount: 0,
    pendingLabelCount: 0,
    totalCount: 0,
    unboundCount: 0,
  };
}

export function createRetryFormDefaults(
  currentUserName: string,
  currentUserId: string,
) {
  return {
    operatorName: currentUserName,
    operatorUserId: currentUserId,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  };
}

export function createVerifyFormDefaults(
  currentUserName: string,
  currentUserId: string,
) {
  return {
    fixationLiquidType: '',
    operatorName: currentUserName,
    operatorUserId: currentUserId,
    remarks: '',
    specimenBarcode: '',
    specimenId: '',
    specimenNo: '',
    terminalCode: '',
  };
}

export function normalizeRouteQueryValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return '';
}

export function triggerWorkbenchLookupState(
  keyword: string,
  queryType:
    | 'APPLICATION_NO'
    | 'AUTO'
    | 'INPATIENT_NO'
    | 'PATIENT_NAME' = 'AUTO',
): null | {
  keyword: string;
  queryType: 'APPLICATION_NO' | 'AUTO' | 'INPATIENT_NO' | 'PATIENT_NAME';
  triggerKeyDelta: number;
} {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    return null;
  }
  return {
    keyword: normalizedKeyword,
    queryType,
    triggerKeyDelta: 1,
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

export function buildSpecimenManagementListQuery(options: {
  abnormalFlag: AbnormalFilterValue;
  dateRange: string[];
  departmentId: string;
  keyword: string;
  labelPrintStatus: string;
  page: number;
  quickFilter: QuickFilterKey;
  size: number;
  specimenStatus: string;
}): SpecimenManagementListQuery {
  const quickQuery = resolveQuickFilterQuery(options.quickFilter);
  return {
    abnormalFlag:
      resolveExplicitAbnormalFlag(options.abnormalFlag) ??
      quickQuery.abnormalFlag,
    dateFrom: options.dateRange[0] || undefined,
    dateTo: options.dateRange[1] || undefined,
    departmentId: options.departmentId.trim() || undefined,
    keyword: options.keyword.trim() || undefined,
    labelPrintStatus: options.labelPrintStatus || quickQuery.labelPrintStatus,
    page: options.page,
    size: options.size,
    specimenStatus:
      options.specimenStatus || quickQuery.specimenStatus || undefined,
  };
}

export function canRetryBatch(row: SpecimenManagementListItem) {
  return (
    Boolean(row.labelPrintBatchNo) &&
    ['FAILED', 'PENDING'].includes(row.labelPrintStatus ?? '')
  );
}

export function isVerifyCompleted(row: SpecimenManagementListItem) {
  return row.specimenStatus === 'FIXED' || row.fixationStatus === 'COMPLETED';
}

export function canStartVerify(row: SpecimenManagementListItem) {
  return (
    !row.abnormalFlag &&
    !isVerifyCompleted(row) &&
    row.fixationStatus !== 'FIXING'
  );
}

export function canCompleteVerify(row: SpecimenManagementListItem) {
  return !row.abnormalFlag && row.fixationStatus === 'FIXING';
}

export function labelTagType(status?: null | string) {
  if (status === 'SUCCESS') {
    return 'success';
  }
  if (status === 'FAILED') {
    return 'danger';
  }
  if (status === 'PENDING') {
    return 'warning';
  }
  return 'info';
}

export function specimenTagType(row: SpecimenManagementListItem) {
  if (row.abnormalFlag) {
    return 'danger';
  }
  if (row.specimenStatus === 'RECEIVED' || row.specimenStatus === 'FIXED') {
    return 'success';
  }
  if (row.specimenStatus === 'REGISTERED' || row.specimenStatus === 'FIXING') {
    return 'warning';
  }
  return 'info';
}

export function buildRetryLabelPrintRequest(form: {
  printerCode: string;
  remarks: string;
  terminalCode: string;
}): LabelPrintRetryRequest {
  return {
    printerCode: form.printerCode.trim(),
    remarks: form.remarks.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}

export function buildSpecimenVerificationRequest(form: {
  fixationLiquidType: string;
  remarks: string;
  specimenBarcode: string;
  specimenId?: null | string;
  specimenNo?: null | string;
  terminalCode: string;
}): SpecimenFixationRequest {
  return {
    fixationLiquidType: form.fixationLiquidType.trim() || null,
    remarks: form.remarks.trim() || null,
    specimenBarcode: form.specimenBarcode.trim() || null,
    specimenId: form.specimenId?.trim() || null,
    specimenNo: form.specimenNo?.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}

export function isNotFoundWorkflowError(error: unknown) {
  const apiError = error as {
    message?: string;
    response?: {
      data?: {
        error?: string;
        message?: string;
      };
      status?: number;
    };
  };
  const responseMessage =
    apiError.response?.data?.error ||
    apiError.response?.data?.message ||
    apiError.message ||
    '';

  return (
    apiError.response?.status === 404 ||
    responseMessage === 'Resource not found'
  );
}

export function resolveRetryDialogContext(
  rows: SpecimenManagementListItem[],
  sourceLabel: string,
): (RetryDialogContext & { ok: true }) | { errorMessage: string; ok: false } {
  if (rows.length === 0) {
    return { errorMessage: '请先选择需要补打的标本', ok: false };
  }
  if (rows.some((row) => !canRetryBatch(row))) {
    return {
      errorMessage: '仅待打印或打印失败的记录支持补打',
      ok: false,
    };
  }

  const [firstRow] = rows;
  const batchNumbers = [
    ...new Set(rows.map((row) => row.labelPrintBatchNo).filter(Boolean)),
  ];
  const [batchNo] = batchNumbers;

  if (!firstRow || batchNumbers.length !== 1 || !batchNo) {
    return {
      errorMessage: '批量补打仅允许选择同一标签批次',
      ok: false,
    };
  }

  return {
    applicationId: firstRow.applicationId,
    batchNo,
    ok: true,
    selectionCount: rows.length,
    sourceLabel,
  };
}

export function buildRetryRowsFromLatestResult(
  result: {
    labelPrintBatchNo: null | string;
    specimens: SpecimenTrackingSummary[];
  },
  applicationId: string,
): SpecimenManagementListItem[] {
  return result.specimens
    .filter((item) =>
      ['FAILED', 'PENDING'].includes(item.labelPrintStatus ?? ''),
    )
    .map((item) => ({
      abnormalFlag: false,
      applicationId,
      applicationNo: '',
      barcode: item.barcode,
      barcodeBindingStatus: item.barcodeBindingStatus,
      buildingId: null,
      containerCount: item.containerCount,
      containerName: item.containerName,
      fixationStatus: item.fixationStatus,
      labelPrintBatchNo: result.labelPrintBatchNo,
      labelPrintStatus: item.labelPrintStatus,
      latestTrackingAt: null,
      patientGender: null,
      patientId: null,
      patientName: null,
      registeredAt: null,
      registrationOperatorName: null,
      roomId: null,
      specimenCount: item.specimenCount,
      specimenId: item.id,
      specimenName: item.specimenName,
      specimenNo: item.specimenNo,
      specimenSite: item.specimenSite,
      specimenStatus: item.specimenStatus,
      specimenType: item.specimenType,
      submittingDepartmentId: null,
      submittingDepartmentName: null,
      surgeryName: null,
    }));
}
