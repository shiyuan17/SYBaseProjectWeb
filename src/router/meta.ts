import 'vue-router'

import type { PermissionCode } from '@/shared/constants/permissions'

export type AppRouteLayout = 'app' | 'auth' | 'blank'

export interface AppRouteMeta {
  title: string
  requiresAuth: boolean
  permissionCodes?: PermissionCode[]
  layout?: AppRouteLayout
  hiddenInMenu?: boolean
  icon?: string
  keepAlive?: boolean
  fixedTab?: boolean
  activePath?: string
  isFullPage?: boolean
}

declare module 'vue-router' {
  interface RouteMeta extends AppRouteMeta {
    _syRouteMetaBrand?: never
  }
}
