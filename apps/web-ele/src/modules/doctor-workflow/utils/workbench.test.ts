import type { PendingDiagnosticTaskItem } from '../types/doctor-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildTaskActionBlockedMessage,
  matchesAllowedStatus,
} from './workbench';

function createTask(
  overrides: Partial<PendingDiagnosticTaskItem> = {},
): PendingDiagnosticTaskItem {
  return {
    acceptedAt: null,
    caseId: 'CASE-1',
    completedAt: null,
    diagnosisDoctorName: '主诊医生',
    diagnosisDoctorUserId: 'DOC-1',
    id: 'TASK-1',
    primaryDoctorName: '责任医生',
    primaryDoctorUserId: 'DOC-2',
    reviewerName: null,
    taskStatus: 'PENDING',
    taskType: 'PRIMARY',
    ...overrides,
  };
}

describe('doctor workflow workbench helpers', () => {
  it('matches task status against the allowed set', () => {
    expect(matchesAllowedStatus('PENDING', ['PENDING', 'ASSIGNED'])).toBe(true);
    expect(matchesAllowedStatus('COMPLETED', ['PENDING', 'ASSIGNED'])).toBe(
      false,
    );
  });

  it('returns stable blocked copy for missing, unassigned and invalid task states', () => {
    expect(buildTaskActionBlockedMessage('accept', null, true, '')).toBe(
      '当前病例没有可操作的诊断任务',
    );
    expect(
      buildTaskActionBlockedMessage(
        'accept',
        createTask(),
        false,
        '主诊医生 / 责任医生',
      ),
    ).toContain('责任/初诊医生：主诊医生 / 责任医生');
    expect(
      buildTaskActionBlockedMessage(
        'start',
        createTask({ taskStatus: 'COMPLETED' }),
        true,
        '',
      ),
    ).toContain('不可开始诊断');
  });
});
