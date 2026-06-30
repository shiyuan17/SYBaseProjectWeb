import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from 'vue-router';

import {
  applyDashboardFullContent,
  restoreDashboardLayout,
} from '#/modules/dashboard/composables/useDashboardFullContent';

export const ANALYTICS_ROUTE_NAME = 'Analytics';

function createRoute(name: null | string): RouteLocationNormalized {
  return { name } as RouteLocationNormalized;
}

export function syncDashboardRouteLayout(
  to: RouteLocationNormalized | RouteLocationNormalizedLoaded,
  from: RouteLocationNormalized | RouteLocationNormalizedLoaded,
) {
  if (to.name === ANALYTICS_ROUTE_NAME) {
    applyDashboardFullContent();
    return;
  }

  if (from.name === ANALYTICS_ROUTE_NAME) {
    restoreDashboardLayout();
  }
}

export function setupDashboardLayoutGuard(router: {
  beforeEach: (
    guard: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
    ) => boolean,
  ) => void;
}) {
  router.beforeEach((to, from) => {
    syncDashboardRouteLayout(to, from);
    return true;
  });
}

export const __testables = {
  createRoute,
};
