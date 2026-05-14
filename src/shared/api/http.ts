import axios from 'axios'

import { toAppRequestError } from '@/shared/utils/error'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toAppRequestError(error))
)

export async function request<T>(config: Parameters<typeof httpClient.request>[0]) {
  const response = await httpClient.request<{ data: T }>(config)
  return response.data.data
}

export { httpClient }

