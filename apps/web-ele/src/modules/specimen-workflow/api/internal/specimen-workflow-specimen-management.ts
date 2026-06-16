import type {
  FixationResult,
  PendingSpecimenPage,
  PendingSpecimenQuery,
  SpecimenBarcodeBindingRequest,
  SpecimenBarcodeUnbindRequest,
  SpecimenCheckInRequest,
  SpecimenConfirmRequest,
  SpecimenFixationRequest,
  SpecimenManagementListPage,
  SpecimenManagementListQuery,
  SpecimenRemovalConfirmRequest,
  SpecimenRemovalConfirmResult,
  SpecimenRemovalPage,
  SpecimenRemovalQuery,
  SpecimenRemovalQuickConfirmRequest,
  SpecimenTrackingSummary,
  SpecimenVerificationRecord,
  SpecimenVerificationRequest,
} from '../../types/specimen-workflow';
import type {
  PendingSpecimenPageResponse,
  SpecimenManagementListPageResponse,
  SpecimenRemovalPageResponse,
} from './specimen-workflow-mappers';

import { requestClient } from '#/api/request';

import {
  mapPendingSpecimenPageResponse,
  mapSpecimenManagementListPageResponse,
  mapSpecimenRemovalPageResponse,
} from './specimen-workflow-mappers';
import {
  bindSpecimenBarcodeMock,
  checkInSpecimenMock,
  completeFixationMock,
  completeSpecimenVerificationMock,
  confirmSpecimenMock,
  confirmSpecimenRemovalByIdentifierMock,
  confirmSpecimenRemovalMock,
  listPendingFixationsMock,
  listPendingSpecimenRemovalsMock,
  listSpecimensMock,
  listSpecimenVerificationRecordsMock,
  rebindSpecimenBarcodeMock,
  startFixationMock,
  startSpecimenVerificationMock,
  unbindSpecimenBarcodeMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';

export async function listSpecimens(
  params: SpecimenManagementListQuery,
): Promise<SpecimenManagementListPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listSpecimensMock(params);
  }
  const response = await requestClient.get<SpecimenManagementListPageResponse>(
    '/v1/specimens',
    {
      params,
    },
  );
  return mapSpecimenManagementListPageResponse(response);
}

export async function listPendingFixations(
  params: PendingSpecimenQuery,
): Promise<PendingSpecimenPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingFixationsMock(params);
  }
  const response = await requestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-fixations/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function startSpecimenVerification(
  data: SpecimenVerificationRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return startSpecimenVerificationMock(data);
  }
  return requestClient.post<SpecimenTrackingSummary>(
    '/v1/specimen-verifications/start',
    data,
  );
}

export async function completeSpecimenVerification(
  data: SpecimenVerificationRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return completeSpecimenVerificationMock(data);
  }
  return requestClient.post<SpecimenTrackingSummary>(
    '/v1/specimen-verifications/complete',
    data,
  );
}

export async function startFixation(data: SpecimenFixationRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return startFixationMock(data);
  }
  return requestClient.post<FixationResult>(
    '/v1/specimen-fixations/start',
    data,
  );
}

export async function completeFixation(data: SpecimenFixationRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return completeFixationMock(data);
  }
  return requestClient.post<FixationResult>(
    '/v1/specimen-fixations/complete',
    data,
  );
}

export async function listPendingSpecimenRemovals(
  params: SpecimenRemovalQuery,
): Promise<SpecimenRemovalPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingSpecimenRemovalsMock(params);
  }
  const response = await requestClient.get<SpecimenRemovalPageResponse>(
    '/v1/specimen-removals/pending',
    { params },
  );
  return mapSpecimenRemovalPageResponse(response);
}

export async function confirmSpecimenRemoval(
  data: SpecimenRemovalConfirmRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return confirmSpecimenRemovalMock(data);
  }
  return requestClient.post<SpecimenRemovalConfirmResult>(
    '/v1/specimen-removals/confirm',
    data,
  );
}

export async function confirmSpecimenRemovalByIdentifier(
  data: SpecimenRemovalQuickConfirmRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return confirmSpecimenRemovalByIdentifierMock(data);
  }
  return requestClient.post<SpecimenRemovalConfirmResult>(
    '/v1/specimen-removals/confirm-by-identifier',
    data,
  );
}

export async function exportSpecimenRemovals(params: SpecimenRemovalQuery) {
  return requestClient.download('/v1/specimen-removals/export', {
    params,
    responseReturn: 'body',
  });
}

export async function bindSpecimenBarcode(
  specimenId: string,
  data: SpecimenBarcodeBindingRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return bindSpecimenBarcodeMock(specimenId, data);
  }
  return requestClient.post<SpecimenTrackingSummary>(
    `/v1/specimens/${specimenId}/barcode-binding`,
    data,
  );
}

export async function rebindSpecimenBarcode(
  specimenId: string,
  data: SpecimenBarcodeBindingRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return rebindSpecimenBarcodeMock(specimenId, data);
  }
  return requestClient.put<SpecimenTrackingSummary>(
    `/v1/specimens/${specimenId}/barcode-binding`,
    data,
  );
}

export async function unbindSpecimenBarcode(
  specimenId: string,
  params: SpecimenBarcodeUnbindRequest = {},
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return unbindSpecimenBarcodeMock(specimenId, params);
  }
  return requestClient.request<SpecimenTrackingSummary>(
    `/v1/specimens/${specimenId}/barcode-binding`,
    {
      method: 'DELETE',
      params,
    },
  );
}

export async function confirmSpecimen(
  barcode: string,
  data: SpecimenConfirmRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return confirmSpecimenMock(barcode, data);
  }
  return requestClient.post<SpecimenTrackingSummary>(
    `/v1/specimens/barcodes/${barcode}/confirm`,
    data,
  );
}

export async function checkInSpecimen(
  barcode: string,
  data: SpecimenCheckInRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return checkInSpecimenMock(barcode, data);
  }
  return requestClient.post<SpecimenTrackingSummary>(
    `/v1/specimens/barcodes/${barcode}/check-in`,
    data,
  );
}

export async function listSpecimenVerificationRecords(barcode: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listSpecimenVerificationRecordsMock(barcode);
  }
  return requestClient.get<SpecimenVerificationRecord[]>(
    `/v1/specimens/barcodes/${barcode}/verification-records`,
  );
}
