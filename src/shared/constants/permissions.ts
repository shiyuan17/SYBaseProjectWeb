export const PERMISSION_CODES = {
  dashboardView: 'dashboard:view',
  userManagementView: 'user-management:view'
} as const

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES]

