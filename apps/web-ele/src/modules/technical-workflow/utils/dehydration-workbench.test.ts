import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildDehydrationWorkbenchStats,
  getDehydrationTaskOperator,
  getDehydrationTaskRemark,
} from './dehydration-workbench';

function createTask(
  overrides: Partial<PendingTechnicalTaskItem> = {},
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APPLY-1',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: '2026-06-01T15:11:24',
    deadlineAt: null,
    id: 'TASK-1',
    objectId: 'BLOCK-1',
    objectType: 'SAMPLING_BLOCK',
    pathologyNo: 'S2600057',
    payload: null,
    remarks: null,
    specimenId: 'SPEC-1',
    startedAt: null,
    taskStatus: 'PENDING',
    taskType: 'DEHYDRATION',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

describe('dehydration workbench helpers', () => {
  it('builds old-workstation counters from task statuses', () => {
    const stats = buildDehydrationWorkbenchStats([
      createTask(),
      createTask({ id: 'TASK-2', taskStatus: 'IN_PROGRESS' }),
      createTask({ id: 'TASK-3', taskStatus: 'COMPLETED' }),
    ]);

    expect(stats).toEqual([
      { label: '总蜡块', tone: 'info', value: 3 },
      { label: '未脱水', tone: 'danger', value: 1 },
      { label: '脱水中', tone: 'warning', value: 1 },
      { label: '脱水完成', tone: 'success', value: 1 },
    ]);
  });

  it('prefers production remarks and assigned operator when available', () => {
    const task = createTask({
      assignedToName: '王技师',
      productionRemarks: '优先处理',
      remarks: '普通备注',
    });

    expect(getDehydrationTaskRemark(task)).toBe('优先处理');
    expect(getDehydrationTaskOperator(task)).toBe('王技师');
  });

  it('falls back to empty strings for legacy rows without operator metadata', () => {
    const task = createTask();

    expect(getDehydrationTaskRemark(task)).toBe('');
    expect(getDehydrationTaskOperator(task)).toBe('');
  });
});
