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
    ['COMPLETE', 'CREATE_BATCH', 'EVALUATE', 'EXECUTE', 'MARK'].includes(
      event.eventType ?? '',
    )
  );
}

export function buildWorkflowTimelineSteps(
  tracking: null | TechnicalTrackingViewModel,
  context: null | WorkstationCaseContext,
  formatDateTime: (value?: null | string) => string,
  formatEventStatus: (value?: null | string) => string,
  formatNullable: (value?: null | string) => string,
  formatTaskStatus: (value?: null | string) => string,
): WorkflowTimelineStep[] {
  if (!tracking || !context) {
    return [];
  }

  const eventsByNode = new Map<string, TechnicalTrackingEventSummary>();
  context.recentEvents.forEach((event) => {
    const nodeCode = getEventNodeCode(event);
    if (!nodeCode || eventsByNode.has(nodeCode)) {
      return;
    }
    eventsByNode.set(nodeCode, event);
  });

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
    context.recentEvents
      .filter((event) => isCompletedEvent(event))
      .map((event) => getEventNodeCode(event))
      .filter(Boolean),
  );

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
    const task = tracking.technicalTasks.find(
      (item) => item.taskType === step.nodeCode,
    );
    const completed =
      completedNodeCodes.has(step.nodeCode) ||
      completedEventNodeCodes.has(step.nodeCode);

    let status: WorkflowTimelineStep['status'] = 'pending';
    if (completed) {
      status = 'completed';
    } else if (index === currentIndex) {
      status = 'current';
    }

    let statusText = '-';
    if (latestEvent) {
      statusText = formatEventStatus(latestEvent.eventStatus);
    } else if (task) {
      statusText = formatTaskStatus(task.taskStatus);
    } else if (status === 'current') {
      statusText = '待处理';
    }

    return {
      content: formatNullable(latestEvent?.eventContent ?? task?.remarks),
      index: index + 1,
      nodeCode: step.nodeCode,
      operatorName: formatNullable(
        latestEvent?.operatorName ?? task?.assignedToName,
      ),
      status,
      statusText,
      time: formatDateTime(
        latestEvent?.eventTime ?? task?.completedAt ?? task?.startedAt,
      ),
      title: step.title,
    };
  });
}
