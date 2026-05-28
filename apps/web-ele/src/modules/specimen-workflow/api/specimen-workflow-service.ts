import type {
  ApplicationListItem,
  ApplicationListQuery,
  ApplicationPage,
  ApplicationFormReprintRequest,
  ApplicationCreateRequest,
  ApplicationCreateResult,
  ApplicationDetailView,
  ApplicationUpdateRequest,
  DuplicateApplicationCheckQuery,
  DuplicateApplicationCheckResult,
  SpecimenCheckInRequest,
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
  SpecimenManagementListPage,
  SpecimenManagementListQuery,
  SpecimenManagementListSummary,
  SpecimenRemovalConfirmRequest,
  SpecimenRemovalConfirmResult,
  SpecimenRemovalQuickConfirmRequest,
  SpecimenRemovalItem,
  SpecimenRemovalPage,
  SpecimenRemovalQuery,
  SpecimenRemovalSummary,
  SpecimenBarcodeBindingRequest,
  SpecimenConfirmRequest,
  SpecimenFixationRequest,
  SpecimenReceiptRequest,
  SpecimenReceiptResult,
  SpecimenRegisterRequest,
  SpecimenRegisterResult,
  SpecimenTrackingSummary,
  SpecimenVerificationRequest,
  SpecimenVerificationRecord,
  TrackingEventView,
  TrackingQueryView,
  TransportOrderCreateRequest,
  TransportOrderHandoverRequest,
  TransportOrderOperatorRequest,
  TransportOrderView,
} from '../types/specimen-workflow';
import {
  bindSpecimenBarcodeMock,
  checkInSpecimenMock,
  completeFixationMock,
  completeSpecimenVerificationMock,
  confirmSpecimenRemovalMock,
  confirmSpecimenRemovalByIdentifierMock,
  confirmSpecimenMock,
  createApplicationMock,
  createTransportOrderMock,
  deleteApplicationMock,
  directReceiveSpecimensMock,
  duplicateCheckApplicationsMock,
  getApplicationDetailMock,
  getApplicationTrackingByApplicationNoMock,
  getApplicationTrackingMock,
  getLatestRegistrationResultMock,
  getSpecimenTrackingByBarcodeMock,
  handoverTransportOrderMock,
  importClinicalApplicationMock,
  listApplicationsMock,
  listPendingFixationsMock,
  listPendingSpecimenRemovalsMock,
  listPendingReceiptsMock,
  listPendingTransportOrdersMock,
  listSpecimenVerificationRecordsMock,
  listSpecimensMock,
  lookupApplicationForRegistrationMock,
  printTransportOrderMock,
  receiveSpecimensMock,
  registerSpecimensMock,
  rebindSpecimenBarcodeMock,
  reprintApplicationFormMock,
  resetMockState as resetSpecimenWorkflowMockState,
  retryLabelPrintMock,
  startSpecimenVerificationMock,
  startFixationMock,
  updateApplicationMock,
} from './specimen-workflow-mock';

import { requestClient } from '#/api/request';

const USE_SPECIMEN_WORKFLOW_MOCK =
  import.meta.env.MODE === 'test'
  || import.meta.env.VITE_SPECIMEN_WORKFLOW_MOCK === 'true';

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
  'registrationSnapshot' | 'specimens'
> & {
  registrationSnapshot?: LatestSpecimenRegistrationResult['registrationSnapshot'];
  specimens?: SpecimenTrackingSummary[];
};

type ApplicationPageResponse = ApplicationPage;
type PendingSpecimenPageResponse = PendingSpecimenPage;
type PendingTransportOrderPageResponse = PendingTransportOrderPage;
type SpecimenManagementListPageResponse = Omit<
  SpecimenManagementListPage,
  'items' | 'summary'
> & {
  items?: SpecimenManagementListPage['items'];
  summary?: Partial<SpecimenManagementListSummary>;
};
type SpecimenRemovalPageResponse = Omit<
  SpecimenRemovalPage,
  'items' | 'summary'
> & {
  items?: SpecimenRemovalItem[];
  summary?: Partial<SpecimenRemovalSummary>;
};

export function mapApplicationDetailResponse(
  response: ApplicationDetailResponse,
): ApplicationDetailView {
  return {
    ...response,
    currentNode: response.voided ? 'VOIDED' : response.currentNode,
    deletable: response.deletable ?? false,
    editable: response.editable ?? false,
    fixationCompletedAt: response.fixationCompletedAt ?? null,
    operationDisabledReason: response.operationDisabledReason ?? null,
    patientCheckStatus: response.patientCheckStatus ?? null,
    recentEvents: response.recentEvents ?? [],
    receiptAbnormalSummary: response.receiptAbnormalSummary ?? null,
    reportIssued: response.reportIssued ?? false,
    reportStatus: response.reportStatus ?? null,
    specimenConfirmedAt: response.specimenConfirmedAt ?? null,
    specimens: (response.specimens ?? []).map(mapSpecimenTrackingSummary),
    unreceivedCount: response.unreceivedCount ?? 0,
    voided: response.voided ?? response.status === 'VOIDED',
  };
}

export function mapPendingSpecimenPageResponse(
  response: PendingSpecimenPageResponse,
): PendingSpecimenPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => {
      const verificationCompletedAt = item.verificationCompletedAt ?? null;
      const verificationStartedAt = item.verificationStartedAt ?? null;

      return {
        ...item,
        abnormalType: item.abnormalType ?? null,
        batchAbnormalFlag: item.batchAbnormalFlag ?? false,
        checkInStatus: item.checkInStatus ?? null,
        checkedInAt: item.checkedInAt ?? null,
        checkedInByName: item.checkedInByName ?? null,
        reminderCount: item.reminderCount ?? 0,
        unreceivedCount: item.unreceivedCount ?? 0,
        verificationCompletedAt,
        verificationStartedAt,
        verificationStatus: resolvePendingSpecimenVerificationStatus(
          item.verificationStatus,
          verificationStartedAt,
          verificationCompletedAt,
        ),
      };
    }),
  };
}

function resolvePendingSpecimenVerificationStatus(
  verificationStatus: null | string | undefined,
  verificationStartedAt: null | string,
  verificationCompletedAt: null | string,
) {
  const normalizedStatus = verificationStatus?.trim();
  if (normalizedStatus) {
    return normalizedStatus;
  }
  if (verificationCompletedAt) {
    return 'VERIFIED';
  }
  if (verificationStartedAt) {
    return 'VERIFYING';
  }
  return 'UNVERIFIED';
}

export function mapApplicationPageResponse(
  response: ApplicationPageResponse,
): ApplicationPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      currentNode: item.voided ? 'VOIDED' : item.currentNode,
      deletable: item.deletable ?? false,
      editable: item.editable ?? false,
      operationDisabledReason: item.operationDisabledReason ?? null,
      voided: item.voided ?? item.status === 'VOIDED',
    })),
  };
}

export function mapPendingTransportOrderPageResponse(
  response: PendingTransportOrderPageResponse,
): PendingTransportOrderPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      batchAbnormalFlag: item.batchAbnormalFlag ?? false,
      reminderCount: item.reminderCount ?? 0,
      unreceivedCount: item.unreceivedCount ?? 0,
    })),
  };
}

export function mapSpecimenManagementListPageResponse(
  response: SpecimenManagementListPageResponse,
): SpecimenManagementListPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      abnormalType: item.abnormalType ?? null,
      barcodeBindingStatus: item.barcodeBindingStatus ?? null,
      checkInStatus: item.checkInStatus ?? null,
      checkedInAt: item.checkedInAt ?? null,
      checkedInByName: item.checkedInByName ?? null,
      fixationCompletedAt: item.fixationCompletedAt ?? null,
      recentNode: item.recentNode ?? null,
      specimenConfirmedAt: item.specimenConfirmedAt ?? null,
      verificationCompletedAt: item.verificationCompletedAt ?? null,
      verificationStartedAt: item.verificationStartedAt ?? null,
      verificationStatus: item.verificationStatus ?? null,
    })),
    summary: {
      abnormalCount: response.summary?.abnormalCount ?? 0,
      labelPrintedCount: response.summary?.labelPrintedCount ?? 0,
      pendingLabelCount: response.summary?.pendingLabelCount ?? 0,
      totalCount: response.summary?.totalCount ?? 0,
    },
  };
}

export function mapSpecimenRemovalPageResponse(
  response: SpecimenRemovalPageResponse,
): SpecimenRemovalPage {
  return {
    ...response,
    items: (response.items ?? []).map((item) => ({
      ...item,
      confirmedAt: item.confirmedAt ?? null,
      specimenRemovalAt: item.specimenRemovalAt ?? null,
      specimenRemovalOperatorName: item.specimenRemovalOperatorName ?? null,
    })),
    summary: {
      abnormalCount: response.summary?.abnormalCount ?? 0,
      confirmedCount: response.summary?.confirmedCount ?? 0,
      pendingCount: response.summary?.pendingCount ?? 0,
      totalCount: response.summary?.totalCount ?? 0,
    },
  };
}

export function mapRegistrationResultResponse(
  response: RegistrationResultResponse,
): SpecimenRegisterResult {
  return {
    ...response,
    specimens: (response.specimens ?? []).map(mapSpecimenTrackingSummary),
  };
}

export function mapLatestRegistrationResultResponse(
  response: LatestRegistrationResultResponse,
): LatestSpecimenRegistrationResult {
  return {
    ...response,
    registrationSnapshot: response.registrationSnapshot
      ? {
          collectionScene: response.registrationSnapshot.collectionScene ?? null,
          operatorName: response.registrationSnapshot.operatorName ?? null,
          operatorUserId: response.registrationSnapshot.operatorUserId ?? null,
          printerCode: response.registrationSnapshot.printerCode ?? null,
          remarks: response.registrationSnapshot.remarks ?? null,
          terminalCode: response.registrationSnapshot.terminalCode ?? null,
        }
      : null,
    specimens: (response.specimens ?? []).map(mapSpecimenTrackingSummary),
  };
}

function mapSpecimenTrackingSummary(
  specimen: SpecimenTrackingSummary,
): SpecimenTrackingSummary {
  return {
    ...specimen,
    abnormalReason: specimen.abnormalReason ?? null,
    abnormalType: specimen.abnormalType ?? null,
    barcodeBindingStatus: specimen.barcodeBindingStatus ?? null,
    checkInStatus: specimen.checkInStatus ?? null,
    checkedInAt: specimen.checkedInAt ?? null,
    checkedInByName: specimen.checkedInByName ?? null,
    fixationCompletedAt: specimen.fixationCompletedAt ?? null,
    qualityCheckResult: specimen.qualityCheckResult ?? null,
    qualityIssueCodes: specimen.qualityIssueCodes ?? [],
    receiptStatus: specimen.receiptStatus ?? null,
    specimenConfirmedAt: specimen.specimenConfirmedAt ?? null,
    verificationCompletedAt: specimen.verificationCompletedAt ?? null,
    verificationStartedAt: specimen.verificationStartedAt ?? null,
    verificationStatus: specimen.verificationStatus ?? null,
  };
}

export async function createApplication(data: ApplicationCreateRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return createApplicationMock(data);
  }
  return requestClient.post<ApplicationCreateResult>('/v1/applications', data);
}

export async function updateApplication(
  applicationId: string,
  data: ApplicationUpdateRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return updateApplicationMock(applicationId, data);
  }
  return requestClient.request<ApplicationCreateResult>(
    `/v1/applications/${applicationId}`,
    {
      data,
      method: 'PATCH',
    },
  );
}

export async function deleteApplication(applicationId: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return deleteApplicationMock(applicationId);
  }
  return requestClient.delete<ApplicationCreateResult>(
    `/v1/applications/${applicationId}`,
  );
}

export async function listApplications(params: ApplicationListQuery) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listApplicationsMock(params);
  }
  const response = await requestClient.get<ApplicationPageResponse>('/v1/applications', {
    params,
  });
  return mapApplicationPageResponse(response);
}

export async function duplicateCheckApplications(
  params: DuplicateApplicationCheckQuery,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return duplicateCheckApplicationsMock(params);
  }
  return requestClient.get<DuplicateApplicationCheckResult>(
    '/v1/applications/duplicate-check',
    { params },
  );
}

export async function importClinicalApplication(
  data: ImportClinicalApplicationRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return importClinicalApplicationMock(data);
  }
  return requestClient.post<ApplicationCreateResult>(
    '/v1/clinical-applications/import',
    data,
  );
}

export async function getApplicationDetail(applicationId: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getApplicationDetailMock(applicationId);
  }
  const response = await requestClient.get<ApplicationDetailResponse>(
    `/v1/applications/${applicationId}`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getApplicationTracking(applicationId: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getApplicationTrackingMock(applicationId);
  }
  const response = await requestClient.get<TrackingQueryResponse>(
    `/v1/applications/${applicationId}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getApplicationTrackingByApplicationNo(applicationNo: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getApplicationTrackingByApplicationNoMock(applicationNo);
  }
  const application = await lookupApplicationForRegistration(applicationNo);
  return getApplicationTracking(application.id);
}

export async function getSpecimenTrackingByBarcode(barcode: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getSpecimenTrackingByBarcodeMock(barcode);
  }
  const response = await requestClient.get<TrackingQueryResponse>(
    `/v1/specimens/barcodes/${barcode}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function registerSpecimens(data: SpecimenRegisterRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return registerSpecimensMock(data);
  }
  const response = await requestClient.post<RegistrationResultResponse>(
    '/v1/specimens/register',
    data,
  );
  return mapRegistrationResultResponse(response);
}

export async function retryLabelPrint(batchNo: string, data: LabelPrintRetryRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return retryLabelPrintMock(batchNo, data);
  }
  return requestClient.post<LabelPrintRetryResult>(
    `/v1/specimens/label-batches/${batchNo}/retry`,
    data,
  );
}

export async function getLatestRegistrationResult(applicationId: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getLatestRegistrationResultMock(applicationId);
  }
  const response = await requestClient.get<LatestRegistrationResultResponse>(
    `/v1/specimens/applications/${applicationId}/latest-registration`,
  );
  return mapLatestRegistrationResultResponse(response);
}

export async function lookupApplicationForRegistration(applicationNo: string) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return lookupApplicationForRegistrationMock(applicationNo);
  }
  return requestClient.get<ApplicationListItem>('/v1/specimens/applications/lookup', {
    params: { applicationNo },
  });
}

export async function listSpecimens(params: SpecimenManagementListQuery) {
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

export async function listPendingFixations(params: PendingSpecimenQuery) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingFixationsMock(params);
  }
  const response = await requestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-fixations/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function startSpecimenVerification(data: SpecimenVerificationRequest) {
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
  return requestClient.post<FixationResult>('/v1/specimen-fixations/start', data);
}

export async function completeFixation(data: SpecimenFixationRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return completeFixationMock(data);
  }
  return requestClient.post<FixationResult>('/v1/specimen-fixations/complete', data);
}

export async function listPendingSpecimenRemovals(params: SpecimenRemovalQuery) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingSpecimenRemovalsMock(params);
  }
  const response = await requestClient.get<SpecimenRemovalPageResponse>(
    '/v1/specimen-removals/pending',
    { params },
  );
  return mapSpecimenRemovalPageResponse(response);
}

export async function confirmSpecimenRemoval(data: SpecimenRemovalConfirmRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return confirmSpecimenRemovalMock(data);
  }
  return requestClient.post<SpecimenRemovalConfirmResult>('/v1/specimen-removals/confirm', data);
}

export async function confirmSpecimenRemovalByIdentifier(data: SpecimenRemovalQuickConfirmRequest) {
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

export async function listPendingTransportOrders(params: PendingTransportOrderQuery) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingTransportOrdersMock(params);
  }
  const response = await requestClient.get<PendingTransportOrderPageResponse>(
    '/v1/transport-orders/pending',
    { params },
  );
  return mapPendingTransportOrderPageResponse(response);
}

export async function createTransportOrder(data: TransportOrderCreateRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return createTransportOrderMock(data);
  }
  return requestClient.post<TransportOrderView>('/v1/transport-orders', data);
}

export async function printTransportOrder(
  transportOrderId: string,
  data: TransportOrderOperatorRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return printTransportOrderMock(transportOrderId, data);
  }
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/print`,
    data,
  );
}

export async function handoverTransportOrder(
  transportOrderId: string,
  data: TransportOrderHandoverRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return handoverTransportOrderMock(transportOrderId, data);
  }
  return requestClient.post<TransportOrderView>(
    `/v1/transport-orders/${transportOrderId}/handover`,
    data,
  );
}

export async function listPendingReceipts(params: PendingSpecimenQuery) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listPendingReceiptsMock(params);
  }
  const response = await requestClient.get<PendingSpecimenPageResponse>(
    '/v1/specimen-receipts/pending',
    { params },
  );
  return mapPendingSpecimenPageResponse(response);
}

export async function receiveSpecimens(data: SpecimenReceiptRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return receiveSpecimensMock(data);
  }
  const response = await requestClient.post<SpecimenReceiptResult>(
    '/v1/specimen-receipts',
    data,
  );
  return {
    ...response,
    batchAbnormalFlag: response.batchAbnormalFlag ?? false,
    receiptAbnormalSummary: response.receiptAbnormalSummary ?? null,
    reminderCount: response.reminderCount ?? 0,
  };
}

export async function directReceiveSpecimens(data: DirectSpecimenReceiptRequest) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return directReceiveSpecimensMock(data);
  }
  const response = await requestClient.post<SpecimenReceiptResult>(
    '/v1/specimen-receipts/by-barcodes',
    data,
  );
  return {
    ...response,
    batchAbnormalFlag: response.batchAbnormalFlag ?? false,
    receiptAbnormalSummary: response.receiptAbnormalSummary ?? null,
    reminderCount: response.reminderCount ?? 0,
  };
}

export async function bindSpecimenBarcode(
  barcode: string,
  data: SpecimenBarcodeBindingRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return bindSpecimenBarcodeMock(barcode, data);
  }
  return requestClient.post<SpecimenTrackingSummary>(
    `/v1/specimens/barcodes/${barcode}/bindings`,
    data,
  );
}

export async function rebindSpecimenBarcode(
  barcode: string,
  data: SpecimenBarcodeBindingRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return rebindSpecimenBarcodeMock(barcode, data);
  }
  return requestClient.put<SpecimenTrackingSummary>(
    `/v1/specimens/barcodes/${barcode}/bindings`,
    data,
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

export async function reprintApplicationForm(
  applicationId: string,
  data: ApplicationFormReprintRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return reprintApplicationFormMock(applicationId, data);
  }
  return requestClient.post<TrackingEventView>(
    `/v1/applications/${applicationId}/reprint-form`,
    data,
  );
}

export function resetMockState() {
  resetSpecimenWorkflowMockState();
}
