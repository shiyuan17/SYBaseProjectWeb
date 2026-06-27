import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ANALYTICS_ROUTE_NAME,
  __testables,
  syncDashboardRouteLayout,
} from './dashboard-layout-guard';

const layoutMocks = vi.hoisted(() => ({
  applyDashboardFullContent: vi.fn(),
  restoreDashboardLayout: vi.fn(),
}));

vi.mock('#/modules/dashboard/composables/useDashboardFullContent', () => ({
  applyDashboardFullContent: layoutMocks.applyDashboardFullContent,
  restoreDashboardLayout: layoutMocks.restoreDashboardLayout,
}));

describe('dashboard layout guard', () => {
  afterEach(() => {
    layoutMocks.applyDashboardFullContent.mockClear();
    layoutMocks.restoreDashboardLayout.mockClear();
  });

  it('applies full-content when navigating to analytics', () => {
    syncDashboardRouteLayout(
      __testables.createRoute(ANALYTICS_ROUTE_NAME),
      __testables.createRoute('Workspace'),
    );

    expect(layoutMocks.applyDashboardFullContent).toHaveBeenCalledTimes(1);
    expect(layoutMocks.restoreDashboardLayout).not.toHaveBeenCalled();
  });

  it('restores layout when leaving analytics', () => {
    syncDashboardRouteLayout(
      __testables.createRoute('Workspace'),
      __testables.createRoute(ANALYTICS_ROUTE_NAME),
    );

    expect(layoutMocks.restoreDashboardLayout).toHaveBeenCalledTimes(1);
    expect(layoutMocks.applyDashboardFullContent).not.toHaveBeenCalled();
  });

  it('does nothing when neither side is analytics', () => {
    syncDashboardRouteLayout(
      __testables.createRoute('Workspace'),
      __testables.createRoute('Dashboard'),
    );

    expect(layoutMocks.applyDashboardFullContent).not.toHaveBeenCalled();
    expect(layoutMocks.restoreDashboardLayout).not.toHaveBeenCalled();
  });
});
