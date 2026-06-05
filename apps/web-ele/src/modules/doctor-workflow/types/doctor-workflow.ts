export interface DiagnosticTaskActionRequest {
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface AssignDiagnosticTaskRequest {
  diagnosisDoctorName: string;
  diagnosisDoctorUserId: string;
  primaryDoctorName: string;
  primaryDoctorUserId: string;
  remarks?: string;
  reviewerName: string;
  reviewerUserId: string;
  terminalCode?: string;
}

export interface PendingDiagnosticTaskQuery {
  assignedFrom?: string;
  assignedTo?: string;
  page: number;
  pathologyNo?: string;
  size: number;
  taskStatus?: string;
  taskType?: string;
}

export interface PendingDiagnosticTaskItem {
  acceptedAt?: null | string;
  applicationId?: null | string;
  applicationNo?: null | string;
  applicationType?: null | string;
  assignedAt?: null | string;
  blockCount?: null | number;
  caseId: string;
  checkItem?: null | string;
  completedAt?: null | string;
  diagnosisDoctorName?: null | string;
  diagnosisDoctorUserId?: null | string;
  id: string;
  pathologyNo?: null | string;
  patientId?: null | string;
  patientName?: null | string;
  primaryDoctorName?: null | string;
  primaryDoctorUserId?: null | string;
  reportPrintedAt?: null | string;
  reportStatus?: null | string;
  remarks?: null | string;
  reviewerName?: null | string;
  reviewerUserId?: null | string;
  specimenName?: null | string;
  submittingDepartmentName?: null | string;
  taskStatus?: null | string;
  taskType?: null | string;
}

export interface PendingDiagnosticTaskPage {
  items: PendingDiagnosticTaskItem[];
  page: number;
  size: number;
  total: number;
}

export interface SpecimenSummary {
  barcode?: null | string;
  specimenId: string;
  specimenName?: null | string;
  specimenNo?: null | string;
  specimenStatus?: null | string;
}

export interface BlockSummary {
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  blockCode?: null | string;
  blockId: string;
  description?: null | string;
  embeddingDoctorName?: null | string;
  embeddingBoxNo?: null | string;
  grossingDoctorName?: null | string;
  loanStatus?: null | string;
  remarks?: null | string;
  specimenId?: null | string;
  specimenName?: null | string;
  tissueName?: null | string;
  usageStatus?: null | string;
}

export interface SlideSummary {
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  blockCode?: null | string;
  diagnosisRemark?: null | string;
  embeddingBoxId?: null | string;
  evaluation?: null | string;
  examinationItem?: null | string;
  loanStatus?: null | string;
  pathologyNo?: null | string;
  qualityStatus?: null | string;
  slicedAt?: null | string;
  slicedByName?: null | string;
  slideId: string;
  slideNo?: null | string;
  slideStatus?: null | string;
  slideType?: null | string;
  specimenId?: null | string;
}

export interface CurrentReportSummary {
  clinicalDiagnosis?: null | string;
  finalDiagnosis?: null | string;
  grossExam?: null | string;
  microscopicExam?: null | string;
  publishedAt?: null | string;
  reportId: string;
  reportNo?: null | string;
  reportStatus?: null | string;
  reviewedAt?: null | string;
  reviewerName?: null | string;
  richTextContent?: null | string;
  signedAt?: null | string;
  signedByName?: null | string;
  submittedAt?: null | string;
  versionNo?: null | number;
}

export interface EventSummary {
  eventContent?: null | string;
  eventStatus?: null | string;
  eventTime?: null | string;
  eventType?: null | string;
  nodeCode?: null | string;
  operatorName?: null | string;
}

export interface RevisionRequestSummary {
  approvedVersionNo?: null | number;
  currentVersionNo?: null | number;
  rejectReason?: null | string;
  reportId?: null | string;
  requestId: string;
  requestedAt?: null | string;
  requestedByName?: null | string;
  requestReason?: null | string;
  requestStatus?: null | string;
  reviewedAt?: null | string;
  reviewedByName?: null | string;
}

export interface MedicalOrderSummary {
  acceptedAt?: null | string;
  applicationNo?: null | string;
  billingStatus?: null | string;
  cancelledAt?: null | string;
  caseId?: null | string;
  completedAt?: null | string;
  doctorName?: null | string;
  executorName?: null | string;
  executionScope?: null | string;
  orderContent?: null | string;
  orderDate?: null | string;
  orderId: string;
  orderNumber?: null | string;
  orderType?: null | string;
  pathologyNo?: null | string;
  patientName?: null | string;
  remarks?: null | string;
  status?: null | string;
}

export interface PendingMedicalOrderQuery {
  page: number;
  pathologyNo?: string;
  size: number;
  status?: string;
}

export interface PendingMedicalOrderItem extends MedicalOrderSummary {
  caseId: string;
  orderId: string;
}

export interface PendingMedicalOrderPage {
  items: PendingMedicalOrderItem[];
  page: number;
  size: number;
  total: number;
}

export interface MedicalOrderPagedResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface MedicalOrderItemView {
  categoryId: string;
  defaultContent?: null | string;
  enabled: boolean;
  executionScope?: null | string;
  id: string;
  orderItemCode?: null | string;
  orderItemName: string;
  orderType?: null | string;
  sortOrder: number;
}

export interface MedicalOrderCategoryNode {
  categoryCode?: null | string;
  categoryName: string;
  children: MedicalOrderCategoryNode[];
  enabled: boolean;
  id: string;
  items: MedicalOrderItemView[];
  parentId?: null | string;
  sortOrder: number;
}

export interface MedicalOrderPackageItemView {
  id: string;
  orderItemCode?: null | string;
  orderItemId: string;
  orderItemName: string;
  packageId: string;
  remarks?: null | string;
  sortOrder: number;
}

export interface MedicalOrderPackageView {
  enabled: boolean;
  id: string;
  items: MedicalOrderPackageItemView[];
  ownerUserId?: null | string;
  packageCode?: null | string;
  packageName: string;
  packageType?: null | string;
  remarks?: null | string;
}

export interface MedicalOrderPackagePageQuery {
  enabled?: boolean;
  keyword?: null | string;
  packageType?: null | string;
  page: number;
  size: number;
}

export interface ConsultationSummary {
  completedAt?: null | string;
  consultationId: string;
  consultationType?: null | string;
  hostName?: null | string;
  opinion?: null | string;
  participantCount?: null | number;
  requestedAt?: null | string;
  requestedByName?: null | string;
  status?: null | string;
}

export interface HistoricalPathologySummary {
  age?: null | string;
  diagnosis?: null | string;
  examinationNo?: null | string;
  inpatientNo?: null | string;
  reportTime?: null | string;
  submissionType?: null | string;
}

export interface PacsExaminationSummary {
  examinationNo?: null | string;
  imagingDescription?: null | string;
  imagingDiagnosis?: null | string;
  reportStatus?: null | string;
  reportTime?: null | string;
  submissionType?: null | string;
}

export interface ReportTraceSummary {
  diagnosisInfo?: null | string;
  reportDoctorName?: null | string;
  reportStatus?: null | string;
  reportTime?: null | string;
  sequenceNo: number;
}

export interface RemarkSectionSummary {
  content?: null | string;
  relatedNo?: null | string;
  sectionKey: string;
  title: string;
}

export interface ChargeItemSummary {
  chargedAt?: null | string;
  chargedByName?: null | string;
  itemName?: null | string;
}

export interface DiagnosticWorkbenchView {
  applicationFormArchiveLocation?: null | string;
  applicationFormArchiveStatus?: null | string;
  applicationFormImageUrl?: null | string;
  applicationNo?: null | string;
  applicationOrder?: null | string;
  applicationType?: null | string;
  bedNo?: null | string;
  blocks: BlockSummary[];
  caseId: string;
  caseStatus?: null | string;
  checkItem?: null | string;
  clinicalDiagnosis?: null | string;
  clinicalExaminationAndSurgeryFindings?: null | string;
  clinicalHistory?: null | string;
  clinicalSubmissionRequirements?: null | string;
  consultations: ConsultationSummary[];
  currentReport: CurrentReportSummary | null;
  deliveredAt?: null | string;
  detachedAt?: null | string;
  fixedAt?: null | string;
  diagnosticTasks: PendingDiagnosticTaskItem[];
  chargeItems: ChargeItemSummary[];
  hasPendingRevision: boolean;
  historicalPathologies: HistoricalPathologySummary[];
  infectiousAndPastHistorySummary?: null | string;
  infectiousSource?: null | string;
  inpatientNo?: null | string;
  medicalOrders: MedicalOrderSummary[];
  outpatientNo?: null | string;
  patientAge?: null | string;
  patientGender?: null | string;
  patientId?: null | string;
  pathologyNo?: null | string;
  phone?: null | string;
  patientName?: null | string;
  pacsExaminations: PacsExaminationSummary[];
  recentEvents: EventSummary[];
  remarkSections: RemarkSectionSummary[];
  reportTraces: ReportTraceSummary[];
  revisions: RevisionRequestSummary[];
  slides: SlideSummary[];
  specimens: SpecimenSummary[];
  submittingDepartmentName?: null | string;
  submittingDoctorName?: null | string;
}

export interface ReportVersionSummary {
  createdAt?: null | string;
  finalDiagnosisSnapshot?: null | string;
  signedAt?: null | string;
  versionId: string;
  versionNo?: null | number;
  versionStatus?: null | string;
}

export interface ReportTrackingView {
  applicationFormArchiveLocation?: null | string;
  applicationFormArchiveStatus?: null | string;
  applicationFormImageUrl?: null | string;
  applicationNo?: null | string;
  caseId: string;
  caseStatus?: null | string;
  consultations: ConsultationSummary[];
  currentDraftVersionNo?: null | number;
  currentReport: CurrentReportSummary | null;
  diagnosticTasks: PendingDiagnosticTaskItem[];
  events: EventSummary[];
  hasPendingRevision: boolean;
  latestEffectiveVersionNo?: null | number;
  medicalOrders: MedicalOrderSummary[];
  pathologyNo?: null | string;
  patientName?: null | string;
  revisions: RevisionRequestSummary[];
  versions: ReportVersionSummary[];
}

export interface PathologyReportDraft extends DiagnosticTaskActionRequest {
  caseId: string;
  clinicalDiagnosis?: string;
  finalDiagnosis?: string;
  grossExam?: string;
  microscopicExam?: string;
  richTextContent?: string;
  taskId: string;
}

export interface CreateMedicalOrderRequest {
  caseId: string;
  operatorName: string;
  operatorUserId?: string;
  orderContent: string;
  orderType: string;
  remarks?: string;
  terminalCode?: string;
}

export interface MedicalOrderActionRequest {
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface MedicalOrderOperationResult {
  caseId?: null | string;
  orderId: string;
  orderNumber?: null | string;
  status?: null | string;
}

export type SavePathologyReportDraftRequest = Omit<
  PathologyReportDraft,
  'caseId' | 'taskId'
>;

export interface RejectPathologyReportRequest {
  operatorName: string;
  operatorUserId?: string;
  rejectReason: string;
  terminalCode?: string;
}

export interface PathologyReportOperationResult {
  caseId?: null | string;
  reportId: string;
  reportNo?: null | string;
  reportStatus?: null | string;
  versionNo?: null | number;
  versionStatus?: null | string;
}

export interface CreateReportRevisionRequest extends DiagnosticTaskActionRequest {
  reportId: string;
  requestReason: string;
}

export interface ReviewReportRevisionRequest extends DiagnosticTaskActionRequest {
  rejectReason?: string;
}

export interface ReportRevisionOperationResult {
  approvedVersionNo?: null | number;
  caseId?: null | string;
  reportId?: null | string;
  requestId: string;
  requestStatus?: null | string;
}

export interface ConsultationParticipantInput {
  participantName: string;
  participantRole: string;
  participantUserId: string;
}

export interface CreateConsultationRequest extends DiagnosticTaskActionRequest {
  caseId: string;
  participants: ConsultationParticipantInput[];
}

export interface CommentConsultationParticipantRequest extends DiagnosticTaskActionRequest {
  opinion: string;
}

export interface CompleteConsultationRequest extends DiagnosticTaskActionRequest {
  opinion: string;
}

export interface ConsultationOperationResult {
  caseId?: null | string;
  consultationId: string;
  status?: null | string;
}
