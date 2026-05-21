export interface PendingTechnicalTaskQuery {
  applicationNo?: null | string;
  createdFrom?: null | string;
  createdTo?: null | string;
  objectType?: null | string;
  page: number;
  pathologyNo?: null | string;
  size: number;
  taskStatus?: null | string;
  taskType?: null | string;
  timedOutOnly?: boolean;
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
  payload: null | string;
  remarks: null | string;
  specimenId: null | string;
  startedAt: null | string;
  taskStatus: null | string;
  taskType: null | string;
  timedOut: boolean;
  timeoutRuleCode: null | string;
}

export interface PendingTechnicalTaskPage {
  items: PendingTechnicalTaskItem[];
  page: number;
  size: number;
  total: number;
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
  specimenId: string;
}

export interface TechnicalTrackingEmbeddingBoxSummary {
  embeddingBoxId: string;
  embeddingBoxNo: null | string;
  sliceNotice: null | string;
  slideCount: number;
  specimenId: string;
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
  events: TechnicalTrackingEventSummary[];
  pathologyNo: null | string;
  qcEvaluations: TechnicalTrackingQcEvaluationSummary[];
  reworks: TechnicalTrackingReworkSummary[];
  slides: TechnicalTrackingSlideSummary[];
  specimens: TechnicalTrackingSpecimenSummary[];
  technicalTasks: PendingTechnicalTaskItem[];
}

export interface TechnicalTaskStartRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  taskId: string;
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

export interface GrossingBlockItemRequest {
  blockDescription?: null | string;
  blockSite?: null | string;
  specialRequirement?: null | string;
}

export interface GrossingSpecimenItemRequest {
  blocks: GrossingBlockItemRequest[];
  bodyPartId?: null | string;
  grossDescription?: null | string;
  mediaAssets?: MediaAssetItem[];
  samplingTemplateId?: null | string;
  specimenId: string;
  specimenType: string;
}

export interface GrossingCompleteRequest {
  caseId: string;
  operatorName: string;
  operatorUserId?: null | string;
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
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  samplingBlockIds: string[];
  terminalCode?: null | string;
}

export interface BatchOperatorRequest {
  operatorName: string;
  operatorUserId?: null | string;
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
  operatorName: string;
  operatorUserId?: null | string;
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
  operatorName: string;
  operatorUserId?: null | string;
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

export interface SlideStainingCompleteRequest {
  operatorName: string;
  operatorUserId?: null | string;
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
  operatorName: string;
  operatorUserId?: null | string;
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
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface ReworkOrderResult {
  caseId: string;
  reworkType: null | string;
  status: null | string;
}
