import type {
  TechnicalTrackingView,
  WorkstationCaseContext,
} from '../types/technical-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildTrackingTreeData,
  buildWorkflowTimelineSteps,
  resolveInitialTrackingTab,
  resolveSelectedTrackingNodeId,
} from './tracking';

function createTracking(
  overrides: Partial<TechnicalTrackingView> = {},
): TechnicalTrackingView {
  return {
    blocks: [],
    caseId: 'CASE-001',
    caseStatus: 'GROSSING_PENDING',
    embeddingBoxes: [],
    events: [],
    pathologyNo: 'BL-001',
    qcEvaluations: [],
    reworks: [],
    slides: [],
    specimens: [],
    technicalTasks: [],
    ...overrides,
  };
}

function createContext(
  overrides: Partial<WorkstationCaseContext> = {},
): WorkstationCaseContext {
  return {
    activeTaskCount: 0,
    alerts: [],
    blockCount: 0,
    caseId: 'CASE-001',
    caseStatus: 'GROSSING_PENDING',
    currentTaskSuggestions: [],
    embeddingBoxCount: 0,
    nextFlowLabel: '脱水',
    pathologyNo: 'BL-001',
    pendingReworkCount: 0,
    progressNodes: [
      {
        id: 'CASE-001',
        label: 'BL-001',
        type: 'CASE',
      },
      {
        id: 'SPEC-001',
        label: 'SP-001',
        parentId: 'CASE-001',
        type: 'SPECIMEN',
      },
    ],
    recentEvents: [],
    slideCount: 0,
    specimenCount: 1,
    ...overrides,
  };
}

describe('tracking utils', () => {
  it('resolves initial tab with fallback', () => {
    expect(resolveInitialTrackingTab('abnormal')).toBe('abnormal');
    expect(resolveInitialTrackingTab('invalid')).toBe('timeline');
  });

  it('prefers objectId and then task objectId when selecting tracking node', () => {
    const tracking = createTracking({
      technicalTasks: [
        {
          applicationId: 'APP-001',
          applicationNo: 'APP-001',
          caseId: 'CASE-001',
          completedAt: null,
          createdAt: null,
          deadlineAt: null,
          id: 'TASK-001',
          objectId: 'SPEC-001',
          objectType: 'SPECIMEN',
          pathologyNo: 'BL-001',
          payload: null,
          remarks: null,
          specimenId: null,
          startedAt: null,
          taskStatus: 'PENDING',
          taskType: 'GROSSING',
          timedOut: false,
          timeoutRuleCode: null,
        },
      ],
    });

    expect(
      resolveSelectedTrackingNodeId(
        { objectId: 'SLIDE-001', taskId: 'TASK-001' },
        'timeline',
        tracking,
      ),
    ).toBe('SLIDE-001');

    expect(
      resolveSelectedTrackingNodeId(
        { objectId: '', taskId: 'TASK-001' },
        'timeline',
        tracking,
      ),
    ).toBe('SPEC-001');
  });

  it('builds nested tracking tree data from workstation context', () => {
    const tree = buildTrackingTreeData(createContext());

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children[0]?.id).toBe('SPEC-001');
  });

  it('builds workflow timeline status from tasks and events', () => {
    const tracking = createTracking({
      events: [
        {
          eventContent: '完成取材',
          eventStatus: 'SUCCESS',
          eventTime: '2026-05-31T10:00:00',
          eventType: 'COMPLETE',
          nodeCode: 'GROSSING',
          operatorName: '技师甲',
        },
      ],
      technicalTasks: [
        {
          applicationId: 'APP-001',
          applicationNo: 'APP-001',
          caseId: 'CASE-001',
          completedAt: '2026-05-31T10:00:00',
          createdAt: null,
          deadlineAt: null,
          id: 'TASK-001',
          objectId: 'SPEC-001',
          objectType: 'SPECIMEN',
          pathologyNo: 'BL-001',
          payload: null,
          remarks: null,
          specimenId: null,
          startedAt: '2026-05-31T09:00:00',
          taskStatus: 'COMPLETED',
          taskType: 'GROSSING',
          timedOut: false,
          timeoutRuleCode: null,
        },
        {
          applicationId: 'APP-001',
          applicationNo: 'APP-001',
          caseId: 'CASE-001',
          completedAt: null,
          createdAt: null,
          deadlineAt: null,
          id: 'TASK-002',
          objectId: 'SPEC-001',
          objectType: 'SPECIMEN',
          pathologyNo: 'BL-001',
          payload: null,
          remarks: null,
          specimenId: null,
          startedAt: null,
          taskStatus: 'PENDING',
          taskType: 'DEHYDRATION',
          timedOut: false,
          timeoutRuleCode: null,
        },
      ],
    });

    const steps = buildWorkflowTimelineSteps(
      tracking,
      createContext({
        recentEvents: tracking.events,
      }),
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
    );

    expect(steps[0]?.status).toBe('completed');
    expect(steps[1]?.status).toBe('current');
    expect(steps[0]?.statusText).toBe('SUCCESS');
  });
});
