import { describe, expect, it } from 'vitest';

import {
  buildStatReportFileName,
  buildStatReportPayload,
} from './report-query';

describe('m6 statistics report query helpers', () => {
  it('builds compact report payloads without empty filter fields', () => {
    expect(
      buildStatReportPayload('QUALITY', {
        dateRange: ['2026-05-01T00:00:00', '2026-05-30T23:59:59'],
        departmentId: 'DEPT-1',
        indicatorCode: '',
        operatorName: '统计员',
        operatorUserId: '',
        roleId: 'ROLE-1',
        templateCode: 'QUALITY_MONTHLY',
      }),
    ).toEqual({
      category: 'QUALITY',
      departmentId: 'DEPT-1',
      from: '2026-05-01T00:00:00',
      indicatorCode: undefined,
      operatorName: '统计员',
      operatorUserId: undefined,
      roleId: 'ROLE-1',
      templateCode: 'QUALITY_MONTHLY',
      to: '2026-05-30T23:59:59',
    });
  });

  it('uses template code first and category fallback for export file names', () => {
    expect(buildStatReportFileName('QUALITY', 'QUALITY_MONTHLY')).toBe(
      'QUALITY_MONTHLY-stat-report.csv',
    );
    expect(buildStatReportFileName('WORKLOAD', '')).toBe(
      'workload-stat-report.csv',
    );
  });
});
