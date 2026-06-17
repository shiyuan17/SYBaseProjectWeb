import type { RouteComponent, RouteRecordRaw } from 'vue-router';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { M3_PERMISSION_CODES } from '#/modules/technical-workflow/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';
import { withRouteComponentReloadRetry } from '#/router/routes/lazy-load';

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

function loadTechnicalWorkflowRouteComponent(
  loader: () => Promise<RouteComponent>,
  routeName: string,
) {
  return withRouteComponentReloadRetry(loader, routeName);
}

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
    redirect: '/technical-workflow/specimen-receipt',
    children: [
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/TechnicalWorkflowEntryView.vue'),
          'TechnicalWorkflowEntry',
        ),
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/specimen-workflow/views/SpecimenReceiptView.vue'),
          'TechnicalWorkflowReceipt',
        ),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_RECEIVE],
          icon: 'carbon:archive',
          title: '标本接收',
        },
        name: 'TechnicalWorkflowReceipt',
        path: '/technical-workflow/specimen-receipt',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/TechnicalSpecimenRegistrationView.vue'),
          'TechnicalSpecimenRegistration',
        ),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_RECEIVE],
          icon: 'carbon:data-table',
          title: '标本登记',
        },
        name: 'TechnicalSpecimenRegistration',
        path: '/technical-workflow/specimen-registration',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/TechnicalTasksView.vue'),
          'TechnicalTasks',
        ),
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/FrozenWorkstationView.vue'),
          'FrozenWorkstation',
        ),
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/GrossingWorkstationView.vue'),
          'GrossingWorkstation',
        ),
        meta: {
          authority: [M3_PERMISSION_CODES.GROSSING],
          icon: 'carbon:scan',
          title: '取材描写工作站',
        },
        name: 'GrossingWorkstation',
        path: '/technical-workflow/grossing',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/DehydrationWorkstationView.vue'),
          'DehydrationWorkstation',
        ),
        meta: {
          authority: [M3_PERMISSION_CODES.DEHYDRATION],
          icon: 'carbon:data-vis-4',
          title: '脱水工作站',
        },
        name: 'DehydrationWorkstation',
        path: '/technical-workflow/dehydration',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/EmbeddingWorkstationView.vue'),
          'EmbeddingWorkstation',
        ),
        meta: {
          authority: [M3_PERMISSION_CODES.EMBEDDING],
          icon: 'carbon:cube',
          title: '包埋工作站',
        },
        name: 'EmbeddingWorkstation',
        path: '/technical-workflow/embedding',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/SlicingWorkstationView.vue'),
          'SlicingWorkstation',
        ),
        meta: {
          authority: [M3_PERMISSION_CODES.SLICING],
          icon: 'carbon:cut',
          title: '切片工作站',
        },
        name: 'SlicingWorkstation',
        path: '/technical-workflow/slicing',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/StainingWorkstationView.vue'),
          'StainingWorkstation',
        ),
        meta: {
          authority: [M3_PERMISSION_CODES.STAINING],
          icon: 'carbon:color-palette',
          title: '染色出片工作站',
        },
        name: 'StainingWorkstation',
        path: '/technical-workflow/staining',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/RoutineOrderWorkstationView.vue'),
          'RoutineOrderWorkstation',
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/SpecialOrderWorkstationView.vue'),
          'SpecialOrderWorkstation',
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/IhcWorkstationView.vue'),
          'IhcWorkstation',
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/CytologyWorkstationView.vue'),
          'CytologyWorkstation',
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/LiquidCytologyWorkstationView.vue'),
          'LiquidCytologyWorkstation',
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
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/ReworkWorkstationView.vue'),
          'ReworkWorkstation',
        ),
        meta: {
          authority: [M3_PERMISSION_CODES.REWORK],
          icon: 'carbon:renew',
          title: '返工工作站',
        },
        name: 'ReworkWorkstation',
        path: '/technical-workflow/rework',
      },
      {
        component: loadTechnicalWorkflowRouteComponent(
          () =>
            import('#/modules/technical-workflow/views/TechnicalTrackingView.vue'),
          'TechnicalTracking',
        ),
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
