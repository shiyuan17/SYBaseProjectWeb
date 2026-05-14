import { createRouter, createWebHistory } from 'vue-router'

import { useSessionStore } from '@/stores/session'

import { ROUTE_NAMES } from './route-names'
import { routes } from './routes'

function formatPageTitle(title: string) {
  return `${title} - ${import.meta.env.VITE_APP_TITLE}`
}

export function setupRouter() {
  const router = createRouter({
    history: createWebHistory(),
    routes
  })

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

  return router
}

