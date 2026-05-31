import type { ApplicationDetailView } from '../../types/specimen-workflow';

import { requestClient } from '#/api/request';

import {
  getApplicationTrackingByApplicationNoMock,
  getApplicationTrackingMock,
  getSpecimenTrackingByBarcodeMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';
import {
  type TrackingQueryResponse,
  mapApplicationDetailResponse,
} from './specimen-workflow-mappers';
import { lookupApplicationForRegistration } from './specimen-workflow-registration';

export async function getApplicationTracking(
  applicationId: string,
): Promise<ApplicationDetailView> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getApplicationTrackingMock(applicationId);
  }
  const response = await requestClient.get<TrackingQueryResponse>(
    `/v1/applications/${applicationId}/tracking`,
  );
  return mapApplicationDetailResponse(response);
}

export async function getApplicationTrackingByApplicationNo(
  applicationNo: string,
) {
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
