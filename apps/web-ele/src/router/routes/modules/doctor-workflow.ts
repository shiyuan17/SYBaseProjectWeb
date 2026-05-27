import type { RouteRecordRaw } from 'vue-router';

import {
  M4_CONSULTATION_PAGE_AUTHORITIES,
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
  M4_REVISION_PAGE_AUTHORITIES,
} from '#/modules/doctor-workflow/constants';

const DOCTOR_WORKFLOW_AUTHORITIES = [
  M4_PERMISSION_CODES.DIAG_TASK_QUERY,
  M4_PERMISSION_CODES.ASSIGN,
  M4_PERMISSION_CODES.WORKBENCH_QUERY,
  M4_PERMISSION_CODES.ACCEPT,
  M4_PERMISSION_CODES.START,
  M4_PERMISSION_CODES.REPORT_CREATE,
  M4_PERMISSION_CODES.REPORT_SUBMIT,
  M4_PERMISSION_CODES.REPORT_REVIEW,
  M4_PERMISSION_CODES.REPORT_SIGN,
  M4_PERMISSION_CODES.REPORT_PUBLISH,
  M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
  M4_PERMISSION_CODES.REVISION_REQUEST_CREATE,
  M4_PERMISSION_CODES.REVISION_APPROVE,
  M4_PERMISSION_CODES.CONSULTATION_CREATE,
  M4_PERMISSION_CODES.CONSULTATION_COMMENT,
  M4_PERMISSION_CODES.CONSULTATION_COMPLETE,
  M4_PERMISSION_CODES.MEDICAL_ORDER_QUERY,
  M4_PERMISSION_CODES.MEDICAL_ORDER_ACCEPT,
  M4_PERMISSION_CODES.MEDICAL_ORDER_COMPLETE,
  M4_PERMISSION_CODES.MEDICAL_ORDER_CREATE,
  M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL,
];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: DOCTOR_WORKFLOW_AUTHORITIES,
      icon: 'carbon:stethoscope',
      order: 140,
      title: '诊断管理',
    },
    name: 'DoctorWorkflowRoot',
    path: '/doctor-workflow',
    redirect: '/doctor-workflow/entry',
    children: [
      {
        component: () =>
          import('#/modules/doctor-workflow/views/DoctorWorkflowEntryView.vue'),
        meta: {
          authority: DOCTOR_WORKFLOW_AUTHORITIES,
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '医生流程入口',
        },
        name: 'DoctorWorkflowEntry',
        path: '/doctor-workflow/entry',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/DiagnosisAssignmentView.vue'),
        meta: {
          authority: [M4_PERMISSION_CODES.DIAG_TASK_QUERY],
          icon: 'carbon:user-multiple',
          title: '诊断分配',
        },
        name: 'DiagnosisAssignment',
        path: '/doctor-workflow/assignment',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/DiagnosisWorkbenchView.vue'),
        meta: {
          authority: [M4_PERMISSION_CODES.WORKBENCH_QUERY],
          icon: 'carbon:workspace',
          title: '诊断工作台',
        },
        name: 'DiagnosisWorkbench',
        path: '/doctor-workflow/workbench',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/PathologyReportView.vue'),
        meta: {
          authority: [...M4_REPORT_PAGE_AUTHORITIES],
          icon: 'carbon:report',
          title: '病理报告',
        },
        name: 'PathologyReport',
        path: '/doctor-workflow/report',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/FrozenReportView.vue'),
        meta: {
          authority: [...M4_REPORT_PAGE_AUTHORITIES],
          icon: 'carbon:snowflake',
          title: '冰冻快速报告',
        },
        name: 'FrozenReport',
        path: '/doctor-workflow/frozen-report',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/ReportTrackingView.vue'),
        meta: {
          authority: [M4_PERMISSION_CODES.REPORT_TRACKING_QUERY],
          icon: 'carbon:search',
          title: '报告追踪',
        },
        name: 'ReportTracking',
        path: '/doctor-workflow/tracking',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/MedicalOrderWorkbenchView.vue'),
        meta: {
          authority: [...M4_MEDICAL_ORDER_PAGE_AUTHORITIES],
          icon: 'carbon:task-approved',
          title: '病理医嘱执行',
        },
        name: 'MedicalOrderWorkbench',
        path: '/doctor-workflow/medical-orders',
      },
      {
        component: () =>
          import('#/modules/doctor-workflow/views/ReportRevisionView.vue'),
        meta: {
          authority: [...M4_REVISION_PAGE_AUTHORITIES],
          icon: 'carbon:document-preliminary',
          title: '报告修订',
        },
        name: 'ReportRevision',
        path: '/doctor-workflow/revision',
      },
      {
        component: () =>
          import(
            '#/modules/doctor-workflow/views/ConsultationWorkstationView.vue'
          ),
        meta: {
          authority: [...M4_CONSULTATION_PAGE_AUTHORITIES],
          icon: 'carbon:group',
          title: '会诊管理',
        },
        name: 'Consultation',
        path: '/doctor-workflow/consultation',
      },
    ],
  },
];

export default routes;
