import type {
  BatchOperatorRequest,
  CompleteDehydrationBatchRequest,
  CreateDehydrationBatchRequest,
  CreateReworkOrderRequest,
  DehydrationBatchResult,
  EmbeddingCompleteRequest,
  EmbeddingResult,
  ExecuteReworkOrderRequest,
  GrossingCompleteRequest,
  GrossingMediaAssetUploadResponse,
  GrossingResult,
  PendingTechnicalTaskPage,
  PendingTechnicalTaskQuery,
  ReworkOrderResult,
  SlicingCompleteRequest,
  SlicingResult,
  SlideStainingCompleteRequest,
  SlideStainingResult,
  TaskOperationResult,
  TechnicalTaskAssignRequest,
  TechnicalTaskClaimRequest,
  TechnicalTaskPriorityRequest,
  TechnicalTaskReleaseRequest,
  TechnicalTaskStartRequest,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import { requestClient } from '#/api/request';

type PendingTechnicalTaskPageResponse = Partial<PendingTechnicalTaskPage>;
type TechnicalTrackingResponse = Partial<TechnicalTrackingView>;

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
    events: response.events ?? [],
    pathologyNo: response.pathologyNo ?? null,
    qcEvaluations: response.qcEvaluations ?? [],
    reworks: response.reworks ?? [],
    slides: response.slides ?? [],
    specimens: response.specimens ?? [],
    technicalTasks: response.technicalTasks ?? [],
  };
}

export async function listPendingTechnicalTasks(params: PendingTechnicalTaskQuery) {
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

export async function completeGrossing(data: GrossingCompleteRequest) {
  return requestClient.post<GrossingResult>('/v1/grossings/complete', data);
}

export async function uploadGrossingMediaAsset(file: File) {
  return requestClient.upload<GrossingMediaAssetUploadResponse>(
    '/v1/grossing-media-assets',
    { file },
  );
}

export async function createDehydrationBatch(data: CreateDehydrationBatchRequest) {
  return requestClient.post<DehydrationBatchResult>('/v1/dehydration-batches', data);
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

export async function startSlideStaining(data: TechnicalTaskStartRequest) {
  return requestClient.post<TaskOperationResult>('/v1/slide-stainings/start', data);
}

export async function completeSlideStaining(data: SlideStainingCompleteRequest) {
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
