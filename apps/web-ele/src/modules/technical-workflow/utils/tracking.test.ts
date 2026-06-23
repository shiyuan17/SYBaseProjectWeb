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
      (event) => event.eventContent ?? '-',
    );

    expect(steps[0]?.status).toBe('completed');
    expect(steps[1]?.status).toBe('current');
    expect(steps[0]?.statusText).toBe('SUCCESS');
  });

  it('formats English timeline content into Chinese fallback text', () => {
    const tracking = createTracking({
      events: [
        {
          eventContent: 'Grossing started',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T11:18:55',
          eventType: 'START',
          nodeCode: 'GROSSING',
          operatorName: '技师甲',
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
      (event) => {
        if (event.eventType === 'START' && event.nodeCode === 'GROSSING') {
          return '取材开始';
        }
        return '技术流程事件';
      },
    );

    expect(steps[0]?.content).toBe('取材开始');
  });

  it('falls back to node-specific task and record data when no event exists', () => {
    const tracking = createTracking({
      embeddingBoxes: [
        {
          embeddingBoxId: 'BOX-001',
          embeddingBoxNo: 'A1',
          slideCount: 1,
          sliceNotice: '薄切',
          specimenId: 'SPEC-001',
        },
      ],
      qcEvaluations: [
        {
          evaluatedAt: '2026-06-18T13:30:00',
          evaluationResult: 'REWORK_REQUIRED',
          evaluatorName: '质控员甲',
          improvementSuggestion: '重新切片',
          issueDescription: '切片皱褶',
          qcEvaluationId: 'QC-001',
          qcType: 'HE',
          remarks: '追加质控',
          slideId: 'SLIDE-001',
          slideNo: 'SL-001',
          specimenId: 'SPEC-001',
        },
      ],
      reworks: [
        {
          reason: '染色偏浅',
          reworkOrderId: 'RW-001',
          reworkType: 'RESTAIN',
          status: 'PENDING',
        },
      ],
      technicalTasks: [
        {
          applicationId: 'APP-001',
          applicationNo: 'APP-001',
          assignedToName: '技师甲',
          assignedToUserId: 'USER-1',
          caseId: 'CASE-001',
          completedAt: null,
          createdAt: '2026-06-18T10:00:00',
          currentNode: 'DEHYDRATION',
          deadlineAt: null,
          id: 'TASK-001',
          objectId: 'SPEC-001',
          objectType: 'SPECIMEN',
          pathologyNo: 'BL-001',
          payload: null,
          priority: null,
          remarks: '等待脱水',
          specimenId: 'SPEC-001',
          startedAt: '2026-06-18T10:30:00',
          taskStatus: 'IN_PROGRESS',
          taskType: 'DEHYDRATION',
          timedOut: false,
          timeoutRuleCode: null,
        },
      ],
    });

    const steps = buildWorkflowTimelineSteps(
      tracking,
      createContext({
        recentEvents: [],
      }),
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (event) => event.eventContent ?? '-',
    );

    expect(steps[1]).toMatchObject({
      content: '等待脱水',
      operatorName: '技师甲',
      status: 'current',
      statusText: 'IN_PROGRESS',
      time: '2026-06-18T10:30:00',
      title: '脱水',
    });
    expect(steps[2]).toMatchObject({
      content: '薄切',
      status: 'pending',
      title: '包埋',
    });
    expect(steps[5]).toMatchObject({
      content: '切片皱褶；重新切片；染色偏浅',
      operatorName: '质控员甲',
      status: 'pending',
      statusText: '-',
      time: '2026-06-18T13:30:00',
      title: '质控闭环',
    });
  });

  it('uses a unified empty placeholder for future nodes without any data', () => {
    const steps = buildWorkflowTimelineSteps(
      createTracking(),
      createContext({
        recentEvents: [],
      }),
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      () => '技术流程事件',
    );

    expect(steps[0]).toMatchObject({
      content: '暂无记录',
      operatorName: '暂无记录',
      status: 'current',
      statusText: '待处理',
      time: '暂无记录',
      title: '取材描写',
    });
    expect(steps[1]).toMatchObject({
      content: '暂无记录',
      operatorName: '暂无记录',
      status: 'pending',
      statusText: '-',
      time: '暂无记录',
      title: '脱水',
    });
  });

  it('does not echo unknown English timeline content', () => {
    const tracking = createTracking({
      events: [
        {
          eventContent: 'Unexpected english content',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T11:18:55',
          eventType: 'SYNC',
          nodeCode: 'UNKNOWN_NODE',
          operatorName: '技师甲',
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
      () => '技术流程事件',
    );

    expect(
      steps.some((step) => step.content.includes('Unexpected english')),
    ).toBe(false);
  });

  it('uses all tracking events for timeline nodes instead of truncated recent events', () => {
    const oldEvents = Array.from({ length: 8 }, (_, index) => ({
      eventContent: `早期事件 ${index + 1}`,
      eventStatus: 'SUCCESS',
      eventTime: `2026-06-18T08:0${index}:00`,
      eventType: 'START',
      nodeCode: 'GROSSING',
      operatorName: '早期技师',
    }));
    const tracking = createTracking({
      events: [
        ...oldEvents,
        {
          eventContent: '脱水完成',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T13:10:00',
          eventType: 'COMPLETE',
          nodeCode: 'DEHYDRATION',
          operatorName: '脱水技师',
        },
        {
          eventContent: '切片完成',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T15:20:00',
          eventType: 'COMPLETE',
          nodeCode: 'SLICING',
          operatorName: '切片技师',
        },
      ],
    });

    const steps = buildWorkflowTimelineSteps(
      tracking,
      createContext({
        recentEvents: oldEvents,
      }),
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (event) => event.eventContent ?? '-',
    );

    expect(steps[1]).toMatchObject({
      content: '脱水完成',
      operatorName: '脱水技师',
      status: 'completed',
      time: '2026-06-18T13:10:00',
      title: '脱水',
    });
    expect(steps[3]).toMatchObject({
      content: '切片完成',
      operatorName: '切片技师',
      status: 'completed',
      time: '2026-06-18T15:20:00',
      title: '切片',
    });
  });

  it('prefers complete events over start events for the same timeline node', () => {
    const tracking = createTracking({
      events: [
        {
          eventContent: '开始脱水',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T11:00:00',
          eventType: 'START',
          nodeCode: 'DEHYDRATION',
          operatorName: '开始技师',
        },
        {
          eventContent: '完成脱水',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-18T12:30:00',
          eventType: 'COMPLETE',
          nodeCode: 'DEHYDRATION',
          operatorName: '完成技师',
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
      (event) => event.eventContent ?? '-',
    );

    expect(steps[1]).toMatchObject({
      content: '完成脱水',
      operatorName: '完成技师',
      status: 'completed',
      time: '2026-06-18T12:30:00',
    });
  });

  it('marks upstream nodes completed when downstream workflow is already completed', () => {
    const tracking = createTracking({
      events: [
        {
          eventContent: '完成脱水',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-19T05:30:00',
          eventType: 'COMPLETE',
          nodeCode: 'DEHYDRATION',
          operatorName: '脱水技师',
        },
        {
          eventContent: '包埋开始',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-19T06:41:47',
          eventType: 'START',
          nodeCode: 'EMBEDDING',
          operatorName: '病理科管理员',
        },
        {
          eventContent: '切片完成',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-19T08:20:00',
          eventType: 'COMPLETE',
          nodeCode: 'SLICING',
          operatorName: '切片技师',
        },
        {
          eventContent: '染色完成',
          eventStatus: 'SUCCESS',
          eventTime: '2026-06-19T09:10:00',
          eventType: 'COMPLETE',
          nodeCode: 'STAINING',
          operatorName: '染色技师',
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
      (event) => event.eventContent ?? '-',
    );

    expect(steps[2]).toMatchObject({
      content: '包埋开始',
      operatorName: '病理科管理员',
      status: 'completed',
      time: '2026-06-19T06:41:47',
      title: '包埋',
    });
  });

  it('falls back to stained slide status when staining events are absent', () => {
    const tracking = createTracking({
      slides: [
        {
          embeddingBoxId: 'BOX-001',
          qualityStatus: null,
          slideId: 'SLIDE-001',
          slideNo: 'SL20260623004',
          slideStatus: 'STAINED',
          specimenId: 'SPEC-001',
        },
      ],
    });

    const steps = buildWorkflowTimelineSteps(
      tracking,
      createContext({
        recentEvents: [],
      }),
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      (value) => value ?? '-',
      () => '技术流程事件',
    );

    expect(steps[4]).toMatchObject({
      content: '已染色玻片：SL20260623004',
      status: 'completed',
      statusText: '已染色',
      title: '染色出片',
    });
  });
});
