import type { RouteRecordRaw } from 'vue-router';

import { M1_PERMISSION_CODES } from '#/modules/system-management/constants';

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
];

const routes: RouteRecordRaw[] = [
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
        component: () =>
          import('#/modules/system-management/views/SystemUsersView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.SYSTEM_USER_QUERY],
          icon: 'carbon:user-avatar',
          title: '系统用户',
        },
      },
      {
        name: 'Roles',
        path: '/system/roles',
        component: () => import('#/modules/system-management/views/RolesView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.SYSTEM_ROLE_QUERY],
          icon: 'carbon:user-role',
          title: '角色授权',
        },
      },
      {
        name: 'Departments',
        path: '/system/departments',
        component: () =>
          import('#/modules/system-management/views/DepartmentsView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.DEPARTMENT_QUERY],
          icon: 'carbon:building',
          title: '科室字典',
        },
      },
      {
        name: 'BodyParts',
        path: '/system/body-parts',
        component: () =>
          import('#/modules/system-management/views/BodyPartsView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.BODY_PART_QUERY],
          icon: 'carbon:tree-view',
          title: '部位字典',
        },
      },
      {
        name: 'MedicalOrderDicts',
        path: '/system/medical-order-dicts',
        component: () =>
          import('#/modules/system-management/views/MedicalOrderDictsView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.ORDER_DICT_QUERY],
          icon: 'carbon:book',
          title: '医嘱字典',
        },
      },
      {
        name: 'MedicalOrderCharges',
        path: '/system/medical-order-charges',
        component: () =>
          import('#/modules/system-management/views/MedicalOrderChargesView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.ORDER_CHARGE_QUERY],
          icon: 'carbon:currency',
          title: '医嘱收费',
        },
      },
      {
        name: 'MedicalOrderPackages',
        path: '/system/medical-order-packages',
        component: () =>
          import('#/modules/system-management/views/MedicalOrderPackagesView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.PACKAGE_QUERY],
          icon: 'carbon:package',
          title: '医嘱套餐',
        },
      },
      {
        name: 'SamplingTemplates',
        path: '/system/sampling-templates',
        component: () =>
          import('#/modules/system-management/views/SamplingTemplatesView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.TEMPLATE_QUERY],
          icon: 'carbon:document-preliminary',
          title: '描写模板',
        },
      },
      {
        name: 'SamplingGuidelines',
        path: '/system/sampling-guidelines',
        component: () =>
          import('#/modules/system-management/views/SamplingGuidelinesView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.GUIDELINE_QUERY],
          icon: 'carbon:rule',
          title: '取材规范',
        },
      },
      {
        name: 'SystemConfigs',
        path: '/system/configs',
        component: () =>
          import('#/modules/system-management/views/SystemConfigsView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.CONFIG_QUERY],
          icon: 'carbon:settings-adjust',
          title: '系统配置',
        },
      },
      {
        name: 'NumberingRules',
        path: '/system/numbering-rules',
        component: () =>
          import('#/modules/system-management/views/NumberingRulesView.vue'),
        meta: {
          authority: [M1_PERMISSION_CODES.NUMBERING_QUERY],
          icon: 'carbon:list-numbered',
          title: '编号规则',
        },
      },
    ],
  },
];

export default routes;
