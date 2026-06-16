import { describe, expect, it } from 'vitest';

import { canViewStatisticsPage, getM6EntryPath } from './access';
import { M6_PERMISSION_CODES } from './constants';

describe('m6 access helpers', () => {
  it('routes statistics users into the statistics dashboard entry', () => {
    const accessCodes = [M6_PERMISSION_CODES.STAT_REPORT_QUERY];

    expect(getM6EntryPath(accessCodes)).toBe('/m6/dashboard');
    expect(canViewStatisticsPage(accessCodes)).toBe(true);
  });
});
