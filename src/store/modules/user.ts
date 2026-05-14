import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { LanguageEnum } from '@/enums/appEnum'
import { ROUTE_NAMES } from '@/router/route-names'
import type { useSessionStore } from '@/stores/session'
import type { AppRouteRecord } from '@/types/router'

interface ArtUserInfo {
  userId?: string
  userName: string
  email: string
  roles: string[]
  buttons?: string[]
}

const defaultUserInfo = (): ArtUserInfo => ({
  userName: '未登录用户',
  email: '',
  roles: []
})

export const useUserStore = defineStore(
  'userStore',
  () => {
    const router = useRouter()
    const language = ref(LanguageEnum.ZH)
    const isLogin = ref(false)
    const isLock = ref(false)
    const lockPassword = ref('')
    const info = ref<ArtUserInfo>(defaultUserInfo())
    const searchHistory = ref<AppRouteRecord[]>([])
    const accessToken = ref('')
    const refreshToken = ref('')

    const getUserInfo = computed(() => info.value)

    const setUserInfo = (newInfo: Partial<ArtUserInfo>) => {
      info.value = {
        ...defaultUserInfo(),
        ...newInfo
      }
    }

    const setLoginStatus = (status: boolean) => {
      isLogin.value = status
    }

    const setLanguage = (lang: LanguageEnum) => {
      language.value = lang
    }

    const setSearchHistory = (list: AppRouteRecord[]) => {
      searchHistory.value = list
    }

    const setLockStatus = (status: boolean) => {
      isLock.value = status
    }

    const setLockPassword = (password: string) => {
      lockPassword.value = password
    }

    const setToken = (newAccessToken: string, newRefreshToken = '') => {
      accessToken.value = newAccessToken
      refreshToken.value = newRefreshToken
    }

    const syncFromSession = (sessionStore: ReturnType<typeof useSessionStore>) => {
      isLogin.value = sessionStore.isAuthenticated
      accessToken.value = sessionStore.token ?? ''
      refreshToken.value = ''
      info.value = {
        userId: sessionStore.user?.id,
        userName: sessionStore.user?.displayName ?? '未登录用户',
        email: sessionStore.user?.email ?? '',
        roles: sessionStore.permissionCodes
      }
    }

    const resetUserState = () => {
      isLogin.value = false
      isLock.value = false
      lockPassword.value = ''
      info.value = defaultUserInfo()
      accessToken.value = ''
      refreshToken.value = ''
    }

    const logOut = async () => {
      const { useSessionStore: getSessionStore } = await import('@/stores/session')
      const sessionStore = getSessionStore()
      sessionStore.logout()
      resetUserState()
      await router.replace({ name: ROUTE_NAMES.login })
    }

    const checkAndClearWorktabs = () => undefined

    return {
      language,
      isLogin,
      isLock,
      lockPassword,
      info,
      searchHistory,
      accessToken,
      refreshToken,
      getUserInfo,
      setUserInfo,
      setLoginStatus,
      setLanguage,
      setSearchHistory,
      setLockStatus,
      setLockPassword,
      setToken,
      syncFromSession,
      logOut,
      checkAndClearWorktabs
    }
  },
  {
    persist: {
      key: 'user',
      storage: localStorage
    }
  }
)
