import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getApplicationDetail,
  getLatestRegistrationResult,
  importClinicalApplication,
  listApplications,
  lookupApplicationForRegistration,
  mapApplicationPageResponse,
  mapApplicationDetailResponse,
  mapLatestRegistrationResultResponse,
  mapPendingSpecimenPageResponse,
  mapPendingTransportOrderPageResponse,
  mapRegistrationResultResponse,
} from './specimen-workflow-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const requestClientMock = requestClient as unknown as {
  get: Mock;
  post: Mock;
};

type ApplicationDetailResponse = Parameters<
  typeof mapApplicationDetailResponse
>[0];

function createApplicationDetailResponse(
  overrides: Partial<ApplicationDetailResponse> = {},
): ApplicationDetailResponse {
  return {
    abnormalFlag: false,
    applicationDate: '2026-05-21',
    applicationFormStatus: 'PENDING',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '诊断',
    clinicalSymptom: null,
    createdAt: '2026-05-21T10:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    externalOrderNo: null,
    id: 'APP-ID',
    patientAge: '40',
    patientGender: 'F',
    patientId: 'P-001',
    patientName: '张三',
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: null,
    specimenSite: '胃',
    status: 'SUBMITTED',
    submissionDate: '2026-05-21',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    submittingDoctorName: '医生A',
    submittingDoctorUserId: 'DOC-1',
    thirdPartySource: null,
    updatedAt: '2026-05-21T10:00:00',
    ...overrides,
  };
}

beforeEach(() => {
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
});

describe('specimen-workflow-service mappers', () => {
  it('normalizes application detail arrays', () => {
    const mapped = mapApplicationDetailResponse(
      createApplicationDetailResponse({
        recentEvents: [],
        specimens: [],
      }),
    );

    expect(mapped.recentEvents).toEqual([]);
    expect(mapped.specimens).toEqual([]);
  });

  it('fills omitted application detail arrays', () => {
    const mapped = mapApplicationDetailResponse(createApplicationDetailResponse());

    expect(mapped.recentEvents).toEqual([]);
    expect(mapped.specimens).toEqual([]);
  });

  it('keeps provided application detail arrays', () => {
    const mapped = mapApplicationDetailResponse(
      createApplicationDetailResponse({
        recentEvents: [
          {
            eventContent: '登记完成',
            eventStatus: 'SUCCESS',
            eventTime: '2026-05-21T10:00:00',
            eventType: 'REGISTER',
            nodeCode: 'SPECIMEN_COLLECTION',
            operatorName: '张三',
            sourceTerminal: 'TERMINAL-01',
          },
        ],
        specimens: [
          {
            barcode: 'BC-001',
            fixationStatus: 'PENDING',
            id: 'SPEC-ID',
            labelPrintStatus: 'PRINTED',
            specimenCount: 1,
            specimenName: '胃组织',
            specimenNo: 'SP-001',
            specimenSite: '胃',
            specimenStatus: 'REGISTERED',
            specimenType: '组织',
          },
        ],
      }),
    );

    expect(mapped.recentEvents).toHaveLength(1);
    expect(mapped.specimens).toHaveLength(1);
  });

  it('keeps pending specimen pagination stable', () => {
    const mapped = mapPendingSpecimenPageResponse({
      items: [],
      page: 2,
      size: 20,
      total: 5,
    });

    expect(mapped).toEqual({
      items: [],
      page: 2,
      size: 20,
      total: 5,
    });
  });

  it('keeps pending transport pagination stable', () => {
    const mapped = mapPendingTransportOrderPageResponse({
      items: [],
      page: 1,
      size: 20,
      total: 3,
    });

    expect(mapped.total).toBe(3);
    expect(mapped.items).toEqual([]);
  });

  it('fills omitted application list items', () => {
    const mapped = mapApplicationPageResponse({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    expect(mapped).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('fills omitted registration result specimens', () => {
    const mapped = mapRegistrationResultResponse({
      labelPrintBatchNo: 'LP-001',
      labelPrintMessage: null,
      labelPrintSuccess: true,
    });

    expect(mapped.specimens).toEqual([]);
  });

  it('fills omitted latest registration result specimens', () => {
    const mapped = mapLatestRegistrationResultResponse({
      applicationId: 'APP-ID',
      labelPrintBatchNo: null,
      labelPrintMessage: null,
      labelPrintSuccess: false,
    });

    expect(mapped.applicationId).toBe('APP-ID');
    expect(mapped.specimens).toEqual([]);
  });
});

describe('specimen-workflow-service requests', () => {
  it('uses unified requestClient for clinical application import', async () => {
    requestClientMock.post.mockResolvedValue({ id: 'APP-ID' });

    await expect(
      importClinicalApplication({
        externalOrderNo: 'EXT-001',
        thirdPartySource: 'HIS',
      }),
    ).resolves.toEqual({ id: 'APP-ID' });

    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/v1/clinical-applications/import',
      {
        externalOrderNo: 'EXT-001',
        thirdPartySource: 'HIS',
      },
    );
  });

  it('maps unwrapped application detail response from requestClient', async () => {
    requestClientMock.get.mockResolvedValue(createApplicationDetailResponse());

    await expect(getApplicationDetail('APP-ID')).resolves.toMatchObject({
      id: 'APP-ID',
      specimens: [],
      recentEvents: [],
    });

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/applications/APP-ID');
  });

  it('uses unified requestClient for application list query', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await expect(
      listApplications({
        applicationNo: 'APP',
        page: 1,
        size: 20,
      }),
    ).resolves.toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/applications', {
      params: {
        applicationNo: 'APP',
        page: 1,
        size: 20,
      },
    });
  });

  it('uses unified requestClient for latest registration result query', async () => {
    requestClientMock.get.mockResolvedValue({
      applicationId: 'APP-ID',
      labelPrintBatchNo: 'LP-001',
      labelPrintMessage: 'printed',
      labelPrintSuccess: true,
      specimens: [],
    });

    await expect(getLatestRegistrationResult('APP-ID')).resolves.toEqual({
      applicationId: 'APP-ID',
      labelPrintBatchNo: 'LP-001',
      labelPrintMessage: 'printed',
      labelPrintSuccess: true,
      specimens: [],
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/specimens/applications/APP-ID/latest-registration',
    );
  });

  it('uses unified requestClient for registration lookup by application number', async () => {
    requestClientMock.get.mockResolvedValue({
      abnormalFlag: false,
      applicationDate: '2026-05-21',
      applicationFormStatus: 'NOT_UPLOADED',
      applicationNo: 'APP-001',
      applicationType: 'ROUTINE',
      createdAt: '2026-05-21T10:00:00',
      currentNode: 'DRAFT',
      id: 'APP-ID',
      latestLabelPrintStatus: null,
      patientAge: '40',
      patientGender: 'F',
      patientName: '张三',
      registeredSpecimenCount: 0,
      status: 'DRAFT',
      submissionDate: '2026-05-21',
      submittingDepartmentName: '外科',
      submittingDoctorName: '医生A',
      updatedAt: '2026-05-21T10:00:00',
    });

    await expect(lookupApplicationForRegistration('APP-001')).resolves.toMatchObject({
      id: 'APP-ID',
      applicationNo: 'APP-001',
      status: 'DRAFT',
      registeredSpecimenCount: 0,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/specimens/applications/lookup',
      {
        params: {
          applicationNo: 'APP-001',
        },
      },
    );
  });
});
