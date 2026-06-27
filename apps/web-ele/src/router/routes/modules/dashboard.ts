import type { RouteComponent, RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';
import { withRouteComponentReloadRetry } from '#/router/routes/lazy-load';

function loadDashboardRouteComponent(
  loader: () => Promise<RouteComponent>,
  routeName: string,
) {
  return withRouteComponentReloadRetry(loader, routeName);
}

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: loadDashboardRouteComponent(
          () => import('#/views/dashboard/analytics/index.vue'),
          'Analytics',
        ),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        component: loadDashboardRouteComponent(
          () => import('#/views/dashboard/workspace/index.vue'),
          'Workspace',
        ),
        meta: {
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
        },
      },
    ],
  },
]);

export default routes;
