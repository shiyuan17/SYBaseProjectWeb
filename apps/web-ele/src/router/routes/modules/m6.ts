import type { RouteRecordRaw } from 'vue-router';

import {
  M6_BILLING_PAGE_AUTHORITIES,
  M6_HISTORY_PAGE_AUTHORITIES,
  M6_INTEGRATION_PAGE_AUTHORITIES,
  M6_STATISTICS_PAGE_AUTHORITIES,
} from '#/modules/m6-management/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const M6_AUTHORITIES = [
  ...M6_INTEGRATION_PAGE_AUTHORITIES,
  ...M6_BILLING_PAGE_AUTHORITIES,
  ...M6_HISTORY_PAGE_AUTHORITIES,
  ...M6_STATISTICS_PAGE_AUTHORITIES,
];

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      authority: M6_AUTHORITIES,
      icon: 'carbon:data-base',
      order: 190,
      title: '集成与统计',
    },
    name: 'M6Root',
    path: '/m6',
    redirect: '/m6/entry',
    children: [
      {
        component: () => import('#/modules/m6-management/views/M6EntryView.vue'),
        meta: {
          authority: M6_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: 'M6 入口',
        },
        name: 'M6Entry',
        path: '/m6/entry',
      },
      {
        component: () =>
          import('#/modules/m6-management/views/IntegrationManagementView.vue'),
        meta: {
          authority: [...M6_INTEGRATION_PAGE_AUTHORITIES],
          icon: 'carbon:connect',
          title: '集成任务',
        },
        name: 'IntegrationManagement',
        path: '/m6/integration',
      },
      {
        component: () =>
          import('#/modules/m6-management/views/BillingManagementView.vue'),
        meta: {
          authority: [...M6_BILLING_PAGE_AUTHORITIES],
          icon: 'carbon:currency',
          title: '收费管理',
        },
        name: 'BillingManagement',
        path: '/m6/billing',
      },
      {
        component: () =>
          import('#/modules/m6-management/views/HistoricalReportsView.vue'),
        meta: {
          authority: [...M6_HISTORY_PAGE_AUTHORITIES],
          icon: 'carbon:document',
          title: '历史报告',
        },
        name: 'HistoricalReports',
        path: '/m6/history',
      },
      {
        component: () =>
          import('#/modules/m6-statistics/views/StatisticsAnalysisView.vue'),
        meta: {
          authority: [...M6_STATISTICS_PAGE_AUTHORITIES],
          icon: 'carbon:chart-line',
          title: '统计分析',
        },
        name: 'StatisticsAnalysis',
        path: '/m6/statistics',
      },
    ],
  },
]);

export default routes;
