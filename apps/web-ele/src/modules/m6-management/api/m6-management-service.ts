import type {
  BillingReceiptRequest,
  BillingRecordQuery,
  BillingRecordView,
  HistoricalImportJobQuery,
  HistoricalImportJobView,
  HistoricalReportQuery,
  HistoricalReportView,
  HistoricalReportVersionView,
  ImportHistoricalReportsRequest,
  IntegrationTaskQuery,
  IntegrationTaskView,
  OperatorRequest,
  ReconcileBillingRequest,
  ReconciliationResult,
} from '../types/m6-management';

import { requestClient } from '#/api/request';

function normalizeString(value: null | string | undefined) {
  return value ?? '';
}

function normalizeNumber(value: number | undefined) {
  return value ?? 0;
}

function mapHistoricalReportVersion(
  item: Partial<HistoricalReportVersionView>,
): HistoricalReportVersionView {
  return {
    createdAt: normalizeString(item.createdAt),
    finalDiagnosis: normalizeString(item.finalDiagnosis),
    id: normalizeString(item.id),
    reportSummary: normalizeString(item.reportSummary),
    versionNo: normalizeNumber(item.versionNo),
  };
}

export function mapIntegrationTaskResponse(
  item: Partial<IntegrationTaskView>,
): IntegrationTaskView {
  return {
    businessId: normalizeString(item.businessId),
    businessType: normalizeString(item.businessType),
    compensationStatus: normalizeString(item.compensationStatus),
    createdAt: normalizeString(item.createdAt),
    externalSystem: normalizeString(item.externalSystem),
    id: normalizeString(item.id),
    lastAttemptAt: normalizeString(item.lastAttemptAt),
    lastErrorCode: normalizeString(item.lastErrorCode),
    lastErrorMessage: normalizeString(item.lastErrorMessage),
    maxRetryCount: normalizeNumber(item.maxRetryCount),
    nextRetryAt: normalizeString(item.nextRetryAt),
    reconciliationStatus: normalizeString(item.reconciliationStatus),
    requestPayload: normalizeString(item.requestPayload),
    resolvedAt: normalizeString(item.resolvedAt),
    responsePayload: normalizeString(item.responsePayload),
    retryCount: normalizeNumber(item.retryCount),
    stageCode: normalizeString(item.stageCode),
    taskStatus: normalizeString(item.taskStatus),
    taskType: normalizeString(item.taskType),
    updatedAt: normalizeString(item.updatedAt),
  };
}

export function mapBillingRecordResponse(
  item: Partial<BillingRecordView>,
): BillingRecordView {
  return {
    amount: normalizeString(item.amount),
    billedAt: normalizeString(item.billedAt),
    billingNo: normalizeString(item.billingNo),
    billingStage: normalizeString(item.billingStage),
    billingStatus: normalizeString(item.billingStatus),
    caseId: normalizeString(item.caseId),
    compensationStatus: normalizeString(item.compensationStatus),
    createdAt: normalizeString(item.createdAt),
    externalBillNo: normalizeString(item.externalBillNo),
    externalSystem: normalizeString(item.externalSystem),
    id: normalizeString(item.id),
    integrationTaskId: normalizeString(item.integrationTaskId),
    itemName: normalizeString(item.itemName),
    itemType: normalizeString(item.itemType),
    lastAttemptAt: normalizeString(item.lastAttemptAt),
    lastErrorCode: normalizeString(item.lastErrorCode),
    lastErrorMessage: normalizeString(item.lastErrorMessage),
    maxRetryCount: normalizeNumber(item.maxRetryCount),
    operatorName: normalizeString(item.operatorName),
    operatorUserId: normalizeString(item.operatorUserId),
    orderId: normalizeString(item.orderId),
    quantity: normalizeString(item.quantity),
    reconciliationStatus: normalizeString(item.reconciliationStatus),
    remarks: normalizeString(item.remarks),
    resolvedAt: normalizeString(item.resolvedAt),
    retryCount: normalizeNumber(item.retryCount),
    updatedAt: normalizeString(item.updatedAt),
  };
}

export function mapHistoricalImportJobResponse(
  item: Partial<HistoricalImportJobView>,
): HistoricalImportJobView {
  return {
    applicationNo: normalizeString(item.applicationNo),
    completedAt: normalizeString(item.completedAt),
    compensationStatus: normalizeString(item.compensationStatus),
    failureCount: normalizeNumber(item.failureCount),
    id: normalizeString(item.id),
    importStatus: normalizeString(item.importStatus),
    integrationTaskId: normalizeString(item.integrationTaskId),
    lastErrorMessage: normalizeString(item.lastErrorMessage),
    maxRetryCount: normalizeNumber(item.maxRetryCount),
    pathologyNo: normalizeString(item.pathologyNo),
    patientId: normalizeString(item.patientId),
    reconciliationStatus: normalizeString(item.reconciliationStatus),
    remarks: normalizeString(item.remarks),
    requestedAt: normalizeString(item.requestedAt),
    requestedByName: normalizeString(item.requestedByName),
    requestedByUserId: normalizeString(item.requestedByUserId),
    retryCount: normalizeNumber(item.retryCount),
    sourceSystem: normalizeString(item.sourceSystem),
    successCount: normalizeNumber(item.successCount),
    taskLastErrorCode: normalizeString(item.taskLastErrorCode),
    taskLastErrorMessage: normalizeString(item.taskLastErrorMessage),
    totalCount: normalizeNumber(item.totalCount),
  };
}

export function mapHistoricalReportResponse(
  item: Partial<HistoricalReportView>,
): HistoricalReportView {
  return {
    applicationNo: normalizeString(item.applicationNo),
    attachmentUrl: normalizeString(item.attachmentUrl),
    externalReportNo: normalizeString(item.externalReportNo),
    finalDiagnosis: normalizeString(item.finalDiagnosis),
    id: normalizeString(item.id),
    importJobId: normalizeString(item.importJobId),
    pathologyNo: normalizeString(item.pathologyNo),
    patientId: normalizeString(item.patientId),
    patientName: normalizeString(item.patientName),
    reportDate: normalizeString(item.reportDate),
    reportSummary: normalizeString(item.reportSummary),
    sourceDepartmentName: normalizeString(item.sourceDepartmentName),
    sourceDoctorName: normalizeString(item.sourceDoctorName),
    sourceSystem: normalizeString(item.sourceSystem),
    versions: Array.isArray(item.versions)
      ? item.versions.map(mapHistoricalReportVersion)
      : [],
  };
}

export function mapReconciliationResponse(
  item: Partial<ReconciliationResult>,
): ReconciliationResult {
  return {
    discrepancyCount: normalizeNumber(item.discrepancyCount),
    from: normalizeString(item.from),
    matchedCount: normalizeNumber(item.matchedCount),
    to: normalizeString(item.to),
    totalCount: normalizeNumber(item.totalCount),
  };
}

export async function listIntegrationTasks(query: IntegrationTaskQuery) {
  const response = await requestClient.get<Partial<IntegrationTaskView>[]>(
    '/v1/integration-tasks',
    {
      params: {
        businessId: query.businessId || undefined,
        businessType: query.businessType || undefined,
        compensationStatus: query.compensationStatus || undefined,
        externalSystem: query.externalSystem || undefined,
        reconciliationStatus: query.reconciliationStatus || undefined,
        stageCode: query.stageCode || undefined,
        taskStatus: query.taskStatus || undefined,
        taskType: query.taskType || undefined,
      },
    },
  );

  return Array.isArray(response) ? response.map(mapIntegrationTaskResponse) : [];
}

export async function listBillingRecords(query: BillingRecordQuery) {
  const response = await requestClient.get<Partial<BillingRecordView>[]>(
    '/v1/billing-records',
    {
      params: {
        billingStage: query.billingStage || undefined,
        billingStatus: query.billingStatus || undefined,
        caseId: query.caseId || undefined,
        externalSystem: query.externalSystem || undefined,
        from: query.from || undefined,
        orderId: query.orderId || undefined,
        to: query.to || undefined,
      },
    },
  );

  return Array.isArray(response) ? response.map(mapBillingRecordResponse) : [];
}

export async function receiveBillingReceipt(
  id: string,
  payload: BillingReceiptRequest,
) {
  const response = await requestClient.post<Partial<BillingRecordView>>(
    `/v1/billing-records/${encodeURIComponent(id)}/receipt`,
    payload,
  );

  return mapBillingRecordResponse(response ?? {});
}

export async function retryBilling(id: string, payload: OperatorRequest) {
  const response = await requestClient.post<Partial<BillingRecordView>>(
    `/v1/billing-records/${encodeURIComponent(id)}/retry`,
    payload,
  );

  return mapBillingRecordResponse(response ?? {});
}

export async function reconcileBilling(payload: ReconcileBillingRequest) {
  const response = await requestClient.post<Partial<ReconciliationResult>>(
    '/v1/billing-records/reconcile',
    payload,
  );

  return mapReconciliationResponse(response ?? {});
}

export async function importHistoricalReports(
  payload: ImportHistoricalReportsRequest,
) {
  const response = await requestClient.post<Partial<HistoricalImportJobView>>(
    '/v1/historical-report-import-jobs',
    payload,
  );

  return mapHistoricalImportJobResponse(response ?? {});
}

export async function listHistoricalImportJobs(query: HistoricalImportJobQuery) {
  const response = await requestClient.get<Partial<HistoricalImportJobView>[]>(
    '/v1/historical-report-import-jobs',
    {
      params: {
        applicationNo: query.applicationNo || undefined,
        importStatus: query.importStatus || undefined,
        pathologyNo: query.pathologyNo || undefined,
        patientId: query.patientId || undefined,
        sourceSystem: query.sourceSystem || undefined,
      },
    },
  );

  return Array.isArray(response)
    ? response.map(mapHistoricalImportJobResponse)
    : [];
}

export async function listHistoricalReports(query: HistoricalReportQuery) {
  const response = await requestClient.get<Partial<HistoricalReportView>[]>(
    '/v1/historical-reports',
    {
      params: {
        applicationNo: query.applicationNo || undefined,
        externalReportNo: query.externalReportNo || undefined,
        from: query.from || undefined,
        pathologyNo: query.pathologyNo || undefined,
        patientId: query.patientId || undefined,
        sourceSystem: query.sourceSystem || undefined,
        to: query.to || undefined,
      },
    },
  );

  return Array.isArray(response) ? response.map(mapHistoricalReportResponse) : [];
}
