import type {
  ApplicationDetailView,
  LatestSpecimenRegistrationResult,
  SpecimenManagementListItem,
  SpecimenTrackingSummary,
} from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildTrackingSpecimenListQuery,
  createEmptySpecimenManagementSummary,
  formatContainerRatio,
  labelTagType,
  resolveDetailTargetSpecimen,
  resolveExplicitAbnormalFlag,
  resolveQuickFilterQuery,
  specimenTagType,
} from './tracking-specimen-list';

function createSpecimen(
  overrides: Partial<SpecimenTrackingSummary> = {},
): SpecimenTrackingSummary {
  return {
    abnormalReason: null,
    barcode: 'BC-1',
    containerCount: 2,
    containerName: '蜡块盒',
    fixationStatus: 'FIXING',
    id: 'SPEC-1',
    labelPrintStatus: 'PENDING',
    specimenCount: 3,
    specimenName: '肺组织',
    specimenNo: 'SP-1',
    specimenSite: '左肺',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    ...overrides,
  };
}

function createRow(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-1',
    applicationNo: 'NO-1',
    barcode: 'BC-1',
    containerCount: 2,
    containerName: '蜡块盒',
    fixationStatus: null,
    labelPrintBatchNo: null,
    labelPrintStatus: 'PENDING',
    latestTrackingAt: null,
    patientName: '张三',
    registeredAt: '2026-05-31T08:00:00',
    specimenCount: 3,
    specimenId: 'SPEC-1',
    specimenName: '肺组织',
    specimenNo: 'SP-1',
    specimenSite: '左肺',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: 'DEPT-1',
    submittingDepartmentName: '病理科',
    ...overrides,
  };
}

function createApplicationDetail(
  specimens: SpecimenTrackingSummary[],
): ApplicationDetailView {
  return {
    abnormalFlag: false,
    applicationDate: null,
    applicationFormStatus: null,
    applicationNo: 'NO-1',
    applicationType: null,
    clinicalDiagnosis: null,
    clinicalSymptom: null,
    createdAt: null,
    currentNode: null,
    deletable: false,
    editable: false,
    externalOrderNo: null,
    id: 'APP-1',
    operationDisabledReason: null,
    patientAge: null,
    patientGender: null,
    patientId: null,
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: null,
    specimenSite: null,
    specimenRemovalTime: null,
    specimens,
    status: null,
    submissionDate: null,
    submittingDepartmentId: 'DEPT-1',
    submittingDepartmentName: '病理科',
    submittingDoctorName: null,
    submittingDoctorUserId: null,
    thirdPartySource: null,
    updatedAt: null,
    voided: false,
  };
}

function createLatestResult(
  specimens: SpecimenTrackingSummary[],
): LatestSpecimenRegistrationResult {
  return {
    applicationId: 'APP-1',
    labelPrintBatchNo: 'BATCH-1',
    labelPrintMessage: null,
    labelPrintSuccess: true,
    registrationSnapshot: null,
    specimens,
  };
}

describe('tracking specimen list helpers', () => {
  it('builds default summary and filter query', () => {
    expect(createEmptySpecimenManagementSummary()).toEqual({
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 0,
      unboundCount: 0,
    });
    expect(resolveQuickFilterQuery('ABNORMAL')).toEqual({ abnormalFlag: true });
    expect(resolveQuickFilterQuery('PENDING_LABEL')).toEqual({
      labelPrintStatus: 'PENDING',
    });
    expect(resolveExplicitAbnormalFlag('true')).toBe(true);
    expect(resolveExplicitAbnormalFlag('false')).toBe(false);
    expect(resolveExplicitAbnormalFlag('')).toBeUndefined();

    expect(
      buildTrackingSpecimenListQuery(
        {
          abnormalFlag: '',
          dateRange: ['2026-05-01', '2026-05-31'],
          departmentId: ' DEPT-1 ',
          keyword: ' BC-1 ',
          labelPrintStatus: '',
          page: 2,
          size: 20,
          specimenStatus: '',
        },
        'PENDING_LABEL',
      ),
    ).toEqual({
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      departmentId: 'DEPT-1',
      keyword: 'BC-1',
      labelPrintStatus: 'PENDING',
      page: 2,
      size: 20,
    });
  });

  it('resolves target specimen from application detail then latest result', () => {
    const detailSpecimen = createSpecimen({
      id: 'SPEC-1',
      specimenName: 'Detail',
    });
    const latestSpecimen = createSpecimen({
      id: 'SPEC-2',
      specimenName: 'Latest',
    });

    expect(
      resolveDetailTargetSpecimen(
        'SPEC-1',
        createApplicationDetail([detailSpecimen]),
        createLatestResult([latestSpecimen]),
      )?.specimenName,
    ).toBe('Detail');
    expect(
      resolveDetailTargetSpecimen(
        'SPEC-2',
        null,
        createLatestResult([latestSpecimen]),
      )?.specimenName,
    ).toBe('Latest');
    expect(resolveDetailTargetSpecimen('SPEC-3', null, null)).toBeNull();
  });

  it('maps tag types and container ratio', () => {
    expect(labelTagType('SUCCESS')).toBe('success');
    expect(labelTagType('FAILED')).toBe('danger');
    expect(labelTagType('PENDING')).toBe('info');

    expect(specimenTagType(createRow({ specimenStatus: 'REJECTED' }))).toBe(
      'danger',
    );
    expect(specimenTagType(createRow({ specimenStatus: 'CHECKED_IN' }))).toBe(
      'success',
    );
    expect(specimenTagType(createRow({ specimenStatus: 'FIXED' }))).toBe(
      'primary',
    );
    expect(specimenTagType(createRow({ specimenStatus: 'IN_TRANSIT' }))).toBe(
      'warning',
    );
    expect(specimenTagType(createRow())).toBe('info');

    expect(formatContainerRatio(createRow())).toBe('2 / 3');
    expect(
      formatContainerRatio(
        createRow({ containerCount: null, specimenCount: null }),
      ),
    ).toBe('- / -');
  });
});
