import 'vue-router'

import type { PermissionCode } from '@/shared/constants/permissions'

export type AppRouteLayout = 'app' | 'auth' | 'blank'

export interface AppRouteMeta {
  title: string
  requiresAuth: boolean
  permissionCodes?: PermissionCode[]
  layout?: AppRouteLayout
  hiddenInMenu?: boolean
}

declare module 'vue-router' {
  interface RouteMeta extends AppRouteMeta {}
}

