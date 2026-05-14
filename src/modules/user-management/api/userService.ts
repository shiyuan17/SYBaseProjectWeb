import type { PaginatedResponse } from '@/shared/types/api'

import { request } from '@/shared/api/http'

import type { UserListItemDto, UserListQuery } from '../types/userManagement'

export function fetchUserList(query: UserListQuery) {
  return request<PaginatedResponse<UserListItemDto>>({
    method: 'GET',
    url: '/user-management/users',
    params: {
      keyword: query.keyword || undefined,
      status: query.status === 'all' ? undefined : query.status,
      page: query.page,
      size: query.size
    }
  })
}

