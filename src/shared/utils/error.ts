import axios, { type AxiosError } from 'axios'

import type { BusinessErrorPayload } from '@/shared/types/api'

export class AppRequestError extends Error {
  status?: number
  code?: string
  traceId?: string

  constructor(message: string, options?: { status?: number; code?: string; traceId?: string }) {
    super(message)
    this.name = 'AppRequestError'
    this.status = options?.status
    this.code = options?.code
    this.traceId = options?.traceId
  }
}

export function normalizeErrorMessage(error: unknown, fallback = '请求失败，请稍后重试') {
  if (error instanceof AppRequestError) {
    return error.message
  }

  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data as BusinessErrorPayload | undefined
    return errorData?.message ?? error.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function toAppRequestError(error: AxiosError<BusinessErrorPayload>) {
  const status = error.response?.status
  const payload = error.response?.data
  const fallbackMessage = status === 401 ? '登录状态已失效，请重新登录' : '请求失败，请稍后重试'

  return new AppRequestError(payload?.message ?? error.message ?? fallbackMessage, {
    status,
    code: payload?.code,
    traceId: payload?.traceId
  })
}
