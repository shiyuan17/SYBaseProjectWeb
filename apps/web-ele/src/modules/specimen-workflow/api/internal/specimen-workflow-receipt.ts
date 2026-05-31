import type {
  DirectSpecimenReceiptRequest,
  PendingSpecimenPage,
  PendingSpecimenQuery,
  SpecimenReceiptRequest,
  SpecimenReceiptResult,
} from '../../types/specimen-workflow';

import { requestClient } from '#/api/request';

import {
  directReceiveSpecimensMock,
  listPendingReceiptsMock,
  receiveSpecimensMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';
import {
  type PendingSpecimenPageResponse,
  mapPendingSpecimenPageResponse,
  mapSpecimenReceiptResult,
} from './specimen-workflow-mappers';

export async function listPendingReceipts(
  params: PendingSpecimenQuery,
): Promise<PendingSpecimenPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingReceiptsMock(params);
  }
  const response = await requestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-receipts/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function receiveSpecimens(
  data: SpecimenReceiptRequest,
): Promise<SpecimenReceiptResult> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return receiveSpecimensMock(data);
  }
  const response = await requestClient.post<SpecimenReceiptResult>(
    '/v1/specimen-receipts',
    data,
  );
  return mapSpecimenReceiptResult(response);
}

export async function directReceiveSpecimens(
  data: DirectSpecimenReceiptRequest,
): Promise<SpecimenReceiptResult> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return directReceiveSpecimensMock(data);
  }
  const response = await requestClient.post<SpecimenReceiptResult>(
    '/v1/specimen-receipts/by-barcodes',
    data,
  );
  return mapSpecimenReceiptResult(response);
}
