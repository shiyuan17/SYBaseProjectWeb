import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getApplicationDetail,
  getApplicationTrackingByApplicationNo,
  getLatestRegistrationResult,
  importClinicalApplication,
  listApplications,
  listPendingFixations,
  listSpecimens,
  lookupApplicationForRegistration,
  mapApplicationPageResponse,
  mapApplicationDetailResponse,
  mapLatestRegistrationResultResponse,
  mapPendingSpecimenPageResponse,
  mapSpecimenManagementListPageResponse,
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
  const { specimenRemovalTime = null, ...restOverrides } = overrides;

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
    specimenRemovalTime,
    status: 'SUBMITTED',
    submissionDate: '2026-05-21',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    submittingDoctorName: '医生A',
    submittingDoctorUserId: 'DOC-1',
    thirdPartySource: null,
    updatedAt: '2026-05-21T10:00:00',
    ...restOverrides,
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
            clinicalSymptom: '腹痛',
            collectionMode: 'SURGERY',
            containerCount: 1,
            containerName: 'Specimen Bottle',
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
    expect(mapped.specimens[0]).toMatchObject({
      clinicalSymptom: '腹痛',
      collectionMode: 'SURGERY',
    });
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

  it('fills omitted specimen management page structures', () => {
    const mapped = mapSpecimenManagementListPageResponse({
      page: 1,
      size: 20,
      total: 0,
    });

    expect(mapped).toEqual({
      items: [],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 0,
    });
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

  it('looks up application id before querying tracking by application number', async () => {
    requestClientMock.get
      .mockResolvedValueOnce({
        abnormalFlag: false,
        applicationDate: '2026-05-21',
        applicationFormStatus: 'NOT_UPLOADED',
        applicationNo: 'AP202605220001',
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
      })
      .mockResolvedValueOnce(
        createApplicationDetailResponse({
          applicationNo: 'AP202605220001',
          id: 'APP-ID',
        }),
      );

    await expect(
      getApplicationTrackingByApplicationNo('AP202605220001'),
    ).resolves.toMatchObject({
      applicationNo: 'AP202605220001',
      id: 'APP-ID',
      recentEvents: [],
      specimens: [],
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/specimens/applications/lookup',
      {
        params: {
          applicationNo: 'AP202605220001',
        },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/applications/APP-ID/tracking',
    );
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

  it('uses unified requestClient for specimen management list query', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-ID',
          applicationNo: 'APP-001',
          barcode: 'BC-001',
          fixationStatus: 'PENDING',
          labelPrintBatchNo: 'LP-001',
          labelPrintStatus: 'FAILED',
          latestTrackingAt: '2026-05-21T10:00:00',
          patientName: '张三',
          registeredAt: '2026-05-21T10:00:00',
          specimenCount: 1,
          specimenId: 'SPEC-ID',
          specimenName: '胃组织',
          specimenNo: 'SP-001',
          specimenSite: '胃',
          specimenStatus: 'REGISTERED',
          specimenType: 'ROUTINE',
          submittingDepartmentId: 'DEP-1',
          submittingDepartmentName: '外科',
        },
      ],
      page: 1,
      size: 20,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });

    await expect(
      listSpecimens({
        keyword: 'APP-001',
        labelPrintStatus: 'FAILED',
        page: 1,
        size: 20,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          applicationId: 'APP-ID',
          labelPrintBatchNo: 'LP-001',
          specimenId: 'SPEC-ID',
        },
      ],
      summary: {
        pendingLabelCount: 1,
        totalCount: 1,
      },
      total: 1,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/specimens', {
      params: {
        keyword: 'APP-001',
        labelPrintStatus: 'FAILED',
        page: 1,
        size: 20,
      },
    });
  });

  it('uses unified requestClient for pending fixation list query', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await expect(
      listPendingFixations({
        applicationId: 'APP-ID',
        departmentId: 'DEP-1',
        fixationStatus: 'FIXING',
        page: 1,
        size: 20,
      }),
    ).resolves.toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/specimen-fixations/pending', {
      params: {
        applicationId: 'APP-ID',
        departmentId: 'DEP-1',
        fixationStatus: 'FIXING',
        page: 1,
        size: 20,
      },
    });
  });
});
