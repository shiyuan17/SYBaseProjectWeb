export const ROUTE_NAMES = {
  login: 'login',
  dashboard: 'dashboard',
  userManagementUsers: 'user-management-users',
  notFound: 'not-found'
} as const

export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES]

