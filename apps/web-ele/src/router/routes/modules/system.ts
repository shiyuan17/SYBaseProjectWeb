import type { RouteComponent, RouteRecordRaw } from 'vue-router';

import { M1_PERMISSION_CODES } from '#/modules/system-management/constants';
import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';
import { withRouteComponentReloadRetry } from '#/router/routes/lazy-load';

const SYSTEM_QUERY_AUTHORITIES = [
  M1_PERMISSION_CODES.SYSTEM_USER_QUERY,
  M1_PERMISSION_CODES.SYSTEM_ROLE_QUERY,
  M1_PERMISSION_CODES.DEPARTMENT_QUERY,
  M1_PERMISSION_CODES.BODY_PART_QUERY,
  M1_PERMISSION_CODES.ORDER_DICT_QUERY,
  M1_PERMISSION_CODES.ORDER_CHARGE_QUERY,
  M1_PERMISSION_CODES.PACKAGE_QUERY,
  M1_PERMISSION_CODES.TEMPLATE_QUERY,
  M1_PERMISSION_CODES.GUIDELINE_QUERY,
  M1_PERMISSION_CODES.CONFIG_QUERY,
  M1_PERMISSION_CODES.NUMBERING_QUERY,
  M1_PERMISSION_CODES.LOG_QUERY,
];

function loadSystemRouteComponent(
  loader: () => Promise<RouteComponent>,
  routeName: string,
) {
  return withRouteComponentReloadRetry(loader, routeName);
}

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      authority: SYSTEM_QUERY_AUTHORITIES,
      icon: 'carbon:settings',
      order: 900,
      title: '系统管理',
    },
    name: 'SystemRoot',
    path: '/system',
    redirect: '/system/users',
    children: [
      {
        name: 'SystemUsers',
        path: '/system/users',
        component: loadSystemRouteComponent(
          () => import('#/modules/system-management/views/SystemUsersView.vue'),
          'SystemUsers',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.SYSTEM_USER_QUERY],
          icon: 'carbon:user-avatar',
          title: '系统用户',
        },
      },
      {
        name: 'Roles',
        path: '/system/roles',
        component: loadSystemRouteComponent(
          () => import('#/modules/system-management/views/RolesView.vue'),
          'Roles',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.SYSTEM_ROLE_QUERY],
          icon: 'carbon:user-role',
          title: '角色授权',
        },
      },
      {
        name: 'Departments',
        path: '/system/departments',
        component: loadSystemRouteComponent(
          () => import('#/modules/system-management/views/DepartmentsView.vue'),
          'Departments',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.DEPARTMENT_QUERY],
          icon: 'carbon:building',
          title: '科室字典',
        },
      },
      {
        name: 'BodyParts',
        path: '/system/body-parts',
        component: loadSystemRouteComponent(
          () => import('#/modules/system-management/views/BodyPartsView.vue'),
          'BodyParts',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.BODY_PART_QUERY],
          icon: 'carbon:tree-view',
          title: '部位字典',
        },
      },
      {
        name: 'MedicalOrderDicts',
        path: '/system/medical-order-dicts',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/MedicalOrderDictsView.vue'),
          'MedicalOrderDicts',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.ORDER_DICT_QUERY],
          icon: 'carbon:book',
          title: '医嘱字典',
        },
      },
      {
        name: 'MedicalOrderCharges',
        path: '/system/medical-order-charges',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/MedicalOrderChargesView.vue'),
          'MedicalOrderCharges',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.ORDER_CHARGE_QUERY],
          icon: 'carbon:currency',
          title: '医嘱收费',
        },
      },
      {
        name: 'MedicalOrderPackages',
        path: '/system/medical-order-packages',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/MedicalOrderPackagesView.vue'),
          'MedicalOrderPackages',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.PACKAGE_QUERY],
          icon: 'carbon:package',
          title: '医嘱套餐',
        },
      },
      {
        name: 'SamplingTemplates',
        path: '/system/sampling-templates',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/SamplingTemplatesView.vue'),
          'SamplingTemplates',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.TEMPLATE_QUERY],
          icon: 'carbon:document-preliminary',
          title: '描写模板',
        },
      },
      {
        name: 'SamplingGuidelines',
        path: '/system/sampling-guidelines',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/SamplingGuidelinesView.vue'),
          'SamplingGuidelines',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.GUIDELINE_QUERY],
          icon: 'carbon:rule',
          title: '取材规范',
        },
      },
      {
        name: 'SystemConfigs',
        path: '/system/configs',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/SystemConfigsView.vue'),
          'SystemConfigs',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.CONFIG_QUERY],
          icon: 'carbon:settings-adjust',
          title: '系统配置',
        },
      },
      {
        name: 'NumberingRules',
        path: '/system/numbering-rules',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/NumberingRulesView.vue'),
          'NumberingRules',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.NUMBERING_QUERY],
          icon: 'carbon:list-numbered',
          title: '编号规则',
        },
      },
      {
        name: 'LogManagement',
        path: '/system/logs',
        component: loadSystemRouteComponent(
          () =>
            import('#/modules/system-management/views/LogManagementView.vue'),
          'LogManagement',
        ),
        meta: {
          authority: [M1_PERMISSION_CODES.LOG_QUERY],
          icon: 'carbon:report',
          title: '日志管理',
        },
      },
    ],
  },
]);

export default routes;
