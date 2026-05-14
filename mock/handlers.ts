import { delay, http, HttpResponse } from 'msw'

import { PERMISSION_CODES } from '@/shared/constants/permissions'
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api'
import type { SessionLoginResponse } from '@/shared/types/auth'
import type { UserListItemDto } from '@/modules/user-management/types/userManagement'

const apiPathMatcher = (path: string) => new RegExp(`.*/api${path}(\\?.*)?$`)

const users: UserListItemDto[] = [
  {
    id: 'u-001',
    username: 'ada',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    status: 'active',
    createdAt: '2025-03-01T09:00:00Z'
  },
  {
    id: 'u-002',
    username: 'grace',
    fullName: 'Grace Hopper',
    email: 'grace@example.com',
    status: 'active',
    createdAt: '2025-03-04T08:20:00Z'
  },
  {
    id: 'u-003',
    username: 'linus',
    fullName: 'Linus Torvalds',
    email: 'linus@example.com',
    status: 'disabled',
    createdAt: '2025-03-08T10:15:00Z'
  },
  {
    id: 'u-004',
    username: 'margaret',
    fullName: 'Margaret Hamilton',
    email: 'margaret@example.com',
    status: 'active',
    createdAt: '2025-03-11T07:45:00Z'
  },
  {
    id: 'u-005',
    username: 'tim',
    fullName: 'Tim Berners-Lee',
    email: 'tim@example.com',
    status: 'active',
    createdAt: '2025-03-14T12:30:00Z'
  },
  {
    id: 'u-006',
    username: 'dennis',
    fullName: 'Dennis Ritchie',
    email: 'dennis@example.com',
    status: 'disabled',
    createdAt: '2025-03-16T11:25:00Z'
  }
]

function createApiResponse<T>(data: T): ApiResponse<T> {
  return {
    code: 'SUCCESS',
    message: 'ok',
    traceId: 'trace-local-mock',
    data
  }
}

export const handlers = [
  http.post(apiPathMatcher('/auth/login'), async ({ request }) => {
    await delay(250)

    const payload = (await request.json()) as { username?: string; password?: string }

    if (payload.username !== 'admin' || payload.password !== 'admin123') {
      return HttpResponse.json(
        {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: '用户名或密码错误',
          traceId: 'trace-login-invalid'
        },
        {
          status: 401
        }
      )
    }

    const response: SessionLoginResponse = {
      token: 'mock-token',
      user: {
        id: 'session-admin',
        username: 'admin',
        displayName: '系统管理员',
        permissionCodes: [PERMISSION_CODES.dashboardView, PERMISSION_CODES.userManagementView]
      }
    }

    return HttpResponse.json(createApiResponse(response))
  }),
  http.get(apiPathMatcher('/user-management/users'), async ({ request }) => {
    await delay(300)

    const url = new URL(request.url)
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase()
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page') ?? '1')
    const size = Number(url.searchParams.get('size') ?? '10')

    if (keyword === 'error') {
      return HttpResponse.json(
        {
          code: 'USER_LIST_FAILED',
          message: 'Mock 服务故意返回失败，用于验证错误态',
          traceId: 'trace-user-list-error'
        },
        {
          status: 500
        }
      )
    }

    const filteredUsers = users.filter((user) => {
      const matchesKeyword =
        !keyword ||
        [user.username, user.fullName, user.email].some((value) =>
          value.toLowerCase().includes(keyword)
        )
      const matchesStatus = !status || user.status === status

      return matchesKeyword && matchesStatus
    })

    const pageStart = (page - 1) * size
    const pageItems = keyword === 'empty' ? [] : filteredUsers.slice(pageStart, pageStart + size)

    const response: PaginatedResponse<UserListItemDto> = {
      items: pageItems,
      page,
      size,
      total: keyword === 'empty' ? 0 : filteredUsers.length
    }

    return HttpResponse.json(createApiResponse(response))
  })
]
