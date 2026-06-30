import { describe, expect, it, vi } from 'vitest';

import { M1_PERMISSION_CODES } from '#/modules/system-management/constants';

const { withRouteComponentReloadRetryMock } = vi.hoisted(() => ({
  withRouteComponentReloadRetryMock: vi.fn((loader) => loader),
}));

vi.mock('#/router/routes/lazy-load', () => ({
  withRouteComponentReloadRetry: withRouteComponentReloadRetryMock,
}));

import systemRoutes from './system';

describe('system routes', () => {
  it('registers high-frequency system routes with authorities', () => {
    const systemRoot = systemRoutes.find(
      (route) => route.name === 'SystemRoot',
    );
    const usersRoute = systemRoot?.children?.find(
      (route) => route.name === 'SystemUsers',
    );
    const configsRoute = systemRoot?.children?.find(
      (route) => route.name === 'SystemConfigs',
    );
    const logsRoute = systemRoot?.children?.find(
      (route) => route.name === 'LogManagement',
    );

    expect(systemRoot?.path).toBe('/system');
    expect(systemRoot?.redirect).toBe('/system/users');
    expect(usersRoute?.path).toBe('/system/users');
    expect(usersRoute?.meta?.keepAlive).toBe(true);
    expect(usersRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_USER_QUERY,
    ]);
    expect(configsRoute?.path).toBe('/system/configs');
    expect(configsRoute?.meta?.keepAlive).toBe(true);
    expect(configsRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.CONFIG_QUERY,
    ]);
    expect(logsRoute?.path).toBe('/system/logs');
    expect(logsRoute?.meta?.keepAlive).toBe(true);
    expect(logsRoute?.meta?.authority).toEqual([M1_PERMISSION_CODES.LOG_QUERY]);
  });

  it('wraps high-frequency system pages with route reload retry', () => {
    for (const routeName of [
      'SystemUsers',
      'Roles',
      'Departments',
      'BodyParts',
      'MedicalOrderDicts',
      'MedicalOrderCharges',
      'MedicalOrderPackages',
      'SamplingTemplates',
      'SamplingGuidelines',
      'SystemConfigs',
      'NumberingRules',
      'LogManagement',
    ]) {
      expect(withRouteComponentReloadRetryMock).toHaveBeenCalledWith(
        expect.any(Function),
        routeName,
      );
    }
  });
});
