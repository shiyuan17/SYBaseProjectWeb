import type { RouteRecordStringComponent } from '@vben/types';

import type { MenuView } from '#/modules/system-management/types/system-management';

import { describe, expect, it } from 'vitest';

import {
  M4_CONSULTATION_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
  M4_REVISION_PAGE_AUTHORITIES,
} from '#/modules/doctor-workflow/constants';
import {
  M6_PERMISSION_CODES,
  M6_STATISTICS_PAGE_AUTHORITIES,
} from '#/modules/m6-management/constants';
import {
  M5_ARCHIVE_PAGE_AUTHORITIES,
  M5_BORROW_PAGE_AUTHORITIES,
  M5_EQUIPMENT_PAGE_AUTHORITIES,
  M5_REAGENT_PAGE_AUTHORITIES,
  M5_RESOURCE_PAGE_AUTHORITIES,
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

function collectMenuRoutes(
  routes: RouteRecordStringComponent<string>[],
): RouteRecordStringComponent<string>[] {
  return routes.flatMap((route) => [
    route,
    ...collectMenuRoutes(route.children ?? []),
  ]);
}

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
      {
        componentName: 'LogManagement',
        enabled: true,
        icon: 'carbon:report',
        id: 'MENU_SYS_LOG_MANAGEMENT',
        menuCode: 'SYS_LOG_MANAGEMENT',
        menuName: '日志管理',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/logs',
        permissionPrefix: 'sys:log',
        sortOrder: 40,
        visible: true,
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
      expect.objectContaining({
        component: '/modules/system-management/views/LogManagementView',
        meta: expect.objectContaining({
          keepAlive: true,
        }),
        name: 'LogManagement',
        path: '/system/logs',
      }),
    ]);
  });

  it('falls back to the canonical frontend icon when a backend menu icon is missing', () => {
    const routes = mapMenuViewsToRoutes([
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
        componentName: 'LogManagement',
        enabled: true,
        icon: null,
        id: 'MENU_SYS_LOG_MANAGEMENT',
        menuCode: 'SYS_LOG_MANAGEMENT',
        menuName: '日志管理',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/logs',
        permissionPrefix: 'sys:log',
        sortOrder: 40,
        visible: true,
      },
    ]);

    expect(routes[0]?.children).toEqual([
      expect.objectContaining({
        meta: expect.objectContaining({
          icon: 'carbon:report',
        }),
        name: 'LogManagement',
        path: '/system/logs',
      }),
    ]);
  });

  it('normalizes legacy invalid menu icon aliases from backend menu data', () => {
    const routes = mapMenuViewsToRoutes([
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
        componentName: 'LogManagement',
        enabled: true,
        icon: 'carbon:document-audit',
        id: 'MENU_SYS_LOG_MANAGEMENT',
        menuCode: 'SYS_LOG_MANAGEMENT',
        menuName: '日志管理',
        menuType: 'MENU',
        parentId: 'MENU_SYSTEM',
        path: '/system/logs',
        permissionPrefix: 'sys:log',
        sortOrder: 40,
        visible: true,
      },
    ]);

    expect(routes[0]?.children).toEqual([
      expect.objectContaining({
        meta: expect.objectContaining({
          icon: 'carbon:report',
        }),
        name: 'LogManagement',
        path: '/system/logs',
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
        menuName: '标本采集',
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
        redirect: '/workflow/application-registration-workbench',
        children: [
          expect.objectContaining({
            meta: expect.objectContaining({
              hideInMenu: true,
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
              title: '标本采集',
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
        menuName: '标本接收',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/workflow/pathology-receipt',
        permissionPrefix: 'm2:receipt',
        sortOrder: 120,
        visible: true,
      },
      {
        componentName: 'TechnicalSpecimenRegistration',
        enabled: true,
        icon: 'table',
        id: 'MENU_M3_SPECIMEN_REGISTRATION',
        menuCode: 'M3_SPECIMEN_REGISTRATION',
        menuName: '标本登记',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/api/v1/technical-specimen-registrations/pending',
        permissionPrefix: 'm2:receipt',
        sortOrder: 121,
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
        sortOrder: 122,
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
        sortOrder: 123,
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
        sortOrder: 124,
        visible: true,
      },
      {
        componentName: 'Staining',
        enabled: true,
        icon: 'palette',
        id: 'MENU_M3_STAINING',
        menuCode: 'M3_STAINING',
        menuName: '染色出片',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/api/v1/slide-stainings',
        permissionPrefix: 'm3:staining',
        sortOrder: 125,
        visible: true,
      },
      {
        componentName: 'RoutineOrderWorkstation',
        enabled: true,
        icon: 'document',
        id: 'MENU_M3_ROUTINE_ORDER',
        menuCode: 'M3_ROUTINE_ORDER',
        menuName: '常规医嘱工作站',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/technical-workflow/routine-orders',
        permissionPrefix: 'm3:routine-order',
        sortOrder: 126,
        visible: true,
      },
      {
        componentName: 'SpecialOrderWorkstation',
        enabled: true,
        icon: 'document',
        id: 'MENU_M3_SPECIAL_ORDER',
        menuCode: 'M3_SPECIAL_ORDER',
        menuName: '特检医嘱工作站',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/technical-workflow/special-orders',
        permissionPrefix: 'm3:special-order',
        sortOrder: 127,
        visible: true,
      },
      {
        componentName: 'IhcWorkstation',
        enabled: true,
        icon: 'chemistry',
        id: 'MENU_M3_IHC',
        menuCode: 'M3_IHC',
        menuName: '免疫组化工作站',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/technical-workflow/ihc',
        permissionPrefix: 'm3:ihc',
        sortOrder: 128,
        visible: true,
      },
      {
        componentName: 'CytologyWorkstation',
        enabled: true,
        icon: 'microscope',
        id: 'MENU_M3_CYTOLOGY',
        menuCode: 'M3_CYTOLOGY',
        menuName: '细胞学工作站',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/technical-workflow/cytology',
        permissionPrefix: 'm3:cytology',
        sortOrder: 129,
        visible: true,
      },
      {
        componentName: 'LiquidCytologyWorkstation',
        enabled: true,
        icon: 'lucide:droplets',
        id: 'MENU_M3_LIQUID_CYTOLOGY',
        menuCode: 'M3_LIQUID_CYTOLOGY',
        menuName: '液基细胞学工作站',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/technical-workflow/liquid-cytology',
        permissionPrefix: 'm3:liquid-cytology',
        sortOrder: 130,
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
              title: '标本接收工作台',
            }),
            name: 'PathologyReceipt',
            path: '/workflow/pathology-receipt',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
              title: '检查登记',
            }),
            name: 'TechnicalSpecimenRegistration',
            path: '/technical-workflow/specimen-registration',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              hideInMenu: true,
              keepAlive: true,
            }),
            name: 'TechnicalTasks',
            path: '/technical-workflow/tasks',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
              title: '取材描写工作站',
            }),
            name: 'GrossingWorkstation',
            path: '/technical-workflow/grossing',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              hideInMenu: true,
              keepAlive: true,
            }),
            name: 'FrozenWorkstation',
            path: '/technical-workflow/frozen',
          }),
          expect.objectContaining({
            meta: expect.objectContaining({
              keepAlive: true,
              title: '染色出片工作站',
            }),
            name: 'StainingWorkstation',
            path: '/technical-workflow/staining',
          }),
          expect.objectContaining({
            component:
              '/modules/technical-workflow/views/RoutineOrderWorkstationView',
            meta: expect.objectContaining({
              keepAlive: true,
              title: '常规医嘱工作站',
            }),
            name: 'RoutineOrderWorkstation',
            path: '/technical-workflow/routine-orders',
          }),
          expect.objectContaining({
            component:
              '/modules/technical-workflow/views/SpecialOrderWorkstationView',
            meta: expect.objectContaining({
              keepAlive: true,
              title: '特检医嘱工作站',
            }),
            name: 'SpecialOrderWorkstation',
            path: '/technical-workflow/special-orders',
          }),
          expect.objectContaining({
            component: '/modules/technical-workflow/views/IhcWorkstationView',
            meta: expect.objectContaining({
              keepAlive: true,
              title: '免疫组化工作站',
            }),
            name: 'IhcWorkstation',
            path: '/technical-workflow/ihc',
          }),
          expect.objectContaining({
            component:
              '/modules/technical-workflow/views/CytologyWorkstationView',
            meta: expect.objectContaining({
              keepAlive: true,
              title: '细胞学工作站',
            }),
            name: 'CytologyWorkstation',
            path: '/technical-workflow/cytology',
          }),
          expect.objectContaining({
            component:
              '/modules/technical-workflow/views/LiquidCytologyWorkstationView',
            meta: expect.objectContaining({
              icon: 'lucide:droplets',
              keepAlive: true,
              title: '液基细胞学工作站',
            }),
            name: 'LiquidCytologyWorkstation',
            path: '/technical-workflow/liquid-cytology',
          }),
        ],
      }),
    ]);
  });

  it('deduplicates backend PathologyReceipt menus to the canonical M2 route', () => {
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
        componentName: 'PathologyReceipt',
        enabled: true,
        icon: 'archive',
        id: 'MENU_M2_RECEIPT',
        menuCode: 'M2_RECEIPT',
        menuName: '标本接收',
        menuType: 'MENU',
        parentId: 'MENU_M2_WORKFLOW',
        path: '/workflow/pathology-receipt',
        permissionPrefix: 'm2:receipt',
        sortOrder: 120,
        visible: true,
      },
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
        sortOrder: 130,
        visible: true,
      },
      {
        componentName: 'PathologyReceipt',
        enabled: true,
        icon: 'archive',
        id: 'MENU_M3_RECEIPT_DUPLICATE',
        menuCode: 'M2_RECEIPT',
        menuName: '标本接收',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/workflow/pathology-receipt',
        permissionPrefix: 'm2:receipt',
        sortOrder: 120,
        visible: true,
      },
      {
        componentName: 'TechnicalSpecimenRegistration',
        enabled: true,
        icon: 'table',
        id: 'MENU_M3_SPECIMEN_REGISTRATION',
        menuCode: 'M3_SPECIMEN_REGISTRATION',
        menuName: '检查登记',
        menuType: 'MENU',
        parentId: 'MENU_M3_WORKFLOW',
        path: '/technical-workflow/specimen-registration',
        permissionPrefix: 'm2:receipt',
        sortOrder: 121,
        visible: true,
      },
    ]);
    const allRoutes = collectMenuRoutes(routes);

    expect(
      allRoutes.filter((route) => route.name === 'PathologyReceipt'),
    ).toEqual([
      expect.objectContaining({
        path: '/workflow/pathology-receipt',
      }),
    ]);
    expect(
      routes
        .find((route) => route.name === 'TechnicalWorkflowRoot')
        ?.children?.map((route) => route.name),
    ).toEqual(['TechnicalSpecimenRegistration']);
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
        componentName: 'DiagnosisWorkbench',
        enabled: true,
        icon: 'workspace',
        id: 'MENU_M4_WORKBENCH',
        menuCode: 'M4_WORKBENCH',
        menuName: '诊断工作台',
        menuType: 'MENU',
        parentId: 'MENU_M4_WORKFLOW',
        path: '/api/v1/pathology-cases/{id}/diagnostic-workbench',
        permissionPrefix: 'm4:workbench',
        sortOrder: 132,
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
        sortOrder: 133,
        visible: true,
      },
      {
        componentName: 'MedicalOrderWorkbench',
        enabled: true,
        icon: 'orders',
        id: 'MENU_M4_MEDICAL_ORDER',
        menuCode: 'M4_MEDICAL_ORDER',
        menuName: '病理医嘱执行',
        menuType: 'MENU',
        parentId: 'MENU_M4_WORKFLOW',
        path: '/api/v1/medical-orders/pending',
        permissionPrefix: 'm4:medical-order',
        sortOrder: 135,
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
              title: '诊断平台工作站',
            }),
            name: 'DiagnosisWorkbench',
            path: '/doctor-workflow/workbench',
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
            name: 'MedicalOrderWorkbench',
            path: '/doctor-workflow/medical-orders',
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
        menuName: '归档与借记',
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
        componentName: 'BorrowManagement',
        enabled: true,
        icon: 'borrow',
        id: 'MENU_M5_BORROW',
        menuCode: 'M5_BORROW',
        menuName: '借记管理',
        menuType: 'MENU',
        parentId: 'MENU_M5_SUPPORT',
        path: '/operation-support/borrow',
        permissionPrefix: 'm5:borrow',
        sortOrder: 162,
        visible: true,
      },
      {
        componentName: 'OperationResourceRoot',
        enabled: true,
        icon: 'resource',
        id: 'MENU_M5_RESOURCE',
        menuCode: 'M5_RESOURCE',
        menuName: '设备及试剂管理',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/operation-resources',
        permissionPrefix: 'm5:resource',
        sortOrder: 170,
        visible: true,
      },
      {
        componentName: 'EquipmentManagement',
        enabled: true,
        icon: 'equipment',
        id: 'MENU_M5_EQUIPMENT',
        menuCode: 'M5_EQUIPMENT',
        menuName: '仪器设备管理',
        menuType: 'MENU',
        parentId: 'MENU_M5_RESOURCE',
        path: '/api/v1/equipment-records',
        permissionPrefix: 'm5:equipment',
        sortOrder: 171,
        visible: true,
      },
      {
        componentName: 'ReagentConsumableManagement',
        enabled: true,
        icon: 'reagent',
        id: 'MENU_M5_REAGENT',
        menuCode: 'M5_REAGENT',
        menuName: '试剂耗材管理',
        menuType: 'MENU',
        parentId: 'MENU_M5_RESOURCE',
        path: '/api/v1/reagents',
        permissionPrefix: 'm5:reagent',
        sortOrder: 172,
        visible: true,
      },
      {
        componentName: 'HazardousChemicalsManagement',
        enabled: true,
        icon: 'hazard',
        id: 'MENU_M5_HAZARD',
        menuCode: 'M5_HAZARDOUS_CHEMICALS',
        menuName: '危化品管理',
        menuType: 'MENU',
        parentId: 'MENU_M5_RESOURCE',
        path: '/operation-resources/hazardous-chemicals',
        permissionPrefix: 'm5:hazardous',
        sortOrder: 173,
        visible: true,
      },
      {
        componentName: 'MedicalWasteManagement',
        enabled: true,
        icon: 'waste',
        id: 'MENU_M5_WASTE',
        menuCode: 'M5_MEDICAL_WASTE',
        menuName: '医疗废物管理',
        menuType: 'MENU',
        parentId: 'MENU_M5_RESOURCE',
        path: '/operation-resources/medical-waste',
        permissionPrefix: 'm5:waste',
        sortOrder: 174,
        visible: true,
      },
    ]);

    expect(routes).toEqual(
      expect.arrayContaining([
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
              name: 'BorrowManagement',
              path: '/operation-support/borrow',
            }),
          ],
        }),
        expect.objectContaining({
          name: 'OperationResourceRoot',
          path: '/operation-resources',
          redirect: '/operation-resources/equipment',
          children: expect.arrayContaining([
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'EquipmentManagement',
              path: '/operation-resources/equipment',
            }),
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'ReagentConsumableManagement',
              path: '/operation-resources/reagents',
            }),
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'HazardousChemicalsManagement',
              path: '/operation-resources/hazardous-chemicals',
            }),
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'MedicalWasteManagement',
              path: '/operation-resources/medical-waste',
            }),
          ]),
        }),
      ]),
    );
  });

  it('converts M6 management menu definitions into canonical frontend routes', () => {
    const routes = mapMenuViewsToRoutes([
      {
        componentName: 'M6Root',
        enabled: true,
        icon: 'm6',
        id: 'MENU_M6_SUPPORT',
        menuCode: 'M6_SUPPORT',
        menuName: '数据统计与分析',
        menuType: 'DIRECTORY',
        parentId: null,
        path: '/m6',
        permissionPrefix: 'm6',
        sortOrder: 190,
        visible: true,
      },
      {
        componentName: 'M6StatisticsDashboard',
        enabled: true,
        icon: 'dashboard',
        id: 'MENU_M6_DASHBOARD',
        menuCode: 'M6_DASHBOARD',
        menuName: '统计仪表盘',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/m6/dashboard',
        permissionPrefix: 'm6:dashboard',
        sortOrder: 190,
        visible: true,
      },
      {
        componentName: 'QualityIndicatorStatistics',
        enabled: true,
        icon: 'quality',
        id: 'MENU_M6_QUALITY',
        menuCode: 'M6_QUALITY_INDICATORS',
        menuName: '质控指标统计',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/m6/quality-indicators',
        permissionPrefix: 'm6:quality',
        sortOrder: 191,
        visible: true,
      },
      {
        componentName: 'ManagementIndicatorStatistics',
        enabled: true,
        icon: 'management',
        id: 'MENU_M6_MANAGEMENT',
        menuCode: 'M6_MANAGEMENT_INDICATORS',
        menuName: '管理指标统计',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/m6/management-indicators',
        permissionPrefix: 'm6:management',
        sortOrder: 192,
        visible: true,
      },
      {
        componentName: 'CustomStatisticsAnalysis',
        enabled: true,
        icon: 'custom',
        id: 'MENU_M6_STAT',
        menuCode: 'M6_STAT',
        menuName: '自定义统计分析',
        menuType: 'MENU',
        parentId: 'MENU_M6_SUPPORT',
        path: '/api/v1/stat-reports/query',
        permissionPrefix: 'm6:stat',
        sortOrder: 193,
        visible: true,
      },
    ]);

    expect(routes).toEqual([
      expect.objectContaining({
        name: 'M6Root',
        path: '/m6',
        redirect: '/m6/dashboard',
        children: [
          expect.objectContaining({
            component: '/modules/m6-statistics/views/StatisticsDashboardView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'M6StatisticsDashboard',
            path: '/m6/dashboard',
          }),
          expect.objectContaining({
            component:
              '/modules/m6-statistics/views/QualityIndicatorStatisticsView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'QualityIndicatorStatistics',
            path: '/m6/quality-indicators',
          }),
          expect.objectContaining({
            component:
              '/modules/m6-statistics/views/ManagementIndicatorStatisticsView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'ManagementIndicatorStatistics',
            path: '/m6/management-indicators',
          }),
          expect.objectContaining({
            component: '/modules/m6-statistics/views/StatisticsAnalysisView',
            meta: expect.objectContaining({
              keepAlive: true,
            }),
            name: 'CustomStatisticsAnalysis',
            path: '/m6/custom-analysis',
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

    expect(routes).toStrictEqual(backendRoutes);
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
    const allRoutes = collectMenuRoutes(routes);

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
              name: 'BorrowManagement',
              path: '/operation-support/borrow',
            }),
          ]),
        }),
        expect.objectContaining({
          name: 'OperationResourceRoot',
          path: '/operation-resources',
          redirect: '/operation-resources/equipment',
          children: expect.arrayContaining([
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'EquipmentManagement',
              path: '/operation-resources/equipment',
            }),
            expect.objectContaining({
              meta: expect.objectContaining({
                keepAlive: true,
              }),
              name: 'ReagentConsumableManagement',
              path: '/operation-resources/reagents',
            }),
          ]),
        }),
      ]),
    );
    expect(
      allRoutes.filter((route) => route.name === 'PathologyReceipt'),
    ).toHaveLength(1);
    expect(
      routes.find((route) => route.name === 'TechnicalWorkflowRoot')?.redirect,
    ).toBe('/technical-workflow/specimen-registration');
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
    const logRoute = systemRoot?.children?.find(
      (route) => route.name === 'LogManagement',
    );

    expect(systemUserRoute?.component).toBeTypeOf('function');
    expect(roleRoute?.component).toBeTypeOf('function');
    expect(logRoute?.component).toBeTypeOf('function');
    expect(systemUserRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_USER_QUERY,
    ]);
    expect(roleRoute?.meta?.authority).toEqual([
      M1_PERMISSION_CODES.SYSTEM_ROLE_QUERY,
    ]);
    expect(logRoute?.meta?.authority).toEqual([M1_PERMISSION_CODES.LOG_QUERY]);
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
        M1_PERMISSION_CODES.LOG_QUERY,
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
    expect(frozenRoute?.component).toBeTypeOf('function');
    expect(trackingRoute?.component).toBeTypeOf('function');
    expect(
      workflowRoot?.children?.some(
        (route) => route.name === 'PathologyReceipt',
      ),
    ).toBe(false);
    expect(workflowRoot?.meta?.authority).toContain(
      M2_PERMISSION_CODES.SPECIMEN_RECEIVE,
    );
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

    expect(reportRoute?.meta?.authority).toEqual([
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
    const borrowRoute = operationRoot?.children?.find(
      (route) => route.name === 'BorrowManagement',
    );
    const resourceRoot = operationSupportRoutes.find(
      (route) => route.name === 'OperationResourceRoot',
    );
    const reagentRoute = resourceRoot?.children?.find(
      (route) => route.name === 'ReagentConsumableManagement',
    );
    const equipmentRoute = resourceRoot?.children?.find(
      (route) => route.name === 'EquipmentManagement',
    );
    const hazardousRoute = resourceRoot?.children?.find(
      (route) => route.name === 'HazardousChemicalsManagement',
    );
    const wasteRoute = resourceRoot?.children?.find(
      (route) => route.name === 'MedicalWasteManagement',
    );

    expect(archiveRoute?.component).toBeTypeOf('function');
    expect(borrowRoute?.component).toBeTypeOf('function');
    expect(reagentRoute?.component).toBeTypeOf('function');
    expect(equipmentRoute?.component).toBeTypeOf('function');
    expect(hazardousRoute?.component).toBeTypeOf('function');
    expect(wasteRoute?.component).toBeTypeOf('function');
    expect(archiveRoute?.meta?.authority).toEqual([
      ...M5_ARCHIVE_PAGE_AUTHORITIES,
    ]);
    expect(borrowRoute?.meta?.authority).toEqual([
      ...M5_BORROW_PAGE_AUTHORITIES,
    ]);
    expect(reagentRoute?.meta?.authority).toEqual([
      ...M5_REAGENT_PAGE_AUTHORITIES,
    ]);
    expect(equipmentRoute?.meta?.authority).toEqual([
      ...M5_EQUIPMENT_PAGE_AUTHORITIES,
    ]);
    expect(hazardousRoute?.meta?.authority).toEqual([
      ...M5_RESOURCE_PAGE_AUTHORITIES,
    ]);
    expect(wasteRoute?.meta?.authority).toEqual([
      ...M5_RESOURCE_PAGE_AUTHORITIES,
    ]);
    expect(wasteRoute?.meta?.title).toBe('医疗废物管理');
  });
});

describe('m6 route access', () => {
  it('keeps M6 pages registered with management authorities', () => {
    const m6Root = m6Routes.find((route) => route.name === 'M6Root');
    const qualityRoute = m6Root?.children?.find(
      (route) => route.name === 'QualityIndicatorStatistics',
    );
    const dashboardRoute = m6Root?.children?.find(
      (route) => route.name === 'M6StatisticsDashboard',
    );
    const managementRoute = m6Root?.children?.find(
      (route) => route.name === 'ManagementIndicatorStatistics',
    );
    const statisticsRoute = m6Root?.children?.find(
      (route) => route.name === 'CustomStatisticsAnalysis',
    );

    expect(dashboardRoute?.component).toBeTypeOf('function');
    expect(qualityRoute?.component).toBeTypeOf('function');
    expect(managementRoute?.component).toBeTypeOf('function');
    expect(statisticsRoute?.component).toBeTypeOf('function');
    expect(dashboardRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(qualityRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(managementRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(statisticsRoute?.meta?.authority).toEqual([
      ...M6_STATISTICS_PAGE_AUTHORITIES,
    ]);
    expect(m6Root?.meta?.authority).toContain(
      M6_PERMISSION_CODES.STAT_REPORT_QUERY,
    );
    expect(m6Root?.meta?.authority).not.toContain(
      M6_PERMISSION_CODES.BILLING_RECONCILE,
    );
  });
});
