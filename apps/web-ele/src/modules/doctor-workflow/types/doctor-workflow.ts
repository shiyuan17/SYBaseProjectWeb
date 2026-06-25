export interface DiagnosticTaskActionRequest {
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface PathologyReportActionRequest {
  remarks?: string;
  terminalCode?: string;
}

export interface AssignDiagnosticTaskRequest {
  diagnosisDoctorName?: string;
  diagnosisDoctorUserId?: string;
  primaryDoctorName?: string;
  primaryDoctorUserId?: string;
  remarks?: string;
  reviewerName?: string;
  reviewerUserId?: string;
  terminalCode?: string;
}

export interface PendingDiagnosticTaskQuery {
  dateFrom?: string;
  dateTo?: string;
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
  patientIdDisplay?: null | string;
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

export interface MedicalOrderBlockSummary {
  blockNo: string;
  medicalOrderBlockId: string;
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
  signedVersionDeliveryStatus?: null | string;
  signedVersionIssuedAt?: null | string;
  signedVersionPlannedIssueAt?: null | string;
  signedAt?: null | string;
  signedByName?: null | string;
  submittedAt?: null | string;
  versionNo?: null | number;
}

export interface FormalReportVersionSummary {
  deliveryStatus?: null | string;
  issuedAt?: null | string;
  plannedIssueAt?: null | string;
  printStatus?: null | string;
  printedAt?: null | string;
  publishedAt?: null | string;
  recalledAt?: null | string;
  reportId: string;
  reportNo?: null | string;
  reviewedAt?: null | string;
  signedAt?: null | string;
  signedByName?: null | string;
  submittedAt?: null | string;
  versionId: string;
  versionNo?: null | number;
  versionStatus?: null | string;
}

export interface CaseReportVersionSummary {
  deliveryStatus?: null | string;
  issuedAt?: null | string;
  plannedIssueAt?: null | string;
  printStatus?: null | string;
  printedAt?: null | string;
  publishedAt?: null | string;
  recalledAt?: null | string;
  reportId: string;
  reportNo?: null | string;
  reviewedAt?: null | string;
  signedAt?: null | string;
  signedByName?: null | string;
  submittedAt?: null | string;
  versionId: string;
  versionNo?: null | number;
  versionStatus?: null | string;
}

export interface DiagnosticReportPrintPreviewField {
  class?: string;
  label: string;
  value: string;
}

export interface DiagnosticReportPrintPreviewSection {
  images?: DiagnosticReportPrintPreviewSectionImage[];
  label: string;
  minHeight: number;
  value: string;
}

export interface DiagnosticReportPrintPreviewSectionImage {
  fileUrl: string;
  key: string;
  left: number;
  title: string;
  top: number;
}

export interface DiagnosticReportPrintPreview {
  accentColor: string;
  deliveredAt: string;
  footerFields: DiagnosticReportPrintPreviewField[];
  hospitalName: string;
  metaFields: DiagnosticReportPrintPreviewField[];
  note: string;
  reportNo: string;
  reportTitle: string;
  sections: DiagnosticReportPrintPreviewSection[];
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
  blockNo?: null | string;
  canConfirm?: boolean;
  canPrint?: boolean;
  canQc?: boolean;
  canRelease?: boolean;
  canTerminate?: boolean;
  cancelledAt?: null | string;
  caseId?: null | string;
  completedAt?: null | string;
  doctorName?: null | string;
  executorName?: null | string;
  executionScope?: null | string;
  orderContent?: null | string;
  orderDate?: null | string;
  orderCategoryCode?: null | string;
  orderCategoryId?: null | string;
  orderCategoryName?: null | string;
  orderId: string;
  orderItemCode?: null | string;
  orderItemId?: null | string;
  orderItemName?: null | string;
  orderNumber?: null | string;
  orderType?: null | string;
  pathologyNo?: null | string;
  inpatientNo?: null | string;
  patientId?: null | string;
  patientIdDisplay?: null | string;
  patientName?: null | string;
  submittingDepartmentName?: null | string;
  printedAt?: null | string;
  printedByName?: null | string;
  releasedAt?: null | string;
  releasedByName?: null | string;
  remarks?: null | string;
  status?: null | string;
  specimenNo?: null | string;
  slideNo?: null | string;
  slicingMergedPrintGroup?: boolean;
  slicingPrintGroupId?: null | string;
  slicingTaskId?: null | string;
  slicingTaskIds?: string[];
  targetBlockId?: null | string;
  targetSlideId?: null | string;
  targetSpecimenId?: null | string;
  targetType?: null | string;
  terminatedAt?: null | string;
  terminatedByName?: null | string;
  terminationReasonCode?: null | string;
  terminationReasonLabel?: null | string;
  terminationRemarks?: null | string;
}

export interface PendingMedicalOrderQuery {
  dateFrom?: string;
  dateTo?: string;
  orderCategoryCode?: string;
  page: number;
  pathologyNo?: string;
  size: number;
  status?: string;
  workDate?: string;
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
  participants?: ConsultationParticipantSummary[];
  requestedAt?: null | string;
  requestedByName?: null | string;
  status?: null | string;
}

export interface ConsultationParticipantSummary {
  commentedAt?: null | string;
  draftedByName?: null | string;
  opinion?: null | string;
  participantId: string;
  participantName?: null | string;
  participantRole?: null | string;
  participantUserId?: null | string;
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
  medicalOrderBlocks: MedicalOrderBlockSummary[];
  medicalOrders: MedicalOrderSummary[];
  outpatientNo?: null | string;
  patientAge?: null | string;
  patientGender?: null | string;
  patientId?: null | string;
  patientIdDisplay?: null | string;
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

export interface LifecycleKeyFact {
  label: string;
  value?: null | string;
}

export interface LifecycleNodeView {
  eventContent?: null | string;
  keyFacts: LifecycleKeyFact[];
  nodeCode?: null | string;
  occurredAt?: null | string;
  operatorDevice?: null | string;
  operatorIp?: null | string;
  operatorName?: null | string;
  stageCode?: null | string;
  status?: null | string;
  title?: null | string;
}

export interface LifecycleStageGroupView {
  nodes: LifecycleNodeView[];
  stageCode?: null | string;
  stageTitle?: null | string;
}

export interface CaseLifecycleSummaryView {
  applicationDate?: null | string;
  applicationNo?: null | string;
  applicationType?: null | string;
  caseId: string;
  caseStatus?: null | string;
  currentStage?: null | string;
  hasPendingRevision: boolean;
  pathologyNo?: null | string;
  patientAge?: null | string;
  patientGender?: null | string;
  patientName?: null | string;
  submittingDepartmentName?: null | string;
  submittingDoctorName?: null | string;
}

export interface CaseLifecycleApplicationFormView {
  applicantDoctorName?: null | string;
  applicationDate?: null | string;
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  imageUrl?: null | string;
  remarks?: null | string;
}

export interface LifecycleSlideView {
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  embeddingBoxId?: null | string;
  loanStatus?: null | string;
  printedAt?: null | string;
  qcEvaluatedAt?: null | string;
  qcEvaluatorName?: null | string;
  qcResult?: null | string;
  qualityStatus?: null | string;
  reworkReason?: null | string;
  reworkStatus?: null | string;
  slideEvents: LifecycleNodeView[];
  slideId: string;
  slideNo?: null | string;
  slideStatus?: null | string;
  slicedAt?: null | string;
  slicedByName?: null | string;
  specimenId?: null | string;
  stainedAt?: null | string;
  stainedByName?: null | string;
}

export interface LifecycleBlockView {
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  blockCode?: null | string;
  blockEvents: LifecycleNodeView[];
  blockId: string;
  description?: null | string;
  embeddedByName?: null | string;
  embeddingBoxNo?: null | string;
  embeddingEndedAt?: null | string;
  embeddingRemarks?: null | string;
  embeddingStartedAt?: null | string;
  evaluationLevel?: null | string;
  grossDescription?: null | string;
  loanStatus?: null | string;
  sampledAt?: null | string;
  sampledByName?: null | string;
  samplingEvaluation?: null | string;
  sliceNotice?: null | string;
  slides: LifecycleSlideView[];
  specimenId?: null | string;
  specimenName?: null | string;
}

export interface LifecycleSpecimenView {
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  barcode?: null | string;
  blocks: LifecycleBlockView[];
  checkedInAt?: null | string;
  confirmedAt?: null | string;
  contentDescribedByName?: null | string;
  createdAt?: null | string;
  fixedAt?: null | string;
  loanStatus?: null | string;
  receivedAt?: null | string;
  receiptStatus?: null | string;
  removalAt?: null | string;
  specimenEvents: LifecycleNodeView[];
  specimenId: string;
  specimenName?: null | string;
  specimenNo?: null | string;
  specimenStatus?: null | string;
}

export interface LifecycleReportView {
  consultations: ConsultationSummary[];
  currentReport: CurrentReportSummary | null;
  diagnosticTasks: PendingDiagnosticTaskItem[];
  medicalOrders: MedicalOrderSummary[];
  revisions: RevisionRequestSummary[];
  versions: ReportVersionSummary[];
}

export interface CaseLifecycleTrackingView {
  applicationForm: CaseLifecycleApplicationFormView | null;
  caseSummary: CaseLifecycleSummaryView;
  overallTimeline: LifecycleStageGroupView[];
  reportLifecycle: LifecycleReportView;
  specimens: LifecycleSpecimenView[];
}

export interface PathologyReportDraft extends PathologyReportActionRequest {
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
  blockNo?: string;
  orderContent: string;
  orderItemId?: string;
  orderType: string;
  remarks?: string;
  slideNo?: string;
  targetBlockId?: string;
  targetBlockNo?: string;
  targetSlideId?: string;
  targetSpecimenId?: string;
  targetType?: string;
  specimenNo?: string;
  terminalCode?: string;
}

export interface CreateMedicalOrderBlockRequest {
  blockNo: string;
}

export interface MedicalOrderBlockCreateResult {
  blockNo: string;
  medicalOrderBlockId: string;
}

export interface MedicalOrderActionRequest {
  remarks?: string;
  terminalCode?: string;
}

export interface MedicalOrderOperationResult {
  caseId?: null | string;
  orderId: string;
  orderNumber?: null | string;
  status?: null | string;
}

export interface MedicalOrderSlidePrintLabel {
  blockNo?: null | string;
  orderId: string;
  pathologyNo?: null | string;
  patientId?: null | string;
  patientIdDisplay?: null | string;
  patientName?: null | string;
  slideNo?: null | string;
  specimenNo?: null | string;
  checkItem?: null | string;
}

export interface MedicalOrderSlidePrintResult {
  orderId: string;
  printedAt?: null | string;
  printedByName?: null | string;
  labels: MedicalOrderSlidePrintLabel[];
}

export interface TerminateMedicalOrderRequest extends MedicalOrderActionRequest {
  terminationReasonCode: string;
  terminationReasonLabel: string;
}

export interface MedicalOrderQcEvaluationScoreDetail {
  checked?: boolean;
  deductionGroup: string;
  deductionSuggestion: string;
  deductionValue: number;
  itemName: string;
}

export interface CreateMedicalOrderQcEvaluationRequest {
  caseId: string;
  detailItems: MedicalOrderQcEvaluationScoreDetail[];
  evaluationReason?: string;
  grade: string;
  processingAction: string;
  qcAspect: 'GROSSING' | 'SLIDE';
  remarks?: string;
  reworkType?: null | string;
  totalScore: number;
  terminalCode?: string;
}

export interface MedicalOrderQcEvaluationSummary {
  evaluatedAt?: null | string;
  evaluationReason?: null | string;
  evaluatorName?: null | string;
  grade?: null | string;
  orderId: string;
  processingAction?: null | string;
  qcAspect?: null | string;
  qcEvaluationId: string;
  remarks?: null | string;
  reworkOrderId?: null | string;
  reworkType?: null | string;
  totalScore: number;
}

export interface MedicalOrderBillingRequest {
  caseId: string;
  orderIds?: string[];
  remarks?: string;
  terminalCode?: string;
}

export interface MedicalOrderBillingItemResult {
  billingRecordId?: null | string;
  billingStatus?: null | string;
  message?: null | string;
  orderId: string;
}

export interface MedicalOrderBillingResult {
  failureCount: number;
  items: MedicalOrderBillingItemResult[];
  successCount: number;
  totalCount: number;
}

export type SavePathologyReportDraftRequest = Omit<
  PathologyReportDraft,
  'caseId' | 'taskId'
>;

export interface RejectPathologyReportRequest {
  rejectReason: string;
  terminalCode?: string;
}

export interface OperatorRejectPathologyReportRequest {
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

export interface FormalReportVersionBatchActionRequest {
  issueMode?: 'DELAY_2_HOURS' | 'DELAY_3_HOURS' | 'IMMEDIATE';
  plannedIssueAt?: string;
  remarks?: string;
  terminalCode?: string;
  versionIds: string[];
}

export interface FormalReportVersionBatchActionItemResult {
  message?: null | string;
  success: boolean;
  versionId: string;
}

export interface FormalReportVersionBatchActionResult {
  failureCount: number;
  items: FormalReportVersionBatchActionItemResult[];
  successCount: number;
  totalCount: number;
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

export interface DiagnosisWorkbenchReportDraftValue {
  clinicalDiagnosis?: string;
  finalDiagnosis?: string;
  grossExam?: string;
  microscopicExam?: string;
  reportNo?: string;
  reportNoLabel?: string;
  richTextContent?: string;
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
