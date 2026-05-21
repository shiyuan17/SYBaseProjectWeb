import type { RouteRecordRaw } from 'vue-router';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

const WORKFLOW_AUTHORITIES = [
  M2_PERMISSION_CODES.SPECIMEN_REGISTER,
  M2_PERMISSION_CODES.FIXATION_VERIFY,
  M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
  M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
  M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: WORKFLOW_AUTHORITIES,
      icon: 'carbon:flow',
      order: 120,
      title: '临床送检工作流',
    },
    name: 'WorkflowRoot',
    path: '/workflow',
    redirect: '/workflow/entry',
    children: [
      {
        component: () =>
          import('#/modules/specimen-workflow/views/WorkflowEntryView.vue'),
        meta: {
          authority: WORKFLOW_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '工作流入口',
        },
        name: 'WorkflowEntry',
        path: '/workflow/entry',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/ClinicalRegisterView.vue'),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_REGISTER],
          icon: 'carbon:catalog',
          title: '临床登记',
        },
        name: 'ClinicalRegister',
        path: '/workflow/clinical-register',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/FixationVerifyView.vue'),
        meta: {
          authority: [M2_PERMISSION_CODES.FIXATION_VERIFY],
          icon: 'carbon:checkmark-outline',
          title: '固定核对',
        },
        name: 'FixationVerify',
        path: '/workflow/fixation-verify',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/TransportHandoverView.vue'),
        meta: {
          authority: [M2_PERMISSION_CODES.TRANSPORT_HANDOVER],
          icon: 'carbon:delivery',
          title: '转运交接',
        },
        name: 'TransportHandover',
        path: '/workflow/transport-handover',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/SpecimenReceiptView.vue'),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_RECEIVE],
          icon: 'carbon:archive',
          title: '标本接收',
        },
        name: 'SpecimenReceipt',
        path: '/workflow/specimen-receipt',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/TrackingQueryView.vue'),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY],
          icon: 'carbon:search',
          title: '追踪查询',
        },
        name: 'TrackingQuery',
        path: '/workflow/tracking-query',
      },
    ],
  },
];

export default routes;
