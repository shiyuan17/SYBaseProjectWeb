import { describe, expect, it, vi } from 'vitest';

import { createDateRangePickerShortcuts } from './date-range';

function formatLocalDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('createDateRangePickerShortcuts', () => {
  it('returns the expected labels and ranges', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00+08:00'));

    try {
      const shortcuts = createDateRangePickerShortcuts();

      expect(shortcuts.map((item) => item.text)).toEqual([
        '今天',
        '昨天',
        '本周',
        '本月',
      ]);
      expect(
        shortcuts.map((item) =>
          item.value().map((value) => formatLocalDate(value)),
        ),
      ).toEqual([
        ['2026-06-17', '2026-06-17'],
        ['2026-06-16', '2026-06-16'],
        ['2026-06-15', '2026-06-17'],
        ['2026-06-01', '2026-06-17'],
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
