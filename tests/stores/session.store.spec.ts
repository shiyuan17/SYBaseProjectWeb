import { createPinia, setActivePinia } from 'pinia'

import { STORAGE_KEYS } from '@/shared/constants/storage'
import { useSessionStore } from '@/stores/session'

describe('session store', () => {
  it('logs in and persists whitelisted session fields', async () => {
    setActivePinia(createPinia())
    const sessionStore = useSessionStore()

    await sessionStore.login({
      username: 'admin',
      password: 'admin123'
    })

    expect(sessionStore.isAuthenticated).toBe(true)
    expect(sessionStore.user?.displayName).toBe('系统管理员')

    const persistedRawValue = localStorage.getItem(STORAGE_KEYS.session)
    expect(persistedRawValue).not.toBeNull()

    const persistedValue = JSON.parse(persistedRawValue ?? '{}') as { token?: string }
    expect(persistedValue.token).toBe('mock-token')
  })

  it('clears persisted state on logout', async () => {
    setActivePinia(createPinia())
    const sessionStore = useSessionStore()

    await sessionStore.login({
      username: 'admin',
      password: 'admin123'
    })

    sessionStore.logout()

    expect(sessionStore.isAuthenticated).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull()
  })
})

