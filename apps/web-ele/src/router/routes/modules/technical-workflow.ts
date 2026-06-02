import type { RouteRecordRaw } from 'vue-router';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { M3_PERMISSION_CODES } from '#/modules/technical-workflow/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const TECHNICAL_WORKFLOW_AUTHORITIES = [
  M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
  M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
  M3_PERMISSION_CODES.GROSSING,
  M3_PERMISSION_CODES.DEHYDRATION,
  M3_PERMISSION_CODES.EMBEDDING,
  M3_PERMISSION_CODES.SLICING,
  M3_PERMISSION_CODES.STAINING,
  M3_PERMISSION_CODES.REWORK,
  M3_PERMISSION_CODES.TECHNICAL_TRACKING_QUERY,
];

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      authority: TECHNICAL_WORKFLOW_AUTHORITIES,
      icon: 'carbon:operations-record',
      order: 130,
      title: '制片管理',
    },
    name: 'TechnicalWorkflowRoot',
    path: '/technical-workflow',
    redirect: '/technical-workflow/entry',
    children: [
      {
        component: () =>
          import('#/modules/technical-workflow/views/TechnicalWorkflowEntryView.vue'),
        meta: {
          authority: TECHNICAL_WORKFLOW_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '技术流程入口',
        },
        name: 'TechnicalWorkflowEntry',
        path: '/technical-workflow/entry',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/SpecimenReceiptView.vue'),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_RECEIVE],
          icon: 'carbon:archive',
          title: '标本接收',
        },
        name: 'PathologyReceipt',
        path: '/workflow/pathology-receipt',
      },
      {
        component: () =>
          import(
            '#/modules/technical-workflow/views/TechnicalSpecimenRegistrationView.vue'
          ),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_RECEIVE],
          icon: 'carbon:data-table',
          title: '登记接收工作站',
        },
        name: 'TechnicalSpecimenRegistration',
        path: '/technical-workflow/specimen-registration',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/TechnicalTasksView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          hideInMenu: true,
          icon: 'carbon:task',
          title: '任务池',
        },
        name: 'TechnicalTasks',
        path: '/technical-workflow/tasks',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/FrozenWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          hideInMenu: true,
          icon: 'carbon:snowflake',
          title: '冰冻工作台',
        },
        name: 'FrozenWorkstation',
        path: '/technical-workflow/frozen',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/GrossingWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.GROSSING],
          icon: 'carbon:scan',
          title: '取材描写工作站',
        },
        name: 'GrossingWorkstation',
        path: '/technical-workflow/grossing',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/DehydrationWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.DEHYDRATION],
          icon: 'carbon:data-vis-4',
          title: '脱水工作站',
        },
        name: 'DehydrationWorkstation',
        path: '/technical-workflow/dehydration',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/EmbeddingWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.EMBEDDING],
          icon: 'carbon:cube',
          title: '包埋工作站',
        },
        name: 'EmbeddingWorkstation',
        path: '/technical-workflow/embedding',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/SlicingWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.SLICING],
          icon: 'carbon:cut',
          title: '切片工作站',
        },
        name: 'SlicingWorkstation',
        path: '/technical-workflow/slicing',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/StainingWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.STAINING],
          icon: 'carbon:color-palette',
          title: '染色出片工作站',
        },
        name: 'StainingWorkstation',
        path: '/technical-workflow/staining',
      },
      {
        component: () =>
          import(
            '#/modules/technical-workflow/views/RoutineOrderWorkstationView.vue'
          ),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          icon: 'carbon:document-tasks',
          title: '常规医嘱工作站',
        },
        name: 'RoutineOrderWorkstation',
        path: '/technical-workflow/routine-orders',
      },
      {
        component: () =>
          import(
            '#/modules/technical-workflow/views/SpecialOrderWorkstationView.vue'
          ),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          icon: 'carbon:document-requirements',
          title: '特检医嘱工作站',
        },
        name: 'SpecialOrderWorkstation',
        path: '/technical-workflow/special-orders',
      },
      {
        component: () =>
          import(
            '#/modules/technical-workflow/views/IhcWorkstationView.vue'
          ),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          icon: 'carbon:chemistry',
          title: '免疫组化工作站',
        },
        name: 'IhcWorkstation',
        path: '/technical-workflow/ihc',
      },
      {
        component: () =>
          import(
            '#/modules/technical-workflow/views/CytologyWorkstationView.vue'
          ),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          icon: 'carbon:microscope',
          title: '细胞学工作站',
        },
        name: 'CytologyWorkstation',
        path: '/technical-workflow/cytology',
      },
      {
        component: () =>
          import(
            '#/modules/technical-workflow/views/LiquidCytologyWorkstationView.vue'
          ),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY],
          icon: 'lucide:droplets',
          title: '液基细胞学工作站',
        },
        name: 'LiquidCytologyWorkstation',
        path: '/technical-workflow/liquid-cytology',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/ReworkWorkstationView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.REWORK],
          icon: 'carbon:renew',
          title: '返工工作站',
        },
        name: 'ReworkWorkstation',
        path: '/technical-workflow/rework',
      },
      {
        component: () =>
          import('#/modules/technical-workflow/views/TechnicalTrackingView.vue'),
        meta: {
          authority: [M3_PERMISSION_CODES.TECHNICAL_TRACKING_QUERY],
          icon: 'carbon:search',
          title: '技术追踪',
        },
        name: 'TechnicalTracking',
        path: '/technical-workflow/tracking',
      },
    ],
  },
]);

export default routes;
