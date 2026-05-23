import type {
  ApplicationListItem,
  ApplicationListQuery,
  ApplicationPage,
  ApplicationCreateRequest,
  ApplicationCreateResult,
  ApplicationDetailView,
  DirectSpecimenReceiptRequest,
  FixationResult,
  ImportClinicalApplicationRequest,
  LatestSpecimenRegistrationResult,
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
  SpecimenTrackingSummary,
  TrackingEventView,
  TrackingQueryView,
  TransportOrderCreateRequest,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
  TransportOrderView,
} from '../types/specimen-workflow';

import { requestClient } from '#/api/request';

type ApplicationDetailResponse = Omit<
  ApplicationDetailView,
  'recentEvents' | 'specimens'
> & {
  recentEvents?: TrackingEventView[];
  specimens?: SpecimenTrackingSummary[];
};
type TrackingQueryResponse = Omit<TrackingQueryView, 'recentEvents'> & {
  recentEvents?: TrackingEventView[];
};
type RegistrationResultResponse = Omit<SpecimenRegisterResult, 'specimens'> & {
  specimens?: SpecimenTrackingSummary[];
};
type LatestRegistrationResultResponse = Omit<
  LatestSpecimenRegistrationResult,
  'specimens'
> & {
  specimens?: SpecimenTrackingSummary[];
};

type ApplicationPageResponse = ApplicationPage;
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

export function mapApplicationPageResponse(
  response: ApplicationPageResponse,
): ApplicationPage {
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

export function mapRegistrationResultResponse(
  response: RegistrationResultResponse,
): SpecimenRegisterResult {
  return {
    ...response,
    specimens: response.specimens ?? [],
  };
}

export function mapLatestRegistrationResultResponse(
  response: LatestRegistrationResultResponse,
): LatestSpecimenRegistrationResult {
  return {
    ...response,
    specimens: response.specimens ?? [],
  };
}

export async function createApplication(data: ApplicationCreateRequest) {
  return requestClient.post<ApplicationCreateResult>('/v1/applications', data);
}

export async function listApplications(params: ApplicationListQuery) {
  const response = await requestClient.get<ApplicationPageResponse>('/v1/applications', {
    params,
  });
  return mapApplicationPageResponse(response);
}

export async function importClinicalApplication(
  data: ImportClinicalApplicationRequest,
) {
  return requestClient.post<ApplicationCreateResult>(
    '/v1/clinical-applications/import',
    data,
  );
}

export async function getApplicationDetail(applicationId: string) {
  const response = await requestClient.get<ApplicationDetailResponse>(
    `/v1/applications/${applicationId}`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getApplicationTracking(applicationId: string) {
  const response = await requestClient.get<TrackingQueryResponse>(
    `/v1/applications/${applicationId}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getSpecimenTrackingByBarcode(barcode: string) {
  const response = await requestClient.get<TrackingQueryResponse>(
    `/v1/specimens/barcodes/${barcode}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function registerSpecimens(data: SpecimenRegisterRequest) {
  const response = await requestClient.post<RegistrationResultResponse>(
    '/v1/specimens/register',
    data,
  );
  return mapRegistrationResultResponse(response);
}

export async function retryLabelPrint(batchNo: string, data: LabelPrintRetryRequest) {
  return requestClient.post<LabelPrintRetryResult>(
    `/v1/specimens/label-batches/${batchNo}/retry`,
    data,
  );
}

export async function getLatestRegistrationResult(applicationId: string) {
  const response = await requestClient.get<LatestRegistrationResultResponse>(
    `/v1/specimens/applications/${applicationId}/latest-registration`,
  );
  return mapLatestRegistrationResultResponse(response);
}

export async function lookupApplicationForRegistration(applicationNo: string) {
  return requestClient.get<ApplicationListItem>('/v1/specimens/applications/lookup', {
    params: { applicationNo },
  });
}

export async function listPendingFixations(params: PendingSpecimenQuery) {
  const response = await requestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-fixations/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function startFixation(data: SpecimenFixationRequest) {
  return requestClient.post<FixationResult>('/v1/specimen-fixations/start', data);
}

export async function completeFixation(data: SpecimenFixationRequest) {
  return requestClient.post<FixationResult>('/v1/specimen-fixations/complete', data);
}

export async function listPendingTransportOrders(params: PendingTransportOrderQuery) {
  const response = await requestClient.get<PendingTransportOrderPageResponse>(
    '/v1/transport-orders/pending',
    { params },
  );
  return mapPendingTransportOrderPageResponse(response);
}

export async function createTransportOrder(data: TransportOrderCreateRequest) {
  return requestClient.post<TransportOrderView>('/v1/transport-orders', data);
}

export async function printTransportOrder(
  transportOrderId: string,
  data: TransportOrderOperatorRequest,
) {
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/print`,
    data,
  );
}

export async function handoverTransportOrder(
  transportOrderId: string,
  data: TransportOrderHandoverRequest,
) {
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/handover`,
    data,
  );
}

export async function listPendingReceipts(params: PendingSpecimenQuery) {
  const response = await requestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-receipts/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function receiveSpecimens(data: SpecimenReceiptRequest) {
  return requestClient.post<SpecimenReceiptResult>('/v1/specimen-receipts', data);
}

export async function directReceiveSpecimens(data: DirectSpecimenReceiptRequest) {
  return requestClient.post<SpecimenReceiptResult>(
    '/v1/specimen-receipts/by-barcodes',
    data,
  );
}
