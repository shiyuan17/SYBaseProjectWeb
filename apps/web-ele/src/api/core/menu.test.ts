import type { MenuView } from '#/modules/system-management/types/system-management';

import { describe, expect, it } from 'vitest';

import {
  M4_CONSULTATION_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
  M4_REVISION_PAGE_AUTHORITIES,
} from '#/modules/doctor-workflow/constants';
import {
  M6_BILLING_PAGE_AUTHORITIES,
  M6_HISTORY_PAGE_AUTHORITIES,
  M6_INTEGRATION_PAGE_AUTHORITIES,
  M6_PERMISSION_CODES,
  M6_STATISTICS_PAGE_AUTHORITIES,
} from '#/modules/m6-management/constants';
import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_REAGENT_PAGE_AUTHORITIES,
} from '#/modules/operation-support/constants';
import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { M1_PERMISSION_CODES } from '#/modules/system-management/constants';
import { M3_PERMISSION_CODES } from '#/modules/technical-workflow/constants';
import doctorWorkflowRoutes from '#/router/routes/modules/doctor-workflow';
import m6Routes from '#/router/routes/modules/m6';
import operationSupportRoutes from '#/router/routes/modules/operation-support';
import systemRoutes from '#/router/routes/modules/system';
import technicalWorkflowRoutes from '#/router/routes/modules/technical-workflow';
import workflowRoutes from '#/router/routes/modules/workflow';

import { getBackendFirstMenuRoutes, mapMenuViewsToRoutes } from './menu-mapper';

describe('mapMenuViewsToRoutes', () => {
  it('converts legacy M1 menu definitions into canonical frontend routes', () => {
    const menus: MenuView[] = [
      {
        componentName: 'SystemRoot',
        enabled: true,
        icon: 'setting',
        id: 'MENU_SYSTEM',
        menuCode: 'SYSTEM',
        menuName: '系统管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/system',
        permissionPrefix: 'sys',
        sortOrder: 1,
        visible: true,
      },
      {
        componentName: 'SystemUsers',
        enabled: true,
        icon: 'user',
        id: 'MENU_SYS_USERS',
        menuCode: 'SYS_USERS',
        menuName: '系统用户',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/api/v1/system-users',
        permissionPrefix: 'sys:user',
        sortOrder: 10,
        visible: true,
      },
      {
        componentName: 'system/medical-order-dict/index',
        enabled: true,
        icon: 'clipboard',
        id: 'MENU_SYS_ORDER_DICT',
        menuCode: 'SYS_MEDICAL_ORDER_DICT',
        menuName: '医嘱字典管理',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/medical-order-dict',
        permissionPrefix: 'sys:medical-order-dict',
        sortOrder: 20,
        visible: true,
      },
      {
        componentName: 'system/login-log/index',
        enabled: false,
        icon: 'log',
        id: 'MENU_SYS_LOGIN_LOG',
        menuCode: 'SYS_LOGIN_LOG',
        menuName: '登录日志',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/login-logs',
        permissionPrefix: 'sys:login-log',
        sortOrder: 30,
        visible: false,
      },
    ];

    const routes = mapMenuViewsToRoutes(menus);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      component: 'BasicLayout',
      name: 'SystemRoot',
      path: '/system',
      redirect: '/system/users',
    });
    expect(routes[0]?.children).toEqual([
      expect.objectContaining({
        component: '/modules/system-management/views/SystemUsersView',
        meta: expect.objectContaining({
          keepAlive: true,
        }),
        name: 'SystemUsers',
        path: '/system/users',
      }),
      expect.objectContaining({
        component: '/modules/system-management/views/MedicalOrderDictsView',
        meta: expect.objectContaining({
          keepAlive: true,
        }),
        name: 'MedicalOrderDicts',
        path: '/system/medical-order-dicts',
      }),
    ]);
  });

  it('converts M2 workflow menu definitions into the consolidated clinical submission routes', () => {
    const routes = mapMenuViewsToRoutes([
      {
        componentName: 'WorkflowRoot',
        enabled: true,
        icon: 'flow',
        id: 'MENU_M2_WORKFLOW',
        menuCode: 'M2_WORKFLOW',
        menuName: '临床送检',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/workflow',
        permissionPrefix: 'm2',
        sortOrder: 100,
        visible: true,
      },
      {
        componentName: 'SubmissionRegistration',
        enabled: true,
        icon: 'list',
        id: 'MENU_M2_APPLICATION_LIST',
        menuCode: 'M2_APPLICATION_LIST',
        menuName: '申请与登记',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/workflow/submission-registration',
        permissionPrefix: 'm2:application-list',
        sortOrder: 110,
        visible: true,
      },
      {
        componentName: 'ApplicationRegistrationWorkbench',
        enabled: true,
        icon: 'workspace',
        id: 'MENU_M2_CLINICAL_WORKBENCH',
        menuCode: 'M2_CLINICAL_WORKBENCH',
        menuName: '申请登记工作台',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/workflow/application-registration-workbench',
        permissionPrefix: 'm2:clinical-workbench',
        sortOrder: 115,
        visible: true,
      },
      {
        componentName: 'FixationTransport',
        enabled: true,
        icon: 'check',
        id: 'MENU_M2_FIXATION',
        menuCode: 'M2_FIXATION',
        menuName: '固定与转运',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/workflow/fixation-transport',
        permissionPrefix: 'm2:fixation',
        sortOrder: 120,
        visible: true,
      },
      {
        componentName: 'TrackingException',
        enabled: true,
        icon: 'search',
        id: 'MENU_M2_TRACKING',
        menuCode: 'M2_TRACKING',
        menuName: '追踪与异常',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/workflow/tracking-exception',
        permissionPrefix: 'm2:tracking',
        sortOrder: 140,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'WorkflowRoot',
        path: '/workflow',
        redirect: '/workflow/submission-registration',
        children: [
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'SubmissionRegistration',
            path: '/workflow/submission-registration',
          }),
          expect.objectContaining({
            component:
              '/modules/specimen-workflow/views/ApplicationRegistrationWorkbenchView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'ApplicationRegistrationWorkbench',
            path: '/workflow/application-registration-workbench',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'FixationTransport',
            path: '/workflow/fixation-transport',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'TrackingException',
            path: '/workflow/tracking-exception',
          }),
        ],
      }),
    ]);
  });

  it('converts M3 technical workflow menu definitions into canonical frontend routes', () => {
    const routes = mapMenuViewsToRoutes([
      {
        componentName: 'TechnicalWorkflowRoot',
        enabled: true,
        icon: 'operations',
        id: 'MENU_M3_WORKFLOW',
        menuCode: 'M3_WORKFLOW',
        menuName: '制片管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/technical-workflow',
        permissionPrefix: 'm3',
        sortOrder: 120,
        visible: true,
      },
      {
        componentName: 'PathologyReceipt',
        enabled: true,
        icon: 'archive',
        id: 'MENU_M2_RECEIPT',
        menuCode: 'M2_RECEIPT',
        menuName: '病理接收',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/workflow/pathology-receipt',
        permissionPrefix: 'm2:receipt',
        sortOrder: 120,
        visible: true,
      },
      {
        componentName: 'TechnicalTasks',
        enabled: true,
        icon: 'task',
        id: 'MENU_M3_TASKS',
        menuCode: 'M3_TASKS',
        menuName: '任务池',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/api/v1/technical-tasks/pending',
        permissionPrefix: 'm3:tasks',
        sortOrder: 121,
        visible: true,
      },
      {
        componentName: 'Grossing',
        enabled: true,
        icon: 'scan',
        id: 'MENU_M3_GROSSING',
        menuCode: 'M3_GROSSING',
        menuName: '取材描写',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/api/v1/grossings',
        permissionPrefix: 'm3:grossing',
        sortOrder: 122,
        visible: true,
      },
      {
        componentName: 'FrozenWorkstation',
        enabled: true,
        icon: 'snow',
        id: 'MENU_M3_FROZEN',
        menuCode: 'M3_FROZEN',
        menuName: '冰冻工作台',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/api/v1/frozen-sessions',
        permissionPrefix: 'm3:frozen',
        sortOrder: 123,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'TechnicalWorkflowRoot',
        path: '/technical-workflow',
        redirect: '/workflow/pathology-receipt',
        children: [
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'PathologyReceipt',
            path: '/workflow/pathology-receipt',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'TechnicalTasks',
            path: '/technical-workflow/tasks',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'GrossingWorkstation',
            path: '/technical-workflow/grossing',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'FrozenWorkstation',
            path: '/technical-workflow/frozen',
          }),
        ],
      }),
    ]);
  });

  it('converts M4 doctor workflow menu definitions into canonical frontend routes', () => {
    const routes = mapMenuViewsToRoutes([
      {
        componentName: 'DoctorWorkflowRoot',
        enabled: true,
        icon: 'm4',
        id: 'MENU_M4_WORKFLOW',
        menuCode: 'M4_WORKFLOW',
        menuName: '诊断管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/doctor-workflow',
        permissionPrefix: 'm4',
        sortOrder: 130,
        visible: true,
      },
      {
        componentName: 'DiagnosisAssignment',
        enabled: true,
        icon: 'assign',
        id: 'MENU_M4_ASSIGN',
        menuCode: 'M4_ASSIGN',
        menuName: '诊断分配',
        menuType: 'MENU',
        parentId: 'MENU_M4_WORKFLOW',
        path: '/api/v1/diagnostic-tasks/pending',
        permissionPrefix: 'm4:assign',
        sortOrder: 131,
        visible: true,
      },
      {
        componentName: 'PathologyReport',
        enabled: true,
        icon: 'report',
        id: 'MENU_M4_REPORT',
        menuCode: 'M4_REPORT',
        menuName: '病理报告',
        menuType: 'MENU',
        parentId: 'MENU_M4_WORKFLOW',
        path: '/api/v1/pathology-reports',
        permissionPrefix: 'm4:report',
        sortOrder: 132,
        visible: true,
      },
      {
        componentName: 'FrozenReport',
        enabled: true,
        icon: 'snow',
        id: 'MENU_M4_FROZEN_REPORT',
        menuCode: 'M4_FROZEN_REPORT',
        menuName: '冰冻快速报告',
        menuType: 'MENU',
        parentId: 'MENU_M4_WORKFLOW',
        path: '/api/v1/frozen-sessions',
        permissionPrefix: 'm4:frozen-report',
        sortOrder: 133,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'DoctorWorkflowRoot',
        path: '/doctor-workflow',
        redirect: '/doctor-workflow/assignment',
        children: [
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'DiagnosisAssignment',
            path: '/doctor-workflow/assignment',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'PathologyReport',
            path: '/doctor-workflow/report',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'FrozenReport',
            path: '/doctor-workflow/frozen-report',
          }),
        ],
      }),
    ]);
  });

  it('converts M5 operation support menu definitions into canonical frontend routes', () => {
    const routes = mapMenuViewsToRoutes([
      {
        componentName: 'OperationSupportRoot',
        enabled: true,
        icon: 'm5',
        id: 'MENU_M5_SUPPORT',
        menuCode: 'M5_SUPPORT',
        menuName: '归档运营管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/operation-support',
        permissionPrefix: 'm5',
        sortOrder: 160,
        visible: true,
      },
      {
        componentName: 'ArchiveManagement',
        enabled: true,
        icon: 'archive',
        id: 'MENU_M5_ARCHIVE',
        menuCode: 'M5_ARCHIVE',
        menuName: '归档管理',
        menuType: 'MENU',
        parentId: 'MENU_M5_SUPPORT',
        path: '/api/v1/archive-records/search',
        permissionPrefix: 'm5:archive',
        sortOrder: 161,
        visible: true,
      },
      {
        componentName: 'ReagentLedger',
        enabled: true,
        icon: 'reagent',
        id: 'MENU_M5_REAGENT',
        menuCode: 'M5_REAGENT',
        menuName: '试剂台账',
        menuType: 'MENU',
        parentId: 'MENU_M5_SUPPORT',
        path: '/api/v1/reagents',
        permissionPrefix: 'm5:reagent',
        sortOrder: 162,
        visible: true,
      },
      {
        componentName: 'EquipmentLedger',
        enabled: true,
        icon: 'equipment',
        id: 'MENU_M5_EQUIPMENT',
        menuCode: 'M5_EQUIPMENT',
        menuName: '设备台账',
        menuType: 'MENU',
        parentId: 'MENU_M5_SUPPORT',
        path: '/api/v1/equipment-records',
        permissionPrefix: 'm5:equipment',
        sortOrder: 163,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'OperationSupportRoot',
        path: '/operation-support',
        redirect: '/operation-support/archive',
        children: [
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'ArchiveManagement',
            path: '/operation-support/archive',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'ReagentLedger',
            path: '/operation-support/reagents',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'EquipmentLedger',
            path: '/operation-support/equipment',
          }),
        ],
      }),
    ]);
  });

  it('converts M6 management menu definitions into canonical frontend routes', () => {
    const routes = mapMenuViewsToRoutes([
      {
        componentName: 'M6Root',
        enabled: true,
        icon: 'm6',
        id: 'MENU_M6_SUPPORT',
        menuCode: 'M6_SUPPORT',
        menuName: '集成与统计',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/m6',
        permissionPrefix: 'm6',
        sortOrder: 190,
        visible: true,
      },
      {
        componentName: 'IntegrationManagement',
        enabled: true,
        icon: 'connect',
        id: 'MENU_M6_INTEGRATION',
        menuCode: 'M6_INTEGRATION',
        menuName: '集成任务',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/api/v1/integration-tasks',
        permissionPrefix: 'm6:integration',
        sortOrder: 191,
        visible: true,
      },
      {
        componentName: 'BillingManagement',
        enabled: true,
        icon: 'currency',
        id: 'MENU_M6_BILLING',
        menuCode: 'M6_BILLING',
        menuName: '收费管理',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/api/v1/billing-records',
        permissionPrefix: 'm6:billing',
        sortOrder: 192,
        visible: true,
      },
      {
        componentName: 'HistoricalReports',
        enabled: true,
        icon: 'history',
        id: 'MENU_M6_HISTORY',
        menuCode: 'M6_HISTORY',
        menuName: '历史报告',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/api/v1/historical-reports',
        permissionPrefix: 'm6:history',
        sortOrder: 193,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'M6Root',
        path: '/m6',
        redirect: '/m6/integration',
        children: [
          expect.objectContaining({
            component: '/modules/m6-management/views/IntegrationManagementView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'IntegrationManagement',
            path: '/m6/integration',
          }),
          expect.objectContaining({
            component: '/modules/m6-management/views/BillingManagementView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'BillingManagement',
            path: '/m6/billing',
          }),
          expect.objectContaining({
            component: '/modules/m6-management/views/HistoricalReportsView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'HistoricalReports',
            path: '/m6/history',
          }),
        ],
      }),
    ]);
  });
});

describe('getBackendFirstMenuRoutes', () => {
  it('uses backend menu routes when they include mapped child routes', async () => {
    const backendRoutes = mapMenuViewsToRoutes([
      {
        componentName: 'SystemRoot',
        enabled: true,
        icon: 'setting',
        id: 'MENU_SYSTEM',
        menuCode: 'SYSTEM',
        menuName: '系统管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/system',
        permissionPrefix: 'sys',
        sortOrder: 1,
        visible: true,
      },
      {
        componentName: 'SystemUsers',
        enabled: true,
        icon: 'user',
        id: 'MENU_SYS_USERS',
        menuCode: 'SYS_USERS',
        menuName: '系统用户',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/users',
        permissionPrefix: 'sys:user',
        sortOrder: 10,
        visible: true,
      },
    ]);

    const routes = await getBackendFirstMenuRoutes(async () => backendRoutes);

    expect(routes).toBe(backendRoutes);
    expect(routes[0]?.children).toEqual([
      expect.objectContaining({
        meta: expect.objectContaining({
          keepAlive: true,
        }),
        name: 'SystemUsers',
        path: '/system/users',
      }),
    ]);
  });

  it('falls back to static routes when backend menu routes are empty', async () => {
    const routes = await getBackendFirstMenuRoutes(async () => []);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SystemRoot',
          path: '/system',
          redirect: '/system/users',
          children: expect.arrayContaining([
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'SystemUsers',
              path: '/system/users',
            }),
          ]),
        }),
        expect.objectContaining({
          name: 'OperationSupportRoot',
          path: '/operation-support',
          redirect: '/operation-support/archive',
          children: expect.arrayContaining([
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'ArchiveManagement',
              path: '/operation-support/archive',
            }),
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'ReagentLedger',
              path: '/operation-support/reagents',
            }),
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'EquipmentLedger',
              path: '/operation-support/equipment',
            }),
          ]),
        }),
      ]),
    );
  });

  it('falls back to static routes when backend menu loading fails', async () => {
    const routes = await getBackendFirstMenuRoutes(async () => {
      throw new Error('menu api unavailable');
    });

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'SystemRoot',
          children: expect.arrayContaining([
            expect.objectContaining({
              component: '/modules/system-management/views/SystemUsersView',
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'SystemUsers',
              path: '/system/users',
            }),
          ]),
        }),
      ]),
    );
  });
});

describe('system management route access', () => {
  it('keeps page routes registered with query permission authorities', () => {
    const systemRoot = systemRoutes.find(
      (route) => route.name === 'SystemRoot',
    );
    const systemUserRoute = systemRoot?.children?.find(
      (route) => route.name === 'SystemUsers',
    );
    const roleRoute = systemRoot?.children?.find(
      (route) => route.name === 'Roles',
    );

    expect(systemUserRoute?.component).toBeTypeOf('function');
    expect(roleRoute?.component).toBeTypeOf('function');
    expect(systemUserRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_USER_QUERY,
    ]);
    expect(roleRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_ROLE_QUERY,
    ]);
  });

  it('does not use legacy system permission keys as page authorities', () => {
    const systemRoot = systemRoutes.find(
      (route) => route.name === 'SystemRoot',
    );
    const authorities = [
      ...(systemRoot?.meta?.authority ?? []),
      ...(systemRoot?.children ?? []).flatMap(
        (route) => route.meta?.authority ?? [],
      ),
    ];

    expect(authorities).toEqual(
      expect.arrayContaining([
        M1_PERMISSION_CODES.ORDER_DICT_QUERY,
        M1_PERMISSION_CODES.ORDER_CHARGE_QUERY,
      ]),
    );
    expect(authorities).not.toContain('sys:medical-order-dict:query');
    expect(authorities).not.toContain('sys:medical-order-charge:query');
  });
});

describe('workflow route access', () => {
  it('keeps M2 consolidated pages registered with workstation authorities', () => {
    const workflowRoot = workflowRoutes.find(
      (route) => route.name === 'WorkflowRoot',
    );
    const submissionRoute = workflowRoot?.children?.find(
      (route) => route.name === 'SubmissionRegistration',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TrackingException',
    );

    expect(submissionRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
    expect(submissionRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
      M2_PERMISSION_CODES.SPECIMEN_REGISTER,
    ]);
    expect(trackingRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_TRACKING_QUERY,
    ]);
  });
});

describe('technical workflow route access', () => {
  it('keeps M3 pages registered with workstation authorities', () => {
    const workflowRoot = technicalWorkflowRoutes.find(
      (route) => route.name === 'TechnicalWorkflowRoot',
    );
    const receiptRoute = workflowRoot?.children?.find(
      (route) => route.name === 'PathologyReceipt',
    );
    const tasksRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalTasks',
    );
    const frozenRoute = workflowRoot?.children?.find(
      (route) => route.name === 'FrozenWorkstation',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalTracking',
    );

    expect(tasksRoute?.component).toBeTypeOf('function');
    expect(receiptRoute?.component).toBeTypeOf('function');
    expect(frozenRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
    expect(receiptRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    ]);
    expect(tasksRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(frozenRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TASK_QUERY,
    ]);
    expect(trackingRoute?.meta?.authority).toEqual([
      M3_PERMISSION_CODES.TECHNICAL_TRACKING_QUERY,
    ]);
  });
});

describe('doctor workflow route access', () => {
  it('keeps M4 pages registered with doctor workflow authorities', () => {
    const workflowRoot = doctorWorkflowRoutes.find(
      (route) => route.name === 'DoctorWorkflowRoot',
    );
    const assignmentRoute = workflowRoot?.children?.find(
      (route) => route.name === 'DiagnosisAssignment',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ReportTracking',
    );
    const frozenReportRoute = workflowRoot?.children?.find(
      (route) => route.name === 'FrozenReport',
    );
    const consultationRoute = workflowRoot?.children?.find(
      (route) => route.name === 'Consultation',
    );

    expect(assignmentRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
    expect(frozenReportRoute?.component).toBeTypeOf('function');
    expect(consultationRoute?.component).toBeTypeOf('function');
    expect(assignmentRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.DIAG_TASK_QUERY,
    ]);
    expect(trackingRoute?.meta?.authority).toEqual([
      M4_PERMISSION_CODES.REPORT_TRACKING_QUERY,
    ]);
    const reportRoute = workflowRoot?.children?.find(
      (route) => route.name === 'PathologyReport',
    );
    const revisionRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ReportRevision',
    );

    expect(reportRoute?.meta?.authority).toEqual([
      ...M4_REPORT_PAGE_AUTHORITIES,
    ]);
    expect(frozenReportRoute?.meta?.authority).toEqual([
      ...M4_REPORT_PAGE_AUTHORITIES,
    ]);
    expect(revisionRoute?.meta?.authority).toEqual([
      ...M4_REVISION_PAGE_AUTHORITIES,
    ]);
    expect(consultationRoute?.meta?.authority).toEqual([
      ...M4_CONSULTATION_PAGE_AUTHORITIES,
    ]);
  });
});

describe('operation support route access', () => {
  it('keeps M5 pages registered with operation support authorities', () => {
    const operationRoot = operationSupportRoutes.find(
      (route) => route.name === 'OperationSupportRoot',
    );
    const archiveRoute = operationRoot?.children?.find(
      (route) => route.name === 'ArchiveManagement',
    );
    const reagentRoute = operationRoot?.children?.find(
      (route) => route.name === 'ReagentLedger',
    );
    const equipmentRoute = operationRoot?.children?.find(
      (route) => route.name === 'EquipmentLedger',
    );

    expect(archiveRoute?.component).toBeTypeOf('function');
    expect(reagentRoute?.component).toBeTypeOf('function');
    expect(equipmentRoute?.component).toBeTypeOf('function');
    expect(archiveRoute?.meta?.authority).toEqual([
      ...M5_ARCHIVE_PAGE_AUTHORITIES,
    ]);
    expect(reagentRoute?.meta?.authority).toEqual([
      ...M5_REAGENT_PAGE_AUTHORITIES,
    ]);
    expect(equipmentRoute?.meta?.authority).toEqual([
      ...M5_EQUIPMENT_PAGE_AUTHORITIES,
    ]);
  });
});

describe('m6 route access', () => {
  it('keeps M6 pages registered with management authorities', () => {
    const m6Root = m6Routes.find((route) => route.name === 'M6Root');
    const integrationRoute = m6Root?.children?.find(
      (route) => route.name === 'IntegrationManagement',
    );
    const billingRoute = m6Root?.children?.find(
      (route) => route.name === 'BillingManagement',
    );
    const historyRoute = m6Root?.children?.find(
      (route) => route.name === 'HistoricalReports',
    );
    const statisticsRoute = m6Root?.children?.find(
      (route) => route.name === 'StatisticsAnalysis',
    );

    expect(integrationRoute?.component).toBeTypeOf('function');
    expect(billingRoute?.component).toBeTypeOf('function');
    expect(historyRoute?.component).toBeTypeOf('function');
    expect(statisticsRoute?.component).toBeTypeOf('function');
    expect(integrationRoute?.meta?.authority).toEqual([
      ...M6_INTEGRATION_PAGE_AUTHORITIES,
    ]);
    expect(billingRoute?.meta?.authority).toEqual([
      ...M6_BILLING_PAGE_AUTHORITIES,
    ]);
    expect(historyRoute?.meta?.authority).toEqual([
      ...M6_HISTORY_PAGE_AUTHORITIES,
    ]);
    expect(statisticsRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(m6Root?.meta?.authority).toContain(
      M6_PERMISSION_CODES.BILLING_RECONCILE,
    );
    expect(m6Root?.meta?.authority).toContain(
      M6_PERMISSION_CODES.HISTORY_IMPORT,
    );
  });
});
