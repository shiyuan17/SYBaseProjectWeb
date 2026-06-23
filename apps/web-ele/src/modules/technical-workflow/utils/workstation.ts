import type {
  ObjectProgressNode,
  PendingTechnicalTaskItem,
  TechnicalTrackingView,
  TechnicalWorkflowAlert,
  TechnicalWorkflowChainType,
  TechnicalWorkflowTaskType,
  WorkstationCaseContext,
  WorkstationQueueItem,
  WorkstationSummaryBucket,
} from '../types/technical-workflow';

import {
  NEXT_TASK_TYPE_MAP,
  TASK_TYPE_ROUTE_MAP,
  TASK_TYPE_TITLE_MAP,
} from '../constants';

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function dedupeStrings(values: Array<null | string | undefined>) {
  return [
    ...new Set(values.map((item) => normalizeText(item)).filter(Boolean)),
  ];
}

function sortEventsByLatestFirst<T extends { eventTime: null | string }>(
  events: T[],
) {
  return [...events].toSorted((left, right) =>
    normalizeText(right.eventTime).localeCompare(normalizeText(left.eventTime)),
  );
}

function createAlert(
  id: string,
  title: string,
  description: string,
  severity: TechnicalWorkflowAlert['severity'],
  action?: TechnicalWorkflowAlert['action'],
): TechnicalWorkflowAlert {
  return {
    action,
    description,
    id,
    severity,
    title,
  };
}

export function buildWorkstationQueueItems(
  items: PendingTechnicalTaskItem[],
  currentTaskType?: null | string,
): WorkstationQueueItem[] {
  return items
    .map((task) => {
      const nextTaskType = currentTaskType
        ? NEXT_TASK_TYPE_MAP[currentTaskType as TechnicalWorkflowTaskType]
        : undefined;
      const badges = dedupeStrings([
        task.timedOut ? '超时' : '',
        task.taskStatus === 'IN_PROGRESS' ? '处理中' : '',
        nextTaskType && nextTaskType === task.taskType ? '下一工位待衔接' : '',
        task.remarks ? '有备注' : '',
      ]);
      let alertLevel: WorkstationQueueItem['alertLevel'] = 'info';
      if (task.timedOut) {
        alertLevel = 'danger';
      } else if (task.taskStatus === 'IN_PROGRESS') {
        alertLevel = 'warning';
      }

      return {
        alertLevel,
        badges,
        searchText: [
          task.id,
          task.pathologyNo,
          task.caseId,
          task.applicationNo,
          task.objectId,
          task.objectType,
          task.taskType,
          task.remarks,
        ]
          .map((value) => normalizeText(value))
          .filter(Boolean)
          .join(' '),
        task,
      };
    })
    .toSorted((left, right) => {
      if (left.task.timedOut !== right.task.timedOut) {
        return left.task.timedOut ? -1 : 1;
      }
      if (left.task.taskStatus !== right.task.taskStatus) {
        if (left.task.taskStatus === 'PENDING') {
          return -1;
        }
        if (right.task.taskStatus === 'PENDING') {
          return 1;
        }
      }
      if (left.task.pathologyNo !== right.task.pathologyNo) {
        return normalizeText(left.task.pathologyNo).localeCompare(
          normalizeText(right.task.pathologyNo),
          'zh-CN',
        );
      }
      return normalizeText(left.task.createdAt).localeCompare(
        normalizeText(right.task.createdAt),
      );
    });
}

export function buildWorkstationCaseContext(
  tracking: TechnicalTrackingView,
  currentTaskType?: null | string,
): WorkstationCaseContext {
  const alerts: TechnicalWorkflowAlert[] = [];
  const activeTasks = tracking.technicalTasks.filter(
    (task) =>
      task.taskStatus === 'IN_PROGRESS' || task.taskStatus === 'PENDING',
  );
  const pendingReworks = tracking.reworks.filter(
    (item) => item.status !== 'COMPLETED',
  );
  const unqualifiedQc = tracking.qcEvaluations.find(
    (item) =>
      item.evaluationResult === 'REWORK_REQUIRED' ||
      item.evaluationResult === 'UNQUALIFIED',
  );

  const rework = pendingReworks[0];
  if (rework) {
    alerts.push(
      createAlert(
        `rework-${rework.reworkOrderId}`,
        '存在待处理返工',
        `返工单 ${rework.reworkOrderId} 仍未闭环，建议优先确认原因并回流到对应工位。`,
        'danger',
        {
          label: '进入返工',
          query: {
            caseId: tracking.caseId,
            mode: 'exception',
            pathologyNo: tracking.pathologyNo ?? undefined,
          },
          target: {
            routeType: 'REWORK',
          },
        },
      ),
    );
  }

  if (unqualifiedQc) {
    alerts.push(
      createAlert(
        `qc-${unqualifiedQc.qcEvaluationId}`,
        '发现质控风险',
        `${unqualifiedQc.slideNo || unqualifiedQc.slideId} 存在质控问题，建议先核对问题描述和改进建议。`,
        'warning',
        {
          label: '查看生产轨迹',
          query: {
            caseId: tracking.caseId,
            tab: 'abnormal',
          },
          target: {
            routeType: 'TRACKING',
          },
        },
      ),
    );
  }

  const downstreamTaskType = currentTaskType
    ? NEXT_TASK_TYPE_MAP[currentTaskType as TechnicalWorkflowTaskType]
    : undefined;

  let nextFlowLabel = '复核/闭环';
  if (downstreamTaskType) {
    nextFlowLabel =
      TASK_TYPE_TITLE_MAP[downstreamTaskType] ?? downstreamTaskType;
  } else if (currentTaskType === 'STAINING') {
    nextFlowLabel = '后续诊断流程';
  } else if (pendingReworks.length > 0) {
    nextFlowLabel = '返工回流';
  }

  if (downstreamTaskType) {
    const downstreamCount = activeTasks.filter(
      (item) => item.taskType === downstreamTaskType,
    ).length;
    if (downstreamCount > 0) {
      alerts.push(
        createAlert(
          `downstream-${downstreamTaskType}`,
          '存在下一工位待衔接任务',
          `${TASK_TYPE_TITLE_MAP[downstreamTaskType] ?? downstreamTaskType} 当前已有 ${downstreamCount} 条待办，可在完成当前对象后继续处理。`,
          'info',
          {
            label: '进入下一工位',
            query: {
              caseId: tracking.caseId,
              mode: 'queue',
              pathologyNo: tracking.pathologyNo ?? undefined,
            },
            target: {
              routeType: 'TASK_TYPE',
              taskType: downstreamTaskType as TechnicalWorkflowTaskType,
            },
          },
        ),
      );
    }
  }

  const progressNodes: ObjectProgressNode[] = [
    {
      id: tracking.caseId,
      label: tracking.pathologyNo || tracking.caseId,
      secondaryLabel: tracking.caseStatus,
      type: 'CASE',
    },
    ...tracking.specimens.map((item) => ({
      id: item.specimenId,
      label: item.specimenNo || item.specimenId,
      parentId: tracking.caseId,
      secondaryLabel: item.specimenName,
      status: item.specimenStatus,
      type: 'SPECIMEN' as const,
    })),
    ...tracking.blocks.map((item) => ({
      id: item.blockId,
      label: item.blockCode || item.blockId,
      parentId: item.specimenId,
      secondaryLabel: item.description,
      type: 'SAMPLING_BLOCK' as const,
    })),
    ...tracking.embeddingBoxes.map((item) => ({
      id: item.embeddingBoxId,
      label: item.embeddingBoxNo || item.embeddingBoxId,
      parentId: item.specimenId,
      secondaryLabel: item.sliceNotice,
      type: 'EMBEDDING_BOX' as const,
    })),
    ...tracking.slides.map((item) => ({
      id: item.slideId,
      label: item.slideNo || item.slideId,
      parentId: item.embeddingBoxId || item.specimenId,
      secondaryLabel: item.qualityStatus,
      status: item.slideStatus,
      type: 'SLIDE' as const,
    })),
  ];

  return {
    activeTaskCount: activeTasks.length,
    alerts,
    blockCount: tracking.blocks.length,
    caseId: tracking.caseId,
    caseStatus: tracking.caseStatus,
    currentTaskSuggestions: dedupeStrings([
      tracking.embeddingBoxes
        .map((item) => item.sliceNotice)
        .filter((item) => normalizeText(item))
        .join('；'),
      tracking.qcEvaluations[0]?.improvementSuggestion,
      tracking.reworks[0]?.reason,
    ]),
    embeddingBoxCount: tracking.embeddingBoxes.length,
    nextFlowLabel,
    pathologyNo: tracking.pathologyNo,
    pendingReworkCount: pendingReworks.length,
    progressNodes,
    recentEvents: sortEventsByLatestFirst(tracking.events).slice(0, 8),
    slideCount: tracking.slides.length,
    specimenCount: tracking.specimens.length,
  };
}

function resolveSummaryChain(
  taskType: TechnicalWorkflowTaskType,
): TechnicalWorkflowChainType {
  if (taskType === 'FROZEN') {
    return 'FROZEN';
  }
  if (taskType === 'REWORK') {
    return 'EXCEPTION';
  }
  return 'REGULAR';
}

export function buildWorkstationSummaryBuckets(
  items: PendingTechnicalTaskItem[],
): WorkstationSummaryBucket[] {
  const byType = new Map<string, PendingTechnicalTaskItem[]>();
  items.forEach((item) => {
    const taskType = normalizeText(item.taskType);
    if (!taskType) {
      return;
    }
    byType.set(taskType, [...(byType.get(taskType) ?? []), item]);
  });

  return [...byType.entries()]
    .map(([taskType, bucketItems]) => {
      const normalizedTaskType = taskType as TechnicalWorkflowTaskType;
      return {
        chain: resolveSummaryChain(normalizedTaskType),
        inProgress: bucketItems.filter(
          (item) => item.taskStatus === 'IN_PROGRESS',
        ).length,
        path:
          TASK_TYPE_ROUTE_MAP[normalizedTaskType] ??
          '/technical-workflow/tasks',
        pending: bucketItems.filter((item) => item.taskStatus === 'PENDING')
          .length,
        taskType: normalizedTaskType,
        timedOut: bucketItems.filter((item) => item.timedOut).length,
        title: TASK_TYPE_TITLE_MAP[normalizedTaskType] ?? normalizedTaskType,
      };
    })
    .toSorted((left, right) => left.path.localeCompare(right.path));
}
