import type {
  PendingTechnicalTaskItem,
  TechnicalTrackingView,
} from '../types/technical-workflow';

import { describe, expect, it } from 'vitest';

import {
  buildWorkstationCaseContext,
  buildWorkstationQueueItems,
  buildWorkstationSummaryBuckets,
} from './workstation';

function createTask(
  overrides: Partial<PendingTechnicalTaskItem>,
): PendingTechnicalTaskItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APPLY-1',
    caseId: 'CASE-1',
    completedAt: null,
    createdAt: '2026-05-24T08:00:00',
    deadlineAt: '2026-05-24T10:00:00',
    id: 'TASK-1',
    objectId: 'OBJ-1',
    objectType: 'SPECIMEN',
    pathologyNo: 'BL-001',
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

function createTracking(
  overrides: Partial<TechnicalTrackingView> = {},
): TechnicalTrackingView {
  return {
    blocks: [],
    caseId: 'CASE-1',
    caseStatus: 'SAMPLING',
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

describe('workstation utilities', () => {
  it('sorts queue items by timeout and marks next-station tasks', () => {
    const items = buildWorkstationQueueItems(
      [
        createTask({
          createdAt: '2026-05-24T09:00:00',
          id: 'TASK-NORMAL',
          taskType: 'GROSSING',
        }),
        createTask({
          id: 'TASK-NEXT',
          objectType: 'SAMPLING_BLOCK',
          taskType: 'DEHYDRATION',
        }),
        createTask({
          id: 'TASK-TIMEOUT',
          timedOut: true,
        }),
      ],
      'GROSSING',
    );

    expect(items.map((item) => item.task.id)).toEqual([
      'TASK-TIMEOUT',
      'TASK-NEXT',
      'TASK-NORMAL',
    ]);
    expect(items[1]?.badges).toContain('下一工位待衔接');
  });

  it('builds production reminders and next flow from real tracking fields', () => {
    const context = buildWorkstationCaseContext(
      createTracking({
        embeddingBoxes: [
          {
            embeddingBoxId: 'BOX-1',
            embeddingBoxNo: 'BX-001',
            slideCount: 0,
            sliceNotice: '薄切',
            specimenId: 'SPEC-1',
          },
        ],
        events: [
          {
            eventContent: '完成取材',
            eventStatus: 'SUCCESS',
            eventTime: '2026-05-24T09:00:00',
            eventType: 'COMPLETE',
            nodeCode: 'GROSSING',
            operatorName: '技师',
          },
        ],
        qcEvaluations: [
          {
            evaluatedAt: '2026-05-24T10:00:00',
            evaluationResult: 'REWORK_REQUIRED',
            evaluatorName: '质控员',
            improvementSuggestion: '重新切片',
            issueDescription: '褶皱',
            qcEvaluationId: 'QC-1',
            qcType: 'HE',
            remarks: null,
            slideId: 'SLIDE-1',
            slideNo: 'SL-001',
            specimenId: 'SPEC-1',
          },
        ],
        reworks: [
          {
            reason: '染色偏浅',
            reworkOrderId: 'RW-1',
            reworkType: 'RESTAIN',
            status: 'PENDING',
          },
        ],
        technicalTasks: [
          createTask({
            id: 'TASK-EMBEDDING',
            objectType: 'SAMPLING_BLOCK',
            taskType: 'EMBEDDING',
          }),
        ],
      }),
      'DEHYDRATION',
    );

    expect(context.nextFlowLabel).toBe('包埋工作站');
    expect(context.pendingReworkCount).toBe(1);
    expect(context.currentTaskSuggestions).toEqual([
      '薄切',
      '重新切片',
      '染色偏浅',
    ]);
    expect(context.alerts.map((alert) => alert.action?.label)).toEqual([
      '进入返工',
      '查看生产轨迹',
      '进入下一工位',
    ]);
    expect(context.recentEvents).toHaveLength(1);
  });

  it('summarizes workstation buckets with task counts', () => {
    const buckets = buildWorkstationSummaryBuckets([
      createTask({ id: 'TASK-1', taskStatus: 'PENDING', taskType: 'GROSSING' }),
      createTask({
        id: 'TASK-2',
        taskStatus: 'IN_PROGRESS',
        taskType: 'GROSSING',
      }),
      createTask({
        id: 'TASK-3',
        taskStatus: 'PENDING',
        taskType: 'SLICING',
        timedOut: true,
      }),
    ]);

    expect(buckets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          inProgress: 1,
          pending: 1,
          taskType: 'GROSSING',
          timedOut: 0,
          title: '取材描写工作站',
        }),
        expect.objectContaining({
          pending: 1,
          taskType: 'SLICING',
          timedOut: 1,
          title: '切片工作站',
        }),
      ]),
    );
  });

  it('keeps staining flow out of the rework station by default', () => {
    const context = buildWorkstationCaseContext(createTracking(), 'STAINING');
    expect(context.nextFlowLabel).toBe('后续诊断流程');
    expect(context.alerts).toEqual([]);
  });

  it('keeps the latest eight tracking events in reverse chronological order', () => {
    const events = Array.from({ length: 10 }, (_, index) => ({
      eventContent: `事件 ${index + 1}`,
      eventStatus: 'SUCCESS',
      eventTime: `2026-06-18T${String(8 + index).padStart(2, '0')}:00:00`,
      eventType: 'START',
      nodeCode: 'GROSSING',
      operatorName: '技师',
    }));

    const context = buildWorkstationCaseContext(
      createTracking({
        events,
      }),
    );

    expect(context.recentEvents.map((event) => event.eventContent)).toEqual([
      '事件 10',
      '事件 9',
      '事件 8',
      '事件 7',
      '事件 6',
      '事件 5',
      '事件 4',
      '事件 3',
    ]);
  });
});
