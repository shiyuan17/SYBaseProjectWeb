import type {
  AssignDiagnosticTaskRequest,
  CommentConsultationParticipantRequest,
  CompleteConsultationRequest,
  ConsultationOperationResult,
  CreateConsultationRequest,
  CreateMedicalOrderRequest,
  CreateReportRevisionRequest,
  DiagnosticTaskActionRequest,
  DiagnosticWorkbenchView,
  MedicalOrderActionRequest,
  MedicalOrderBillingItemResult,
  MedicalOrderBillingRequest,
  MedicalOrderBillingResult,
  MedicalOrderCategoryNode,
  MedicalOrderOperationResult,
  MedicalOrderPackagePageQuery,
  MedicalOrderPackageView,
  MedicalOrderPagedResult,
  PathologyReportDraft,
  PathologyReportOperationResult,
  PendingDiagnosticTaskPage,
  PendingDiagnosticTaskQuery,
  PendingMedicalOrderPage,
  PendingMedicalOrderQuery,
  RejectPathologyReportRequest,
  ReportRevisionOperationResult,
  ReportTrackingView,
  ReviewReportRevisionRequest,
  SavePathologyReportDraftRequest,
} from '../types/doctor-workflow';

import { requestClient } from '#/api/request';

type PendingDiagnosticTaskPageResponse = Partial<PendingDiagnosticTaskPage>;
type PendingMedicalOrderPageResponse = Partial<PendingMedicalOrderPage>;
type MedicalOrderPackagePageResponse = Partial<
  MedicalOrderPagedResult<MedicalOrderPackageView>
>;
type MedicalOrderBillingResultResponse = Partial<MedicalOrderBillingResult>;
type DiagnosticWorkbenchResponse = Partial<DiagnosticWorkbenchView>;
type ReportTrackingResponse = Partial<ReportTrackingView>;

export function mapPendingDiagnosticTaskPageResponse(
  response: PendingDiagnosticTaskPageResponse,
): PendingDiagnosticTaskPage {
  return {
    items: response.items ?? [],
    page: response.page ?? 1,
    size: response.size ?? 20,
    total: response.total ?? 0,
  };
}

export function mapPendingMedicalOrderPageResponse(
  response: PendingMedicalOrderPageResponse,
): PendingMedicalOrderPage {
  return {
    items: response.items ?? [],
    page: response.page ?? 1,
    size: response.size ?? 20,
    total: response.total ?? 0,
  };
}

export function mapMedicalOrderPackagePageResponse(
  response: MedicalOrderPackagePageResponse,
  fallbackPage = 1,
  fallbackSize = 20,
): MedicalOrderPagedResult<MedicalOrderPackageView> {
  return {
    items: response.items ?? [],
    page: response.page ?? fallbackPage,
    size: response.size ?? fallbackSize,
    total: response.total ?? 0,
  };
}

export function mapMedicalOrderBillingResponse(
  response: MedicalOrderBillingResultResponse,
): MedicalOrderBillingResult {
  return {
    failureCount: response.failureCount ?? 0,
    items: Array.isArray(response.items)
      ? response.items.map((item) => mapMedicalOrderBillingItem(item))
      : [],
    successCount: response.successCount ?? 0,
    totalCount: response.totalCount ?? 0,
  };
}

function mapMedicalOrderBillingItem(
  item: Partial<MedicalOrderBillingItemResult>,
): MedicalOrderBillingItemResult {
  return {
    billingRecordId: item.billingRecordId ?? null,
    billingStatus: item.billingStatus ?? null,
    message: item.message ?? null,
    orderId: item.orderId ?? '',
  };
}

export function mapDiagnosticWorkbenchResponse(
  response: DiagnosticWorkbenchResponse,
): DiagnosticWorkbenchView {
  return {
    applicationFormArchiveLocation:
      response.applicationFormArchiveLocation ?? null,
    applicationFormArchiveStatus: response.applicationFormArchiveStatus ?? null,
    applicationFormImageUrl: response.applicationFormImageUrl ?? null,
    applicationNo: response.applicationNo ?? null,
    applicationOrder: response.applicationOrder ?? null,
    applicationType: response.applicationType ?? null,
    bedNo: response.bedNo ?? null,
    blocks: response.blocks ?? [],
    caseId: response.caseId ?? '',
    caseStatus: response.caseStatus ?? null,
    chargeItems: response.chargeItems ?? [],
    checkItem: response.checkItem ?? null,
    clinicalDiagnosis: response.clinicalDiagnosis ?? null,
    clinicalExaminationAndSurgeryFindings:
      response.clinicalExaminationAndSurgeryFindings ?? null,
    clinicalHistory: response.clinicalHistory ?? null,
    clinicalSubmissionRequirements:
      response.clinicalSubmissionRequirements ?? null,
    consultations: response.consultations ?? [],
    currentReport: response.currentReport ?? null,
    deliveredAt: response.deliveredAt ?? null,
    detachedAt: response.detachedAt ?? null,
    fixedAt: response.fixedAt ?? null,
    diagnosticTasks: response.diagnosticTasks ?? [],
    hasPendingRevision: response.hasPendingRevision ?? false,
    historicalPathologies: response.historicalPathologies ?? [],
    infectiousAndPastHistorySummary:
      response.infectiousAndPastHistorySummary ?? null,
    infectiousSource: response.infectiousSource ?? null,
    inpatientNo: response.inpatientNo ?? null,
    medicalOrders: response.medicalOrders ?? [],
    outpatientNo: response.outpatientNo ?? null,
    patientAge: response.patientAge ?? null,
    patientGender: response.patientGender ?? null,
    patientId: response.patientId ?? null,
    pathologyNo: response.pathologyNo ?? null,
    pacsExaminations: response.pacsExaminations ?? [],
    phone: response.phone ?? null,
    patientName: response.patientName ?? null,
    recentEvents: response.recentEvents ?? [],
    remarkSections: response.remarkSections ?? [],
    reportTraces: response.reportTraces ?? [],
    revisions: response.revisions ?? [],
    slides: response.slides ?? [],
    specimens: response.specimens ?? [],
    submittingDepartmentName: response.submittingDepartmentName ?? null,
    submittingDoctorName: response.submittingDoctorName ?? null,
  };
}

export function mapReportTrackingResponse(
  response: ReportTrackingResponse,
): ReportTrackingView {
  return {
    applicationFormArchiveLocation:
      response.applicationFormArchiveLocation ?? null,
    applicationFormArchiveStatus: response.applicationFormArchiveStatus ?? null,
    applicationFormImageUrl: response.applicationFormImageUrl ?? null,
    applicationNo: response.applicationNo ?? null,
    caseId: response.caseId ?? '',
    caseStatus: response.caseStatus ?? null,
    consultations: response.consultations ?? [],
    currentDraftVersionNo: response.currentDraftVersionNo ?? null,
    currentReport: response.currentReport ?? null,
    diagnosticTasks: response.diagnosticTasks ?? [],
    events: response.events ?? [],
    hasPendingRevision: response.hasPendingRevision ?? false,
    latestEffectiveVersionNo: response.latestEffectiveVersionNo ?? null,
    medicalOrders: response.medicalOrders ?? [],
    pathologyNo: response.pathologyNo ?? null,
    patientName: response.patientName ?? null,
    revisions: response.revisions ?? [],
    versions: response.versions ?? [],
  };
}

export async function listPendingDiagnosticTasks(
  params: PendingDiagnosticTaskQuery,
) {
  const response = await requestClient.get<PendingDiagnosticTaskPageResponse>(
    '/v1/diagnostic-tasks/pending',
    { params },
  );
  return mapPendingDiagnosticTaskPageResponse(response);
}

export async function listPendingMedicalOrders(
  params: PendingMedicalOrderQuery,
) {
  const response = await requestClient.get<PendingMedicalOrderPageResponse>(
    '/v1/medical-orders/pending',
    { params },
  );
  return mapPendingMedicalOrderPageResponse(response);
}

export async function listMedicalOrderDicts() {
  return (
    (await requestClient.get<MedicalOrderCategoryNode[]>(
      '/v1/medical-order-dicts',
    )) ?? []
  );
}

export async function listMedicalOrderPackagesPage(
  params: MedicalOrderPackagePageQuery,
) {
  const response = await requestClient.get<MedicalOrderPackagePageResponse>(
    '/v1/medical-order-packages/page',
    { params },
  );
  return mapMedicalOrderPackagePageResponse(response, params.page, params.size);
}

export async function assignDiagnosticTask(
  taskId: string,
  data: AssignDiagnosticTaskRequest,
) {
  return requestClient.post<unknown>(
    `/v1/diagnostic-tasks/${taskId}/assign`,
    data,
  );
}

export async function acceptDiagnosticTask(
  taskId: string,
  data: DiagnosticTaskActionRequest,
) {
  return requestClient.post<unknown>(
    `/v1/diagnostic-tasks/${taskId}/accept`,
    data,
  );
}

export async function startDiagnosticTask(
  taskId: string,
  data: DiagnosticTaskActionRequest,
) {
  return requestClient.post<unknown>(
    `/v1/diagnostic-tasks/${taskId}/start`,
    data,
  );
}

export async function createMedicalOrder(data: CreateMedicalOrderRequest) {
  return requestClient.post<MedicalOrderOperationResult>(
    '/v1/medical-orders',
    data,
  );
}

export async function acceptMedicalOrder(
  orderId: string,
  data: MedicalOrderActionRequest,
) {
  return requestClient.post<MedicalOrderOperationResult>(
    `/v1/medical-orders/${orderId}/accept`,
    data,
  );
}

export async function completeMedicalOrder(
  orderId: string,
  data: MedicalOrderActionRequest,
) {
  return requestClient.post<MedicalOrderOperationResult>(
    `/v1/medical-orders/${orderId}/complete`,
    data,
  );
}

export async function cancelMedicalOrder(
  orderId: string,
  data: MedicalOrderActionRequest,
) {
  return requestClient.post<MedicalOrderOperationResult>(
    `/v1/medical-orders/${orderId}/cancel`,
    data,
  );
}

export async function executeMedicalOrderBilling(
  data: MedicalOrderBillingRequest,
) {
  const response = await requestClient.post<MedicalOrderBillingResultResponse>(
    '/v1/medical-orders/billing/execute',
    data,
  );
  return mapMedicalOrderBillingResponse(response ?? {});
}

export async function confirmMedicalOrderBilling(
  data: MedicalOrderBillingRequest,
) {
  const response = await requestClient.post<MedicalOrderBillingResultResponse>(
    '/v1/medical-orders/billing/confirm',
    data,
  );
  return mapMedicalOrderBillingResponse(response ?? {});
}

export async function getDiagnosticWorkbench(caseId: string) {
  const response = await requestClient.get<DiagnosticWorkbenchResponse>(
    `/v1/pathology-cases/${caseId}/diagnostic-workbench`,
  );
  return mapDiagnosticWorkbenchResponse(response);
}

export async function getReportTracking(caseId: string) {
  const response = await requestClient.get<ReportTrackingResponse>(
    `/v1/pathology-cases/${caseId}/report-tracking`,
  );
  return mapReportTrackingResponse(response);
}

export async function createPathologyReport(data: PathologyReportDraft) {
  return requestClient.post<PathologyReportOperationResult>(
    '/v1/pathology-reports',
    data,
  );
}

export async function savePathologyReportDraft(
  reportId: string,
  data: SavePathologyReportDraftRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/save-draft`,
    data,
  );
}

export async function submitPathologyReport(
  reportId: string,
  data: DiagnosticTaskActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/submit`,
    data,
  );
}

export async function reviewPathologyReport(
  reportId: string,
  data: DiagnosticTaskActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/review`,
    data,
  );
}

export async function rejectPathologyReport(
  reportId: string,
  data: RejectPathologyReportRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/reject`,
    data,
  );
}

export async function signPathologyReport(
  reportId: string,
  data: DiagnosticTaskActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/sign`,
    data,
  );
}

export async function publishPathologyReport(
  reportId: string,
  data: DiagnosticTaskActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/publish`,
    data,
  );
}

export async function createReportRevisionRequest(
  data: CreateReportRevisionRequest,
) {
  return requestClient.post<ReportRevisionOperationResult>(
    '/v1/report-revision-requests',
    data,
  );
}

export async function approveReportRevisionRequest(
  requestId: string,
  data: ReviewReportRevisionRequest,
) {
  return requestClient.post<ReportRevisionOperationResult>(
    `/v1/report-revision-requests/${requestId}/approve`,
    data,
  );
}

export async function rejectReportRevisionRequest(
  requestId: string,
  data: ReviewReportRevisionRequest,
) {
  return requestClient.post<ReportRevisionOperationResult>(
    `/v1/report-revision-requests/${requestId}/reject`,
    data,
  );
}

export async function createConsultation(data: CreateConsultationRequest) {
  return requestClient.post<ConsultationOperationResult>(
    '/v1/consultations',
    data,
  );
}

export async function commentConsultationParticipant(
  consultationId: string,
  participantId: string,
  data: CommentConsultationParticipantRequest,
) {
  return requestClient.post<ConsultationOperationResult>(
    `/v1/consultations/${consultationId}/participants/${participantId}/comment`,
    data,
  );
}

export async function completeConsultation(
  consultationId: string,
  data: CompleteConsultationRequest,
) {
  return requestClient.post<ConsultationOperationResult>(
    `/v1/consultations/${consultationId}/complete`,
    data,
  );
}
