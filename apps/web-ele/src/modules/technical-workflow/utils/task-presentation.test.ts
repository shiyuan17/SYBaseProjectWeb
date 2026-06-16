import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { describe, expect, it } from 'vitest';

import {
  formatCurrentNode,
  formatResponsible,
  getPriorityTagType,
  getTaskStatusTagType,
} from './task-presentation';

function createTask(
  overrides: Partial<PendingTechnicalTaskItem> = {},
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APP-20260530-001',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: '2026-05-30T08:00:00',
    deadlineAt: null,
    id: 'TASK-1',
    objectId: 'SPEC-1',
    objectType: 'SPECIMEN',
    pathologyNo: 'BL-20260530-001',
    payload: null,
    remarks: null,
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'GROSSING',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

describe('task presentation helpers', () => {
  it('maps task status to Element Plus tag types', () => {
    expect(getTaskStatusTagType('COMPLETED')).toBe('success');
    expect(getTaskStatusTagType('IN_PROGRESS')).toBe('warning');
    expect(getTaskStatusTagType('PENDING')).toBe('info');
    expect(getTaskStatusTagType(null)).toBe('info');
  });

  it('maps priority to Element Plus tag types', () => {
    expect(getPriorityTagType('STAT')).toBe('danger');
    expect(getPriorityTagType('PRIORITY')).toBe('warning');
    expect(getPriorityTagType('ROUTINE')).toBe('info');
    expect(getPriorityTagType(undefined)).toBe('info');
  });

  it('prefers current node label and falls back to task type formatting', () => {
    expect(formatCurrentNode(createTask({ currentNode: 'SLICING' }))).toBe(
      '切片工作站',
    );
    expect(formatCurrentNode(createTask({ currentNode: null }))).toBe(
      '取材描写工作站',
    );
    expect(formatCurrentNode(createTask({ currentNode: 'CUSTOM_NODE' }))).toBe(
      'CUSTOM_NODE',
    );
  });

  it('formats responsible technician with a stable unassigned fallback', () => {
    expect(
      formatResponsible(createTask({ assignedToName: '  张技师  ' })),
    ).toBe('张技师');
    expect(formatResponsible(createTask({ assignedToName: '   ' }))).toBe(
      '未分派',
    );
    expect(formatResponsible(createTask({ assignedToName: null }))).toBe(
      '未分派',
    );
  });
});
