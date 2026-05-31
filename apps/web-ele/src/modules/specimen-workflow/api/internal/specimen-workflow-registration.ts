import type {
  ApplicationFormReprintRequest,
  ApplicationListItem,
  LabelPrintRetryRequest,
  LabelPrintRetryResult,
  LatestSpecimenRegistrationResult,
  SpecimenRegisterRequest,
  SpecimenRegisterResult,
  TrackingEventView,
} from '../../types/specimen-workflow';

import { requestClient } from '#/api/request';

import {
  getLatestRegistrationResultMock,
  lookupApplicationForRegistrationMock,
  registerSpecimensMock,
  reprintApplicationFormMock,
  retryLabelPrintMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';
import {
  type LatestRegistrationResultResponse,
  type RegistrationResultResponse,
  mapLatestRegistrationResultResponse,
  mapRegistrationResultResponse,
} from './specimen-workflow-mappers';

export async function registerSpecimens(
  data: SpecimenRegisterRequest,
): Promise<SpecimenRegisterResult> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return registerSpecimensMock(data);
  }
  const response = await requestClient.post<RegistrationResultResponse>(
    '/v1/specimens/register',
    data,
  );
  return mapRegistrationResultResponse(response);
}

export async function retryLabelPrint(
  batchNo: string,
  data: LabelPrintRetryRequest,
) {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return retryLabelPrintMock(batchNo, data);
  }
  return requestClient.post<LabelPrintRetryResult>(
    `/v1/specimens/label-batches/${batchNo}/retry`,
    data,
  );
}

export async function getLatestRegistrationResult(
  applicationId: string,
): Promise<LatestSpecimenRegistrationResult> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getLatestRegistrationResultMock(applicationId);
  }
  const response = await requestClient.get<LatestRegistrationResultResponse>(
    `/v1/specimens/applications/${applicationId}/latest-registration`,
  );
  return mapLatestRegistrationResultResponse(response);
}

export async function lookupApplicationForRegistration(
  applicationNo: string,
): Promise<ApplicationListItem> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return lookupApplicationForRegistrationMock(applicationNo);
  }
  return requestClient.get<ApplicationListItem>(
    '/v1/specimens/applications/lookup',
    {
      params: { applicationNo },
    },
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
