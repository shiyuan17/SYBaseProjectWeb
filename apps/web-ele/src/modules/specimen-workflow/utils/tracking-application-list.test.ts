import type {
  ApplicationListItem,
  SpecimenTrackingSummary,
  TrackingEventView,
  TrackingQueryView as WorkflowTrackingQueryView,
} from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildInitialApplicationMatch,
  buildSpecimenTimelineTabs,
  buildTrackingApplicationListQuery,
  formatAggregateContext,
  resolveDetailRecentEvents,
  resolveDetailSpecimens,
} from './tracking-application-list';
import { buildTrackingTimelineData } from './tracking-timeline';

function createTrackingEvent(
  overrides: Partial<TrackingEventView> = {},
): TrackingEventView {
  return {
    eventContent: null,
    eventStatus: 'DONE',
    eventTime: '2026-05-31T09:00:00',
    eventType: 'REGISTERED',
    nodeCode: 'REG',
    operatorName: '张三',
    sourceTerminal: 'T-1',
    ...overrides,
  };
}

function createSpecimen(
  overrides: Partial<SpecimenTrackingSummary> = {},
): SpecimenTrackingSummary {
  return {
    abnormalReason: null,
    barcode: 'BC-1',
    containerCount: 1,
    containerName: '蜡块盒',
    fixationStatus: null,
    id: 'SPEC-1',
    labelPrintStatus: 'PENDING',
    specimenCount: 1,
    specimenName: '肺组织',
    specimenNo: 'SP-1',
    specimenSite: '左肺',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    ...overrides,
  };
}

function createTrackingView(
  overrides: Partial<WorkflowTrackingQueryView> = {},
): WorkflowTrackingQueryView {
  return {
    abnormalFlag: false,
    applicationDate: null,
    applicationFormStatus: null,
    applicationNo: 'NO-1',
    applicationType: 'NORMAL',
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
    specimenRemovalTime: null,
    specimenSite: null,
    specimens: [],
    status: null,
    submissionDate: null,
    submittingDepartmentId: null,
    submittingDepartmentName: null,
    submittingDoctorName: null,
    submittingDoctorUserId: null,
    thirdPartySource: null,
    updatedAt: null,
    voided: false,
    ...overrides,
  };
}

describe('tracking application list helpers', () => {
  it('builds list query from filters', () => {
    expect(
      buildTrackingApplicationListQuery({
        applicationNo: ' NO-1 ',
        dateRange: ['2026-05-01', '2026-05-31'],
        page: 2,
        patientName: ' 张三 ',
        size: 20,
      }),
    ).toEqual({
      applicationNo: 'NO-1',
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      page: 2,
      patientName: '张三',
      size: 20,
    });
  });

  it('resolves detail arrays and specimen timeline tabs', () => {
    const specimen = createSpecimen();
    const event = createTrackingEvent({ specimenId: specimen.id });
    const detailTracking = createTrackingView({
      recentEvents: [event],
      specimens: [specimen],
    });

    expect(resolveDetailRecentEvents(detailTracking)).toEqual([event]);
    expect(resolveDetailSpecimens(detailTracking)).toEqual([specimen]);

    const timelineData = buildTrackingTimelineData([event], [specimen]);
    expect(buildSpecimenTimelineTabs([specimen], timelineData)).toEqual([
      {
        events: [event],
        id: specimen.id,
        label: specimen.specimenNo,
      },
    ]);
  });

  it('formats aggregate context and initial match', () => {
    expect(formatAggregateContext([], '多操作人')).toBe('-');
    expect(formatAggregateContext(['张三'], '多操作人')).toBe('张三');
    expect(formatAggregateContext(['张三', '李四'], '多操作人')).toBe(
      '多操作人（张三、李四）',
    );

    const items: ApplicationListItem[] = [
      {
        abnormalFlag: false,
        applicationDate: null,
        applicationFormStatus: null,
        applicationNo: 'NO-1',
        applicationType: null,
        createdAt: null,
        currentNode: null,
        deletable: false,
        editable: false,
        id: 'APP-1',
        latestLabelPrintStatus: null,
        operationDisabledReason: null,
        patientAge: null,
        patientGender: null,
        patientCheckStatus: null,
        patientName: '张三',
        registeredSpecimenCount: 1,
        reportIssued: false,
        reportStatus: null,
        receiptAbnormalSummary: null,
        submissionDate: null,
        status: null,
        submittingDepartmentName: null,
        submittingDoctorName: null,
        updatedAt: null,
        voided: false,
      },
    ];
    expect(buildInitialApplicationMatch(' APP-1 ', items)).toBe('APP-1');
    expect(buildInitialApplicationMatch('', items)).toBeNull();
  });
});
