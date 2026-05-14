import type { AppRouteRecord } from '@/types/router'
import { PERMISSION_CODES } from '@/shared/constants/permissions'
import { useMenuStore } from '@/store/modules/menu'
import { useSessionStore } from '@/stores/session'

import { ROUTE_NAMES } from './route-names'

const ART_MENU_ROUTES: AppRouteRecord[] = [
  {
    path: '/dashboard',
    name: ROUTE_NAMES.dashboard,
    component: '/dashboard',
    meta: {
      title: '仪表盘',
      icon: 'ri:dashboard-3-line',
      keepAlive: false,
      fixedTab: true,
      permissionCodes: [PERMISSION_CODES.dashboardView]
    }
  },
  {
    path: '/user-management/users',
    name: ROUTE_NAMES.userManagementUsers,
    component: '/user-management/users',
    meta: {
      title: '用户管理',
      icon: 'ri:user-settings-line',
      keepAlive: false,
      permissionCodes: [PERMISSION_CODES.userManagementView]
    }
  }
]

export function getVisibleArtMenuRoutes() {
  const sessionStore = useSessionStore()

  return ART_MENU_ROUTES.filter((route) => {
    const permissionCodes = route.meta.permissionCodes
    return !permissionCodes?.length || sessionStore.hasPermissions(permissionCodes)
  })
}

export function seedArtMenu() {
  const menuStore = useMenuStore()
  const menuList = getVisibleArtMenuRoutes()

  menuStore.setMenuList(menuList)
  menuStore.setHomePath('/dashboard')
}
