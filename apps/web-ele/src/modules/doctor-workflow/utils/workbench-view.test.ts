import type { PendingDiagnosticTaskItem } from '../types/doctor-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildDiagnosisWorkbenchQueueStats,
  filterDiagnosisWorkbenchQueueItems,
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
      assignedCount: 1,
      consultationCount: 0,
      completedCount: 1,
      currentPageCount: 4,
      frozenCount: 0,
      inProgressCount: 1,
      primaryCount: 4,
      reviewCount: 0,
      unsignedReportCount: 3,
    });
  });

  it('filters queue items by quick filter and assigned date range', () => {
    const items = [
      createTask({
        assignedAt: '2026-04-04 09:00:00',
        id: 'TASK-001',
        taskStatus: 'ASSIGNED',
      }),
      createTask({
        assignedAt: '2026-06-04 09:00:00',
        id: 'TASK-002',
        taskStatus: 'IN_PROGRESS',
      }),
      createTask({
        assignedAt: '2026-06-05 09:00:00',
        id: 'TASK-003',
        reportStatus: 'SIGNED',
        taskStatus: 'COMPLETED',
      }),
    ];

    expect(
      filterDiagnosisWorkbenchQueueItems(items, 'IN_PROGRESS', [
        '2026-04-04',
        '2026-06-04',
      ]).map((item) => item.id),
    ).toEqual(['TASK-002']);
    expect(
      filterDiagnosisWorkbenchQueueItems(items, 'UNSIGNED_REPORT', [
        '2026-04-04',
        '2026-06-04',
      ]).map((item) => item.id),
    ).toEqual(['TASK-001', 'TASK-002']);
  });

  it('maps diagnostic task status to stable tag types', () => {
    expect(getDiagnosisTaskStatusTagType('ASSIGNED')).toBe('primary');
    expect(getDiagnosisTaskStatusTagType('IN_PROGRESS')).toBe('warning');
    expect(getDiagnosisTaskStatusTagType('COMPLETED')).toBe('success');
  });
});
