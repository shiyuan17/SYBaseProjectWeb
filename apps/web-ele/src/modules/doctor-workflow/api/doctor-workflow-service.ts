import type {
  AssignDiagnosticTaskRequest,
  CaseLifecycleApplicationFormView,
  CaseLifecycleSummaryView,
  CaseLifecycleTrackingView,
  CaseReportVersionSummary,
  CommentConsultationParticipantRequest,
  CompleteConsultationRequest,
  ConsultationOperationResult,
  CreateConsultationRequest,
  CreateMedicalOrderRequest,
  CreateReportRevisionRequest,
  DiagnosticTaskActionRequest,
  DiagnosticWorkbenchView,
  FormalReportVersionBatchActionRequest,
  FormalReportVersionBatchActionResult,
  FormalReportVersionSummary,
  LifecycleBlockView,
  LifecycleKeyFact,
  LifecycleNodeView,
  LifecycleReportView,
  LifecycleSlideView,
  LifecycleSpecimenView,
  LifecycleStageGroupView,
  MedicalOrderActionRequest,
  MedicalOrderBillingItemResult,
  MedicalOrderBillingRequest,
  MedicalOrderBillingResult,
  MedicalOrderCategoryNode,
  MedicalOrderOperationResult,
  MedicalOrderPackagePageQuery,
  MedicalOrderPackageView,
  MedicalOrderPagedResult,
  PathologyReportActionRequest,
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
type CaseLifecycleTrackingResponse = {
  applicationForm?: null | Partial<CaseLifecycleApplicationFormView>;
  caseSummary?: Partial<CaseLifecycleSummaryView>;
  overallTimeline?: LifecycleStageGroupResponse[];
  reportLifecycle?: Partial<LifecycleReportView> & {
    consultations?: DiagnosticWorkbenchView['consultations'];
    currentReport?: DiagnosticWorkbenchView['currentReport'];
    diagnosticTasks?: DiagnosticWorkbenchView['diagnosticTasks'];
    medicalOrders?: DiagnosticWorkbenchView['medicalOrders'];
    revisions?: DiagnosticWorkbenchView['revisions'];
    versions?: ReportTrackingView['versions'];
  };
  specimens?: LifecycleSpecimenResponse[];
};
type CaseReportVersionSummaryResponse = Partial<CaseReportVersionSummary>;
type FormalReportVersionSummaryResponse = Partial<FormalReportVersionSummary>;
type FormalReportVersionBatchActionResultResponse =
  Partial<FormalReportVersionBatchActionResult>;
type LifecycleKeyFactResponse = Partial<LifecycleKeyFact>;
type LifecycleNodeResponse = Partial<LifecycleNodeView> & {
  keyFacts?: LifecycleKeyFactResponse[];
};
type LifecycleStageGroupResponse = Partial<LifecycleStageGroupView> & {
  nodes?: LifecycleNodeResponse[];
};
type LifecycleSlideResponse = Partial<LifecycleSlideView> & {
  slideEvents?: LifecycleNodeResponse[];
};
type LifecycleBlockResponse = Partial<LifecycleBlockView> & {
  blockEvents?: LifecycleNodeResponse[];
  slides?: LifecycleSlideResponse[];
};
type LifecycleSpecimenResponse = Partial<LifecycleSpecimenView> & {
  blocks?: LifecycleBlockResponse[];
  specimenEvents?: LifecycleNodeResponse[];
};

export function mapPendingDiagnosticTaskPageResponse(
  response: PendingDiagnosticTaskPageResponse,
): PendingDiagnosticTaskPage {
  return {
    items: Array.isArray(response.items)
      ? response.items.map((item) => ({
          acceptedAt: item.acceptedAt ?? null,
          applicationId: item.applicationId ?? null,
          applicationNo: item.applicationNo ?? null,
          applicationType: item.applicationType ?? null,
          assignedAt: item.assignedAt ?? null,
          blockCount: item.blockCount ?? null,
          caseId: item.caseId ?? '',
          checkItem: item.checkItem ?? null,
          completedAt: item.completedAt ?? null,
          diagnosisDoctorName: item.diagnosisDoctorName ?? null,
          diagnosisDoctorUserId: item.diagnosisDoctorUserId ?? null,
          id: item.id ?? '',
          pathologyNo: item.pathologyNo ?? null,
          patientId: item.patientId ?? null,
          patientIdDisplay: item.patientIdDisplay ?? null,
          patientName: item.patientName ?? null,
          primaryDoctorName: item.primaryDoctorName ?? null,
          primaryDoctorUserId: item.primaryDoctorUserId ?? null,
          remarks: item.remarks ?? null,
          reportPrintedAt: item.reportPrintedAt ?? null,
          reportStatus: item.reportStatus ?? null,
          reviewerName: item.reviewerName ?? null,
          reviewerUserId: item.reviewerUserId ?? null,
          specimenName: item.specimenName ?? null,
          submittingDepartmentName: item.submittingDepartmentName ?? null,
          taskStatus: item.taskStatus ?? null,
          taskType: item.taskType ?? null,
        }))
      : [],
    page: response.page ?? 1,
    size: response.size ?? 20,
    total: response.total ?? 0,
  };
}

export function mapPendingMedicalOrderPageResponse(
  response: PendingMedicalOrderPageResponse,
): PendingMedicalOrderPage {
  return {
    items: Array.isArray(response.items)
      ? response.items.map((item) => ({
          ...item,
          caseId: item.caseId ?? '',
          orderId: item.orderId ?? '',
          patientId: item.patientId ?? null,
          patientIdDisplay: item.patientIdDisplay ?? null,
        }))
      : [],
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
    consultations: Array.isArray(response.consultations)
      ? response.consultations.map((item) => ({
          ...item,
          participants: Array.isArray(item.participants)
            ? item.participants.map((participant) => ({
                commentedAt: participant.commentedAt ?? null,
                draftedByName: participant.draftedByName ?? null,
                opinion: participant.opinion ?? null,
                participantId: participant.participantId ?? '',
                participantName: participant.participantName ?? null,
                participantRole: participant.participantRole ?? null,
                participantUserId: participant.participantUserId ?? null,
              }))
            : [],
        }))
      : [],
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
    consultations: Array.isArray(response.consultations)
      ? response.consultations.map((item) => ({
          ...item,
          participants: Array.isArray(item.participants)
            ? item.participants.map((participant) => ({
                commentedAt: participant.commentedAt ?? null,
                draftedByName: participant.draftedByName ?? null,
                opinion: participant.opinion ?? null,
                participantId: participant.participantId ?? '',
                participantName: participant.participantName ?? null,
                participantRole: participant.participantRole ?? null,
                participantUserId: participant.participantUserId ?? null,
              }))
            : [],
        }))
      : [],
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

function mapLifecycleKeyFactResponse(
  response: LifecycleKeyFactResponse,
): LifecycleKeyFact {
  return {
    label: response.label ?? '',
    value: response.value ?? null,
  };
}

function mapLifecycleNodeResponse(
  response: LifecycleNodeResponse,
): LifecycleNodeView {
  return {
    eventContent: response.eventContent ?? null,
    keyFacts: Array.isArray(response.keyFacts)
      ? response.keyFacts.map((item) => mapLifecycleKeyFactResponse(item))
      : [],
    nodeCode: response.nodeCode ?? null,
    occurredAt: response.occurredAt ?? null,
    operatorDevice: response.operatorDevice ?? null,
    operatorIp: response.operatorIp ?? null,
    operatorName: response.operatorName ?? null,
    stageCode: response.stageCode ?? null,
    status: response.status ?? null,
    title: response.title ?? null,
  };
}

function mapLifecycleStageGroupResponse(
  response: LifecycleStageGroupResponse,
): LifecycleStageGroupView {
  return {
    nodes: Array.isArray(response.nodes)
      ? response.nodes.map((item) => mapLifecycleNodeResponse(item))
      : [],
    stageCode: response.stageCode ?? null,
    stageTitle: response.stageTitle ?? null,
  };
}

function mapLifecycleSlideResponse(
  response: LifecycleSlideResponse,
): LifecycleSlideView {
  return {
    archiveLocation: response.archiveLocation ?? null,
    archiveStatus: response.archiveStatus ?? null,
    embeddingBoxId: response.embeddingBoxId ?? null,
    loanStatus: response.loanStatus ?? null,
    printedAt: response.printedAt ?? null,
    qcEvaluatedAt: response.qcEvaluatedAt ?? null,
    qcEvaluatorName: response.qcEvaluatorName ?? null,
    qcResult: response.qcResult ?? null,
    qualityStatus: response.qualityStatus ?? null,
    reworkReason: response.reworkReason ?? null,
    reworkStatus: response.reworkStatus ?? null,
    slideEvents: Array.isArray(response.slideEvents)
      ? response.slideEvents.map((item) => mapLifecycleNodeResponse(item))
      : [],
    slideId: response.slideId ?? '',
    slideNo: response.slideNo ?? null,
    slideStatus: response.slideStatus ?? null,
    slicedAt: response.slicedAt ?? null,
    slicedByName: response.slicedByName ?? null,
    specimenId: response.specimenId ?? null,
    stainedAt: response.stainedAt ?? null,
    stainedByName: response.stainedByName ?? null,
  };
}

function mapLifecycleBlockResponse(
  response: LifecycleBlockResponse,
): LifecycleBlockView {
  return {
    archiveLocation: response.archiveLocation ?? null,
    archiveStatus: response.archiveStatus ?? null,
    blockCode: response.blockCode ?? null,
    blockEvents: Array.isArray(response.blockEvents)
      ? response.blockEvents.map((item) => mapLifecycleNodeResponse(item))
      : [],
    blockId: response.blockId ?? '',
    description: response.description ?? null,
    embeddedByName: response.embeddedByName ?? null,
    embeddingBoxNo: response.embeddingBoxNo ?? null,
    embeddingEndedAt: response.embeddingEndedAt ?? null,
    embeddingRemarks: response.embeddingRemarks ?? null,
    embeddingStartedAt: response.embeddingStartedAt ?? null,
    evaluationLevel: response.evaluationLevel ?? null,
    grossDescription: response.grossDescription ?? null,
    loanStatus: response.loanStatus ?? null,
    sampledAt: response.sampledAt ?? null,
    sampledByName: response.sampledByName ?? null,
    samplingEvaluation: response.samplingEvaluation ?? null,
    sliceNotice: response.sliceNotice ?? null,
    slides: Array.isArray(response.slides)
      ? response.slides.map((item) => mapLifecycleSlideResponse(item))
      : [],
    specimenId: response.specimenId ?? null,
    specimenName: response.specimenName ?? null,
  };
}

function mapLifecycleSpecimenResponse(
  response: LifecycleSpecimenResponse,
): LifecycleSpecimenView {
  return {
    archiveLocation: response.archiveLocation ?? null,
    archiveStatus: response.archiveStatus ?? null,
    barcode: response.barcode ?? null,
    blocks: Array.isArray(response.blocks)
      ? response.blocks.map((item) => mapLifecycleBlockResponse(item))
      : [],
    checkedInAt: response.checkedInAt ?? null,
    confirmedAt: response.confirmedAt ?? null,
    contentDescribedByName: response.contentDescribedByName ?? null,
    createdAt: response.createdAt ?? null,
    fixedAt: response.fixedAt ?? null,
    loanStatus: response.loanStatus ?? null,
    receiptStatus: response.receiptStatus ?? null,
    receivedAt: response.receivedAt ?? null,
    removalAt: response.removalAt ?? null,
    specimenEvents: Array.isArray(response.specimenEvents)
      ? response.specimenEvents.map((item) => mapLifecycleNodeResponse(item))
      : [],
    specimenId: response.specimenId ?? '',
    specimenName: response.specimenName ?? null,
    specimenNo: response.specimenNo ?? null,
    specimenStatus: response.specimenStatus ?? null,
  };
}

export function mapCaseLifecycleTrackingResponse(
  response: CaseLifecycleTrackingResponse,
): CaseLifecycleTrackingView {
  return {
    applicationForm: response.applicationForm
      ? {
          applicantDoctorName:
            response.applicationForm.applicantDoctorName ?? null,
          applicationDate: response.applicationForm.applicationDate ?? null,
          archiveLocation: response.applicationForm.archiveLocation ?? null,
          archiveStatus: response.applicationForm.archiveStatus ?? null,
          imageUrl: response.applicationForm.imageUrl ?? null,
          remarks: response.applicationForm.remarks ?? null,
        }
      : null,
    caseSummary: {
      applicationDate: response.caseSummary?.applicationDate ?? null,
      applicationNo: response.caseSummary?.applicationNo ?? null,
      applicationType: response.caseSummary?.applicationType ?? null,
      caseId: response.caseSummary?.caseId ?? '',
      caseStatus: response.caseSummary?.caseStatus ?? null,
      currentStage: response.caseSummary?.currentStage ?? null,
      hasPendingRevision: response.caseSummary?.hasPendingRevision ?? false,
      pathologyNo: response.caseSummary?.pathologyNo ?? null,
      patientAge: response.caseSummary?.patientAge ?? null,
      patientGender: response.caseSummary?.patientGender ?? null,
      patientName: response.caseSummary?.patientName ?? null,
      submittingDepartmentName:
        response.caseSummary?.submittingDepartmentName ?? null,
      submittingDoctorName: response.caseSummary?.submittingDoctorName ?? null,
    },
    overallTimeline: Array.isArray(response.overallTimeline)
      ? response.overallTimeline.map((item) =>
          mapLifecycleStageGroupResponse(item),
        )
      : [],
    reportLifecycle: {
      consultations: response.reportLifecycle?.consultations ?? [],
      currentReport: response.reportLifecycle?.currentReport ?? null,
      diagnosticTasks: response.reportLifecycle?.diagnosticTasks ?? [],
      medicalOrders: response.reportLifecycle?.medicalOrders ?? [],
      revisions: response.reportLifecycle?.revisions ?? [],
      versions: response.reportLifecycle?.versions ?? [],
    },
    specimens: Array.isArray(response.specimens)
      ? response.specimens.map((item) => mapLifecycleSpecimenResponse(item))
      : [],
  };
}

export function mapFormalReportVersionSummary(
  response: FormalReportVersionSummaryResponse,
): FormalReportVersionSummary {
  return {
    deliveryStatus: response.deliveryStatus ?? null,
    issuedAt: response.issuedAt ?? null,
    plannedIssueAt: response.plannedIssueAt ?? null,
    printStatus: response.printStatus ?? null,
    printedAt: response.printedAt ?? null,
    publishedAt: response.publishedAt ?? null,
    recalledAt: response.recalledAt ?? null,
    reportId: response.reportId ?? '',
    reportNo: response.reportNo ?? null,
    signedAt: response.signedAt ?? null,
    signedByName: response.signedByName ?? null,
    versionId: response.versionId ?? '',
    versionNo: response.versionNo ?? null,
    versionStatus: response.versionStatus ?? null,
  };
}

export function mapCaseReportVersionSummary(
  response: CaseReportVersionSummaryResponse,
): CaseReportVersionSummary {
  return {
    deliveryStatus: response.deliveryStatus ?? null,
    issuedAt: response.issuedAt ?? null,
    plannedIssueAt: response.plannedIssueAt ?? null,
    printStatus: response.printStatus ?? null,
    printedAt: response.printedAt ?? null,
    publishedAt: response.publishedAt ?? null,
    recalledAt: response.recalledAt ?? null,
    reportId: response.reportId ?? '',
    reportNo: response.reportNo ?? null,
    reviewedAt: response.reviewedAt ?? null,
    signedAt: response.signedAt ?? null,
    signedByName: response.signedByName ?? null,
    submittedAt: response.submittedAt ?? null,
    versionId: response.versionId ?? '',
    versionNo: response.versionNo ?? null,
    versionStatus: response.versionStatus ?? null,
  };
}

export function mapFormalReportVersionBatchActionResult(
  response: FormalReportVersionBatchActionResultResponse,
): FormalReportVersionBatchActionResult {
  return {
    failureCount: response.failureCount ?? 0,
    items: Array.isArray(response.items)
      ? response.items.map((item) => ({
          message: item.message ?? null,
          success: item.success ?? false,
          versionId: item.versionId ?? '',
        }))
      : [],
    successCount: response.successCount ?? 0,
    totalCount: response.totalCount ?? 0,
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

export async function listAssignableDiagnosticTasks(
  params: PendingDiagnosticTaskQuery,
) {
  const response = await requestClient.get<PendingDiagnosticTaskPageResponse>(
    '/v1/diagnostic-tasks/assignment',
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

export async function getCaseLifecycleTracking(caseId: string) {
  const response = await requestClient.get<CaseLifecycleTrackingResponse>(
    `/v1/pathology-cases/${caseId}/lifecycle-tracking`,
  );
  return mapCaseLifecycleTrackingResponse(response ?? {});
}

export async function listFormalReportVersions(caseId: string) {
  const response = await requestClient.get<
    FormalReportVersionSummaryResponse[]
  >(`/v1/pathology-cases/${caseId}/formal-report-versions`);
  return (response ?? []).map((item) => mapFormalReportVersionSummary(item));
}

export async function listCaseReportVersions(caseIdentifier: string) {
  const response = await requestClient.get<CaseReportVersionSummaryResponse[]>(
    `/v1/pathology-cases/${caseIdentifier}/report-versions`,
  );
  return (response ?? []).map((item) => mapCaseReportVersionSummary(item));
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
  data: PathologyReportActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/submit`,
    data,
  );
}

export async function reviewPathologyReport(
  reportId: string,
  data: PathologyReportActionRequest,
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
  data: PathologyReportActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/sign`,
    data,
  );
}

export async function publishPathologyReport(
  reportId: string,
  data: PathologyReportActionRequest,
) {
  return requestClient.post<PathologyReportOperationResult>(
    `/v1/pathology-reports/${reportId}/publish`,
    data,
  );
}

export async function printFormalReportVersions(
  data: FormalReportVersionBatchActionRequest,
) {
  const response =
    await requestClient.post<FormalReportVersionBatchActionResultResponse>(
      '/v1/pathology-reports/formal-versions/print',
      data,
    );
  return mapFormalReportVersionBatchActionResult(response ?? {});
}

export async function issueFormalReportVersions(
  data: FormalReportVersionBatchActionRequest,
) {
  const response =
    await requestClient.post<FormalReportVersionBatchActionResultResponse>(
      '/v1/pathology-reports/formal-versions/issue',
      data,
    );
  return mapFormalReportVersionBatchActionResult(response ?? {});
}

export async function recallFormalReportVersions(
  data: FormalReportVersionBatchActionRequest,
) {
  const response =
    await requestClient.post<FormalReportVersionBatchActionResultResponse>(
      '/v1/pathology-reports/formal-versions/recall',
      data,
    );
  return mapFormalReportVersionBatchActionResult(response ?? {});
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
