import type { RouteRecordRaw } from 'vue-router';

import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_BORROW_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_OPERATION_SUPPORT_AUTHORITIES,
  M5_REAGENT_PAGE_AUTHORITIES,
  M5_RESOURCE_PAGE_AUTHORITIES,
} from '#/modules/operation-support/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const RESOURCE_AUTHORITIES = [
  ...M5_REAGENT_PAGE_AUTHORITIES,
  ...M5_EQUIPMENT_PAGE_AUTHORITIES,
];

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      authority: [...M5_OPERATION_SUPPORT_AUTHORITIES],
      icon: 'carbon:archive',
      order: 160,
      title: '归档与借记',
    },
    name: 'OperationSupportRoot',
    path: '/operation-support',
    redirect: '/operation-support/entry',
    children: [
      {
        component: () =>
          import('#/modules/operation-support/views/OperationSupportEntryView.vue'),
        meta: {
          authority: [...M5_OPERATION_SUPPORT_AUTHORITIES],
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '归档与借记入口',
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
          import('#/modules/operation-support/views/BorrowManagementView.vue'),
        meta: {
          authority: [...M5_BORROW_PAGE_AUTHORITIES],
          icon: 'carbon:bookmark',
          title: '借记管理',
        },
        name: 'BorrowManagement',
        path: '/operation-support/borrow',
      },
    ],
  },
  {
    meta: {
      authority: RESOURCE_AUTHORITIES,
      icon: 'carbon:tool-kit',
      order: 170,
      title: '设备及试剂管理',
    },
    name: 'OperationResourceRoot',
    path: '/operation-resources',
    redirect: '/operation-resources/entry',
    children: [
      {
        component: () =>
          import('#/modules/operation-support/views/OperationResourceEntryView.vue'),
        meta: {
          authority: RESOURCE_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '设备及试剂管理入口',
        },
        name: 'OperationResourceEntry',
        path: '/operation-resources/entry',
      },
      {
        component: () =>
          import('#/modules/operation-support/views/EquipmentLedgerView.vue'),
        meta: {
          authority: [...M5_EQUIPMENT_PAGE_AUTHORITIES],
          description: '维护仪器设备档案、保养记录，并跟踪设备预警。',
          icon: 'carbon:tools',
          title: '仪器设备管理',
        },
        name: 'EquipmentManagement',
        path: '/operation-resources/equipment',
      },
      {
        component: () =>
          import('#/modules/operation-support/views/ReagentLedgerView.vue'),
        meta: {
          authority: [...M5_REAGENT_PAGE_AUTHORITIES],
          description: '维护试剂耗材基础信息、库存批次，并跟踪预警。',
          icon: 'carbon:chemistry',
          title: '试剂耗材管理',
        },
        name: 'ReagentConsumableManagement',
        path: '/operation-resources/reagents',
      },
      {
        component: () =>
          import('#/modules/operation-support/views/MedicalWasteManagementView.vue'),
        meta: {
          authority: [...M5_RESOURCE_PAGE_AUTHORITIES],
          description: '维护人体标本与药物试剂医疗废物袋打印、交接记录。',
          icon: 'carbon:trash-can',
          title: '医疗废物管理',
        },
        name: 'MedicalWasteManagement',
        path: '/operation-resources/medical-waste',
      },
    ],
  },
]);

export default routes;
