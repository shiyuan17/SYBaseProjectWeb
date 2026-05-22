import type { MenuView } from '#/modules/system-management/types/system-management';

import { describe, expect, it } from 'vitest';

import {
  M4_CONSULTATION_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
  M4_REVISION_PAGE_AUTHORITIES,
} from '#/modules/doctor-workflow/constants';
import { M5_PERMISSION_CODES } from '#/modules/operation-support/constants';
import { M1_PERMISSION_CODES } from '#/modules/system-management/constants';
import { M2_PERMISSION_CODES } from '#/modules/specimen-workflow/constants';
import { M3_PERMISSION_CODES } from '#/modules/technical-workflow/constants';
import doctorWorkflowRoutes from '#/router/routes/modules/doctor-workflow';
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
        name: 'SystemUsers',
        path: '/system/users',
      }),
      expect.objectContaining({
        component: '/modules/system-management/views/MedicalOrderDictsView',
        name: 'MedicalOrderDicts',
        path: '/system/medical-order-dicts',
      }),
    ]);
  });

  it('converts M2 workflow menu definitions into canonical frontend routes', () => {
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
        componentName: 'ApplicationList',
        enabled: true,
        icon: 'list',
        id: 'MENU_M2_APPLICATION_LIST',
        menuCode: 'M2_APPLICATION_LIST',
        menuName: '申请管理',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/api/v1/applications',
        permissionPrefix: 'm2:application-list',
        sortOrder: 110,
        visible: true,
      },
      {
        componentName: 'ClinicalRegister',
        enabled: true,
        icon: 'catalog',
        id: 'MENU_M2_CLINICAL',
        menuCode: 'M2_CLINICAL',
        menuName: '标本管理',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/api/v1/specimens/register',
        permissionPrefix: 'm2:clinical',
        sortOrder: 111,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'WorkflowRoot',
        path: '/workflow',
        redirect: '/workflow/application-list',
        children: [
          expect.objectContaining({
            name: 'ApplicationList',
            path: '/workflow/application-list',
          }),
          expect.objectContaining({
            name: 'SpecimenManagement',
            path: '/workflow/specimen-management',
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
        menuName: '技术组核心生产线',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/technical-workflow',
        permissionPrefix: 'm3',
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
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'TechnicalWorkflowRoot',
        path: '/technical-workflow',
        redirect: '/technical-workflow/tasks',
        children: [
          expect.objectContaining({
            name: 'TechnicalTasks',
            path: '/technical-workflow/tasks',
          }),
          expect.objectContaining({
            name: 'GrossingWorkstation',
            path: '/technical-workflow/grossing',
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
        menuName: '医生诊断工作流',
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
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'DoctorWorkflowRoot',
        path: '/doctor-workflow',
        redirect: '/doctor-workflow/assignment',
        children: [
          expect.objectContaining({
            name: 'DiagnosisAssignment',
            path: '/doctor-workflow/assignment',
          }),
          expect.objectContaining({
            name: 'PathologyReport',
            path: '/doctor-workflow/report',
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
        menuName: '归档与运营支撑',
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
            name: 'ArchiveManagement',
            path: '/operation-support/archive',
          }),
          expect.objectContaining({
            name: 'ReagentLedger',
            path: '/operation-support/reagents',
          }),
          expect.objectContaining({
            name: 'EquipmentLedger',
            path: '/operation-support/equipment',
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
              name: 'ArchiveManagement',
              path: '/operation-support/archive',
            }),
            expect.objectContaining({
              name: 'ReagentLedger',
              path: '/operation-support/reagents',
            }),
            expect.objectContaining({
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
    const systemRoot = systemRoutes.find((route) => route.name === 'SystemRoot');
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
    const systemRoot = systemRoutes.find((route) => route.name === 'SystemRoot');
    const authorities = [
      ...(systemRoot?.meta?.authority ?? []),
      ...(systemRoot?.children ?? []).flatMap((route) => route.meta?.authority ?? []),
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
  it('keeps M2 pages registered with workstation authorities', () => {
    const workflowRoot = workflowRoutes.find((route) => route.name === 'WorkflowRoot');
    const listRoute = workflowRoot?.children?.find(
      (route) => route.name === 'ApplicationList',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TrackingQuery',
    );

    expect(listRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
    expect(listRoute?.meta?.authority).toEqual([
      M2_PERMISSION_CODES.APPLICATION_DETAIL_QUERY,
      M2_PERMISSION_CODES.APPLICATION_CREATE,
      M2_PERMISSION_CODES.CLINICAL_IMPORT,
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
    const tasksRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalTasks',
    );
    const trackingRoute = workflowRoot?.children?.find(
      (route) => route.name === 'TechnicalTracking',
    );

    expect(tasksRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
    expect(tasksRoute?.meta?.authority).toEqual([
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
    const consultationRoute = workflowRoot?.children?.find(
      (route) => route.name === 'Consultation',
    );

    expect(assignmentRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
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

    expect(reportRoute?.meta?.authority).toEqual([...M4_REPORT_PAGE_AUTHORITIES]);
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
      M5_PERMISSION_CODES.ARCHIVE_QUERY,
    ]);
    expect(reagentRoute?.meta?.authority).toEqual([
      M5_PERMISSION_CODES.REAGENT_QUERY,
    ]);
    expect(equipmentRoute?.meta?.authority).toEqual([
      M5_PERMISSION_CODES.EQUIPMENT_QUERY,
    ]);
  });
});
