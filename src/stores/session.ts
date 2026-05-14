import { defineStore } from 'pinia'

import { loginWithPassword } from '@/shared/api/authService'
import { STORAGE_KEYS } from '@/shared/constants/storage'
import type { LoginPayload, SessionState } from '@/shared/types/auth'
import { loadJson, removeStorageValue, saveJson } from '@/shared/utils/storage'

const initialState = (): SessionState => ({
  isAuthenticated: false,
  token: null,
  user: null,
  permissionCodes: [],
  isInitialized: false
})

interface PersistedSessionState {
  isAuthenticated: boolean
  token: string | null
  user: SessionState['user']
  permissionCodes: SessionState['permissionCodes']
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => initialState(),
  getters: {
    displayName: (state) => state.user?.displayName ?? '未登录用户'
  },
  actions: {
    hydrate() {
      if (this.isInitialized) {
        return
      }

      const persistedState = loadJson<PersistedSessionState | null>(STORAGE_KEYS.session, null)

      if (persistedState?.isAuthenticated && persistedState.user && persistedState.token) {
        this.$patch({
          isAuthenticated: true,
          token: persistedState.token,
          user: persistedState.user,
          permissionCodes: persistedState.permissionCodes
        })
      }

      this.isInitialized = true
    },
    async login(payload: LoginPayload) {
      const sessionData = await loginWithPassword(payload)

      this.$patch({
        isAuthenticated: true,
        token: sessionData.token,
        user: sessionData.user,
        permissionCodes: sessionData.user.permissionCodes,
        isInitialized: true
      })

      this.persist()
    },
    logout() {
      this.$patch(initialState())
      this.isInitialized = true
      removeStorageValue(STORAGE_KEYS.session)
    },
    hasPermissions(requiredPermissionCodes: string[] = []) {
      return requiredPermissionCodes.every((permissionCode) => this.permissionCodes.includes(permissionCode))
    },
    persist() {
      saveJson<PersistedSessionState>(STORAGE_KEYS.session, {
        isAuthenticated: this.isAuthenticated,
        token: this.token,
        user: this.user,
        permissionCodes: this.permissionCodes
      })
    }
  }
})

