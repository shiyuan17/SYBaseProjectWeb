import { describe, expect, it, vi } from 'vitest';

import {
  compareNullableDateDesc,
  createNumericId,
  createTimestamp,
  includesText,
  normalizeText,
  paginateItems,
  withinDateRange,
} from './mock-support';

describe('specimen workflow mock support helpers', () => {
  it('normalizes and matches user-facing search text', () => {
    expect(normalizeText('  病理号  ')).toBe('病理号');
    expect(includesText('BL-20260530-001', '260530')).toBe(true);
    expect(includesText('BL-20260530-001', 'missing')).toBe(false);
    expect(includesText(null, '')).toBe(true);
  });

  it('sorts nullable dates descending and checks inclusive date ranges', () => {
    const dates = ['2026-05-29T08:00:00', null, '2026-05-30T08:00:00'];
    expect(dates.toSorted(compareNullableDateDesc)).toEqual([
      '2026-05-30T08:00:00',
      '2026-05-29T08:00:00',
      null,
    ]);
    expect(withinDateRange('2026-05-30T08:00:00', '2026-05-01')).toBe(true);
    expect(withinDateRange('2026-05-30T08:00:00', null, '2026-05-29')).toBe(
      false,
    );
    expect(withinDateRange(null, '2026-05-01', '2026-05-31')).toBe(false);
  });

  it('paginates with safe page and size defaults', () => {
    expect(paginateItems([1, 2, 3, 4], 2, 2)).toEqual({
      items: [3, 4],
      page: 2,
      size: 2,
      total: 4,
    });
    expect(paginateItems([1, 2, 3], 0, 0)).toEqual({
      items: [1],
      page: 1,
      size: 1,
      total: 3,
    });
  });

  it('creates deterministic mock ids and second-level timestamps', () => {
    expect(createNumericId('EV', ['EV-001', 'EV-009', 'OTHER'])).toBe('EV-010');

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-30T09:08:07.123Z'));
    expect(createTimestamp()).toBe('2026-05-30T09:08:07');
    vi.useRealTimers();
  });
});
