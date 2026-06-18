import type { Ref } from 'vue';

import type {
  FrozenSession,
  FrozenSessionDetail,
} from '#/modules/frozen-workflow/types/frozen-workflow';

import { getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue';

import {
  getFrozenSessionDetail,
  listFrozenSessions,
} from '#/modules/frozen-workflow/api/frozen-workflow-service';

import {
  cancelFrozenReminderSpeech,
  speakFrozenReminder,
} from '../utils/frozen-reminder-voice';

export const FROZEN_REMINDER_POLL_INTERVAL_MS = 15_000;

export type FrozenReminderApplicationRef = {
  applicationId?: null | string;
  applicationNo?: null | string;
  patientName?: null | string;
};

export interface UseFrozenReminderWatcherOptions {
  application: Ref<FrozenReminderApplicationRef | null>;
  enabled: Ref<boolean>;
  intervalMs?: number;
}

function isPublishedSession(detail: FrozenSessionDetail | null): boolean {
  if (!detail) {
    return false;
  }
  const confirmed = (detail.reportConfirmedAt ?? '').trim();
  return detail.sessionStatus === 'CONFIRMED' && confirmed.length > 0;
}

function matchesApplication(
  session: Pick<FrozenSession, 'applicationNo'>,
  applicationNo: string,
): boolean {
  return (session.applicationNo ?? '').trim() === applicationNo;
}

export function useFrozenReminderWatcher(
  options: UseFrozenReminderWatcherOptions,
) {
  const intervalMs =
    typeof options.intervalMs === 'number' && options.intervalMs > 0
      ? options.intervalMs
      : FROZEN_REMINDER_POLL_INTERVAL_MS;

  const dialogVisible = ref(false);
  const currentDetail = ref<FrozenSessionDetail | null>(null);
  const lastError = ref<unknown>(null);
  const notifiedKey = ref<string>('');

  let timer: null | ReturnType<typeof setInterval> = null;
  let visibilityHandler: (() => void) | null = null;
  let disposed = false;
  let inFlight: null | Promise<void> = null;

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function resetState(closeDialog: boolean) {
    clearTimer();
    cancelFrozenReminderSpeech();
    notifiedKey.value = '';
    if (closeDialog) {
      dialogVisible.value = false;
      currentDetail.value = null;
    }
  }

  function shouldPoll(): boolean {
    if (!options.enabled.value) {
      return false;
    }
    const app = options.application.value;
    const applicationNo = (app?.applicationNo ?? '').trim();
    return applicationNo.length > 0;
  }

  async function fetchPublishedDetail(
    applicationNo: string,
  ): Promise<FrozenSessionDetail | null> {
    const page = await listFrozenSessions({
      keyword: applicationNo,
      page: 1,
      size: 5,
    });
    const matched = (page.items ?? []).find((item) =>
      matchesApplication(item, applicationNo),
    );
    if (!matched) {
      return null;
    }
    const detail = await getFrozenSessionDetail(matched.id);
    return detail ?? null;
  }

  async function runPoll() {
    if (disposed || !shouldPoll()) {
      return;
    }
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return;
    }
    const app = options.application.value;
    const applicationNo = (app?.applicationNo ?? '').trim();
    if (applicationNo === '') {
      return;
    }
    try {
      const detail = await fetchPublishedDetail(applicationNo);
      if (disposed) {
        return;
      }
      if (!isPublishedSession(detail) || !detail) {
        return;
      }
      const key = `${detail.id}::${(detail.reportConfirmedAt ?? '').trim()}`;
      if (key === notifiedKey.value) {
        return;
      }
      notifiedKey.value = key;
      currentDetail.value = detail;
      dialogVisible.value = true;
      speakFrozenReminder({
        frozenPathologyNo: detail.frozenPathologyNo,
        patientName: app?.patientName ?? detail.patientName,
      });
    } catch (error) {
      lastError.value = error;
      console.warn('[frozen-reminder-watcher] poll failed', error);
    }
  }

  async function pollOnce(): Promise<void> {
    const previous = inFlight;
    const task = (
      previous ? previous.catch(() => undefined) : Promise.resolve()
    )
      .then(() => runPoll())
      .finally(() => {
        if (inFlight === task) {
          inFlight = null;
        }
      });
    inFlight = task;
    await task;
  }

  function ensureTimer() {
    if (timer !== null || disposed) {
      return;
    }
    timer = setInterval(() => {
      void pollOnce();
    }, intervalMs);
  }

  function syncVisibilityListener(active: boolean) {
    if (typeof document === 'undefined') {
      return;
    }
    if (active && visibilityHandler === null) {
      visibilityHandler = () => {
        if (document.visibilityState === 'visible' && shouldPoll()) {
          void pollOnce();
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    } else if (!active && visibilityHandler !== null) {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
  }

  watch(
    () =>
      [
        options.enabled.value,
        (options.application.value?.applicationId ?? '').trim(),
        (options.application.value?.applicationNo ?? '').trim(),
      ] as const,
    ([enabled, , applicationNo], previous) => {
      const previousApplicationNo = previous?.[2] ?? '';
      const applicationChanged = previousApplicationNo !== applicationNo;
      if (applicationChanged) {
        resetState(true);
      }
      if (!enabled || applicationNo === '') {
        clearTimer();
        syncVisibilityListener(false);
        return;
      }
      ensureTimer();
      syncVisibilityListener(true);
      void pollOnce();
    },
    { immediate: true },
  );

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      disposed = true;
      clearTimer();
      syncVisibilityListener(false);
      cancelFrozenReminderSpeech();
    });
  }

  return {
    closeDialog: () => {
      dialogVisible.value = false;
    },
    currentDetail,
    dialogVisible,
    lastError,
    pollOnce,
  };
}
