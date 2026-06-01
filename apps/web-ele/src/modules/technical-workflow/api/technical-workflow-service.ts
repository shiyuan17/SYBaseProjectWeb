import type {
  BatchOperatorRequest,
  CompleteDehydrationBatchRequest,
  CompleteTechnicalSpecimenRegistrationRequest,
  CreateDehydrationBatchRequest,
  CreateReworkOrderRequest,
  CreateSlideQcEvaluationRequest,
  DeleteTechnicalSpecimenRegistrationMediaAssetResult,
  DehydrationBatchResult,
  EmbeddingCompleteRequest,
  EmbeddingWorkstationSummary,
  EmbeddingResult,
  ExecuteReworkOrderRequest,
  GrossingCompleteRequest,
  GrossingWorkbenchContext,
  GrossingMediaAssetUploadResponse,
  GrossingResult,
  PendingTechnicalTaskPage,
  PendingTechnicalSpecimenRegistrationPage,
  PendingTechnicalSpecimenRegistrationQuery,
  PendingTechnicalTaskQuery,
  ReworkOrderResult,
  SaveTechnicalSpecimenRegistrationMaterialsRequest,
  SlicingCompleteRequest,
  SlicingWorkbenchQuery,
  SlicingWorkbenchRow,
  SlicingWorkbenchStats,
  SlicingWorkbenchView,
  SlicingResult,
  SlideQcEvaluationResult,
  SlideStainingCompleteRequest,
  SlideStainingResult,
  TaskOperationResult,
  TechnicalTaskAssignRequest,
  TechnicalTaskClaimRequest,
  TechnicalTaskPriorityRequest,
  TechnicalTaskReleaseRequest,
  TechnicalTaskStartRequest,
  CompleteTechnicalSpecimenRegistrationResult,
  TechnicalSpecimenRegistrationDetail,
  TechnicalSpecimenRegistrationWorkspace,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import { requestClient } from '#/api/request';

type PendingTechnicalTaskPageResponse = Partial<PendingTechnicalTaskPage>;
type PendingTechnicalSpecimenRegistrationPageResponse =
  Partial<PendingTechnicalSpecimenRegistrationPage>;
type TechnicalSpecimenRegistrationDetailResponse =
  Partial<TechnicalSpecimenRegistrationDetail>;
type TechnicalSpecimenRegistrationWorkspaceResponse =
  Partial<TechnicalSpecimenRegistrationWorkspace>;
type TechnicalTrackingResponse = Partial<TechnicalTrackingView>;
type EmbeddingWorkstationSummaryResponse = Partial<EmbeddingWorkstationSummary>;
type SlicingWorkbenchResponse = Partial<
  Omit<SlicingWorkbenchView, 'completedTodayList' | 'pendingList' | 'stats'>
> & {
  completedTodayList?: Array<Partial<SlicingWorkbenchRow>>;
  pendingList?: Array<Partial<SlicingWorkbenchRow>>;
  stats?: Partial<SlicingWorkbenchStats>;
};
type GrossingWorkbenchContextResponse = Partial<
  Omit<GrossingWorkbenchContext, 'tracking'>
> & {
  tracking?: Partial<TechnicalTrackingView>;
};

export function mapPendingTechnicalTaskPageResponse(
  response: PendingTechnicalTaskPageResponse,
): PendingTechnicalTaskPage {
  return {
    items: response.items ?? [],
    page: response.page ?? 1,
    size: response.size ?? 20,
    total: response.total ?? 0,
  };
}

export function mapTechnicalTrackingResponse(
  response: TechnicalTrackingResponse,
): TechnicalTrackingView {
  return {
    blocks: response.blocks ?? [],
    caseId: response.caseId ?? '',
    caseStatus: response.caseStatus ?? null,
    embeddingBoxes: response.embeddingBoxes ?? [],
    embeddingEvaluationRecords: response.embeddingEvaluationRecords ?? [],
    embeddingRecords: response.embeddingRecords ?? [],
    events: response.events ?? [],
    pathologyNo: response.pathologyNo ?? null,
    qcEvaluations: response.qcEvaluations ?? [],
    reworks: response.reworks ?? [],
    slides: response.slides ?? [],
    specimens: response.specimens ?? [],
    technicalTasks: response.technicalTasks ?? [],
  };
}

function mapSlicingWorkbenchRow(
  response: Partial<SlicingWorkbenchRow>,
): SlicingWorkbenchRow {
  return {
    caseId: response.caseId ?? '',
    completedAt: response.completedAt ?? null,
    embeddingBoxId: response.embeddingBoxId ?? '',
    embeddingClearRemark: response.embeddingClearRemark ?? null,
    embeddingEvaluation: response.embeddingEvaluation ?? null,
    embeddingOperatorName: response.embeddingOperatorName ?? null,
    grossingEvaluation: response.grossingEvaluation ?? null,
    pathologyNo: response.pathologyNo ?? null,
    patientId: response.patientId ?? null,
    patientName: response.patientName ?? null,
    selectable: response.selectable ?? false,
    shiftRemark: response.shiftRemark ?? null,
    slideId: response.slideId ?? null,
    slideNo: response.slideNo ?? null,
    sliceNotice: response.sliceNotice ?? null,
    slicingOperatorName: response.slicingOperatorName ?? null,
    slicingRemark: response.slicingRemark ?? null,
    specimenId: response.specimenId ?? null,
    specimenName: response.specimenName ?? null,
    taskId: response.taskId ?? '',
    taskStatus: response.taskStatus ?? null,
    timedOut: response.timedOut ?? false,
  };
}

export function mapSlicingWorkbenchResponse(
  response: SlicingWorkbenchResponse,
): SlicingWorkbenchView {
  return {
    completedPage: response.completedPage ?? 1,
    completedSize: response.completedSize ?? 20,
    completedTodayList: (response.completedTodayList ?? []).map(
      mapSlicingWorkbenchRow,
    ),
    completedTotal: response.completedTotal ?? 0,
    pendingList: (response.pendingList ?? []).map(mapSlicingWorkbenchRow),
    pendingPage: response.pendingPage ?? 1,
    pendingSize: response.pendingSize ?? 20,
    pendingTotal: response.pendingTotal ?? 0,
    stats: {
      completedDeptTodayCount: response.stats?.completedDeptTodayCount ?? 0,
      completedMineTodayCount: response.stats?.completedMineTodayCount ?? 0,
      overdueCount: response.stats?.overdueCount ?? 0,
      pendingPrintCount: response.stats?.pendingPrintCount ?? 0,
      pendingTodayCount: response.stats?.pendingTodayCount ?? 0,
      pendingTomorrowCount: response.stats?.pendingTomorrowCount ?? 0,
    },
  };
}

export function mapEmbeddingWorkstationSummaryResponse(
  response: EmbeddingWorkstationSummaryResponse,
): EmbeddingWorkstationSummary {
  return {
    completedCount: response.completedCount ?? 0,
    completedRecords: response.completedRecords ?? [],
    pendingCount: response.pendingCount ?? 0,
    pendingTasks: response.pendingTasks ?? [],
    workDate: response.workDate ?? null,
  };
}

export function mapGrossingWorkbenchContextResponse(
  response: GrossingWorkbenchContextResponse,
): GrossingWorkbenchContext {
  return {
    caseSummary: {
      applicationId: response.caseSummary?.applicationId ?? '',
      applicationNo: response.caseSummary?.applicationNo ?? '',
      applicationType: response.caseSummary?.applicationType ?? null,
      caseId: response.caseSummary?.caseId ?? '',
      caseStatus: response.caseSummary?.caseStatus ?? null,
      inpatientNo: response.caseSummary?.inpatientNo ?? null,
      pathologyNo: response.caseSummary?.pathologyNo ?? null,
      patientId: response.caseSummary?.patientId ?? null,
      patientName: response.caseSummary?.patientName ?? null,
      submittingDepartmentName:
        response.caseSummary?.submittingDepartmentName ?? null,
    },
    checkItems: response.checkItems ?? [],
    clinicalDiagnosis: response.clinicalDiagnosis ?? null,
    clinicalHistory: response.clinicalHistory ?? null,
    contextSummary: response.contextSummary ?? null,
    mediaAssets: response.mediaAssets ?? [],
    relatedExaminations: response.relatedExaminations ?? null,
    task: {
      objectId: response.task?.objectId ?? null,
      objectType: response.task?.objectType ?? null,
      taskId: response.task?.taskId ?? '',
      taskStatus: response.task?.taskStatus ?? null,
    },
    tracking: mapTechnicalTrackingResponse(response.tracking ?? {}),
  };
}

export function mapPendingTechnicalSpecimenRegistrationPageResponse(
  response: PendingTechnicalSpecimenRegistrationPageResponse,
): PendingTechnicalSpecimenRegistrationPage {
  return {
    items: response.items ?? [],
    page: response.page ?? 1,
    size: response.size ?? 20,
    total: response.total ?? 0,
  };
}

export function mapTechnicalSpecimenRegistrationDetailResponse(
  response: TechnicalSpecimenRegistrationDetailResponse,
): TechnicalSpecimenRegistrationDetail {
  return {
    applicationId: response.applicationId ?? '',
    applicationNo: response.applicationNo ?? '',
    applicationType: response.applicationType ?? null,
    caseId: response.caseId ?? '',
    checkItems: response.checkItems ?? [],
    clinicalDiagnosis: response.clinicalDiagnosis ?? null,
    inpatientNo: response.inpatientNo ?? null,
    materials: (response.materials ?? []).map((item) => ({
      sequenceNo: item.sequenceNo ?? 0,
      sourcePart: item.sourcePart ?? null,
      specimenId: item.specimenId ?? null,
      specimenName: item.specimenName ?? null,
      specimenType: item.specimenType ?? null,
    })),
    pathologyNo: response.pathologyNo ?? null,
    patientId: response.patientId ?? null,
    patientName: response.patientName ?? null,
    receivedAt: response.receivedAt ?? null,
    registeredAt: response.registeredAt ?? null,
    registeredByName: response.registeredByName ?? null,
    registrationRemarks: response.registrationRemarks ?? null,
    registrationStatus: response.registrationStatus ?? null,
    submittingDepartmentName: response.submittingDepartmentName ?? null,
  };
}

export function mapTechnicalSpecimenRegistrationWorkspaceResponse(
  response: TechnicalSpecimenRegistrationWorkspaceResponse,
): TechnicalSpecimenRegistrationWorkspace {
  return {
    actionFlags: {
      canCompleteRegistration:
        response.actionFlags?.canCompleteRegistration ?? false,
      canDeleteMediaAssets:
        response.actionFlags?.canDeleteMediaAssets ?? false,
      canSaveMaterials: response.actionFlags?.canSaveMaterials ?? false,
      canUploadMediaAssets:
        response.actionFlags?.canUploadMediaAssets ?? false,
    },
    basicInfo: {
      applicationNo: response.basicInfo?.applicationNo ?? null,
      applicationType: response.basicInfo?.applicationType ?? null,
      fixationTime: response.basicInfo?.fixationTime ?? null,
      inpatientNo: response.basicInfo?.inpatientNo ?? null,
      pathologyNo: response.basicInfo?.pathologyNo ?? null,
      patientAge: response.basicInfo?.patientAge ?? null,
      patientGender: response.basicInfo?.patientGender ?? null,
      patientId: response.basicInfo?.patientId ?? null,
      patientName: response.basicInfo?.patientName ?? null,
      registrationStatus: response.basicInfo?.registrationStatus ?? null,
      specimenRemovalTime: response.basicInfo?.specimenRemovalTime ?? null,
      submissionDate: response.basicInfo?.submissionDate ?? null,
      submittingDepartmentName:
        response.basicInfo?.submittingDepartmentName ?? null,
      submittingDoctorName: response.basicInfo?.submittingDoctorName ?? null,
    },
    checkItems: response.checkItems ?? [],
    detailSections: {
      clinicalExaminationAndSurgeryFindings:
        response.detailSections?.clinicalExaminationAndSurgeryFindings ?? null,
      clinicalSubmissionRequirements:
        response.detailSections?.clinicalSubmissionRequirements ?? null,
      externalPathologyDiagnosis:
        response.detailSections?.externalPathologyDiagnosis ?? null,
      historySummary: response.detailSections?.historySummary ?? null,
      infectiousAndPastHistorySummary:
        response.detailSections?.infectiousAndPastHistorySummary ?? null,
      labAndImagingExaminations:
        response.detailSections?.labAndImagingExaminations ?? null,
    },
    materials: (response.materials ?? []).map((item) => ({
      sequenceNo: item.sequenceNo ?? 0,
      sourcePart: item.sourcePart ?? null,
      specimenId: item.specimenId ?? null,
      specimenName: item.specimenName ?? null,
      specimenType: item.specimenType ?? null,
    })),
    mediaAssets: (response.mediaAssets ?? []).map((item) => ({
      assetId: item.assetId ?? '',
      capturedAt: item.capturedAt ?? null,
      fileName: item.fileName ?? null,
      fileUrl: item.fileUrl ?? '',
    })),
    pendingSummary: response.pendingSummary ?? {
      applicationId: '',
      applicationNo: '',
      applicationType: null,
      caseId: '',
      checkItem: null,
      inpatientNo: null,
      pathologyNo: null,
      patientId: null,
      patientName: null,
      receivedAt: null,
      registeredAt: null,
      registeredByName: null,
      registrationStatus: null,
      submittingDepartmentName: null,
    },
  };
}

export async function listPendingTechnicalTasks(
  params: PendingTechnicalTaskQuery,
) {
  const response = await requestClient.get<PendingTechnicalTaskPageResponse>(
    '/v1/technical-tasks/pending',
    { params },
  );
  return mapPendingTechnicalTaskPageResponse(response);
}

export async function getTechnicalTracking(caseIdentifier: string) {
  const response = await requestClient.get<TechnicalTrackingResponse>(
    `/v1/pathology-cases/${encodeURIComponent(caseIdentifier)}/technical-tracking`,
  );
  return mapTechnicalTrackingResponse(response);
}

export async function getEmbeddingWorkstationSummary(workDate?: string) {
  const response = await requestClient.get<EmbeddingWorkstationSummaryResponse>(
    '/v1/embeddings/workstation-summary',
    { params: { workDate } },
  );
  return mapEmbeddingWorkstationSummaryResponse(response);
}

export async function listPendingTechnicalSpecimenRegistrations(
  params: PendingTechnicalSpecimenRegistrationQuery,
) {
  const response = await requestClient.get<PendingTechnicalSpecimenRegistrationPageResponse>(
    '/v1/technical-specimen-registrations/pending',
    { params },
  );
  return mapPendingTechnicalSpecimenRegistrationPageResponse(response);
}

export async function getTechnicalSpecimenRegistrationDetail(caseId: string) {
  const response = await requestClient.get<TechnicalSpecimenRegistrationDetailResponse>(
    `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}`,
  );
  return mapTechnicalSpecimenRegistrationDetailResponse(response);
}

export async function getTechnicalSpecimenRegistrationWorkspace(caseId: string) {
  const response = await requestClient.get<TechnicalSpecimenRegistrationWorkspaceResponse>(
    `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/workspace`,
  );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function saveTechnicalSpecimenRegistrationMaterials(
  caseId: string,
  data: SaveTechnicalSpecimenRegistrationMaterialsRequest,
) {
  const response = await requestClient.put<TechnicalSpecimenRegistrationWorkspaceResponse>(
    `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/materials`,
    data,
  );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function uploadTechnicalSpecimenRegistrationMediaAsset(
  caseId: string,
  file: File,
) {
  return requestClient.upload<TechnicalSpecimenRegistrationWorkspace['mediaAssets'][number]>(
    `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/media-assets`,
    { file },
  );
}

export async function deleteTechnicalSpecimenRegistrationMediaAsset(
  caseId: string,
  assetId: string,
) {
  return requestClient.delete<DeleteTechnicalSpecimenRegistrationMediaAssetResult>(
    `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/media-assets/${encodeURIComponent(assetId)}`,
  );
}

export async function completeTechnicalSpecimenRegistration(
  caseId: string,
  data: CompleteTechnicalSpecimenRegistrationRequest,
) {
  return requestClient.post<CompleteTechnicalSpecimenRegistrationResult>(
    `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/complete`,
    data,
  );
}

export async function assignTechnicalTask(
  taskId: string,
  data: TechnicalTaskAssignRequest,
) {
  return requestClient.post<PendingTechnicalTaskPage['items'][number]>(
    `/v1/technical-tasks/${encodeURIComponent(taskId)}/assign`,
    data,
  );
}

export async function claimTechnicalTask(
  taskId: string,
  data: TechnicalTaskClaimRequest,
) {
  return requestClient.post<PendingTechnicalTaskPage['items'][number]>(
    `/v1/technical-tasks/${encodeURIComponent(taskId)}/claim`,
    data,
  );
}

export async function releaseTechnicalTask(
  taskId: string,
  data: TechnicalTaskReleaseRequest,
) {
  return requestClient.post<PendingTechnicalTaskPage['items'][number]>(
    `/v1/technical-tasks/${encodeURIComponent(taskId)}/release`,
    data,
  );
}

export async function updateTechnicalTaskPriority(
  taskId: string,
  data: TechnicalTaskPriorityRequest,
) {
  return requestClient.post<PendingTechnicalTaskPage['items'][number]>(
    `/v1/technical-tasks/${encodeURIComponent(taskId)}/priority`,
    data,
  );
}

export async function startGrossing(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>('/v1/grossings/start', data);
}

export async function getGrossingWorkbenchContext(taskId: string) {
  const response = await requestClient.get<GrossingWorkbenchContextResponse>(
    `/v1/grossings/${encodeURIComponent(taskId)}/context`,
  );
  return mapGrossingWorkbenchContextResponse(response);
}

export async function completeGrossing(data: GrossingCompleteRequest) {
  return requestClient.post<GrossingResult>('/v1/grossings/complete', data);
}

export async function uploadGrossingMediaAsset(file: File) {
  return requestClient.upload<GrossingMediaAssetUploadResponse>(
    '/v1/grossing-media-assets',
    { file },
  );
}

export async function createDehydrationBatch(
  data: CreateDehydrationBatchRequest,
) {
  return requestClient.post<DehydrationBatchResult>(
    '/v1/dehydration-batches',
    data,
  );
}

export async function startDehydrationBatch(
  batchId: string,
  data: BatchOperatorRequest,
) {
  return requestClient.post<DehydrationBatchResult>(
    `/v1/dehydration-batches/${batchId}/start`,
    data,
  );
}

export async function completeDehydrationBatch(
  batchId: string,
  data: CompleteDehydrationBatchRequest,
) {
  return requestClient.post<DehydrationBatchResult>(
    `/v1/dehydration-batches/${batchId}/complete`,
    data,
  );
}

export async function startEmbedding(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>('/v1/embeddings/start', data);
}

export async function completeEmbedding(data: EmbeddingCompleteRequest) {
  return requestClient.post<EmbeddingResult>('/v1/embeddings/complete', data);
}

export async function startSlicing(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>('/v1/slicings/start', data);
}

export async function completeSlicing(data: SlicingCompleteRequest) {
  return requestClient.post<SlicingResult>('/v1/slicings/complete', data);
}

export async function getSlicingWorkbench(params: SlicingWorkbenchQuery) {
  const response = await requestClient.get<SlicingWorkbenchResponse>(
    '/v1/slicings/workbench',
    { params },
  );
  return mapSlicingWorkbenchResponse(response);
}

export async function createSlideQcEvaluation(
  data: CreateSlideQcEvaluationRequest,
) {
  return requestClient.post<SlideQcEvaluationResult>(
    '/v1/slide-qc-evaluations',
    data,
  );
}

export async function startSlideStaining(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>(
    '/v1/slide-stainings/start',
    data,
  );
}

export async function completeSlideStaining(
  data: SlideStainingCompleteRequest,
) {
  return requestClient.post<SlideStainingResult>(
    '/v1/slide-stainings/complete',
    data,
  );
}

export async function createReworkOrder(data: CreateReworkOrderRequest) {
  return requestClient.post<ReworkOrderResult>('/v1/rework-orders', data);
}

export async function executeReworkOrder(
  reworkOrderId: string,
  data: ExecuteReworkOrderRequest,
) {
  return requestClient.post<ReworkOrderResult>(
    `/v1/rework-orders/${reworkOrderId}/execute`,
    data,
  );
}
