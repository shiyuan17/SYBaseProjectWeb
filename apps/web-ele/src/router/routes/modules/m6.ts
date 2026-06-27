import type { RouteComponent, RouteRecordRaw } from 'vue-router';

import { M6_STATISTICS_PAGE_AUTHORITIES } from '#/modules/m6-management/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';
import { withRouteComponentReloadRetry } from '#/router/routes/lazy-load';

const M6_AUTHORITIES = [...M6_STATISTICS_PAGE_AUTHORITIES];

function loadM6RouteComponent(
  loader: () => Promise<RouteComponent>,
  routeName: string,
) {
  return withRouteComponentReloadRetry(loader, routeName);
}

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      authority: M6_AUTHORITIES,
      icon: 'carbon:data-base',
      order: 190,
      title: '数据统计与分析',
    },
    name: 'M6Root',
    path: '/m6',
    redirect: '/m6/entry',
    children: [
      {
        component: loadM6RouteComponent(
          () => import('#/modules/m6-management/views/M6EntryView.vue'),
          'M6Entry',
        ),
        meta: {
          authority: M6_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '数据统计入口',
        },
        name: 'M6Entry',
        path: '/m6/entry',
      },
      {
        component: loadM6RouteComponent(
          () =>
            import('#/modules/m6-statistics/views/StatisticsDashboardView.vue'),
          'M6StatisticsDashboard',
        ),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description: '汇总展示 M6 质控、运营与工作量统计核心指标。',
          icon: 'carbon:dashboard',
          title: '统计仪表盘',
        },
        name: 'M6StatisticsDashboard',
        path: '/m6/dashboard',
      },
      {
        component: loadM6RouteComponent(
          () =>
            import('#/modules/m6-statistics/views/QualityIndicatorStatisticsView.vue'),
          'QualityIndicatorStatistics',
        ),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description:
            '展示三甲质控指标、质量安全控制指标与数据源接入口径状态。',
          icon: 'carbon:chart-line',
          title: '质控指标统计',
        },
        name: 'QualityIndicatorStatistics',
        path: '/m6/quality-indicators',
      },
      {
        component: loadM6RouteComponent(
          () =>
            import('#/modules/m6-statistics/views/ManagementIndicatorStatisticsView.vue'),
          'ManagementIndicatorStatistics',
        ),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description: '展示业务量、收费、物资/试剂预警与人员工作量统计口径。',
          icon: 'carbon:chart-column',
          title: '管理指标统计',
        },
        name: 'ManagementIndicatorStatistics',
        path: '/m6/management-indicators',
      },
      {
        component: loadM6RouteComponent(
          () =>
            import('#/modules/m6-statistics/views/StatisticsAnalysisView.vue'),
          'CustomStatisticsAnalysis',
        ),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description:
            '面向医疗质量分析报表的统一工作台，支持工作量、质控、冰冻、报告更改与不合格标本分析。',
          icon: 'carbon:chart-line',
          title: '统计报表工作台',
        },
        name: 'CustomStatisticsAnalysis',
        path: '/m6/custom-analysis',
      },
    ],
  },
]);

export default routes;
