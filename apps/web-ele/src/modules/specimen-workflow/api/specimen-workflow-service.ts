import type {
  ApplicationCreateRequest,
  ApplicationCreateResult,
  ApplicationDetailView,
  DirectSpecimenReceiptRequest,
  FixationResult,
  LabelPrintRetryRequest,
  LabelPrintRetryResult,
  PendingSpecimenPage,
  PendingSpecimenQuery,
  PendingTransportOrderPage,
  PendingTransportOrderQuery,
  SpecimenFixationRequest,
  SpecimenReceiptRequest,
  SpecimenReceiptResult,
  SpecimenRegisterRequest,
  SpecimenRegisterResult,
  TrackingEventView,
  TrackingQueryView,
  TransportOrderCreateRequest,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
  TransportOrderView,
} from '../types/specimen-workflow';

import { bodyRequestClient } from '#/api/request';

type ApplicationDetailResponse = Omit<ApplicationDetailView, 'recentEvents'> & {
  recentEvents?: TrackingEventView[];
};
type TrackingQueryResponse = Omit<TrackingQueryView, 'recentEvents'> & {
  recentEvents?: TrackingEventView[];
};

type PendingSpecimenPageResponse = PendingSpecimenPage;
type PendingTransportOrderPageResponse = PendingTransportOrderPage;

export function mapApplicationDetailResponse(
  response: ApplicationDetailResponse,
): ApplicationDetailView {
  return {
    ...response,
    recentEvents: response.recentEvents ?? [],
    specimens: response.specimens ?? [],
  };
}

export function mapPendingSpecimenPageResponse(
  response: PendingSpecimenPageResponse,
): PendingSpecimenPage {
  return {
    ...response,
    items: response.items ?? [],
  };
}

export function mapPendingTransportOrderPageResponse(
  response: PendingTransportOrderPageResponse,
): PendingTransportOrderPage {
  return {
    ...response,
    items: response.items ?? [],
  };
}

export async function createApplication(data: ApplicationCreateRequest) {
  return bodyRequestClient.post<ApplicationCreateResult>('/v1/applications', data);
}

export async function getApplicationDetail(applicationId: string) {
  const response = await bodyRequestClient.get<ApplicationDetailResponse>(
    `/v1/applications/${applicationId}`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getApplicationTracking(applicationId: string) {
  const response = await bodyRequestClient.get<TrackingQueryResponse>(
    `/v1/applications/${applicationId}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getSpecimenTrackingByBarcode(barcode: string) {
  const response = await bodyRequestClient.get<TrackingQueryResponse>(
    `/v1/specimens/barcodes/${barcode}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function registerSpecimens(data: SpecimenRegisterRequest) {
  return bodyRequestClient.post<SpecimenRegisterResult>('/v1/specimens/register', data);
}

export async function retryLabelPrint(batchNo: string, data: LabelPrintRetryRequest) {
  return bodyRequestClient.post<LabelPrintRetryResult>(
    `/v1/specimens/label-batches/${batchNo}/retry`,
    data,
  );
}

export async function listPendingFixations(params: PendingSpecimenQuery) {
  const response = await bodyRequestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-fixations/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function startFixation(data: SpecimenFixationRequest) {
  return bodyRequestClient.post<FixationResult>('/v1/specimen-fixations/start', data);
}

export async function completeFixation(data: SpecimenFixationRequest) {
  return bodyRequestClient.post<FixationResult>('/v1/specimen-fixations/complete', data);
}

export async function listPendingTransportOrders(params: PendingTransportOrderQuery) {
  const response = await bodyRequestClient.get<PendingTransportOrderPageResponse>(
    '/v1/transport-orders/pending',
    { params },
  );
  return mapPendingTransportOrderPageResponse(response);
}

export async function createTransportOrder(data: TransportOrderCreateRequest) {
  return bodyRequestClient.post<TransportOrderView>('/v1/transport-orders', data);
}

export async function printTransportOrder(
  transportOrderId: string,
  data: TransportOrderOperatorRequest,
) {
  return bodyRequestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/print`,
    data,
  );
}

export async function handoverTransportOrder(
  transportOrderId: string,
  data: TransportOrderHandoverRequest,
) {
  return bodyRequestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/handover`,
    data,
  );
}

export async function listPendingReceipts(params: PendingSpecimenQuery) {
  const response = await bodyRequestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-receipts/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function receiveSpecimens(data: SpecimenReceiptRequest) {
  return bodyRequestClient.post<SpecimenReceiptResult>('/v1/specimen-receipts', data);
}

export async function directReceiveSpecimens(data: DirectSpecimenReceiptRequest) {
  return bodyRequestClient.post<SpecimenReceiptResult>(
    '/v1/specimen-receipts/by-barcodes',
    data,
  );
}
