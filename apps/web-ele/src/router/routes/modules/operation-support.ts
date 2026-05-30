import type { RouteRecordRaw } from 'vue-router';

import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_REAGENT_PAGE_AUTHORITIES,
} from '#/modules/operation-support/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const OPERATION_SUPPORT_AUTHORITIES = [
  ...M5_ARCHIVE_PAGE_AUTHORITIES,
  ...M5_REAGENT_PAGE_AUTHORITIES,
  ...M5_EQUIPMENT_PAGE_AUTHORITIES,
];

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      authority: OPERATION_SUPPORT_AUTHORITIES,
      icon: 'carbon:archive',
      order: 160,
      title: '归档运营管理',
    },
    name: 'OperationSupportRoot',
    path: '/operation-support',
    redirect: '/operation-support/entry',
    children: [
      {
        component: () =>
          import('#/modules/operation-support/views/OperationSupportEntryView.vue'),
        meta: {
          authority: OPERATION_SUPPORT_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '运营支撑入口',
        },
        name: 'OperationSupportEntry',
        path: '/operation-support/entry',
      },
      {
        component: () =>
          import('#/modules/operation-support/views/ArchiveManagementView.vue'),
        meta: {
          authority: [...M5_ARCHIVE_PAGE_AUTHORITIES],
          icon: 'carbon:archive',
          title: '归档管理',
        },
        name: 'ArchiveManagement',
        path: '/operation-support/archive',
      },
      {
        component: () =>
          import('#/modules/operation-support/views/ReagentLedgerView.vue'),
        meta: {
          authority: [...M5_REAGENT_PAGE_AUTHORITIES],
          icon: 'carbon:chemistry',
          title: '试剂台账',
        },
        name: 'ReagentLedger',
        path: '/operation-support/reagents',
      },
      {
        component: () =>
          import('#/modules/operation-support/views/EquipmentLedgerView.vue'),
        meta: {
          authority: [...M5_EQUIPMENT_PAGE_AUTHORITIES],
          icon: 'carbon:tools',
          title: '设备台账',
        },
        name: 'EquipmentLedger',
        path: '/operation-support/equipment',
      },
    ],
  },
]);

export default routes;
