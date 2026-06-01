export interface PendingTechnicalTaskQuery {
  applicationNo?: null | string;
  createdFrom?: null | string;
  createdTo?: null | string;
  keyword?: null | string;
  objectType?: null | string;
  page: number;
  pathologyNo?: null | string;
  assignedToUserId?: null | string;
  currentNode?: null | string;
  priority?: null | string;
  size: number;
  taskStatus?: null | string;
  taskType?: null | string;
  timedOutOnly?: boolean;
}

export type TechnicalWorkflowMode = 'exception' | 'queue';

export type TechnicalTaskBoardViewMode = 'case' | 'task';

export type TechnicalWorkflowChainType = 'EXCEPTION' | 'FROZEN' | 'REGULAR';

export type TechnicalWorkflowObjectType =
  | 'CASE'
  | 'EMBEDDING_BOX'
  | 'SAMPLING_BLOCK'
  | 'SLIDE'
  | 'SPECIMEN';

export type TechnicalWorkflowTaskType =
  | 'DEHYDRATION'
  | 'EMBEDDING'
  | 'FROZEN'
  | 'GROSSING'
  | 'REWORK'
  | 'SLICING'
  | 'STAINING';

export interface TechnicalWorkflowDeepLinkQuery {
  caseId?: string;
  mode?: TechnicalWorkflowMode;
  objectId?: string;
  objectType?: string;
  pathologyNo?: string;
  tab?: 'abnormal' | 'timeline' | 'work-items';
  taskId?: string;
}

export interface TechnicalWorkflowRouteMeta {
  authorityCode: string;
  chain: TechnicalWorkflowChainType;
  icon?: string;
  isEntry?: boolean;
  isTracking?: boolean;
  isVisibleInMenu?: boolean;
  key: string;
  name: string;
  path: string;
  title: string;
}

export interface PendingTechnicalTaskItem {
  applicationId: string;
  applicationNo: string;
  caseId: string;
  completedAt: null | string;
  createdAt: null | string;
  deadlineAt: null | string;
  id: string;
  objectId: null | string;
  objectType: null | string;
  pathologyNo: null | string;
  sampledAt?: null | string;
  sampledByName?: null | string;
  payload: null | string;
  assignedToName?: null | string;
  assignedToUserId?: null | string;
  currentNode?: null | string;
  expectedCompletedAt?: null | string;
  remarks: null | string;
  productionRemarks?: null | string;
  receivedAt?: null | string;
  samplingBlockCode?: null | string;
  samplingBlockDescription?: null | string;
  stationCode?: null | string;
  stationName?: null | string;
  specimenId: null | string;
  startedAt: null | string;
  taskStatus: null | string;
  taskType: null | string;
  priority?: null | string;
  timedOut: boolean;
  timeoutRuleCode: null | string;
}

export interface TechnicalTaskSelectOption {
  label: string;
  value: string;
}

export interface TechnicalTaskPoolFilters {
  applicationNo: string;
  assignedToUserId: string;
  assignmentStatus: string;
  createdRange: string[];
  currentNode: string;
  page: number;
  pathologyNo: string;
  priority: string;
  size: number;
  taskStatus: string;
  taskType: string;
  timedOutOnly: boolean;
}

export interface TechnicalTaskCaseGroup {
  caseId: string;
  items: PendingTechnicalTaskItem[];
  pathologyNo: string;
  taskCount: number;
  timedOutCount: number;
}

export interface TechnicalTaskStatCard {
  label: string;
  value: number;
}

export interface TechnicalTaskAssignmentForm {
  assignedToName: string;
  assignedToUserId: string;
  expectedCompletedAt: string;
  operatorName: string;
  operatorUserId: string;
  priority: string;
  productionRemarks: string;
  stationCode: string;
  stationName: string;
  terminalCode: string;
}

export interface TechnicalOperatorFormValue {
  operatorName: string;
  operatorUserId: string;
  remarks: string;
  terminalCode: string;
}

export interface PendingTechnicalTaskPage {
  items: PendingTechnicalTaskItem[];
  page: number;
  size: number;
  total: number;
}

export interface PendingTechnicalSpecimenRegistrationQuery {
  keyword?: null | string;
  page: number;
  receivedFrom?: null | string;
  receivedTo?: null | string;
  size: number;
}

export interface PendingTechnicalSpecimenRegistrationItem {
  applicationId: string;
  applicationNo: string;
  applicationType: null | string;
  caseId: string;
  checkItem: null | string;
  inpatientNo: null | string;
  pathologyNo: null | string;
  patientId: null | string;
  patientName: null | string;
  receivedAt: null | string;
  registeredAt: null | string;
  registeredByName: null | string;
  registrationStatus: null | string;
  submittingDepartmentName: null | string;
}

export interface PendingTechnicalSpecimenRegistrationPage {
  items: PendingTechnicalSpecimenRegistrationItem[];
  page: number;
  size: number;
  total: number;
}

export interface TechnicalSpecimenRegistrationMaterial {
  specimenId: null | string;
  sequenceNo: number;
  sourcePart: null | string;
  specimenName: null | string;
  specimenType: null | string;
}

export interface TechnicalSpecimenRegistrationCheckItem {
  name: null | string;
  sequenceNo: number;
}

export interface TechnicalSpecimenRegistrationDetail {
  applicationId: string;
  applicationNo: string;
  applicationType: null | string;
  caseId: string;
  checkItems: TechnicalSpecimenRegistrationCheckItem[];
  clinicalDiagnosis: null | string;
  inpatientNo: null | string;
  materials: TechnicalSpecimenRegistrationMaterial[];
  pathologyNo: null | string;
  patientId: null | string;
  patientName: null | string;
  receivedAt: null | string;
  registeredAt: null | string;
  registeredByName: null | string;
  registrationRemarks: null | string;
  registrationStatus: null | string;
  submittingDepartmentName: null | string;
}

export interface TechnicalSpecimenRegistrationBasicInfo {
  applicationNo: null | string;
  applicationType: null | string;
  fixationTime: null | string;
  inpatientNo: null | string;
  pathologyNo: null | string;
  patientAge: null | string;
  patientGender: null | string;
  patientId: null | string;
  patientName: null | string;
  registrationStatus: null | string;
  specimenRemovalTime: null | string;
  submissionDate: null | string;
  submittingDepartmentName: null | string;
  submittingDoctorName: null | string;
}

export interface TechnicalSpecimenRegistrationDetailSections {
  clinicalExaminationAndSurgeryFindings: null | string;
  clinicalSubmissionRequirements: null | string;
  externalPathologyDiagnosis: null | string;
  historySummary: null | string;
  infectiousAndPastHistorySummary: null | string;
  labAndImagingExaminations: null | string;
}

export interface TechnicalSpecimenRegistrationMediaAsset {
  assetId: string;
  capturedAt: null | string;
  fileName: null | string;
  fileUrl: string;
}

export interface TechnicalSpecimenRegistrationActionFlags {
  canCompleteRegistration: boolean;
  canDeleteMediaAssets: boolean;
  canSaveMaterials: boolean;
  canUploadMediaAssets: boolean;
}

export interface TechnicalSpecimenRegistrationWorkspace {
  actionFlags: TechnicalSpecimenRegistrationActionFlags;
  basicInfo: TechnicalSpecimenRegistrationBasicInfo;
  checkItems: TechnicalSpecimenRegistrationCheckItem[];
  detailSections: TechnicalSpecimenRegistrationDetailSections;
  materials: TechnicalSpecimenRegistrationMaterial[];
  mediaAssets: TechnicalSpecimenRegistrationMediaAsset[];
  pendingSummary: PendingTechnicalSpecimenRegistrationItem;
}

export interface SaveTechnicalSpecimenRegistrationMaterialItem {
  sourcePart?: null | string;
  specimenId?: null | string;
  specimenName?: null | string;
  specimenType?: null | string;
}

export interface SaveTechnicalSpecimenRegistrationMaterialsRequest {
  materials: SaveTechnicalSpecimenRegistrationMaterialItem[];
  terminalCode?: null | string;
}

export interface DeleteTechnicalSpecimenRegistrationMediaAssetResult {
  assetId: string;
  deleted: boolean;
}

export interface CompleteTechnicalSpecimenRegistrationRequest {
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface CompleteTechnicalSpecimenRegistrationResult {
  caseId: string;
  grossingTaskCreated: boolean;
  pathologyNo: null | string;
  registrationStatus: null | string;
}

export interface TechnicalTrackingSpecimenSummary {
  barcode: null | string;
  specimenId: string;
  specimenName: null | string;
  specimenNo: null | string;
  specimenStatus: null | string;
}

export interface TechnicalTrackingBlockSummary {
  blockCode: null | string;
  blockId: string;
  description: null | string;
  embeddingBoxNo: null | string;
  grossDescription?: null | string;
  specimenName?: null | string;
  specimenId: string;
}

export interface TechnicalTrackingEmbeddingBoxSummary {
  embeddingBoxId: string;
  embeddingBoxNo: null | string;
  sliceNotice: null | string;
  slideCount: number;
  specimenId: string;
}

export interface TechnicalTrackingEmbeddingRecordSummary {
  embeddingBoxId: string;
  embeddingBoxNo: null | string;
  embeddingId: string;
  embeddingRemarks: null | string;
  embeddedByName: null | string;
  endedAt: null | string;
  evaluationLevel: null | string;
  grossDescription: null | string;
  pathologyNo: null | string;
  sampledAt: null | string;
  sampledByName: null | string;
  samplingBlockCode: null | string;
  samplingBlockDescription: null | string;
  samplingBlockId: string;
  samplingEvaluation: null | string;
  sliceNotice: null | string;
  specimenId: string;
  specimenName: null | string;
  startedAt: null | string;
  taskId: string;
  taskStatus: null | string;
  caseId: string;
}

export interface TechnicalTrackingEmbeddingEvaluationRecordSummary {
  caseId: string;
  embeddingBoxNo: null | string;
  embeddingId: string;
  embeddingRemarks: null | string;
  embeddedByName: null | string;
  endedAt: null | string;
  evaluationLevel: null | string;
  pathologyNo: null | string;
  samplingBlockCode: null | string;
  samplingBlockId: string;
  samplingEvaluation: null | string;
  specimenId: string;
  specimenName: null | string;
}

export interface TechnicalTrackingSlideSummary {
  embeddingBoxId: string;
  qualityStatus: null | string;
  slideId: string;
  slideNo: null | string;
  slideStatus: null | string;
  specimenId: string;
}

export interface TechnicalTrackingQcEvaluationSummary {
  evaluatedAt: null | string;
  evaluationResult: null | string;
  evaluatorName: null | string;
  improvementSuggestion: null | string;
  issueDescription: null | string;
  qcEvaluationId: string;
  qcType: null | string;
  remarks: null | string;
  slideId: string;
  slideNo: null | string;
  specimenId: string;
}

export interface TechnicalTrackingReworkSummary {
  reason: null | string;
  reworkOrderId: string;
  reworkType: null | string;
  status: null | string;
}

export interface TechnicalTrackingEventSummary {
  eventContent: null | string;
  eventStatus: null | string;
  eventTime: null | string;
  eventType: null | string;
  nodeCode: null | string;
  operatorName: null | string;
}

export interface TechnicalTrackingView {
  blocks: TechnicalTrackingBlockSummary[];
  caseId: string;
  caseStatus: null | string;
  embeddingBoxes: TechnicalTrackingEmbeddingBoxSummary[];
  embeddingEvaluationRecords?: TechnicalTrackingEmbeddingEvaluationRecordSummary[];
  embeddingRecords?: TechnicalTrackingEmbeddingRecordSummary[];
  events: TechnicalTrackingEventSummary[];
  pathologyNo: null | string;
  qcEvaluations: TechnicalTrackingQcEvaluationSummary[];
  reworks: TechnicalTrackingReworkSummary[];
  slides: TechnicalTrackingSlideSummary[];
  specimens: TechnicalTrackingSpecimenSummary[];
  technicalTasks: PendingTechnicalTaskItem[];
}

export interface GrossingWorkbenchTaskSummary {
  objectId: null | string;
  objectType: null | string;
  taskId: string;
  taskStatus: null | string;
}

export interface GrossingWorkbenchCaseSummary {
  applicationId: string;
  applicationNo: string;
  applicationType: null | string;
  caseId: string;
  caseStatus: null | string;
  inpatientNo: null | string;
  pathologyNo: null | string;
  patientId: null | string;
  patientName: null | string;
  submittingDepartmentName: null | string;
}

export interface GrossingWorkbenchMediaAsset {
  assetId: string;
  capturedAt: null | string;
  capturedByName: null | string;
  fileName: null | string;
  fileUrl: string;
  specimenId: null | string;
}

export interface GrossingWorkbenchContext {
  caseSummary: GrossingWorkbenchCaseSummary;
  checkItems: TechnicalSpecimenRegistrationCheckItem[];
  clinicalDiagnosis: null | string;
  clinicalHistory: null | string;
  contextSummary: null | string;
  mediaAssets: GrossingWorkbenchMediaAsset[];
  relatedExaminations: null | string;
  task: GrossingWorkbenchTaskSummary;
  tracking: TechnicalTrackingView;
}

export interface TechnicalTaskStartRequest {
  remarks?: null | string;
  taskId: string;
  terminalCode?: null | string;
}

export interface TechnicalTaskAssignRequest {
  assignedToName?: null | string;
  assignedToUserId?: null | string;
  expectedCompletedAt?: null | string;
  priority?: null | string;
  productionRemarks?: null | string;
  stationCode?: null | string;
  stationName?: null | string;
  terminalCode?: null | string;
}

export interface TechnicalTaskClaimRequest {
  assignedToName: string;
  assignedToUserId: string;
  remarks?: null | string;
  stationCode?: null | string;
  stationName?: null | string;
  terminalCode?: null | string;
}

export interface TechnicalTaskReleaseRequest {
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface TechnicalTaskPriorityRequest {
  priority: string;
  productionRemarks?: null | string;
  terminalCode?: null | string;
}

export interface TaskOperationResult {
  caseId: string;
  caseStatus: null | string;
  taskId: string;
  taskStatus: null | string;
}

export interface MediaAssetItem {
  fileName?: null | string;
  fileUrl: string;
}

export interface GrossingMediaAssetUploadResponse {
  contentType: string;
  fileName: string;
  fileUrl: string;
  size: number;
}

export interface GrossingBlockItemRequest {
  blockDescription?: null | string;
  blockSite?: null | string;
  specialRequirement?: null | string;
}

export interface GrossingSpecimenItemRequest {
  blocks: GrossingBlockItemRequest[];
  blockCount?: null | number;
  bodyPartId?: null | string;
  cutSurfaceFeature?: null | string;
  grossDescription?: null | string;
  marginMarking?: null | string;
  mediaAssets?: MediaAssetItem[];
  samplingTemplateId?: null | string;
  sizeText?: null | string;
  specimenId: string;
  specimenType: string;
}

export interface GrossingCompleteRequest {
  caseId: string;
  remarks?: null | string;
  specimens: GrossingSpecimenItemRequest[];
  taskId: string;
  terminalCode?: null | string;
}

export interface GrossingResult {
  caseId: string;
  caseStatus: null | string;
  createdDehydrationTaskCount: number;
  taskId: string;
}

export interface CreateDehydrationBatchRequest {
  basketNo: string;
  caseId: string;
  deviceNo?: null | string;
  remarks?: null | string;
  samplingBlockIds: string[];
  terminalCode?: null | string;
}

export interface BatchOperatorRequest {
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface CompleteDehydrationBatchRequest extends BatchOperatorRequest {
  mediaAssets?: MediaAssetItem[];
}

export interface DehydrationBatchResult {
  batchId: string;
  batchNo: string;
  batchStatus: null | string;
  taskCount: number;
}

export interface EmbeddingCompleteRequest {
  blockCount: number;
  deviceCode?: null | string;
  embeddingBoxNo?: null | string;
  evaluationLevel?: null | string;
  remarks?: null | string;
  samplingBlockId: string;
  samplingEvaluation?: null | string;
  sliceNotice?: null | string;
  taskId: string;
  terminalCode?: null | string;
}

export interface EmbeddingResult {
  caseStatus: null | string;
  embeddingBoxId: string;
  embeddingId: string;
  markingMessage: null | string;
  markingSuccess: boolean;
  taskId: string;
}

export interface SlicingCompleteRequest {
  deviceCode?: null | string;
  embeddingBoxId: string;
  qualityIssue?: null | string;
  remarks?: null | string;
  slideCount: number;
  sliceCountPerSlide?: null | number;
  sliceThickness?: null | string;
  taskId: string;
  terminalCode?: null | string;
}

export interface SlicingResult {
  caseStatus: null | string;
  slideIds: string[];
  slicingId: string;
  taskId: string;
}

export interface SlicingWorkbenchQuery {
  completedPage: number;
  completedSize: number;
  keyword?: null | string;
  overdueOnly?: boolean;
  pendingPage: number;
  pendingSize: number;
  pendingTodayOnly?: boolean;
}

export interface SlicingWorkbenchStats {
  completedDeptTodayCount: number;
  completedMineTodayCount: number;
  overdueCount: number;
  pendingPrintCount: number;
  pendingTodayCount: number;
  pendingTomorrowCount: number;
}

export interface SlicingWorkbenchRow {
  caseId: string;
  completedAt?: null | string;
  embeddingBoxId: string;
  embeddingClearRemark?: null | string;
  embeddingEvaluation?: null | string;
  embeddingOperatorName?: null | string;
  grossingEvaluation?: null | string;
  pathologyNo?: null | string;
  patientId?: null | string;
  patientName?: null | string;
  selectable: boolean;
  shiftRemark?: null | string;
  slideId?: null | string;
  slideNo?: null | string;
  sliceNotice?: null | string;
  slicingOperatorName?: null | string;
  slicingRemark?: null | string;
  specimenId?: null | string;
  specimenName?: null | string;
  taskId: string;
  taskStatus?: null | string;
  timedOut: boolean;
}

export interface SlicingWorkbenchView {
  completedPage: number;
  completedSize: number;
  completedTodayList: SlicingWorkbenchRow[];
  completedTotal: number;
  pendingList: SlicingWorkbenchRow[];
  pendingPage: number;
  pendingSize: number;
  pendingTotal: number;
  stats: SlicingWorkbenchStats;
}

export interface CreateSlideQcEvaluationRequest {
  caseId: string;
  evaluationResult: string;
  improvementSuggestion?: null | string;
  issueDescription?: null | string;
  qcType: string;
  remarks?: null | string;
  slideId: string;
  specimenId: string;
  terminalCode?: null | string;
}

export interface SlideQcEvaluationResult {
  evaluationResult: null | string;
  qcEvaluationId: string;
  qualityStatus: null | string;
  slideId: string;
}

export interface SlideStainingCompleteRequest {
  qualityIssue?: null | string;
  remarks?: null | string;
  slideId: string;
  stainingType: string;
  taskId: string;
  terminalCode?: null | string;
}

export interface SlideStainingResult {
  caseStatus: null | string;
  slideId: string;
  taskId: string;
}

export interface CreateReworkOrderRequest {
  caseId: string;
  embeddingBoxId?: null | string;
  qcType?: null | string;
  reason: string;
  remarks?: null | string;
  reworkType: string;
  samplingBlockId?: null | string;
  slideId?: null | string;
  specimenId?: null | string;
  terminalCode?: null | string;
}

export interface ExecuteReworkOrderRequest {
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface ReworkOrderResult {
  caseId: string;
  reworkType: null | string;
  status: null | string;
}

export interface TechnicalWorkflowAlertAction {
  label: string;
  query?: TechnicalWorkflowDeepLinkQuery;
  target:
    | {
        routeType: 'REWORK';
      }
    | {
        routeType: 'TASK_TYPE';
        taskType: TechnicalWorkflowTaskType;
      }
    | {
        routeType: 'TRACKING';
      };
}

export interface TechnicalWorkflowAlert {
  action?: TechnicalWorkflowAlertAction;
  description: string;
  id: string;
  severity: 'danger' | 'info' | 'success' | 'warning';
  title: string;
}

export interface ObjectProgressNode {
  children?: ObjectProgressNode[];
  id: string;
  label: string;
  parentId?: string;
  secondaryLabel?: null | string;
  status?: null | string;
  type: TechnicalWorkflowObjectType;
}

export interface WorkstationCaseContext {
  activeTaskCount: number;
  alerts: TechnicalWorkflowAlert[];
  blockCount: number;
  caseId: string;
  caseStatus: null | string;
  currentTaskSuggestions: string[];
  embeddingBoxCount: number;
  nextFlowLabel: string;
  pathologyNo: null | string;
  pendingReworkCount: number;
  progressNodes: ObjectProgressNode[];
  recentEvents: TechnicalTrackingEventSummary[];
  slideCount: number;
  specimenCount: number;
}

export interface EmbeddingWorkstationSummary {
  completedCount: number;
  completedRecords: TechnicalTrackingEmbeddingRecordSummary[];
  pendingCount: number;
  pendingTasks: PendingTechnicalTaskItem[];
  workDate: null | string;
}

export interface WorkstationQueueItem {
  alertLevel: 'danger' | 'info' | 'success' | 'warning';
  badges: string[];
  searchText: string;
  task: PendingTechnicalTaskItem;
}

export interface WorkstationSummaryBucket {
  chain: TechnicalWorkflowChainType;
  inProgress: number;
  path: string;
  pending: number;
  taskType: TechnicalWorkflowTaskType;
  timedOut: number;
  title: string;
}
