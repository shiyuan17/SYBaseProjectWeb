import type { LocationQueryRaw, RouteRecordRaw } from 'vue-router';

import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';

const WORKFLOW_AUTHORITIES = [
  M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
  M2_PERMISSION_CODES.APPLICATION_CREATE,
  M2_PERMISSION_CODES.CLINICAL_IMPORT,
  M2_PERMISSION_CODES.SPECIMEN_REGISTER,
  M2_PERMISSION_CODES.FIXATION_VERIFY,
  M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
  M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
];

const SUBMISSION_WORKBENCH_AUTHORITIES = [
  M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
  M2_PERMISSION_CODES.APPLICATION_CREATE,
  M2_PERMISSION_CODES.CLINICAL_IMPORT,
  M2_PERMISSION_CODES.SPECIMEN_REGISTER,
];

function redirectWithQuery(
  path: string,
  defaults: LocationQueryRaw = {},
): NonNullable<RouteRecordRaw['redirect']> {
  return (to) => ({
    path,
    query: {
      ...defaults,
      ...to.query,
    } as LocationQueryRaw,
  });
}

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: WORKFLOW_AUTHORITIES,
      icon: 'carbon:flow',
      order: 120,
      title: '临床送检',
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
          import('#/modules/specimen-workflow/views/SubmissionRegistrationView.vue'),
        meta: {
          authority: SUBMISSION_WORKBENCH_AUTHORITIES,
          icon: 'carbon:list-boxes',
          title: '申请与登记',
        },
        name: 'SubmissionRegistration',
        path: '/workflow/submission-registration',
      },
      {
        component: () =>
          import(
            '#/modules/specimen-workflow/views/ApplicationRegistrationWorkbenchView.vue'
          ),
        meta: {
          authority: SUBMISSION_WORKBENCH_AUTHORITIES,
          icon: 'carbon:workspace',
          title: '申请登记工作台',
        },
        name: 'ApplicationRegistrationWorkbench',
        path: '/workflow/application-registration-workbench',
      },
      {
        redirect: redirectWithQuery('/workflow/submission-registration'),
        meta: {
          authority: [
            M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
            M2_PERMISSION_CODES.APPLICATION_CREATE,
            M2_PERMISSION_CODES.CLINICAL_IMPORT,
          ],
          hideInMenu: true,
          hideInTab: true,
          icon: 'carbon:list-boxes',
          title: '申请管理',
        },
        name: 'ApplicationList',
        path: '/workflow/application-list',
      },
      {
        redirect: redirectWithQuery('/workflow/submission-registration', {
          action: 'register',
        }),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_REGISTER],
          hideInMenu: true,
          hideInTab: true,
          icon: 'carbon:catalog',
          title: '标本管理',
        },
        name: 'SpecimenManagement',
        path: '/workflow/specimen-management',
      },
      {
        redirect: redirectWithQuery('/workflow/submission-registration', {
          action: 'register',
        }),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_REGISTER],
          hideInMenu: true,
          hideInTab: true,
          icon: 'carbon:task',
          title: '送检登记兼容页',
        },
        name: 'ClinicalRegister',
        path: '/workflow/clinical-register',
      },
      {
        component: () =>
          import('#/modules/specimen-workflow/views/FixationTransportView.vue'),
        meta: {
          authority: [
            M2_PERMISSION_CODES.FIXATION_VERIFY,
            M2_PERMISSION_CODES.TRANSPORT_HANDOVER,
          ],
          icon: 'carbon:checkmark-outline',
          title: '固定与转运',
        },
        name: 'FixationTransport',
        path: '/workflow/fixation-transport',
      },
      {
        redirect: redirectWithQuery('/workflow/fixation-transport', {
          tab: 'fixation',
        }),
        meta: {
          authority: [M2_PERMISSION_CODES.FIXATION_VERIFY],
          hideInMenu: true,
          hideInTab: true,
          icon: 'carbon:checkmark-outline',
          title: '固定核对',
        },
        name: 'FixationVerify',
        path: '/workflow/fixation-verify',
      },
      {
        redirect: redirectWithQuery('/workflow/fixation-transport', {
          tab: 'transport',
        }),
        meta: {
          authority: [M2_PERMISSION_CODES.TRANSPORT_HANDOVER],
          hideInMenu: true,
          hideInTab: true,
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
          hideInMenu: true,
          icon: 'carbon:archive',
          title: '病理接收',
        },
        name: 'PathologyReceipt',
        path: '/workflow/pathology-receipt',
      },
      {
        redirect: redirectWithQuery('/workflow/pathology-receipt'),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_RECEIVE],
          hideInMenu: true,
          hideInTab: true,
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
          title: '追踪与异常',
        },
        name: 'TrackingException',
        path: '/workflow/tracking-exception',
      },
      {
        redirect: redirectWithQuery('/workflow/tracking-exception'),
        meta: {
          authority: [M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY],
          hideInMenu: true,
          hideInTab: true,
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
