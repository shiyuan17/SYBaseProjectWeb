import type {
  FrozenActionPayload,
  FrozenParaffinCompareRequest,
  FrozenPhoneBackRequest,
  FrozenRemainingTissueRequest,
} from '../types/frozen-workflow';

import {
  completeFrozenGrossingMock,
  completeFrozenParaffinCompareMock,
  completeFrozenPhoneBackMock,
  completeFrozenReceiveMock,
  completeFrozenRemainingTissueMock,
  completeFrozenSlicingMock,
  confirmFrozenReportMock,
  getFrozenSessionDetailMock,
  getFrozenTechnicalWorkbenchMock,
  listFrozenReminderSummaryMock,
  listFrozenSessionsMock,
  resetFrozenWorkflowMockState,
  saveFrozenPreliminaryReportMock,
} from './frozen-workflow-mock';

const USE_FROZEN_WORKFLOW_MOCK = true;

export async function listFrozenSessions(params: {
  keyword?: null | string;
  page: number;
  sessionStatus?: null | string;
  size: number;
  timeoutLevel?: null | string;
}) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return listFrozenSessionsMock(params);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function getFrozenSessionDetail(sessionId: string) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return getFrozenSessionDetailMock(sessionId);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function getFrozenTechnicalWorkbench() {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return getFrozenTechnicalWorkbenchMock();
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function listFrozenReminders() {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return listFrozenReminderSummaryMock();
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function completeFrozenReceive(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return completeFrozenReceiveMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function completeFrozenGrossing(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return completeFrozenGrossingMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function completeFrozenSlicing(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return completeFrozenSlicingMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function saveFrozenPreliminaryReport(
  sessionId: string,
  payload: FrozenPhoneBackRequest,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return saveFrozenPreliminaryReportMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function completeFrozenPhoneBack(
  sessionId: string,
  payload: FrozenPhoneBackRequest,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return completeFrozenPhoneBackMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function confirmFrozenReport(
  sessionId: string,
  payload: FrozenActionPayload,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return confirmFrozenReportMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function completeFrozenParaffinCompare(
  sessionId: string,
  payload: FrozenParaffinCompareRequest,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return completeFrozenParaffinCompareMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export async function completeFrozenRemainingTissue(
  sessionId: string,
  payload: FrozenRemainingTissueRequest,
) {
  if (USE_FROZEN_WORKFLOW_MOCK) {
    return completeFrozenRemainingTissueMock(sessionId, payload);
  }
  throw new Error('Frozen workflow real API is not connected yet.');
}

export function resetFrozenMockState() {
  resetFrozenWorkflowMockState();
}
