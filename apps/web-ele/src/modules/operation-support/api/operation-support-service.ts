import type {
  ArchiveActionResult,
  ArchiveApplicationFormRequest,
  ArchiveCabinetNodeView,
  ArchiveCabinetView,
  ArchiveEmbeddingBoxRequest,
  ArchiveObjectPage,
  ArchiveObjectQuery,
  ArchivePositionView,
  ArchiveRecordView,
  ArchiveSlideRequest,
  ArchiveSpecimenRequest,
  BatchArchiveObjectRequest,
  BatchArchiveSpecimenRequest,
  BatchCreateArchiveCabinetRequest,
  CreateArchiveCabinetNodeRequest,
  CreateArchiveCabinetRequest,
  CreateEquipmentMaintenanceLogRequest,
  CreateEquipmentRecordRequest,
  CreateMaterialLoanAbnormalRecordRequest,
  CreateMaterialLoanRequest,
  CreateReagentRequest,
  CreateReagentStockRequest,
  EquipmentMaintenanceLogView,
  EquipmentRecordView,
  EquipmentWarningView,
  MaterialLoanAbnormalRecordView,
  MaterialLoanQuery,
  MaterialLoanView,
  ReagentStockActionRequest,
  ReagentStockEventView,
  ReagentStockImportResult,
  ReagentStockView,
  ReagentView,
  ReagentWarningView,
  ReturnMaterialLoanRequest,
  SearchArchiveRecordsQuery,
  UpdateArchiveCabinetNodeRequest,
  UpdateArchiveCabinetRequest,
  UpdateEquipmentRecordRequest,
  UpdateReagentRequest,
  UpdateReagentStockRequest,
} from '../types/operation-support';

import { requestClient } from '#/api/request';

function requestPatch<T>(url: string, data?: unknown) {
  return requestClient.request<T>(url, {
    data,
    method: 'PATCH',
  });
}

export function normalizeArrayResult<T>(value: null | T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeArchiveObjectPage(
  value: ArchiveObjectPage | null | Partial<ArchiveObjectPage> | undefined,
  fallback: Required<Pick<ArchiveObjectQuery, 'objectType' | 'page' | 'size'>>,
): ArchiveObjectPage {
  return {
    items: normalizeArrayResult(value?.items),
    page: typeof value?.page === 'number' ? value.page : fallback.page,
    size: typeof value?.size === 'number' ? value.size : fallback.size,
    total: typeof value?.total === 'number' ? value.total : 0,
  };
}

export async function listArchiveCabinets() {
  return normalizeArrayResult(
    await requestClient.get<ArchiveCabinetView[] | null>(
      '/v1/archive-cabinets',
    ),
  );
}

export async function listArchiveCabinetNodes() {
  return normalizeArrayResult(
    await requestClient.get<ArchiveCabinetNodeView[] | null>(
      '/v1/archive-cabinet-nodes',
    ),
  );
}

export async function createArchiveCabinet(data: CreateArchiveCabinetRequest) {
  return requestClient.post<ArchiveCabinetView>('/v1/archive-cabinets', data);
}

export async function createArchiveCabinetNode(
  data: CreateArchiveCabinetNodeRequest,
) {
  return requestClient.post<ArchiveCabinetNodeView>(
    '/v1/archive-cabinet-nodes',
    data,
  );
}

export async function batchCreateArchiveCabinets(
  data: BatchCreateArchiveCabinetRequest,
) {
  return normalizeArrayResult(
    await requestClient.post<ArchiveCabinetView[] | null>(
      '/v1/archive-cabinets/batch',
      data,
    ),
  );
}

export async function updateArchiveCabinet(
  cabinetId: string,
  data: UpdateArchiveCabinetRequest,
) {
  return requestPatch<ArchiveCabinetView>(
    `/v1/archive-cabinets/${cabinetId}`,
    data,
  );
}

export async function updateArchiveCabinetNode(
  nodeId: string,
  data: UpdateArchiveCabinetNodeRequest,
) {
  return requestPatch<ArchiveCabinetNodeView>(
    `/v1/archive-cabinet-nodes/${nodeId}`,
    data,
  );
}

export async function deleteArchiveCabinet(cabinetId: string) {
  return requestClient.request<unknown>(`/v1/archive-cabinets/${cabinetId}`, {
    method: 'DELETE',
  });
}

export async function listAvailableArchivePositions(params: {
  cabinetId?: string;
  cabinetType?: string;
}) {
  return normalizeArrayResult(
    await requestClient.get<ArchivePositionView[] | null>(
      '/v1/archive-positions/available',
      { params },
    ),
  );
}

export async function archiveApplicationForm(
  data: ArchiveApplicationFormRequest,
) {
  return requestClient.post<ArchiveActionResult>(
    '/v1/archive/application-forms',
    data,
  );
}

export async function archiveEmbeddingBox(data: ArchiveEmbeddingBoxRequest) {
  return requestClient.post<ArchiveActionResult>(
    '/v1/archive/embedding-boxes',
    data,
  );
}

export async function archiveSlide(data: ArchiveSlideRequest) {
  return requestClient.post<ArchiveActionResult>('/v1/archive/slides', data);
}

export async function archiveSpecimen(data: ArchiveSpecimenRequest) {
  return requestClient.post<ArchiveActionResult>('/v1/archive/specimens', data);
}

export async function batchArchiveEmbeddingBoxes(
  data: BatchArchiveObjectRequest,
) {
  return normalizeArrayResult(
    await requestClient.post<ArchiveActionResult[] | null>(
      '/v1/archive/embedding-boxes/batch',
      data,
    ),
  );
}

export async function batchArchiveSlides(data: BatchArchiveObjectRequest) {
  return normalizeArrayResult(
    await requestClient.post<ArchiveActionResult[] | null>(
      '/v1/archive/slides/batch',
      data,
    ),
  );
}

export async function batchArchiveSpecimens(data: BatchArchiveSpecimenRequest) {
  return normalizeArrayResult(
    await requestClient.post<ArchiveActionResult[] | null>(
      '/v1/archive/specimens/batch',
      data,
    ),
  );
}

export async function searchArchiveRecords(params: SearchArchiveRecordsQuery) {
  return normalizeArrayResult(
    await requestClient.get<ArchiveRecordView[] | null>(
      '/v1/archive-records/search',
      { params },
    ),
  );
}

export async function listArchiveObjects(params: ArchiveObjectQuery) {
  const normalizedParams = {
    ...params,
    page: params.page ?? 1,
    size: params.size ?? 20,
  };

  const page = await requestClient.get<ArchiveObjectPage | null>(
    '/v1/archive-objects',
    { params: normalizedParams },
  );

  return normalizeArchiveObjectPage(page, normalizedParams);
}

export async function listMaterialLoans(params: MaterialLoanQuery) {
  return normalizeArrayResult(
    await requestClient.get<MaterialLoanView[] | null>('/v1/material-loans', {
      params,
    }),
  );
}

export async function listPendingMaterialLoans(params: MaterialLoanQuery) {
  return normalizeArrayResult(
    await requestClient.get<MaterialLoanView[] | null>(
      '/v1/material-loans/pending',
      {
        params,
      },
    ),
  );
}

export async function createMaterialLoan(data: CreateMaterialLoanRequest) {
  return requestClient.post<MaterialLoanView>('/v1/material-loans', data);
}

export async function createMaterialLoanAbnormalRecord(
  data: CreateMaterialLoanAbnormalRecordRequest,
) {
  return requestClient.post<MaterialLoanAbnormalRecordView>(
    '/v1/material-loans/abnormal-records',
    data,
  );
}

export async function returnMaterialLoan(
  loanId: string,
  data: ReturnMaterialLoanRequest,
) {
  return requestClient.post<MaterialLoanView>(
    `/v1/material-loans/${loanId}/return`,
    data,
  );
}

export async function listReagents(params: {
  enabled?: boolean;
  keyword?: string;
  reagentType?: string;
  templateStatus?: string;
}) {
  return normalizeArrayResult(
    await requestClient.get<null | ReagentView[]>('/v1/reagents', { params }),
  );
}

export async function createReagent(data: CreateReagentRequest) {
  return requestClient.post<ReagentView>('/v1/reagents', data);
}

export async function updateReagent(
  reagentId: string,
  data: UpdateReagentRequest,
) {
  return requestPatch<ReagentView>(`/v1/reagents/${reagentId}`, data);
}

export async function listReagentStocks(params: {
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
  reagentType?: string;
  stockStatus?: string;
}) {
  return normalizeArrayResult(
    await requestClient.get<null | ReagentStockView[]>('/v1/reagent-stocks', {
      params,
    }),
  );
}

export async function createReagentStock(data: CreateReagentStockRequest) {
  return requestClient.post<ReagentStockView>('/v1/reagent-stocks', data);
}

export async function updateReagentStock(
  stockId: string,
  data: UpdateReagentStockRequest,
) {
  return requestPatch<ReagentStockView>(`/v1/reagent-stocks/${stockId}`, data);
}

export async function testReagentStock(
  stockId: string,
  data: ReagentStockActionRequest,
) {
  return requestClient.post<ReagentStockView>(
    `/v1/reagent-stocks/${stockId}/test`,
    data,
  );
}

export async function consumeReagentStock(
  stockId: string,
  data: ReagentStockActionRequest,
) {
  return requestClient.post<ReagentStockView>(
    `/v1/reagent-stocks/${stockId}/consume`,
    data,
  );
}

export async function startUsingReagentStock(
  stockId: string,
  data: ReagentStockActionRequest,
) {
  return requestClient.post<ReagentStockView>(
    `/v1/reagent-stocks/${stockId}/start-use`,
    data,
  );
}

export async function finishUsingReagentStock(
  stockId: string,
  data: ReagentStockActionRequest,
) {
  return requestClient.post<ReagentStockView>(
    `/v1/reagent-stocks/${stockId}/finish-use`,
    data,
  );
}

export async function listReagentStockEvents(stockId: string) {
  return normalizeArrayResult(
    await requestClient.get<null | ReagentStockEventView[]>(
      `/v1/reagent-stocks/${stockId}/events`,
    ),
  );
}

export async function exportReagentStocks(params: Record<string, unknown>) {
  return requestClient.download('/v1/reagent-stocks/export', {
    params,
    responseReturn: 'body',
  });
}

export async function importReagentStocks(file: File) {
  return requestClient.upload<ReagentStockImportResult>(
    '/v1/reagent-stocks/import',
    { file },
  );
}

export async function listReagentWarnings() {
  return normalizeArrayResult(
    await requestClient.get<null | ReagentWarningView[]>(
      '/v1/reagent-stocks/warnings',
    ),
  );
}

export async function listEquipmentRecords(params: {
  equipmentStatus?: string;
  keyword?: string;
}) {
  return normalizeArrayResult(
    await requestClient.get<EquipmentRecordView[] | null>(
      '/v1/equipment-records',
      { params },
    ),
  );
}

export async function createEquipmentRecord(
  data: CreateEquipmentRecordRequest,
) {
  return requestClient.post<EquipmentRecordView>('/v1/equipment-records', data);
}

export async function updateEquipmentRecord(
  equipmentId: string,
  data: UpdateEquipmentRecordRequest,
) {
  return requestPatch<EquipmentRecordView>(
    `/v1/equipment-records/${equipmentId}`,
    data,
  );
}

export async function listEquipmentMaintenanceLogs(equipmentId: string) {
  return normalizeArrayResult(
    await requestClient.get<EquipmentMaintenanceLogView[] | null>(
      `/v1/equipment-records/${equipmentId}/maintenance-logs`,
    ),
  );
}

export async function createEquipmentMaintenanceLog(
  equipmentId: string,
  data: CreateEquipmentMaintenanceLogRequest,
) {
  return requestClient.post<EquipmentMaintenanceLogView>(
    `/v1/equipment-records/${equipmentId}/maintenance-logs`,
    data,
  );
}

export async function listEquipmentWarnings() {
  return normalizeArrayResult(
    await requestClient.get<EquipmentWarningView[] | null>(
      '/v1/equipment-records/warnings',
    ),
  );
}
