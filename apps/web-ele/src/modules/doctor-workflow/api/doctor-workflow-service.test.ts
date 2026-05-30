import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  acceptDiagnosticTask,
  acceptMedicalOrder,
  approveReportRevisionRequest,
  assignDiagnosticTask,
  cancelMedicalOrder,
  commentConsultationParticipant,
  completeConsultation,
  completeMedicalOrder,
  createConsultation,
  createMedicalOrder,
  createPathologyReport,
  createReportRevisionRequest,
  getDiagnosticWorkbench,
  getReportTracking,
  listPendingDiagnosticTasks,
  listPendingMedicalOrders,
  mapDiagnosticWorkbenchResponse,
  mapPendingDiagnosticTaskPageResponse,
  mapPendingMedicalOrderPageResponse,
  mapReportTrackingResponse,
  publishPathologyReport,
  rejectPathologyReport,
  rejectReportRevisionRequest,
  reviewPathologyReport,
  savePathologyReportDraft,
  signPathologyReport,
  startDiagnosticTask,
  submitPathologyReport,
} from './doctor-workflow-service';

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

beforeEach(() => {
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
});

describe('doctor-workflow-service mappers', () => {
  it('normalizes pending diagnostic task pagination', () => {
    expect(mapPendingDiagnosticTaskPageResponse({})).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes pending medical order pagination', () => {
    expect(mapPendingMedicalOrderPageResponse({})).toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });
  });

  it('normalizes diagnostic workbench arrays and nullable report', () => {
    expect(
      mapDiagnosticWorkbenchResponse({
        caseId: 'CASE-001',
        pathologyNo: 'BL-001',
      }),
    ).toMatchObject({
      blocks: [],
      caseId: 'CASE-001',
      consultations: [],
      currentReport: null,
      diagnosticTasks: [],
      hasPendingRevision: false,
      medicalOrders: [],
      pathologyNo: 'BL-001',
      recentEvents: [],
      revisions: [],
      slides: [],
      specimens: [],
    });
  });

  it('normalizes report tracking arrays and version numbers', () => {
    expect(mapReportTrackingResponse({ caseId: 'CASE-001' })).toMatchObject({
      caseId: 'CASE-001',
      consultations: [],
      currentDraftVersionNo: null,
      currentReport: null,
      diagnosticTasks: [],
      events: [],
      hasPendingRevision: false,
      latestEffectiveVersionNo: null,
      medicalOrders: [],
      revisions: [],
      versions: [],
    });
  });
});

describe('doctor-workflow-service requests', () => {
  it('queries pending diagnostic tasks with backend query names', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listPendingDiagnosticTasks({
      page: 1,
      pathologyNo: 'BL-001',
      size: 20,
      taskStatus: 'PENDING',
      taskType: 'PRIMARY',
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/diagnostic-tasks/pending',
      {
        params: {
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          taskStatus: 'PENDING',
          taskType: 'PRIMARY',
        },
      },
    );
  });

  it('queries pending medical orders with backend query names', async () => {
    requestClientMock.get.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await listPendingMedicalOrders({
      page: 1,
      pathologyNo: 'BL-001',
      size: 20,
      status: 'PENDING',
    });

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/medical-orders/pending',
      {
        params: {
          page: 1,
          pathologyNo: 'BL-001',
          size: 20,
          status: 'PENDING',
        },
      },
    );
  });

  it('posts diagnostic task action endpoints with exact paths', async () => {
    await assignDiagnosticTask('TASK-1', {
      diagnosisDoctorName: '责任医生',
      diagnosisDoctorUserId: 'DOC-1',
      operatorName: '分派员',
      primaryDoctorName: '初诊医生',
      primaryDoctorUserId: 'DOC-2',
      reviewerName: '审核医生',
      reviewerUserId: 'DOC-3',
    });
    await acceptDiagnosticTask('TASK-1', { operatorName: '责任医生' });
    await startDiagnosticTask('TASK-1', { operatorName: '责任医生' });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/diagnostic-tasks/TASK-1/assign',
      {
        diagnosisDoctorName: '责任医生',
        diagnosisDoctorUserId: 'DOC-1',
        operatorName: '分派员',
        primaryDoctorName: '初诊医生',
        primaryDoctorUserId: 'DOC-2',
        reviewerName: '审核医生',
        reviewerUserId: 'DOC-3',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/diagnostic-tasks/TASK-1/accept',
      { operatorName: '责任医生' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/diagnostic-tasks/TASK-1/start',
      { operatorName: '责任医生' },
    );
  });

  it('posts medical order endpoints with exact paths', async () => {
    await createMedicalOrder({
      caseId: 'CASE-1',
      operatorName: '诊断医生',
      orderContent: '补做特殊染色',
      orderType: 'SPECIAL_STAIN',
    });
    await acceptMedicalOrder('ORDER-1', { operatorName: '执行岗' });
    await completeMedicalOrder('ORDER-1', { operatorName: '执行岗' });
    await cancelMedicalOrder('ORDER-1', { operatorName: '诊断医生' });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-orders',
      {
        caseId: 'CASE-1',
        operatorName: '诊断医生',
        orderContent: '补做特殊染色',
        orderType: 'SPECIAL_STAIN',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-orders/ORDER-1/accept',
      { operatorName: '执行岗' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/medical-orders/ORDER-1/complete',
      { operatorName: '执行岗' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/medical-orders/ORDER-1/cancel',
      { operatorName: '诊断医生' },
    );
  });

  it('queries diagnostic aggregate endpoints', async () => {
    requestClientMock.get
      .mockResolvedValueOnce({ caseId: 'CASE-1' })
      .mockResolvedValueOnce({ caseId: 'CASE-1' });

    await expect(getDiagnosticWorkbench('CASE-1')).resolves.toMatchObject({
      caseId: 'CASE-1',
      diagnosticTasks: [],
    });
    await expect(getReportTracking('CASE-1')).resolves.toMatchObject({
      caseId: 'CASE-1',
      versions: [],
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/pathology-cases/CASE-1/diagnostic-workbench',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/pathology-cases/CASE-1/report-tracking',
    );
  });

  it('keeps pathology number identifiers in report tracking request paths', async () => {
    requestClientMock.get.mockResolvedValue({ caseId: 'CASE-1' });

    await getReportTracking('BL-202605240003');

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/pathology-cases/BL-202605240003/report-tracking',
    );
  });

  it('posts pathology report lifecycle endpoints with exact paths', async () => {
    await createPathologyReport({
      caseId: 'CASE-1',
      operatorName: '医生',
      taskId: 'TASK-1',
    });
    await savePathologyReportDraft('REPORT-1', {
      finalDiagnosis: '诊断',
      operatorName: '医生',
    });
    await submitPathologyReport('REPORT-1', { operatorName: '医生' });
    await reviewPathologyReport('REPORT-1', { operatorName: '审核医生' });
    await rejectPathologyReport('REPORT-1', {
      operatorName: '审核医生',
      rejectReason: '需补充',
    });
    await signPathologyReport('REPORT-1', { operatorName: '签发医生' });
    await publishPathologyReport('REPORT-1', { operatorName: '发布员' });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/pathology-reports',
      {
        caseId: 'CASE-1',
        operatorName: '医生',
        taskId: 'TASK-1',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/pathology-reports/REPORT-1/save-draft',
      {
        finalDiagnosis: '诊断',
        operatorName: '医生',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/pathology-reports/REPORT-1/submit',
      { operatorName: '医生' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/pathology-reports/REPORT-1/review',
      { operatorName: '审核医生' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/pathology-reports/REPORT-1/reject',
      {
        operatorName: '审核医生',
        rejectReason: '需补充',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/pathology-reports/REPORT-1/sign',
      { operatorName: '签发医生' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      7,
      '/v1/pathology-reports/REPORT-1/publish',
      { operatorName: '发布员' },
    );
  });

  it('posts revision and consultation endpoints with exact paths', async () => {
    await createReportRevisionRequest({
      operatorName: '医生',
      reportId: 'REPORT-1',
      requestReason: '补充诊断',
    });
    await approveReportRevisionRequest('REV-1', { operatorName: '主任' });
    await rejectReportRevisionRequest('REV-2', {
      operatorName: '主任',
      rejectReason: '理由不足',
    });
    await createConsultation({
      caseId: 'CASE-1',
      operatorName: '医生',
      participants: [
        {
          participantName: '会诊医生',
          participantRole: 'MEMBER',
          participantUserId: 'DOC-2',
        },
      ],
    });
    await commentConsultationParticipant('CONS-1', 'PART-1', {
      operatorName: '会诊医生',
      opinion: '同意',
    });
    await completeConsultation('CONS-1', {
      operatorName: '主持人',
      opinion: '完成',
    });

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/report-revision-requests',
      {
        operatorName: '医生',
        reportId: 'REPORT-1',
        requestReason: '补充诊断',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/report-revision-requests/REV-1/approve',
      { operatorName: '主任' },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/report-revision-requests/REV-2/reject',
      {
        operatorName: '主任',
        rejectReason: '理由不足',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      4,
      '/v1/consultations',
      {
        caseId: 'CASE-1',
        operatorName: '医生',
        participants: [
          {
            participantName: '会诊医生',
            participantRole: 'MEMBER',
            participantUserId: 'DOC-2',
          },
        ],
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      5,
      '/v1/consultations/CONS-1/participants/PART-1/comment',
      {
        operatorName: '会诊医生',
        opinion: '同意',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      6,
      '/v1/consultations/CONS-1/complete',
      {
        operatorName: '主持人',
        opinion: '完成',
      },
    );
  });
});
