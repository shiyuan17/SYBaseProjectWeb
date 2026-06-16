import type {
  ApplicationCreateRequest,
  ApplicationCreateResult,
  ApplicationDetailView,
  ApplicationListQuery,
  ApplicationPage,
  ApplicationPatientLookupResult,
  ApplicationUpdateRequest,
  DuplicateApplicationCheckQuery,
  DuplicateApplicationCheckResult,
  ImportClinicalApplicationRequest,
} from '../../types/specimen-workflow';
import type {
  ApplicationDetailResponse,
  ApplicationPageResponse,
} from './specimen-workflow-mappers';

import { requestClient } from '#/api/request';

import {
  mapApplicationDetailResponse,
  mapApplicationPageResponse,
} from './specimen-workflow-mappers';
import {
  createApplicationMock,
  deleteApplicationMock,
  duplicateCheckApplicationsMock,
  getApplicationDetailMock,
  importClinicalApplicationMock,
  listApplicationsMock,
  lookupApplicationPatientByIdentifierMock,
  updateApplicationMock,
  USE_SPECIMEN_WORKFLOW_MOCK,
} from './specimen-workflow-mock-gateway';

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

export async function listApplications(
  params: ApplicationListQuery,
): Promise<ApplicationPage> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return listApplicationsMock(params);
  }
  const response = await requestClient.get<ApplicationPageResponse>(
    '/v1/applications',
    {
      params,
    },
  );
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

export async function lookupApplicationPatientByIdentifier(
  identifier: string,
): Promise<ApplicationPatientLookupResult | null> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return lookupApplicationPatientByIdentifierMock(identifier);
  }
  try {
    return await requestClient.get<ApplicationPatientLookupResult>(
      '/v1/applications/patient-lookup',
      {
        params: { identifier: identifier.trim() },
      },
    );
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response
      ?.status;
    if (status === 404) {
      return null;
    }
    throw error;
  }
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

export async function getApplicationDetail(
  applicationId: string,
): Promise<ApplicationDetailView> {
  if (USE_SPECIMEN_WORKFLOW_MOCK) {
    return getApplicationDetailMock(applicationId);
  }
  const response = await requestClient.get<ApplicationDetailResponse>(
    `/v1/applications/${applicationId}`,
  );
  return mapApplicationDetailResponse(response);
}
