import type {
  ObjectProgressNode,
  TechnicalTrackingEventSummary,
  TechnicalTrackingView as TechnicalTrackingViewModel,
  TechnicalWorkflowDeepLinkQuery,
  WorkstationCaseContext,
} from '../types/technical-workflow';

export type TrackingTab = NonNullable<TechnicalWorkflowDeepLinkQuery['tab']>;

export interface TrackingTreeNode {
  children: TrackingTreeNode[];
  id: string;
  label: string;
  secondaryLabel?: null | string;
  status?: null | string;
  type: ObjectProgressNode['type'];
}

export interface WorkflowTimelineStep {
  content: string;
  index: number;
  nodeCode: string;
  operatorName: string;
  status: 'completed' | 'current' | 'pending';
  statusText: string;
  time: string;
  title: string;
}

type TrackingSelectionTarget = Pick<
  ObjectProgressNode,
  'id' | 'secondaryLabel' | 'type'
>;

const workflowStepDefinitions = [
  { nodeCode: 'GROSSING', title: '取材描写' },
  { nodeCode: 'DEHYDRATION', title: '脱水' },
  { nodeCode: 'EMBEDDING', title: '包埋' },
  { nodeCode: 'SLICING', title: '切片' },
  { nodeCode: 'STAINING', title: '染色出片' },
  { nodeCode: 'QUALITY_CONTROL', title: '质控闭环' },
] as const;

export const TRACKING_TABS: TrackingTab[] = [
  'abnormal',
  'timeline',
  'work-items',
];

const TRACKING_TAB_SET = new Set<TrackingTab>(TRACKING_TABS);
const EMPTY_TIMELINE_VALUE = '暂无记录';
const STAINED_SLIDE_STATUS = 'STAINED';
const STAINED_STATUS_TEXT = '已染色';
const timelineEventTypePriority: Record<string, number> = {
  COMPLETE: 100,
  EVALUATE: 90,
  EXECUTE: 80,
  SLIDE_PRINT: 70,
  MARK: 60,
  START: 50,
  CREATE_BATCH: 40,
  CREATE: 30,
};

export function normalizeTrackingQueryValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveInitialTrackingTab(tabValue: unknown): TrackingTab {
  const tab = normalizeTrackingQueryValue(tabValue);
  return TRACKING_TAB_SET.has(tab as TrackingTab)
    ? (tab as TrackingTab)
    : 'timeline';
}

function resolveTaskObjectId(
  taskId: string,
  tracking: TechnicalTrackingViewModel,
) {
  if (!taskId) {
    return '';
  }
  return (
    tracking.technicalTasks
      .find((item) => item.id === taskId)
      ?.objectId?.trim() ?? ''
  );
}

function resolveAbnormalNodeId(tracking: TechnicalTrackingViewModel) {
  const qcEvaluation = tracking.qcEvaluations.find(
    (item) => item.slideId || item.specimenId,
  );
  if (qcEvaluation?.slideId?.trim()) {
    return qcEvaluation.slideId.trim();
  }
  if (qcEvaluation?.specimenId?.trim()) {
    return qcEvaluation.specimenId.trim();
  }
  return (
    tracking.technicalTasks
      .find((item) => item.objectId?.trim())
      ?.objectId?.trim() ?? tracking.caseId
  );
}

export function resolveSelectedTrackingNodeId(
  query: Pick<TechnicalWorkflowDeepLinkQuery, 'objectId' | 'taskId'>,
  activeTab: TrackingTab,
  tracking: TechnicalTrackingViewModel,
) {
  const objectId = normalizeTrackingQueryValue(query.objectId);
  if (objectId) {
    return objectId;
  }

  const taskObjectId = resolveTaskObjectId(
    normalizeTrackingQueryValue(query.taskId),
    tracking,
  );
  if (taskObjectId) {
    return taskObjectId;
  }

  if (activeTab === 'abnormal') {
    return resolveAbnormalNodeId(tracking);
  }

  return tracking.caseId;
}

export function buildTrackingTreeData(
  context: null | WorkstationCaseContext,
): TrackingTreeNode[] {
  if (!context) {
    return [];
  }

  const childrenMap = new Map<string, ObjectProgressNode[]>();
  context.progressNodes.forEach((node) => {
    const parentId = node.parentId ?? '__root__';
    childrenMap.set(parentId, [...(childrenMap.get(parentId) ?? []), node]);
  });

  const buildNode = (node: ObjectProgressNode): TrackingTreeNode => ({
    children: (childrenMap.get(node.id) ?? []).map((child) => buildNode(child)),
    id: node.id,
    label: node.label,
    secondaryLabel: node.secondaryLabel,
    status: node.status,
    type: node.type,
  });

  return (childrenMap.get('__root__') ?? []).map((node) => buildNode(node));
}

export function filterTrackingTasks(
  tracking: null | TechnicalTrackingViewModel,
  selectedNode: null | TrackingSelectionTarget,
) {
  if (!tracking) {
    return [];
  }
  if (!selectedNode || selectedNode.type === 'CASE') {
    return tracking.technicalTasks;
  }
  return tracking.technicalTasks.filter(
    (item) => item.objectId === selectedNode.id,
  );
}

export function filterTrackingReworks(
  tracking: null | TechnicalTrackingViewModel,
  selectedNode: null | TrackingSelectionTarget,
) {
  if (!tracking) {
    return [];
  }
  if (!selectedNode || selectedNode.type === 'CASE') {
    return tracking.reworks;
  }
  return tracking.reworks.filter((item) =>
    selectedNode.secondaryLabel
      ? item.reason?.includes(selectedNode.secondaryLabel ?? '')
      : true,
  );
}

export function filterTrackingQcEvaluations(
  tracking: null | TechnicalTrackingViewModel,
  selectedNode: null | TrackingSelectionTarget,
) {
  if (!tracking) {
    return [];
  }
  if (!selectedNode || selectedNode.type === 'CASE') {
    return tracking.qcEvaluations;
  }
  if (selectedNode.type === 'SLIDE') {
    return tracking.qcEvaluations.filter(
      (item) => item.slideId === selectedNode.id,
    );
  }
  if (selectedNode.type === 'SPECIMEN') {
    return tracking.qcEvaluations.filter(
      (item) => item.specimenId === selectedNode.id,
    );
  }
  return tracking.qcEvaluations;
}

export function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
}

function getEventNodeCode(event: TechnicalTrackingEventSummary) {
  const nodeCode = event.nodeCode?.trim();
  if (nodeCode) {
    return nodeCode;
  }
  if (event.eventType === 'EVALUATE') {
    return 'QUALITY_CONTROL';
  }
  return '';
}

function isCompletedEvent(event: TechnicalTrackingEventSummary) {
  return (
    event.eventStatus === 'SUCCESS' &&
    ['COMPLETE', 'EVALUATE', 'EXECUTE', 'MARK'].includes(event.eventType ?? '')
  );
}

function getTimelineEventPriority(event: TechnicalTrackingEventSummary) {
  return timelineEventTypePriority[event.eventType?.trim() ?? ''] ?? 0;
}

function compareEventForTimeline(
  left: TechnicalTrackingEventSummary,
  right: TechnicalTrackingEventSummary,
) {
  const priorityDiff =
    getTimelineEventPriority(right) - getTimelineEventPriority(left);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  return (right.eventTime?.trim() ?? '').localeCompare(
    left.eventTime?.trim() ?? '',
  );
}

function buildEventsByNode(events: TechnicalTrackingEventSummary[]) {
  const eventsByNode = new Map<string, TechnicalTrackingEventSummary>();
  events.forEach((event) => {
    const nodeCode = getEventNodeCode(event);
    if (!nodeCode) {
      return;
    }
    const previousEvent = eventsByNode.get(nodeCode);
    if (!previousEvent || compareEventForTimeline(previousEvent, event) > 0) {
      eventsByNode.set(nodeCode, event);
    }
  });
  return eventsByNode;
}

function firstMeaningfulValue(...values: Array<null | string | undefined>) {
  return (
    values.find((value) => typeof value === 'string' && value.trim()) ?? ''
  );
}

function joinMeaningfulValues(...values: Array<null | string | undefined>) {
  const normalizedValues = values
    .map((value) => value?.trim() ?? '')
    .filter(Boolean);
  return normalizedValues.length > 0
    ? [...new Set(normalizedValues)].join('；')
    : '';
}

function getStainedSlides(tracking: TechnicalTrackingViewModel) {
  return tracking.slides.filter(
    (slide) => slide.slideStatus?.trim() === STAINED_SLIDE_STATUS,
  );
}

function hasStainedSlides(tracking: TechnicalTrackingViewModel) {
  return getStainedSlides(tracking).length > 0;
}

function resolveTimelineFallbackTask(
  tracking: TechnicalTrackingViewModel,
  nodeCode: string,
) {
  return tracking.technicalTasks.find((item) => item.taskType === nodeCode);
}

function resolveTimelineFallbackContent(
  tracking: TechnicalTrackingViewModel,
  nodeCode: string,
  task?: TechnicalTrackingViewModel['technicalTasks'][number],
) {
  if (nodeCode === 'EMBEDDING') {
    return joinMeaningfulValues(
      tracking.embeddingBoxes[0]?.sliceNotice,
      tracking.embeddingRecords?.[0]?.sliceNotice,
      tracking.embeddingRecords?.[0]?.embeddingRemarks,
    );
  }
  if (nodeCode === 'QUALITY_CONTROL') {
    return joinMeaningfulValues(
      tracking.qcEvaluations[0]?.issueDescription,
      tracking.qcEvaluations[0]?.improvementSuggestion,
      tracking.reworks[0]?.reason,
    );
  }
  if (nodeCode === 'STAINING' && hasStainedSlides(tracking)) {
    const stainedSlideNos = getStainedSlides(tracking)
      .map((slide) => slide.slideNo || slide.slideId)
      .filter(Boolean);
    return stainedSlideNos.length > 0
      ? `已染色玻片：${stainedSlideNos.join('、')}`
      : STAINED_STATUS_TEXT;
  }
  return joinMeaningfulValues(task?.remarks);
}

function resolveTimelineFallbackOperatorName(
  tracking: TechnicalTrackingViewModel,
  nodeCode: string,
  task?: TechnicalTrackingViewModel['technicalTasks'][number],
) {
  if (nodeCode === 'EMBEDDING') {
    return firstMeaningfulValue(
      tracking.embeddingRecords?.[0]?.embeddedByName,
      task?.assignedToName,
    );
  }
  if (nodeCode === 'QUALITY_CONTROL') {
    return firstMeaningfulValue(
      tracking.qcEvaluations[0]?.evaluatorName,
      task?.assignedToName,
    );
  }
  return firstMeaningfulValue(task?.assignedToName);
}

function resolveTimelineFallbackTime(
  tracking: TechnicalTrackingViewModel,
  nodeCode: string,
  task?: TechnicalTrackingViewModel['technicalTasks'][number],
) {
  if (nodeCode === 'EMBEDDING') {
    return firstMeaningfulValue(
      tracking.embeddingRecords?.[0]?.endedAt,
      tracking.embeddingRecords?.[0]?.startedAt,
      task?.completedAt,
      task?.startedAt,
    );
  }
  if (nodeCode === 'QUALITY_CONTROL') {
    return firstMeaningfulValue(
      tracking.qcEvaluations[0]?.evaluatedAt,
      task?.completedAt,
      task?.startedAt,
    );
  }
  return firstMeaningfulValue(task?.completedAt, task?.startedAt);
}

export function buildWorkflowTimelineSteps(
  tracking: null | TechnicalTrackingViewModel,
  context: null | WorkstationCaseContext,
  formatDateTime: (value?: null | string) => string,
  formatEventStatus: (value?: null | string) => string,
  formatNullable: (value?: null | string) => string,
  formatTaskStatus: (value?: null | string) => string,
  formatEventContent: (event: TechnicalTrackingEventSummary) => string,
): WorkflowTimelineStep[] {
  if (!tracking || !context) {
    return [];
  }

  const eventsByNode = buildEventsByNode(tracking.events);

  const activeTaskNode = tracking.technicalTasks.find(
    (task) =>
      task.taskStatus === 'IN_PROGRESS' || task.taskStatus === 'PENDING',
  )?.taskType;

  const completedNodeCodes = new Set(
    tracking.technicalTasks
      .filter((task) => task.taskStatus === 'COMPLETED' && task.taskType)
      .map((task) => task.taskType as string),
  );
  const completedEventNodeCodes = new Set(
    tracking.events
      .filter((event) => isCompletedEvent(event))
      .map((event) => getEventNodeCode(event))
      .filter(Boolean),
  );
  if (hasStainedSlides(tracking)) {
    completedEventNodeCodes.add('STAINING');
  }

  let lastCompletedIndex = -1;
  workflowStepDefinitions.forEach((step, index) => {
    if (
      completedNodeCodes.has(step.nodeCode) ||
      completedEventNodeCodes.has(step.nodeCode)
    ) {
      lastCompletedIndex = index;
    }
  });

  const activeNodeIndex = activeTaskNode
    ? workflowStepDefinitions.findIndex(
        (step) => step.nodeCode === activeTaskNode,
      )
    : -1;
  const currentIndex =
    activeNodeIndex >= 0
      ? activeNodeIndex
      : Math.min(lastCompletedIndex + 1, workflowStepDefinitions.length - 1);

  return workflowStepDefinitions.map((step, index) => {
    const latestEvent = eventsByNode.get(step.nodeCode);
    const task = resolveTimelineFallbackTask(tracking, step.nodeCode);
    const completed =
      completedNodeCodes.has(step.nodeCode) ||
      completedEventNodeCodes.has(step.nodeCode) ||
      index < lastCompletedIndex;

    let status: WorkflowTimelineStep['status'] = 'pending';
    if (completed) {
      status = 'completed';
    } else if (index === currentIndex) {
      status = 'current';
    }

    let statusText = '-';
    if (latestEvent) {
      statusText = formatEventStatus(latestEvent.eventStatus);
    } else if (step.nodeCode === 'STAINING' && hasStainedSlides(tracking)) {
      statusText = STAINED_STATUS_TEXT;
    } else if (task) {
      statusText = formatTaskStatus(task.taskStatus);
    } else if (status === 'current') {
      statusText = '待处理';
    }

    const fallbackContent = resolveTimelineFallbackContent(
      tracking,
      step.nodeCode,
      task,
    );
    const fallbackOperatorName = resolveTimelineFallbackOperatorName(
      tracking,
      step.nodeCode,
      task,
    );
    const fallbackTime = resolveTimelineFallbackTime(
      tracking,
      step.nodeCode,
      task,
    );

    return {
      content: latestEvent
        ? formatEventContent(latestEvent)
        : formatNullable(fallbackContent || EMPTY_TIMELINE_VALUE),
      index: index + 1,
      nodeCode: step.nodeCode,
      operatorName: formatNullable(
        (latestEvent?.operatorName ?? fallbackOperatorName) ||
          EMPTY_TIMELINE_VALUE,
      ),
      status,
      statusText,
      time:
        latestEvent?.eventTime || fallbackTime
          ? formatDateTime(latestEvent?.eventTime ?? fallbackTime)
          : EMPTY_TIMELINE_VALUE,
      title: step.title,
    };
  });
}
