import { createPinia, setActivePinia } from 'pinia'

import { ROUTE_NAMES } from '@/router/route-names'
import { setupRouter } from '@/router'

describe('router guard', () => {
  it('redirects unauthenticated users to login', async () => {
    setActivePinia(createPinia())
    const router = setupRouter()

    await router.push('/dashboard')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.login)
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
  })
})

