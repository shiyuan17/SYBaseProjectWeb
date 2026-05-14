export interface ApiResponse<T> {
  code: string
  message: string
  traceId: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  size: number
  total: number
}

export interface BusinessErrorPayload {
  code?: string
  message?: string
  traceId?: string
}

