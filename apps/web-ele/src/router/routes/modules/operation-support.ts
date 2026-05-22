import type { RouteRecordRaw } from 'vue-router';

import { M5_PERMISSION_CODES } from '#/modules/operation-support/constants';

const OPERATION_SUPPORT_AUTHORITIES = [
  M5_PERMISSION_CODES.ARCHIVE_CABINET_QUERY,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_CREATE,
  M5_PERMISSION_CODES.ARCHIVE_CABINET_UPDATE,
  M5_PERMISSION_CODES.APPLICATION_FORM_ARCHIVE,
  M5_PERMISSION_CODES.EMBEDDING_BOX_ARCHIVE,
  M5_PERMISSION_CODES.SLIDE_ARCHIVE,
  M5_PERMISSION_CODES.ARCHIVE_QUERY,
  M5_PERMISSION_CODES.LOAN_CREATE,
  M5_PERMISSION_CODES.LOAN_RETURN,
  M5_PERMISSION_CODES.LOAN_QUERY,
  M5_PERMISSION_CODES.REAGENT_QUERY,
  M5_PERMISSION_CODES.REAGENT_CREATE,
  M5_PERMISSION_CODES.REAGENT_UPDATE,
  M5_PERMISSION_CODES.REAGENT_STOCK_QUERY,
  M5_PERMISSION_CODES.REAGENT_STOCK_UPDATE,
  M5_PERMISSION_CODES.REAGENT_WARNING_QUERY,
  M5_PERMISSION_CODES.EQUIPMENT_QUERY,
  M5_PERMISSION_CODES.EQUIPMENT_CREATE,
  M5_PERMISSION_CODES.EQUIPMENT_UPDATE,
  M5_PERMISSION_CODES.EQUIPMENT_MAINTENANCE_CREATE,
  M5_PERMISSION_CODES.EQUIPMENT_WARNING_QUERY,
];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: OPERATION_SUPPORT_AUTHORITIES,
      icon: 'carbon:archive',
      order: 160,
      title: '归档与运营支撑',
    },
    name: 'OperationSupportRoot',
    path: '/operation-support',
    redirect: '/operation-support/entry',
    children: [
      {
        component: () =>
          import(
            '#/modules/operation-support/views/OperationSupportEntryView.vue'
          ),
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
          authority: [M5_PERMISSION_CODES.ARCHIVE_QUERY],
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
          authority: [M5_PERMISSION_CODES.REAGENT_QUERY],
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
          authority: [M5_PERMISSION_CODES.EQUIPMENT_QUERY],
          icon: 'carbon:tools',
          title: '设备台账',
        },
        name: 'EquipmentLedger',
        path: '/operation-support/equipment',
      },
    ],
  },
];

export default routes;
