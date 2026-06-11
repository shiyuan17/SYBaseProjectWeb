import type { RouteRecordRaw } from 'vue-router';

import { M6_STATISTICS_PAGE_AUTHORITIES } from '#/modules/m6-management/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const M6_AUTHORITIES = [...M6_STATISTICS_PAGE_AUTHORITIES];

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
        component: () =>
          import('#/modules/m6-management/views/M6EntryView.vue'),
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
        component: () =>
          import('#/modules/m6-statistics/views/StatisticsDashboardView.vue'),
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
        component: () =>
          import('#/views/_core/fallback/MenuPlaceholderView.vue'),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description: '当前页面暂未接入质控指标统计相关业务功能。',
          icon: 'carbon:chart-line',
          title: '质控指标统计',
        },
        name: 'QualityIndicatorStatistics',
        path: '/m6/quality-indicators',
      },
      {
        component: () =>
          import('#/views/_core/fallback/MenuPlaceholderView.vue'),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description: '当前页面暂未接入管理指标统计相关业务功能。',
          icon: 'carbon:chart-column',
          title: '管理指标统计',
        },
        name: 'ManagementIndicatorStatistics',
        path: '/m6/management-indicators',
      },
      {
        component: () =>
          import('#/modules/m6-statistics/views/StatisticsAnalysisView.vue'),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          description:
            '面向自定义统计分析场景的正式报表入口，支持按模板或单指标查询并导出 CSV。',
          icon: 'carbon:chart-line',
          title: '自定义统计分析',
        },
        name: 'CustomStatisticsAnalysis',
        path: '/m6/custom-analysis',
      },
    ],
  },
]);

export default routes;
