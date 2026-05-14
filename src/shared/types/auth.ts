import type { PermissionCode } from '@/shared/constants/permissions'

export interface LoginPayload {
  username: string
  password: string
}

export interface SessionUser {
  id: string
  username: string
  displayName: string
  permissionCodes: PermissionCode[]
}

export interface SessionLoginResponse {
  token: string
  user: SessionUser
}

export interface SessionState {
  isAuthenticated: boolean
  token: string | null
  user: SessionUser | null
  permissionCodes: PermissionCode[]
  isInitialized: boolean
}

