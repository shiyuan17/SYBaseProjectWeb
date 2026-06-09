import type {
  BatchOperatorRequest,
  CompleteDehydrationBatchRequest,
  CompleteTechnicalSpecimenRegistrationRequest,
  CompleteTechnicalSpecimenRegistrationResult,
  CreateDehydrationBatchRequest,
  CreateReworkOrderRequest,
  CreateSlideQcEvaluationRequest,
  DehydrationBatchResult,
  DeleteTechnicalSpecimenRegistrationMediaAssetResult,
  EmbeddingCompleteRequest,
  EmbeddingQualityReviewRequest,
  EmbeddingQualityReviewResult,
  EmbeddingResult,
  EmbeddingWorkstationSummary,
  ExecuteReworkOrderRequest,
  GrossingCompleteRequest,
  GrossingMediaAssetUploadResponse,
  GrossingResult,
  GrossingWorkbenchContext,
  PendingTechnicalSpecimenRegistrationItem,
  PendingTechnicalSpecimenRegistrationPage,
  PendingTechnicalSpecimenRegistrationQuery,
  PendingTechnicalTaskPage,
  PendingTechnicalTaskQuery,
  ReworkOrderResult,
  SaveTechnicalSpecimenRegistrationDetailSectionsRequest,
  SaveTechnicalSpecimenRegistrationMaterialsRequest,
  SlicingCompleteRequest,
  SlicingResult,
  SlicingSlidePrintRequest,
  SlicingSlidePrintResult,
  SlicingWorkbenchQuery,
  SlicingWorkbenchRow,
  SlicingWorkbenchStats,
  SlicingWorkbenchView,
  SlideQcEvaluationResult,
  SlideStainingCompleteRequest,
  SlideStainingResult,
  TaskOperationResult,
  TechnicalSpecimenRegistrationDetail,
  TechnicalSpecimenRegistrationMaterialVerificationRequest,
  TechnicalSpecimenRegistrationWorkspace,
  TechnicalTaskAssignRequest,
  TechnicalTaskClaimRequest,
  TechnicalTaskPriorityRequest,
  TechnicalTaskReleaseRequest,
  TechnicalTaskRemarksRequest,
  TechnicalTaskStartRequest,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import type {
  ApplicationRegistrationWorkbenchRecord,
  SaveApplicationRegistrationPatientInfoRequest,
} from '#/modules/specimen-workflow/types/application-registration-workbench';

import { requestClient } from '#/api/request';

type PendingTechnicalTaskPageResponse = Partial<PendingTechnicalTaskPage>;
type PendingTechnicalSpecimenRegistrationPageResponse =
  Partial<PendingTechnicalSpecimenRegistrationPage>;
type TechnicalSpecimenRegistrationDetailResponse =
  Partial<TechnicalSpecimenRegistrationDetail>;
type TechnicalSpecimenRegistrationWorkspaceResponse =
  Partial<TechnicalSpecimenRegistrationWorkspace>;
type ApplicationRegistrationWorkbenchRecordResponse =
  Partial<ApplicationRegistrationWorkbenchRecord>;
type TechnicalTrackingResponse = Partial<TechnicalTrackingView>;
type EmbeddingWorkstationSummaryResponse = Partial<EmbeddingWorkstationSummary>;
type SlicingWorkbenchResponse = Partial<
  Omit<SlicingWorkbenchView, 'completedTodayList' | 'pendingList' | 'stats'>
> & {
  completedTodayList?: Array<Partial<SlicingWorkbenchRow>>;
  pendingList?: Array<Partial<SlicingWorkbenchRow>>;
  pendingPrintList?: Array<Partial<SlicingWorkbenchRow>>;
  pendingSliceList?: Array<Partial<SlicingWorkbenchRow>>;
  stats?: Partial<SlicingWorkbenchStats>;
};
type GrossingWorkbenchContextResponse = Partial<
  Omit<GrossingWorkbenchContext, 'tracking'>
> & {
  tracking?: Partial<TechnicalTrackingView>;
};

const DEFAULT_TECHNICAL_SPECIMEN_TYPE = '活体';
const DEFAULT_TECHNICAL_SPECIMEN_SIZE = '小标本';
const DEFAULT_TECHNICAL_TISSUE_COUNT = 1;
const DEFAULT_TECHNICAL_VERIFICATION_STATUS = 'UNVERIFIED';

function mapApplicationRegistrationWorkbenchRecordResponse(
  response: ApplicationRegistrationWorkbenchRecordResponse,
): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: response.applicationId ?? '',
    contagiousSpecimen: {
      hepatitis: response.contagiousSpecimen?.hepatitis ?? false,
      hiv: response.contagiousSpecimen?.hiv ?? false,
      isolation: response.contagiousSpecimen?.isolation ?? false,
      syphilis: response.contagiousSpecimen?.syphilis ?? false,
      tuberculosis: response.contagiousSpecimen?.tuberculosis ?? false,
    },
    gynecologyInfo: {
      additionalNotes: response.gynecologyInfo?.additionalNotes ?? '',
      hpvResult: response.gynecologyInfo?.hpvResult ?? '',
      lastMenstrualPeriod: response.gynecologyInfo?.lastMenstrualPeriod ?? '',
      menopause: response.gynecologyInfo?.menopause ?? false,
      previousCytology: response.gynecologyInfo?.previousCytology ?? '',
      previousTreatment: response.gynecologyInfo?.previousTreatment ?? '',
      specialConditions: {
        abnormalBleeding:
          response.gynecologyInfo?.specialConditions?.abnormalBleeding ?? false,
        birthControl:
          response.gynecologyInfo?.specialConditions?.birthControl ?? false,
        hormoneReplacement:
          response.gynecologyInfo?.specialConditions?.hormoneReplacement ??
          false,
        hysterectomy:
          response.gynecologyInfo?.specialConditions?.hysterectomy ?? false,
        iud: response.gynecologyInfo?.specialConditions?.iud ?? false,
        lactation:
          response.gynecologyInfo?.specialConditions?.lactation ?? false,
        menopause:
          response.gynecologyInfo?.specialConditions?.menopause ?? false,
        other: response.gynecologyInfo?.specialConditions?.other ?? '',
        pregnancy:
          response.gynecologyInfo?.specialConditions?.pregnancy ?? false,
        radiotherapy:
          response.gynecologyInfo?.specialConditions?.radiotherapy ?? false,
      },
    },
    patientInfo: {
      age: response.patientInfo?.age ?? '',
      applicationDate: response.patientInfo?.applicationDate ?? '',
      applicationNo: response.patientInfo?.applicationNo ?? '',
      applyDept: response.patientInfo?.applyDept ?? '',
      applyDoctor: response.patientInfo?.applyDoctor ?? '',
      bedNo: response.patientInfo?.bedNo ?? '',
      checkItem: response.patientInfo?.checkItem ?? '',
      clinicalDiagnosis: response.patientInfo?.clinicalDiagnosis ?? '',
      clinicalHistory: response.patientInfo?.clinicalHistory ?? '',
      deliveryRequirement: response.patientInfo?.deliveryRequirement ?? '',
      endoscopyDiagnosis: response.patientInfo?.endoscopyDiagnosis ?? '',
      frozenReminder: response.patientInfo?.frozenReminder ?? false,
      gender: response.patientInfo?.gender ?? '',
      idNo: response.patientInfo?.idNo ?? '',
      imagingResult: response.patientInfo?.imagingResult ?? '',
      inpatientNo: response.patientInfo?.inpatientNo ?? '',
      patientName: response.patientInfo?.patientName ?? '',
      patientVerified: response.patientInfo?.patientVerified ?? false,
      phone: response.patientInfo?.phone ?? '',
      registrationStatus: response.patientInfo?.registrationStatus ?? '',
      remark: response.patientInfo?.remark ?? '',
      specimenType: response.patientInfo?.specimenType ?? '',
      wardName: response.patientInfo?.wardName ?? '',
    },
    specimenItems: (response.specimenItems ?? []).map((item) => ({
      id: item.id ?? '',
      quantity: item.quantity ?? 0,
      specimenName: item.specimenName ?? '',
      specimenNo: item.specimenNo ?? '',
      specimenSite: item.specimenSite ?? '',
      status: item.status ?? '',
    })),
    surgeryInfo: {
      buildingId: response.surgeryInfo?.buildingId ?? '',
      clinicalFindings: response.surgeryInfo?.clinicalFindings ?? '',
      fixativeType: response.surgeryInfo?.fixativeType ?? '',
      fixationPerson: response.surgeryInfo?.fixationPerson ?? '',
      fixationTime: response.surgeryInfo?.fixationTime ?? '',
      roomId: response.surgeryInfo?.roomId ?? '',
      specimenRemovalTime: response.surgeryInfo?.specimenRemovalTime ?? '',
      surgeryName: response.surgeryInfo?.surgeryName ?? '',
    },
  };
}

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
    applicationType: response.applicationType ?? null,
    caseId: response.caseId ?? '',
    combinedSlide: response.combinedSlide ?? false,
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
    slidePrintStatus: response.slidePrintStatus ?? null,
    sliceNotice: response.sliceNotice ?? null,
    slicingOperatorName: response.slicingOperatorName ?? null,
    slicingRemark: response.slicingRemark ?? null,
    specimenId: response.specimenId ?? null,
    specimenName: response.specimenName ?? null,
    taskId: response.taskId ?? '',
    taskStatus: response.taskStatus ?? null,
    timedOut: response.timedOut ?? false,
    printedSlideCount: response.printedSlideCount ?? 0,
  };
}

export function mapSlicingWorkbenchResponse(
  response: SlicingWorkbenchResponse,
): SlicingWorkbenchView {
  return {
    completedPage: response.completedPage ?? 1,
    completedSize: response.completedSize ?? 20,
    completedTodayList: (response.completedTodayList ?? []).map((row) =>
      mapSlicingWorkbenchRow(row),
    ),
    completedTotal: response.completedTotal ?? 0,
    pendingList: (response.pendingList ?? []).map((row) =>
      mapSlicingWorkbenchRow(row),
    ),
    pendingPrintList: (
      response.pendingPrintList ??
      response.pendingList ??
      []
    ).map((row) => mapSlicingWorkbenchRow(row)),
    pendingPrintTotal: response.pendingPrintTotal ?? response.pendingTotal ?? 0,
    pendingPage: response.pendingPage ?? 1,
    pendingSize: response.pendingSize ?? 20,
    pendingSliceList: (response.pendingSliceList ?? []).map((row) =>
      mapSlicingWorkbenchRow(row),
    ),
    pendingSliceTotal: response.pendingSliceTotal ?? 0,
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
    clinicalSubmissionRequirements:
      response.clinicalSubmissionRequirements ?? null,
    contextSummary: response.contextSummary ?? null,
    externalPathologyDiagnosis: response.externalPathologyDiagnosis ?? null,
    infectiousAndPastHistorySummary:
      response.infectiousAndPastHistorySummary ?? null,
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
    items: (response.items ?? []).map((item) =>
      mapPendingTechnicalSpecimenRegistrationItem(item),
    ),
    page: response.page ?? 1,
    size: response.size ?? 20,
    total: response.total ?? 0,
  };
}

function mapPendingTechnicalSpecimenRegistrationItem(
  response: Partial<PendingTechnicalSpecimenRegistrationItem>,
): PendingTechnicalSpecimenRegistrationItem {
  return {
    applicationId: response.applicationId ?? '',
    applicationNo: response.applicationNo ?? '',
    applicationType: response.applicationType ?? null,
    caseId: response.caseId ?? '',
    checkItem: response.checkItem ?? null,
    inpatientNo: response.inpatientNo ?? null,
    pathologyNo: response.pathologyNo ?? null,
    patientAge: response.patientAge ?? null,
    patientGender: response.patientGender ?? null,
    patientId: response.patientId ?? null,
    patientName: response.patientName ?? null,
    receivedAt: response.receivedAt ?? null,
    registeredAt: response.registeredAt ?? null,
    registeredByName: response.registeredByName ?? null,
    registrationStatus: response.registrationStatus ?? null,
    submittingDepartmentName: response.submittingDepartmentName ?? null,
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
      evaluationItems: item.evaluationItems ?? [],
      frozen: item.frozen ?? false,
      sequenceNo: item.sequenceNo ?? 0,
      sourcePart: item.sourcePart ?? null,
      specimenBarcode: item.specimenBarcode ?? null,
      specimenId: item.specimenId ?? null,
      specimenSize: item.specimenSize ?? DEFAULT_TECHNICAL_SPECIMEN_SIZE,
      specimenName: item.specimenName ?? null,
      specimenType: item.specimenType ?? DEFAULT_TECHNICAL_SPECIMEN_TYPE,
      tissueCount: item.tissueCount ?? DEFAULT_TECHNICAL_TISSUE_COUNT,
      verificationCompletedAt: item.verificationCompletedAt ?? null,
      verificationStatus:
        item.verificationStatus ?? DEFAULT_TECHNICAL_VERIFICATION_STATUS,
      verifiedByName: item.verifiedByName ?? null,
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
      canDeleteMediaAssets: response.actionFlags?.canDeleteMediaAssets ?? false,
      canSaveDetailSections:
        response.actionFlags?.canSaveDetailSections ?? false,
      canSaveMaterials: response.actionFlags?.canSaveMaterials ?? false,
      canUploadMediaAssets: response.actionFlags?.canUploadMediaAssets ?? false,
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
      evaluationItems: item.evaluationItems ?? [],
      frozen: item.frozen ?? false,
      sequenceNo: item.sequenceNo ?? 0,
      sourcePart: item.sourcePart ?? null,
      specimenBarcode: item.specimenBarcode ?? null,
      specimenId: item.specimenId ?? null,
      specimenSize: item.specimenSize ?? DEFAULT_TECHNICAL_SPECIMEN_SIZE,
      specimenName: item.specimenName ?? null,
      specimenType: item.specimenType ?? DEFAULT_TECHNICAL_SPECIMEN_TYPE,
      tissueCount: item.tissueCount ?? DEFAULT_TECHNICAL_TISSUE_COUNT,
      verificationCompletedAt: item.verificationCompletedAt ?? null,
      verificationStatus:
        item.verificationStatus ?? DEFAULT_TECHNICAL_VERIFICATION_STATUS,
      verifiedByName: item.verifiedByName ?? null,
    })),
    mediaAssets: (response.mediaAssets ?? []).map((item) => ({
      assetId: item.assetId ?? '',
      capturedAt: item.capturedAt ?? null,
      fileName: item.fileName ?? null,
      fileUrl: item.fileUrl ?? '',
    })),
    pendingSummary: response.pendingSummary
      ? mapPendingTechnicalSpecimenRegistrationItem(response.pendingSummary)
      : {
          applicationId: '',
          applicationNo: '',
          applicationType: null,
          caseId: '',
          checkItem: null,
          inpatientNo: null,
          pathologyNo: null,
          patientAge: null,
          patientGender: null,
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
  const response =
    await requestClient.get<PendingTechnicalSpecimenRegistrationPageResponse>(
      '/v1/technical-specimen-registrations/pending',
      { params },
    );
  return mapPendingTechnicalSpecimenRegistrationPageResponse(response);
}

export async function listTechnicalSpecimenRegistrations(
  params: PendingTechnicalSpecimenRegistrationQuery,
) {
  const response =
    await requestClient.get<PendingTechnicalSpecimenRegistrationPageResponse>(
      '/v1/technical-specimen-registrations',
      { params },
    );
  return mapPendingTechnicalSpecimenRegistrationPageResponse(response);
}

export async function getTechnicalSpecimenRegistrationDetail(caseId: string) {
  const response =
    await requestClient.get<TechnicalSpecimenRegistrationDetailResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}`,
    );
  return mapTechnicalSpecimenRegistrationDetailResponse(response);
}

export async function getTechnicalSpecimenRegistrationWorkspace(
  caseId: string,
) {
  const response =
    await requestClient.get<TechnicalSpecimenRegistrationWorkspaceResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/workspace`,
    );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function getTechnicalSpecimenRegistrationApplicationWorkbench(
  caseId: string,
) {
  const response =
    await requestClient.get<ApplicationRegistrationWorkbenchRecordResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/application-workbench`,
    );
  return mapApplicationRegistrationWorkbenchRecordResponse(response);
}

export async function saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo(
  caseId: string,
  data: SaveApplicationRegistrationPatientInfoRequest,
) {
  const response =
    await requestClient.request<ApplicationRegistrationWorkbenchRecordResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/application-workbench/patient-info`,
      {
        data,
        method: 'PATCH',
      },
    );
  return mapApplicationRegistrationWorkbenchRecordResponse(response);
}

export async function saveTechnicalSpecimenRegistrationMaterials(
  caseId: string,
  data: SaveTechnicalSpecimenRegistrationMaterialsRequest,
) {
  const response =
    await requestClient.put<TechnicalSpecimenRegistrationWorkspaceResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/materials`,
      data,
    );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function verifyTechnicalSpecimenRegistrationMaterial(
  caseId: string,
  specimenId: string,
  data: TechnicalSpecimenRegistrationMaterialVerificationRequest,
) {
  const response =
    await requestClient.post<TechnicalSpecimenRegistrationWorkspaceResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/materials/${encodeURIComponent(specimenId)}/verify`,
      data,
    );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function cancelTechnicalSpecimenRegistrationMaterialVerification(
  caseId: string,
  specimenId: string,
  data: TechnicalSpecimenRegistrationMaterialVerificationRequest,
) {
  const response =
    await requestClient.post<TechnicalSpecimenRegistrationWorkspaceResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/materials/${encodeURIComponent(specimenId)}/cancel-verification`,
      data,
    );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function saveTechnicalSpecimenRegistrationDetailSections(
  caseId: string,
  data: SaveTechnicalSpecimenRegistrationDetailSectionsRequest,
) {
  const response =
    await requestClient.request<TechnicalSpecimenRegistrationWorkspaceResponse>(
      `/v1/technical-specimen-registrations/${encodeURIComponent(caseId)}/detail-sections`,
      {
        data,
        method: 'PATCH',
      },
    );
  return mapTechnicalSpecimenRegistrationWorkspaceResponse(response);
}

export async function uploadTechnicalSpecimenRegistrationMediaAsset(
  caseId: string,
  file: File,
) {
  return requestClient.upload<
    TechnicalSpecimenRegistrationWorkspace['mediaAssets'][number]
  >(
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

export async function updateTechnicalTaskRemarks(
  taskId: string,
  data: TechnicalTaskRemarksRequest,
) {
  return requestClient.request<PendingTechnicalTaskPage['items'][number]>(
    `/v1/technical-tasks/${encodeURIComponent(taskId)}/remarks`,
    {
      data,
      method: 'PATCH',
    },
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

export async function startDehydration(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>(
    '/v1/dehydrations/start',
    data,
  );
}

export async function completeDehydration(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>(
    '/v1/dehydrations/complete',
    data,
  );
}

export async function startEmbedding(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>('/v1/embeddings/start', data);
}

export async function completeEmbedding(data: EmbeddingCompleteRequest) {
  return requestClient.post<EmbeddingResult>('/v1/embeddings/complete', data);
}

export async function updateEmbeddingQualityReview(
  embeddingId: string,
  data: EmbeddingQualityReviewRequest,
) {
  return requestClient.request<EmbeddingQualityReviewResult>(
    `/v1/embeddings/${encodeURIComponent(embeddingId)}/quality-review`,
    {
      data,
      method: 'PATCH',
    },
  );
}

export async function startSlicing(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>('/v1/slicings/start', data);
}

export async function completeSlicing(data: SlicingCompleteRequest) {
  return requestClient.post<SlicingResult>('/v1/slicings/complete', data);
}

export async function printSlicingSlides(data: SlicingSlidePrintRequest) {
  return requestClient.post<SlicingSlidePrintResult>(
    '/v1/slicings/slide-print',
    data,
  );
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
