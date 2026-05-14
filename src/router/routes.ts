import type { RouteRecordRaw } from 'vue-router'

import { PERMISSION_CODES } from '@/shared/constants/permissions'

import { ROUTE_NAMES } from './route-names'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: ROUTE_NAMES.login,
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      layout: 'auth',
      hiddenInMenu: true
    }
  },
  {
    path: '/',
    component: () => import('@/views/index/index.vue'),
    meta: {
      title: '后台',
      requiresAuth: true,
      layout: 'app',
      hiddenInMenu: true
    },
    children: [
      {
        path: '',
        redirect: {
          name: ROUTE_NAMES.dashboard
        }
      },
      {
        path: 'dashboard',
        name: ROUTE_NAMES.dashboard,
        component: () => import('@/modules/dashboard/views/DashboardView.vue'),
        meta: {
          title: '仪表盘',
          requiresAuth: true,
          permissionCodes: [PERMISSION_CODES.dashboardView],
          layout: 'app',
          icon: 'ri:dashboard-3-line',
          keepAlive: false,
          fixedTab: true
        }
      },
      {
        path: 'user-management/users',
        name: ROUTE_NAMES.userManagementUsers,
        component: () => import('@/modules/user-management/views/UserListView.vue'),
        meta: {
          title: '用户列表',
          requiresAuth: true,
          permissionCodes: [PERMISSION_CODES.userManagementView],
          layout: 'app',
          icon: 'ri:user-settings-line',
          keepAlive: false
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE_NAMES.notFound,
    component: () => import('@/shared/views/NotFoundView.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
      layout: 'blank',
      hiddenInMenu: true
    }
  }
]
