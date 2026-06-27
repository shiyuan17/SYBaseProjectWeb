import { describe, expect, it, vi } from 'vitest';

const { withRouteComponentReloadRetryMock } = vi.hoisted(() => ({
  withRouteComponentReloadRetryMock: vi.fn((loader) => loader),
}));

vi.mock('#/router/routes/lazy-load', () => ({
  withRouteComponentReloadRetry: withRouteComponentReloadRetryMock,
}));

import dashboardRoutes from './dashboard';

describe('dashboard routes', () => {
  it('keeps analytics as the dashboard entry and workspace as secondary page', () => {
    const dashboardRoot = dashboardRoutes.find(
      (route) => route.name === 'Dashboard',
    );
    const analyticsRoute = dashboardRoot?.children?.find(
      (route) => route.name === 'Analytics',
    );
    const workspaceRoute = dashboardRoot?.children?.find(
      (route) => route.name === 'Workspace',
    );

    expect(dashboardRoot?.path).toBe('/dashboard');
    expect(analyticsRoute?.path).toBe('/analytics');
    expect(String(analyticsRoute?.component)).toContain(
      '/views/dashboard/analytics/index.vue',
    );
    expect(analyticsRoute?.meta?.keepAlive).toBe(true);
    expect(analyticsRoute?.meta?.affixTab).toBe(true);
    expect(workspaceRoute?.path).toBe('/workspace');
    expect(String(workspaceRoute?.component)).toContain(
      '/views/dashboard/workspace/index.vue',
    );
    expect(workspaceRoute?.meta?.keepAlive).toBe(true);
  });

  it('wraps high-frequency dashboard pages with route reload retry', () => {
    expect(withRouteComponentReloadRetryMock).toHaveBeenCalledWith(
      expect.any(Function),
      'Analytics',
    );
    expect(withRouteComponentReloadRetryMock).toHaveBeenCalledWith(
      expect.any(Function),
      'Workspace',
    );
  });
});
