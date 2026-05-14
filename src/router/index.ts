import { createRouter, createWebHistory } from 'vue-router'

import { useSessionStore } from '@/stores/session'
import { seedArtMenu } from '@/router/art-menu'
import { setWorktab } from '@/utils/navigation'

import { ROUTE_NAMES } from './route-names'
import { routes } from './routes'

export const HOME_PAGE_PATH = '/dashboard'

function formatPageTitle(title: string) {
  return `${title} - ${import.meta.env.VITE_APP_TITLE}`
}

export const router = createRouter({
  history: createWebHistory(),
  routes
})

export function setupRouter() {
  router.beforeEach((to) => {
    const sessionStore = useSessionStore()

    sessionStore.hydrate()

    if (to.name === ROUTE_NAMES.login && sessionStore.isAuthenticated) {
      return {
        name: ROUTE_NAMES.dashboard
      }
    }

    if (to.meta.requiresAuth && !sessionStore.isAuthenticated) {
      return {
        name: ROUTE_NAMES.login,
        query: {
          redirect: to.fullPath
        }
      }
    }

    if (to.meta.permissionCodes?.length && !sessionStore.hasPermissions(to.meta.permissionCodes)) {
      return {
        name: ROUTE_NAMES.dashboard
      }
    }

    document.title = formatPageTitle(to.meta.title)

    return true
  })

  router.afterEach((to) => {
    if (to.meta.requiresAuth) {
      seedArtMenu()
      setWorktab(to)
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  })

  return router
}
