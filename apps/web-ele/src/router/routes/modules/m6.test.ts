import { describe, expect, it } from 'vitest';

import { hasAuthority } from '@vben/utils';

import {
  M6_BILLING_PAGE_AUTHORITIES,
  M6_HISTORY_PAGE_AUTHORITIES,
  M6_INTEGRATION_PAGE_AUTHORITIES,
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
    const entryRoute = m6Root?.children?.find((route) => route.name === 'M6Entry');
    const integrationRoute = m6Root?.children?.find(
      (route) => route.name === 'IntegrationManagement',
    );
    const billingRoute = m6Root?.children?.find(
      (route) => route.name === 'BillingManagement',
    );
    const historyRoute = m6Root?.children?.find(
      (route) => route.name === 'HistoricalReports',
    );
    const statisticsRoute = m6Root?.children?.find(
      (route) => route.name === 'StatisticsAnalysis',
    );

    expect(m6Root?.path).toBe('/m6');
    expect(m6Root?.redirect).toBe('/m6/entry');
    expect(entryRoute?.path).toBe('/m6/entry');
    expect(entryRoute?.meta?.keepAlive).toBeUndefined();
    expect(integrationRoute?.path).toBe('/m6/integration');
    expect(integrationRoute?.meta?.keepAlive).toBe(true);
    expect(billingRoute?.path).toBe('/m6/billing');
    expect(billingRoute?.meta?.keepAlive).toBe(true);
    expect(historyRoute?.path).toBe('/m6/history');
    expect(historyRoute?.meta?.keepAlive).toBe(true);
    expect(statisticsRoute?.path).toBe('/m6/statistics');
    expect(statisticsRoute?.meta?.keepAlive).toBe(true);
    expect(integrationRoute?.meta?.authority).toEqual([
      ...M6_INTEGRATION_PAGE_AUTHORITIES,
    ]);
    expect(billingRoute?.meta?.authority).toEqual([
      ...M6_BILLING_PAGE_AUTHORITIES,
    ]);
    expect(historyRoute?.meta?.authority).toEqual([
      ...M6_HISTORY_PAGE_AUTHORITIES,
    ]);
    expect(statisticsRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
  });

  it('shows integration page for integration permissions', () => {
    const routeNames = getM6ChildRouteNames([
      M6_PERMISSION_CODES.INTEGRATION_TASK_QUERY,
    ]);

    expect(routeNames).toContain('M6Entry');
    expect(routeNames).toContain('IntegrationManagement');
    expect(routeNames).not.toContain('BillingManagement');
    expect(routeNames).not.toContain('HistoricalReports');
  });

  it('shows billing page for receipt and reconcile permissions', () => {
    const routeNames = getM6ChildRouteNames([
      M6_PERMISSION_CODES.BILLING_RECEIPT,
      M6_PERMISSION_CODES.BILLING_RECONCILE,
    ]);

    expect(routeNames).toContain('M6Entry');
    expect(routeNames).toContain('BillingManagement');
    expect(routeNames).not.toContain('IntegrationManagement');
  });

  it('shows history page for import-only permissions', () => {
    const routeNames = getM6ChildRouteNames([
      M6_PERMISSION_CODES.HISTORY_IMPORT,
    ]);

    expect(routeNames).toContain('M6Entry');
    expect(routeNames).toContain('HistoricalReports');
    expect(routeNames).not.toContain('StatisticsAnalysis');
  });
});
