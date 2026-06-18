import type {
  FrozenSession,
  FrozenSessionDetail,
} from '#/modules/frozen-workflow/types/frozen-workflow';

import { nextTick, ref } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getFrozenSessionDetailMock,
  listFrozenSessionsMock,
  speakFrozenReminderMock,
  cancelFrozenReminderSpeechMock,
} = vi.hoisted(() => ({
  cancelFrozenReminderSpeechMock: vi.fn(),
  getFrozenSessionDetailMock:
    vi.fn<(id: string) => Promise<FrozenSessionDetail | null>>(),
  listFrozenSessionsMock: vi.fn<
    (params: {
      keyword?: null | string;
      page: number;
      sessionStatus?: null | string;
      size: number;
      timeoutLevel?: null | string;
    }) => Promise<{
      items: FrozenSession[];
      page: number;
      size: number;
      total: number;
    }>
  >(),
  speakFrozenReminderMock: vi.fn(() => ({ spoken: true })),
}));

vi.mock('#/modules/frozen-workflow/api/frozen-workflow-service', () => ({
  getFrozenSessionDetail: getFrozenSessionDetailMock,
  listFrozenSessions: listFrozenSessionsMock,
}));

vi.mock('../utils/frozen-reminder-voice', () => ({
  cancelFrozenReminderSpeech: cancelFrozenReminderSpeechMock,
  speakFrozenReminder: speakFrozenReminderMock,
}));

import {
  FROZEN_REMINDER_POLL_INTERVAL_MS,
  useFrozenReminderWatcher,
} from './useFrozenReminderWatcher';

function buildSessionSummary(
  overrides: Partial<FrozenSession> = {},
): FrozenSession {
  return {
    applicationId: 'APP-FR-001',
    applicationNo: 'SQD-FS-20260527-001',
    autoPrintSlides: false,
    caseId: 'CASE-FR-001',
    compareStatus: null,
    compareSummary: null,
    currentTaskType: 'REPORT',
    finalConfirmedAt: null,
    finalDiagnosis: null,
    frozenPathologyNo: 'F260527001',
    grossingCompletedAt: null,
    grossingDescription: null,
    grossingStartedAt: null,
    handoverComment: null,
    hasRegularCaseLinked: false,
    id: 'FS-001',
    intraoperativePhoneBack: false,
    nextAction: 'noop',
    patientName: '张敏',
    phoneBackAt: null,
    preliminaryResult: null,
    receivedAt: null,
    remainingTissueStatus: 'PENDING',
    reportConfirmedAt: null,
    requestDoctorName: '陈医生',
    requestedAt: '2026-05-27T08:20:00',
    sessionNo: 'FS-20260527-01',
    sessionStatus: 'RECEIVED',
    slicingCompletedAt: null,
    slicingStartedAt: null,
    timeoutLevel: 'NONE',
    ...overrides,
  };
}

function buildDetail(
  overrides: Partial<FrozenSessionDetail> = {},
): FrozenSessionDetail {
  return {
    ...buildSessionSummary(overrides),
    reminders: [],
    tasks: [],
    timeline: [],
  } as FrozenSessionDetail;
}

describe('useFrozenReminderWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    listFrozenSessionsMock.mockReset();
    getFrozenSessionDetailMock.mockReset();
    speakFrozenReminderMock.mockReset();
    speakFrozenReminderMock.mockImplementation(() => ({ spoken: true }));
    cancelFrozenReminderSpeechMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers speak + dialog once when session transitions to CONFIRMED', async () => {
    const enabled = ref(true);
    const application = ref({
      applicationId: 'APP-FR-001',
      applicationNo: 'SQD-FS-20260527-001',
      patientName: '张敏',
    });
    listFrozenSessionsMock.mockImplementation(async () => ({
      items: [buildSessionSummary()],
      page: 1,
      size: 5,
      total: 1,
    }));
    getFrozenSessionDetailMock.mockImplementation(async () => buildDetail());

    const watcher = useFrozenReminderWatcher({ application, enabled });
    await Promise.resolve();
    await Promise.resolve();
    expect(speakFrozenReminderMock).not.toHaveBeenCalled();
    expect(watcher.dialogVisible.value).toBe(false);

    getFrozenSessionDetailMock.mockImplementation(async () =>
      buildDetail({
        reportConfirmedAt: '2026-05-27T10:30:00',
        sessionStatus: 'CONFIRMED',
      }),
    );
    await watcher.pollOnce();
    expect(speakFrozenReminderMock).toHaveBeenCalledTimes(1);
    expect(watcher.dialogVisible.value).toBe(true);
    expect(watcher.currentDetail.value?.id).toBe('FS-001');

    await watcher.pollOnce();
    expect(speakFrozenReminderMock).toHaveBeenCalledTimes(1);

    getFrozenSessionDetailMock.mockImplementation(async () =>
      buildDetail({
        reportConfirmedAt: '2026-05-27T11:00:00',
        sessionStatus: 'CONFIRMED',
      }),
    );
    await watcher.pollOnce();
    expect(speakFrozenReminderMock).toHaveBeenCalledTimes(2);
  });

  it('stops polling when enabled becomes false and clears state when application changes', async () => {
    const enabled = ref(true);
    const application = ref({
      applicationId: 'APP-FR-001',
      applicationNo: 'SQD-FS-20260527-001',
      patientName: '张敏',
    });
    listFrozenSessionsMock.mockResolvedValue({
      items: [buildSessionSummary()],
      page: 1,
      size: 5,
      total: 1,
    });
    getFrozenSessionDetailMock.mockResolvedValue(
      buildDetail({
        reportConfirmedAt: '2026-05-27T10:30:00',
        sessionStatus: 'CONFIRMED',
      }),
    );
    const watcher = useFrozenReminderWatcher({ application, enabled });
    await watcher.pollOnce();
    expect(watcher.dialogVisible.value).toBe(true);

    listFrozenSessionsMock.mockClear();
    enabled.value = false;
    await nextTick();
    vi.advanceTimersByTime(FROZEN_REMINDER_POLL_INTERVAL_MS * 3);
    expect(listFrozenSessionsMock).not.toHaveBeenCalled();

    enabled.value = true;
    application.value = {
      applicationId: 'APP-FR-002',
      applicationNo: 'SQD-FS-20260527-002',
      patientName: '李雷',
    };
    await nextTick();
    expect(watcher.dialogVisible.value).toBe(false);
    expect(watcher.currentDetail.value).toBeNull();
  });

  it('keeps silent when API throws', async () => {
    const enabled = ref(true);
    const application = ref({
      applicationId: 'APP-FR-001',
      applicationNo: 'SQD-FS-20260527-001',
      patientName: '张敏',
    });
    listFrozenSessionsMock.mockRejectedValue(new Error('network down'));
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const watcher = useFrozenReminderWatcher({ application, enabled });
    await watcher.pollOnce();
    expect(speakFrozenReminderMock).not.toHaveBeenCalled();
    expect(watcher.dialogVisible.value).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
