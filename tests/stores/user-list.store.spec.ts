import { delay, http, HttpResponse } from 'msw'
import { createPinia, setActivePinia } from 'pinia'

import { server } from '../../mock/server'
import { useUserListStore } from '@/modules/user-management/store/useUserListStore'

describe('user list store', () => {
  it('loads user list successfully', async () => {
    setActivePinia(createPinia())
    const userListStore = useUserListStore()

    await userListStore.fetchUsers()

    expect(userListStore.items.length).toBeGreaterThan(0)
    expect(userListStore.errorMessage).toBeNull()
  })

  it('handles failed responses', async () => {
    server.use(
      http.get(/.*\/api\/user-management\/users$/, () =>
        HttpResponse.json(
          {
            code: 'BROKEN',
            message: '列表服务异常',
            traceId: 'trace-test-failure'
          },
          {
            status: 500
          }
        )
      )
    )

    setActivePinia(createPinia())
    const userListStore = useUserListStore()

    await userListStore.fetchUsers()

    expect(userListStore.items).toHaveLength(0)
    expect(userListStore.errorMessage).toContain('列表服务异常')
  })

  it('keeps the latest request result when requests overlap', async () => {
    server.use(
      http.get(/.*\/api\/user-management\/users$/, async ({ request }) => {
        const url = new URL(request.url)
        const keyword = url.searchParams.get('keyword')

        if (keyword === 'slow') {
          await delay(400)
          return HttpResponse.json({
            code: 'SUCCESS',
            message: 'ok',
            traceId: 'trace-slow',
            data: {
              items: [
                {
                  id: 'slow-user',
                  username: 'slow',
                  fullName: 'Slow Request',
                  email: 'slow@example.com',
                  status: 'active',
                  createdAt: '2025-03-01T09:00:00Z'
                }
              ],
              page: 1,
              size: 10,
              total: 1
            }
          })
        }

        return HttpResponse.json({
          code: 'SUCCESS',
          message: 'ok',
          traceId: 'trace-fast',
          data: {
            items: [
              {
                id: 'fast-user',
                username: 'fast',
                fullName: 'Fast Request',
                email: 'fast@example.com',
                status: 'active',
                createdAt: '2025-03-01T09:00:00Z'
              }
            ],
            page: 1,
            size: 10,
            total: 1
          }
        })
      })
    )

    setActivePinia(createPinia())
    const userListStore = useUserListStore()

    const slowRequest = userListStore.fetchUsers({
      keyword: 'slow'
    })
    const fastRequest = userListStore.fetchUsers({
      keyword: 'fast'
    })

    await Promise.all([slowRequest, fastRequest])

    expect(userListStore.items[0]?.username).toBe('fast')
  })
})

