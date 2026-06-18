import { ElNotification } from 'element-plus';

export interface FrozenReminderVoicePayload {
  frozenPathologyNo?: null | string;
  patientName?: null | string;
}

export interface FrozenReminderSpeakResult {
  spoken: boolean;
}

function buildMessage(payload: FrozenReminderVoicePayload): string {
  const patientName = (payload.patientName ?? '').trim();
  const namePart = patientName ? `患者 ${patientName}` : '当前申请';
  return `${namePart} 的冰冻报告已发布，请查阅。`;
}

function hasSpeechSynthesisSupport(): boolean {
  if (typeof globalThis === 'undefined') {
    return false;
  }
  const synthesis = (globalThis as typeof globalThis & Window).speechSynthesis;
  const utteranceCtor = (globalThis as typeof globalThis & Window)
    .SpeechSynthesisUtterance;
  return Boolean(synthesis) && typeof utteranceCtor === 'function';
}

function notifyFallback(message: string): void {
  try {
    ElNotification({
      duration: 6000,
      message,
      title: '冰冻报告已发布',
      type: 'success',
    });
  } catch {
    // ignore notification fallback errors to avoid breaking the watcher loop
  }
}

export function speakFrozenReminder(
  payload: FrozenReminderVoicePayload,
): FrozenReminderSpeakResult {
  const message = buildMessage(payload);

  if (!hasSpeechSynthesisSupport()) {
    notifyFallback(message);
    return { spoken: false };
  }

  try {
    const synthesis = (globalThis as typeof globalThis & Window)
      .speechSynthesis;
    const UtteranceCtor = (globalThis as typeof globalThis & Window)
      .SpeechSynthesisUtterance;
    const utterance = new UtteranceCtor(message);
    utterance.lang = 'zh-CN';
    utterance.rate = 1;
    synthesis.cancel();
    synthesis.speak(utterance);
    return { spoken: true };
  } catch {
    notifyFallback(message);
    return { spoken: false };
  }
}

export function cancelFrozenReminderSpeech(): void {
  if (!hasSpeechSynthesisSupport()) {
    return;
  }
  try {
    (globalThis as typeof globalThis & Window).speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
