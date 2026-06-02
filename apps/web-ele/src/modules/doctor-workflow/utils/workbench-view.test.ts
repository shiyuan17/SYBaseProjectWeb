import type {
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildDiagnosisWorkbenchQueueStats,
  buildDiagnosticProgressNodes,
  getDiagnosisTaskStatusTagType,
  resolveWorkbenchSelection,
} from './workbench-view';

function createTask(
  overrides: Partial<PendingDiagnosticTaskItem> = {},
): PendingDiagnosticTaskItem {
  return {
    caseId: 'CASE-001',
    diagnosisDoctorName: '当前医生',
    diagnosisDoctorUserId: 'USER-CURRENT',
    id: 'TASK-001',
    pathologyNo: 'PATH-001',
    patientName: '张三',
    primaryDoctorName: '当前医生',
    primaryDoctorUserId: 'USER-CURRENT',
    reviewerName: '审核医生',
    reviewerUserId: 'USER-REVIEW',
    taskStatus: 'ASSIGNED',
    taskType: 'PRIMARY',
    ...overrides,
  };
}

function createWorkbench(
  overrides: Partial<DiagnosticWorkbenchView> = {},
): DiagnosticWorkbenchView {
  return {
    applicationNo: 'APP-001',
    blocks: [],
    caseId: 'CASE-001',
    caseStatus: 'IN_DIAGNOSIS',
    clinicalDiagnosis: '临床诊断',
    consultations: [],
    currentReport: {
      finalDiagnosis: '最终诊断',
      grossExam: '大体所见',
      microscopicExam: '镜检所见',
      reportId: 'REPORT-001',
      reportNo: 'RPT-001',
      reportStatus: 'DRAFT',
      versionNo: 1,
    },
    diagnosticTasks: [createTask()],
    hasPendingRevision: false,
    medicalOrders: [],
    pathologyNo: 'PATH-001',
    patientName: '张三',
    recentEvents: [],
    revisions: [],
    slides: [],
    specimens: [],
    submittingDepartmentName: '消化内科',
    submittingDoctorName: '送检医生',
    ...overrides,
  };
}

describe('doctor workflow workbench view helpers', () => {
  it('prefers taskId, then caseId, then first queue item when resolving selection', () => {
    const items = [
      createTask(),
      createTask({
        caseId: 'CASE-002',
        id: 'TASK-002',
      }),
    ];

    expect(resolveWorkbenchSelection(items, 'TASK-002', '')?.id).toBe(
      'TASK-002',
    );
    expect(resolveWorkbenchSelection(items, '', 'CASE-002')?.id).toBe(
      'TASK-002',
    );
    expect(resolveWorkbenchSelection(items, '', '')?.id).toBe('TASK-001');
  });

  it('builds current-page queue stats without inventing global totals', () => {
    const stats = buildDiagnosisWorkbenchQueueStats([
      createTask({ taskStatus: 'ASSIGNED' }),
      createTask({ id: 'TASK-002', taskStatus: 'ACCEPTED' }),
      createTask({ id: 'TASK-003', taskStatus: 'IN_PROGRESS' }),
      createTask({ id: 'TASK-004', taskStatus: 'COMPLETED' }),
    ]);

    expect(stats).toEqual({
      acceptedCount: 1,
      completedCount: 1,
      currentPageCount: 4,
      inProgressCount: 1,
    });
  });

  it('maps diagnostic task status to stable tag types', () => {
    expect(getDiagnosisTaskStatusTagType('ASSIGNED')).toBe('primary');
    expect(getDiagnosisTaskStatusTagType('IN_PROGRESS')).toBe('warning');
    expect(getDiagnosisTaskStatusTagType('COMPLETED')).toBe('success');
  });

  it('builds progress nodes from selected task and report status', () => {
    const workbench = createWorkbench({
      hasPendingRevision: true,
      medicalOrders: [
        {
          orderId: 'ORDER-001',
          status: 'PENDING',
        },
      ],
    });

    const nodes = buildDiagnosticProgressNodes(
      workbench,
      createTask({ taskStatus: 'IN_PROGRESS' }),
    );

    expect(nodes.map((item) => item.label)).toEqual([
      '病例进入工作台',
      '诊断任务流转',
      '报告编写与流转',
      '协同与闭环',
    ]);
    expect(nodes[1]?.state).toBe('active');
    expect(nodes[3]?.state).toBe('warning');
  });
});
