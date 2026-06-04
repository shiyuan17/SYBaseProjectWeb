import { hasAuthority } from '@vben/utils';

import { describe, expect, it } from 'vitest';

import {
  M6_PERMISSION_CODES,
  M6_STATISTICS_PAGE_AUTHORITIES,
} from '#/modules/m6-management/constants';

import m6Routes from './m6';

function getM6ChildRouteNames(accessCodes: string[]) {
  const m6Root = m6Routes.find((route) => route.name === 'M6Root');
  return (m6Root?.children ?? [])
    .filter((route) => hasAuthority(route, accessCodes))
    .map((route) => route.name);
}

describe('m6 routes', () => {
  it('registers M6 routes with entry and page authorities', () => {
    const m6Root = m6Routes.find((route) => route.name === 'M6Root');
    const entryRoute = m6Root?.children?.find(
      (route) => route.name === 'M6Entry',
    );
    const qualityRoute = m6Root?.children?.find(
      (route) => route.name === 'QualityIndicatorStatistics',
    );
    const managementRoute = m6Root?.children?.find(
      (route) => route.name === 'ManagementIndicatorStatistics',
    );
    const statisticsRoute = m6Root?.children?.find(
      (route) => route.name === 'CustomStatisticsAnalysis',
    );

    expect(m6Root?.path).toBe('/m6');
    expect(m6Root?.redirect).toBe('/m6/entry');
    expect(entryRoute?.path).toBe('/m6/entry');
    expect(entryRoute?.meta?.keepAlive).toBeUndefined();
    expect(qualityRoute?.path).toBe('/m6/quality-indicators');
    expect(qualityRoute?.meta?.keepAlive).toBe(true);
    expect(managementRoute?.path).toBe('/m6/management-indicators');
    expect(managementRoute?.meta?.keepAlive).toBe(true);
    expect(statisticsRoute?.path).toBe('/m6/custom-analysis');
    expect(statisticsRoute?.meta?.keepAlive).toBe(true);
    expect(qualityRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(managementRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(statisticsRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
  });

  it('shows all statistics menu pages when statistics permissions exist', () => {
    const routeNames = getM6ChildRouteNames([
      M6_PERMISSION_CODES.STAT_REPORT_QUERY,
    ]);

    expect(routeNames).toContain('M6Entry');
    expect(routeNames).toContain('QualityIndicatorStatistics');
    expect(routeNames).toContain('ManagementIndicatorStatistics');
    expect(routeNames).toContain('CustomStatisticsAnalysis');
  });
});
