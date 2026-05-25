import type { RouteRecordRaw } from 'vue-router';

import { M6_PERMISSION_CODES } from '#/modules/m6-statistics/constants';

const M6_AUTHORITIES = [
  M6_PERMISSION_CODES.INTEGRATION_TASK_QUERY,
  M6_PERMISSION_CODES.BILLING_QUERY,
  M6_PERMISSION_CODES.HISTORY_IMPORT,
  M6_PERMISSION_CODES.HISTORY_QUERY,
  M6_PERMISSION_CODES.STAT_INDICATOR_QUERY,
  M6_PERMISSION_CODES.STAT_TEMPLATE_QUERY,
  M6_PERMISSION_CODES.STAT_REPORT_QUERY,
  M6_PERMISSION_CODES.STAT_REPORT_EXPORT,
];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: M6_AUTHORITIES,
      icon: 'carbon:data-base',
      order: 190,
      title: '集成与统计',
    },
    name: 'M6Root',
    path: '/m6',
    redirect: '/m6/statistics',
    children: [
      {
        component: () => import('#/views/_core/fallback/coming-soon.vue'),
        meta: {
          authority: [M6_PERMISSION_CODES.INTEGRATION_TASK_QUERY],
          icon: 'carbon:connect',
          title: '集成任务',
        },
        name: 'IntegrationManagement',
        path: '/m6/integration',
      },
      {
        component: () => import('#/views/_core/fallback/coming-soon.vue'),
        meta: {
          authority: [M6_PERMISSION_CODES.BILLING_QUERY],
          icon: 'carbon:currency',
          title: '收费管理',
        },
        name: 'BillingManagement',
        path: '/m6/billing',
      },
      {
        component: () => import('#/views/_core/fallback/coming-soon.vue'),
        meta: {
          authority: [M6_PERMISSION_CODES.HISTORY_QUERY],
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
          authority: [
            M6_PERMISSION_CODES.STAT_INDICATOR_QUERY,
            M6_PERMISSION_CODES.STAT_TEMPLATE_QUERY,
            M6_PERMISSION_CODES.STAT_REPORT_QUERY,
          ],
          icon: 'carbon:chart-line',
          title: '统计分析',
        },
        name: 'StatisticsAnalysis',
        path: '/m6/statistics',
      },
    ],
  },
];

export default routes;
