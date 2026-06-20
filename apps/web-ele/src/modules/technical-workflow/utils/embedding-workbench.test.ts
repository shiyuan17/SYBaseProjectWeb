import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { describe, expect, it } from 'vitest';

import {
  formatShortEmbeddingBoxNo,
  getEmbeddingBlockDisplayNo,
  getEmbeddingRecordBlockDisplayNo,
  getEmbeddingWorkstationRemark,
} from './embedding-workbench';

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
    taskType: 'EMBEDDING',
    timedOut: false,
    timeoutRuleCode: null,
    ...overrides,
  };
}

describe('embedding workbench helpers', () => {
  it('extracts short cassette labels from scoped embedding box numbers', () => {
    expect(formatShortEmbeddingBoxNo('BX-BD202606080002-A1')).toBe('A1');
    expect(formatShortEmbeddingBoxNo('A2')).toBe('A2');
    expect(formatShortEmbeddingBoxNo('BK20260618001')).toBe('BK20260618001');
  });

  it('prefers object display number over internal sampling block code', () => {
    const task = createTask({
      objectDisplayNo: 'A1',
      samplingBlockCode: 'BK20260618001',
    });

    expect(getEmbeddingBlockDisplayNo(task)).toBe('A1');
  });

  it('prefers embedding remarks over task remarks', () => {
    const task = createTask({
      embeddingRemarks: '皮肤组织',
      remarks: '普通备注',
    });

    expect(getEmbeddingWorkstationRemark(task)).toBe('皮肤组织');
  });

  it('falls back to task remarks when embedding remarks are absent', () => {
    const task = createTask({
      remarks: '普通备注',
    });

    expect(getEmbeddingWorkstationRemark(task)).toBe('普通备注');
  });

  it('prefers formatted embedding box number for completed records', () => {
    expect(
      getEmbeddingRecordBlockDisplayNo({
        embeddingBoxNo: 'BX-BD202606080002-B2',
        samplingBlockCode: 'BK20260618002',
      }),
    ).toBe('B2');
  });
});
