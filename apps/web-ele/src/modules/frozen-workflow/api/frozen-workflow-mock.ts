import type {
  FrozenActionPayload,
  FrozenParaffinCompareRequest,
  FrozenPhoneBackRequest,
  FrozenReminderItem,
  FrozenReminderSummary,
  FrozenRemainingTissueRequest,
  FrozenSession,
  FrozenSessionDetail,
  FrozenSessionListPage,
  FrozenSessionListQuery,
  FrozenSessionTask,
  FrozenTechnicalWorkbenchView,
  FrozenTimelineEvent,
} from '../types/frozen-workflow';

import frozenSessionsSeedRaw from '../../../../../../mock_data/frozen-workflow/frozen-sessions.json';

type RawFrozenSession = FrozenSessionDetail;

const frozenSessionsSeed = frozenSessionsSeedRaw as RawFrozenSession[];

let state = createInitialState();

function createInitialState() {
  return {
    sessions: cloneSeed(frozenSessionsSeed),
  };
}

function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function createTimestamp() {
  return new Date().toISOString().slice(0, 19);
}

function paginateItems<T>(items: T[], page: number, size: number) {
  const safePage = Math.max(page, 1);
  const safeSize = Math.max(size, 1);
  const startIndex = (safePage - 1) * safeSize;
  return {
    items: items.slice(startIndex, startIndex + safeSize),
    page: safePage,
    size: safeSize,
    total: items.length,
  };
}

function compareDateDesc(left?: null | string, right?: null | string) {
  return normalizeText(right).localeCompare(normalizeText(left));
}

function findSession(sessionId: string) {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session) {
    throw new Error(`未找到冰冻会话: ${sessionId}`);
  }
  return session;
}

function findTask(session: RawFrozenSession, taskType: FrozenSessionTask['taskType']) {
  const task = session.tasks.find((item) => item.taskType === taskType);
  if (!task) {
    throw new Error(`冰冻会话 ${session.id} 缺少任务 ${taskType}`);
  }
  return task;
}

function createEvent(
  session: RawFrozenSession,
  payload: Omit<FrozenTimelineEvent, 'id'>,
) {
  const nextId = `FE-${String(session.timeline.length + 1).padStart(3, '0')}`;
  const event = {
    ...payload,
    id: nextId,
  };
  session.timeline.unshift(event);
  return event;
}

function sortTimeline(session: RawFrozenSession) {
  session.timeline.sort((left, right) =>
    compareDateDesc(left.eventTime, right.eventTime),
  );
}

function updateTaskStatus(
  session: RawFrozenSession,
  taskType: FrozenSessionTask['taskType'],
  status: FrozenSessionTask['status'],
  operatorName: null | string,
  remarks: null | string,
  time: string,
) {
  const task = findTask(session, taskType);
  task.status = status;
  task.operatorName = operatorName;
  task.remarks = remarks;
  if (status === 'IN_PROGRESS') {
    task.startedAt = task.startedAt ?? time;
    task.completedAt = null;
  }
  if (status === 'COMPLETED') {
    task.startedAt = task.startedAt ?? time;
    task.completedAt = time;
  }
}

function applySessionSummary(session: RawFrozenSession): FrozenSession {
  const {
    reminders,
    tasks,
    timeline,
    ...summary
  } = session;
  return summary;
}

function buildReminderItem(session: RawFrozenSession): FrozenReminderItem {
  return {
    caseId: session.caseId,
    currentTaskType: session.currentTaskType,
    frozenPathologyNo: session.frozenPathologyNo,
    id: `${session.id}-reminder`,
    nextAction: session.nextAction,
    patientName: session.patientName,
    requestedAt: session.requestedAt,
    sessionId: session.id,
    sessionNo: session.sessionNo,
    timeoutLevel: session.timeoutLevel,
    title: `${session.patientName} / ${session.frozenPathologyNo}`,
  };
}

function buildReminderSummary(sessions: RawFrozenSession[]): FrozenReminderSummary {
  const items = sessions
    .filter((item) => item.sessionStatus !== 'CANCELLED' && item.sessionStatus !== 'CLOSED')
    .sort((left, right) => compareDateDesc(left.requestedAt, right.requestedAt))
    .map(buildReminderItem);

  return {
    items,
    orangeCount: items.filter((item) => item.timeoutLevel === 'ORANGE').length,
    redCount: items.filter((item) => item.timeoutLevel === 'RED').length,
    total: items.length,
  };
}

function assertCurrentTask(
  session: RawFrozenSession,
  taskType: FrozenSessionTask['taskType'],
  actionLabel: string,
) {
  if (session.currentTaskType !== taskType) {
    throw new Error(
      `当前冰冻会话处于 ${session.currentTaskType}，不能执行${actionLabel}`,
    );
  }
}

function updateSessionStep(
  session: RawFrozenSession,
  taskType: FrozenSessionTask['taskType'],
  nextTaskType: FrozenSessionTask['taskType'],
  eventType: string,
  nodeCode: string,
  eventContent: string,
  payload: FrozenActionPayload,
  sessionStatus: FrozenSession['sessionStatus'],
) {
  const eventTime = createTimestamp();
  updateTaskStatus(
    session,
    taskType,
    'COMPLETED',
    payload.operatorName,
    payload.remarks ?? null,
    eventTime,
  );
  updateTaskStatus(session, nextTaskType, 'PENDING', null, null, eventTime);
  session.currentTaskType = nextTaskType;
  session.nextAction = nextActionMap[nextTaskType];
  session.sessionStatus = sessionStatus;
  session.timeoutLevel = nextTaskType === 'REPORT' ? 'ORANGE' : 'NONE';
  createEvent(session, {
    eventContent,
    eventTime,
    eventType,
    nodeCode,
    operatorName: payload.operatorName,
  });
  sortTimeline(session);
  return eventTime;
}

const nextActionMap: Record<FrozenSessionTask['taskType'], string> = {
  APPOINTMENT: '安排术中送检',
  COMPARE: '完成冰石对比',
  GROSSING: '开始冰冻取材',
  HANDOVER: '完成交接班',
  PHONE_BACK: '完成术中电话回报',
  RECEIVE: '完成冰冻接收',
  REMAINING_TISSUE: '处理剩余组织',
  REPORT: '完成快速报告',
  SLICING: '完成冰冻切片',
};

export function resetFrozenWorkflowMockState() {
  state = createInitialState();
}

export async function listFrozenSessionsMock(
  query: FrozenSessionListQuery,
): Promise<FrozenSessionListPage> {
  const keyword = normalizeText(query.keyword).toLowerCase();
  const items = state.sessions
    .filter((item) => {
      if (query.sessionStatus && item.sessionStatus !== query.sessionStatus) {
        return false;
      }
      if (query.timeoutLevel && item.timeoutLevel !== query.timeoutLevel) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return [
        item.patientName,
        item.caseId,
        item.applicationNo,
        item.frozenPathologyNo,
        item.sessionNo,
      ]
        .map((value) => normalizeText(value).toLowerCase())
        .some((value) => value.includes(keyword));
    })
    .sort((left, right) => compareDateDesc(left.requestedAt, right.requestedAt))
    .map(applySessionSummary);

  return paginateItems(items, query.page, query.size);
}

export async function listFrozenReminderSummaryMock() {
  return buildReminderSummary(state.sessions);
}

export async function getFrozenSessionDetailMock(sessionId: string) {
  const session = findSession(sessionId);
  return cloneSeed(session);
}

export async function getFrozenTechnicalWorkbenchMock(): Promise<FrozenTechnicalWorkbenchView> {
  const sessions = state.sessions
    .filter((item) =>
      ['RECEIVED', 'GROSSING', 'REQUESTED', 'SLICING'].includes(item.sessionStatus),
    )
    .sort((left, right) => compareDateDesc(left.requestedAt, right.requestedAt))
    .map(applySessionSummary);

  return {
    reminders: buildReminderSummary(state.sessions),
    sessions,
  };
}

export async function completeFrozenReceiveMock(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  const session = findSession(sessionId);
  assertCurrentTask(session, 'RECEIVE', '冰冻接收');
  const eventTime = updateSessionStep(
    session,
    'RECEIVE',
    'GROSSING',
    'FROZEN_RECEIVE_COMPLETED',
    'RECEIVE',
    '完成冰冻接收',
    payload,
    'RECEIVED',
  );
  session.receivedAt = eventTime;
  return cloneSeed(session);
}

export async function completeFrozenGrossingMock(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  const session = findSession(sessionId);
  assertCurrentTask(session, 'GROSSING', '冰冻取材');
  const eventTime = updateSessionStep(
    session,
    'GROSSING',
    'SLICING',
    'FROZEN_GROSSING_COMPLETED',
    'GROSSING',
    '完成冰冻取材',
    payload,
    'GROSSING',
  );
  session.grossingStartedAt = session.grossingStartedAt ?? eventTime;
  session.grossingCompletedAt = eventTime;
  return cloneSeed(session);
}

export async function completeFrozenSlicingMock(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  const session = findSession(sessionId);
  assertCurrentTask(session, 'SLICING', '冰冻切片');
  const eventTime = updateSessionStep(
    session,
    'SLICING',
    'REPORT',
    'FROZEN_SLICING_COMPLETED',
    'SLICING',
    '完成冰冻切片',
    payload,
    'SLICING',
  );
  session.slicingStartedAt = session.slicingStartedAt ?? eventTime;
  session.slicingCompletedAt = eventTime;
  return cloneSeed(session);
}

export async function saveFrozenPreliminaryReportMock(
  sessionId: string,
  payload: FrozenPhoneBackRequest,
) {
  const session = findSession(sessionId);
  assertCurrentTask(session, 'REPORT', '快速报告');
  const eventTime = createTimestamp();
  updateTaskStatus(
    session,
    'REPORT',
    'IN_PROGRESS',
    payload.operatorName,
    payload.remarks ?? null,
    eventTime,
  );
  session.sessionStatus = 'DIAGNOSING';
  session.preliminaryResult = payload.preliminaryResult;
  session.finalDiagnosis = payload.preliminaryResult;
  session.nextAction = '完成术中电话回报';
  createEvent(session, {
    eventContent: '保存冰冻初步结果',
    eventTime,
    eventType: 'FROZEN_PRELIMINARY_SAVED',
    nodeCode: 'REPORT',
    operatorName: payload.operatorName,
  });
  sortTimeline(session);
  return cloneSeed(session);
}

export async function completeFrozenPhoneBackMock(
  sessionId: string,
  payload: FrozenPhoneBackRequest,
) {
  const session = findSession(sessionId);
  assertCurrentTask(session, 'REPORT', '电话回报');
  const reportTask = findTask(session, 'REPORT');
  const eventTime = createTimestamp();
  reportTask.status = 'COMPLETED';
  reportTask.startedAt = reportTask.startedAt ?? eventTime;
  reportTask.completedAt = eventTime;
  reportTask.operatorName = payload.operatorName;
  reportTask.remarks = payload.remarks ?? null;
  updateTaskStatus(session, 'PHONE_BACK', 'COMPLETED', payload.operatorName, payload.remarks ?? null, eventTime);
  session.intraoperativePhoneBack = true;
  session.phoneBackAt = eventTime;
  session.preliminaryResult = payload.preliminaryResult;
  session.finalDiagnosis = payload.preliminaryResult;
  session.currentTaskType = 'COMPARE';
  session.nextAction = nextActionMap.COMPARE;
  session.sessionStatus = 'REPORTED';
  session.timeoutLevel = 'ORANGE';
  createEvent(session, {
    eventContent: '完成术中电话回报',
    eventTime,
    eventType: 'FROZEN_PHONE_BACK_COMPLETED',
    nodeCode: 'REPORT',
    operatorName: payload.operatorName,
  });
  sortTimeline(session);
  return cloneSeed(session);
}

export async function confirmFrozenReportMock(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  const session = findSession(sessionId);
  if (!session.intraoperativePhoneBack) {
    throw new Error('术中电话回报完成后才能最终确认冰冻结果');
  }
  const eventTime = createTimestamp();
  session.finalConfirmedAt = eventTime;
  session.reportConfirmedAt = eventTime;
  session.sessionStatus = 'CONFIRMED';
  session.timeoutLevel = 'NONE';
  createEvent(session, {
    eventContent: '冰冻快速报告最终确认',
    eventTime,
    eventType: 'FROZEN_REPORT_CONFIRMED',
    nodeCode: 'REPORT',
    operatorName: payload.operatorName,
  });
  sortTimeline(session);
  return cloneSeed(session);
}

export async function completeFrozenParaffinCompareMock(
  sessionId: string,
  payload: FrozenParaffinCompareRequest,
) {
  const session = findSession(sessionId);
  if (!session.finalConfirmedAt) {
    throw new Error('冰冻报告确认后才能进行冰石对比');
  }
  const eventTime = createTimestamp();
  updateTaskStatus(
    session,
    'COMPARE',
    'COMPLETED',
    payload.operatorName,
    payload.remarks ?? null,
    eventTime,
  );
  session.compareStatus = payload.compareStatus;
  session.compareSummary = payload.compareSummary;
  session.currentTaskType = 'REMAINING_TISSUE';
  session.nextAction = nextActionMap.REMAINING_TISSUE;
  session.sessionStatus = 'PARAFFIN_REVIEWED';
  createEvent(session, {
    eventContent: '完成冰石对比',
    eventTime,
    eventType: 'FROZEN_COMPARE_COMPLETED',
    nodeCode: 'COMPARE',
    operatorName: payload.operatorName,
  });
  sortTimeline(session);
  return cloneSeed(session);
}

export async function completeFrozenRemainingTissueMock(
  sessionId: string,
  payload: FrozenRemainingTissueRequest,
) {
  const session = findSession(sessionId);
  const eventTime = createTimestamp();
  updateTaskStatus(
    session,
    'REMAINING_TISSUE',
    'COMPLETED',
    payload.operatorName,
    payload.remarks ?? null,
    eventTime,
  );
  updateTaskStatus(
    session,
    'HANDOVER',
    'COMPLETED',
    payload.operatorName,
    payload.remarks ?? null,
    eventTime,
  );
  session.remainingTissueStatus = payload.remainingTissueStatus;
  session.currentTaskType = 'HANDOVER';
  session.nextAction = nextActionMap.HANDOVER;
  session.sessionStatus = 'CLOSED';
  createEvent(session, {
    eventContent: '完成剩余组织处理与交接班确认',
    eventTime,
    eventType: 'FROZEN_CLOSED',
    nodeCode: 'HANDOVER',
    operatorName: payload.operatorName,
  });
  sortTimeline(session);
  return cloneSeed(session);
}
