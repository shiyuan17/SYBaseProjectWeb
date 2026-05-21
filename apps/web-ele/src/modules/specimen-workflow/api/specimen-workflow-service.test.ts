import { describe, expect, it } from 'vitest';

import {
  mapApplicationDetailResponse,
  mapPendingSpecimenPageResponse,
  mapPendingTransportOrderPageResponse,
} from './specimen-workflow-service';

describe('specimen-workflow-service mappers', () => {
  it('normalizes application detail arrays', () => {
    const mapped = mapApplicationDetailResponse({
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
      specimens: [],
      status: 'SUBMITTED',
      submissionDate: '2026-05-21',
      submittingDepartmentId: 'DEP-1',
      submittingDepartmentName: '外科',
      submittingDoctorName: '医生A',
      submittingDoctorUserId: 'DOC-1',
      thirdPartySource: null,
      updatedAt: '2026-05-21T10:00:00',
    });

    expect(mapped.recentEvents).toEqual([]);
    expect(mapped.specimens).toEqual([]);
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
});
