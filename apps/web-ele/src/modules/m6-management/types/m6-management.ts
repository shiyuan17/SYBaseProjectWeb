export interface IntegrationTaskQuery {
  businessId?: string;
  businessType?: string;
  compensationStatus?: string;
  externalSystem?: string;
  reconciliationStatus?: string;
  stageCode?: string;
  taskStatus?: string;
  taskType?: string;
}

export interface IntegrationTaskView {
  businessId: string;
  businessType: string;
  compensationStatus: string;
  createdAt: string;
  externalSystem: string;
  id: string;
  lastAttemptAt: string;
  lastErrorCode: string;
  lastErrorMessage: string;
  maxRetryCount: number;
  nextRetryAt: string;
  reconciliationStatus: string;
  requestPayload: string;
  resolvedAt: string;
  responsePayload: string;
  retryCount: number;
  stageCode: string;
  taskStatus: string;
  taskType: string;
  updatedAt: string;
}

export interface BillingRecordQuery {
  billingStage?: string;
  billingStatus?: string;
  caseId?: string;
  externalSystem?: string;
  from?: string;
  orderId?: string;
  to?: string;
}

export interface BillingRecordView {
  amount: string;
  billedAt: string;
  billingNo: string;
  billingStage: string;
  billingStatus: string;
  caseId: string;
  compensationStatus: string;
  createdAt: string;
  externalBillNo: string;
  externalSystem: string;
  id: string;
  integrationTaskId: string;
  itemName: string;
  itemType: string;
  lastAttemptAt: string;
  lastErrorCode: string;
  lastErrorMessage: string;
  maxRetryCount: number;
  operatorName: string;
  operatorUserId: string;
  orderId: string;
  quantity: string;
  reconciliationStatus: string;
  remarks: string;
  resolvedAt: string;
  retryCount: number;
  updatedAt: string;
}

export interface OperatorRequest {
  operatorName?: string;
  operatorUserId?: string;
}

export interface BillingReceiptRequest extends OperatorRequest {
  billingStatus?: string;
  externalBillNo?: string;
  remarks?: string;
}

export interface ReconcileBillingRequest extends OperatorRequest {
  from?: string;
  to?: string;
}

export interface ReconciliationResult {
  discrepancyCount: number;
  from: string;
  matchedCount: number;
  to: string;
  totalCount: number;
}

export interface HistoricalImportJobQuery {
  applicationNo?: string;
  importStatus?: string;
  pathologyNo?: string;
  patientId?: string;
  sourceSystem?: string;
}

export interface HistoricalImportJobView {
  applicationNo: string;
  completedAt: string;
  compensationStatus: string;
  failureCount: number;
  id: string;
  importStatus: string;
  integrationTaskId: string;
  lastErrorMessage: string;
  maxRetryCount: number;
  pathologyNo: string;
  patientId: string;
  reconciliationStatus: string;
  remarks: string;
  requestedAt: string;
  requestedByName: string;
  requestedByUserId: string;
  retryCount: number;
  sourceSystem: string;
  successCount: number;
  taskLastErrorCode: string;
  taskLastErrorMessage: string;
  totalCount: number;
}

export interface HistoricalReportQuery {
  applicationNo?: string;
  externalReportNo?: string;
  from?: string;
  pathologyNo?: string;
  patientId?: string;
  sourceSystem?: string;
  to?: string;
}

export interface HistoricalReportVersionView {
  createdAt: string;
  finalDiagnosis: string;
  id: string;
  reportSummary: string;
  versionNo: number;
}

export interface HistoricalReportView {
  applicationNo: string;
  attachmentUrl: string;
  externalReportNo: string;
  finalDiagnosis: string;
  id: string;
  importJobId: string;
  pathologyNo: string;
  patientId: string;
  patientName: string;
  reportDate: string;
  reportSummary: string;
  sourceDepartmentName: string;
  sourceDoctorName: string;
  sourceSystem: string;
  versions: HistoricalReportVersionView[];
}

export interface ImportHistoricalReportsRequest extends OperatorRequest {
  applicationNo?: string;
  from?: string;
  pathologyNo?: string;
  patientId?: string;
  remarks?: string;
  sourceSystem?: string;
  to?: string;
}
