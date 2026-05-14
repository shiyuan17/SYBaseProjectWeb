import type { LoginPayload, SessionLoginResponse } from '@/shared/types/auth'

import { request } from './http'

export function loginWithPassword(payload: LoginPayload) {
  return request<SessionLoginResponse>({
    method: 'POST',
    url: '/auth/login',
    data: payload
  })
}

