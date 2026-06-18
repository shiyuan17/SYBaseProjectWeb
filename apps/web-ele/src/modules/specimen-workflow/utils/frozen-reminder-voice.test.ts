import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { notificationMock } = vi.hoisted(() => ({
  notificationMock: vi.fn(),
}));

vi.mock('element-plus', () => ({
  ElNotification: notificationMock,
}));

import {
  cancelFrozenReminderSpeech,
  speakFrozenReminder,
} from './frozen-reminder-voice';

interface MockUtterance {
  lang: string;
  rate: number;
  text: string;
}

const utteranceInstances: MockUtterance[] = [];

class MockSpeechSynthesisUtterance implements MockUtterance {
  lang = '';
  rate = 1;
  text: string;
  constructor(text: string) {
    this.text = text;
    utteranceInstances.push(this);
  }
}

describe('speakFrozenReminder', () => {
  beforeEach(() => {
    notificationMock.mockReset();
    utteranceInstances.length = 0;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).speechSynthesis;
    delete (globalThis as Record<string, unknown>).SpeechSynthesisUtterance;
  });

  it('uses Web Speech API with zh-CN when available', () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    (globalThis as Record<string, unknown>).speechSynthesis = {
      cancel,
      speak,
    };
    (globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;

    const result = speakFrozenReminder({
      frozenPathologyNo: 'F260527001',
      patientName: '张敏',
    });

    expect(result).toEqual({ spoken: true });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(utteranceInstances).toHaveLength(1);
    expect(utteranceInstances[0]?.lang).toBe('zh-CN');
    expect(utteranceInstances[0]?.text).toContain('张敏');
    expect(notificationMock).not.toHaveBeenCalled();
  });

  it('falls back to ElNotification when speechSynthesis is missing', () => {
    const result = speakFrozenReminder({ patientName: '李雷' });
    expect(result).toEqual({ spoken: false });
    expect(notificationMock).toHaveBeenCalledTimes(1);
    const call = notificationMock.mock.calls[0]?.[0] as
      | undefined
      | { message: string; title: string; type: string };
    expect(call?.title).toBe('冰冻报告已发布');
    expect(call?.message).toContain('李雷');
  });

  it('falls back to ElNotification when speech throws', () => {
    const cancel = vi.fn();
    const speak = vi.fn(() => {
      throw new Error('boom');
    });
    (globalThis as Record<string, unknown>).speechSynthesis = {
      cancel,
      speak,
    };
    (globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;

    const result = speakFrozenReminder({ patientName: '王芳' });
    expect(result).toEqual({ spoken: false });
    expect(notificationMock).toHaveBeenCalledTimes(1);
  });

  it('cancelFrozenReminderSpeech swallows missing API', () => {
    expect(() => cancelFrozenReminderSpeech()).not.toThrow();
  });

  it('cancelFrozenReminderSpeech calls underlying cancel when available', () => {
    const cancel = vi.fn();
    (globalThis as Record<string, unknown>).speechSynthesis = {
      cancel,
      speak: vi.fn(),
    };
    (globalThis as Record<string, unknown>).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;
    cancelFrozenReminderSpeech();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
