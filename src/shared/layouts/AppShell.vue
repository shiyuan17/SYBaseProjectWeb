<template>
  <div class="min-h-screen bg-slate-100">
    <div class="grid min-h-screen grid-cols-1 lg:grid-cols-[var(--layout-sidebar-width)_1fr]">
      <aside class="bg-slate-950 px-4 py-6 text-white">
        <div class="mb-8 space-y-2 px-2">
          <p class="text-xs uppercase tracking-[0.3em] text-teal-200">
            Control Center
          </p>
          <h1 class="text-xl font-semibold">
            {{ appTitle }}
          </h1>
          <p class="text-sm text-slate-300">
            基于规范构建的后台脚手架，默认带登录壳、路由守卫、状态层和示例模块。
          </p>
        </div>

        <nav class="space-y-2">
          <RouterLink
            v-for="item in visibleMenuItems"
            :key="item.to"
            :to="item.to"
            class="block rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-white/10"
            :class="item.to === currentRoute.path ? 'bg-white/15 text-white' : 'text-slate-300'"
          >
            <div class="flex items-center justify-between gap-3">
              <span>{{ item.label }}</span>
              <span class="text-xs uppercase tracking-[0.2em] text-slate-400">
                {{ item.badge }}
              </span>
            </div>
          </RouterLink>
        </nav>
      </aside>

      <main class="flex min-h-screen flex-col">
        <header class="border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm text-slate-500">
                当前会话
              </p>
              <h2 class="text-lg font-semibold text-slate-900">
                {{ sessionStore.displayName }}
              </h2>
            </div>

            <div class="flex items-center gap-3">
              <div class="rounded-full bg-brand-muted px-3 py-1 text-xs font-semibold text-brand-strong">
                {{ sessionStore.permissionCodes.length }} 项权限
              </div>
              <el-button
                type="primary"
                plain
                @click="handleLogout"
              >
                退出登录
              </el-button>
            </div>
          </div>
        </header>

        <section class="flex-1 px-6 py-6">
          <RouterView />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { PERMISSION_CODES } from '@/shared/constants/permissions'
import { ROUTE_NAMES } from '@/router/route-names'
import { useSessionStore } from '@/stores/session'

const sessionStore = useSessionStore()
const router = useRouter()
const currentRoute = useRoute()

const appTitle = import.meta.env.VITE_APP_TITLE

const menuItems = [
  {
    label: '仪表盘',
    to: '/dashboard',
    badge: 'core',
    permissionCodes: [PERMISSION_CODES.dashboardView]
  },
  {
    label: '用户管理',
    to: '/user-management/users',
    badge: 'demo',
    permissionCodes: [PERMISSION_CODES.userManagementView]
  }
]

const visibleMenuItems = computed(() =>
  menuItems.filter((item) => sessionStore.hasPermissions(item.permissionCodes))
)

function handleLogout() {
  sessionStore.logout()
  router.replace({
    name: ROUTE_NAMES.login
  })
}
</script>

