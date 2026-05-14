<template>
  <div class="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_48%),linear-gradient(180deg,#f8fafc_0%,#eef6f5_100%)] px-6 py-10">
    <div class="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section class="flex flex-col justify-between rounded-[2rem] bg-slate-950 p-10 text-white shadow-panel">
        <div class="space-y-4">
          <p class="text-xs uppercase tracking-[0.35em] text-teal-200">
            Scaffold Baseline
          </p>
          <div class="space-y-3">
            <h1 class="max-w-xl text-4xl font-semibold leading-tight">
              用一套真正能跑起来的脚手架，把规范落成日常开发的默认路径。
            </h1>
            <p class="max-w-xl text-sm leading-7 text-slate-300">
              当前示例包含登录壳、路由守卫、Pinia 会话状态、Axios 请求层、MSW
              Mock、Vitest 测试基线，以及一个可直接复制扩展的用户管理模块。
            </p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl bg-white/6 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
              Router
            </p>
            <p class="mt-2 text-sm text-slate-200">
              登录守卫、标题策略、权限元信息。
            </p>
          </div>
          <div class="rounded-2xl bg-white/6 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
              State
            </p>
            <p class="mt-2 text-sm text-slate-200">
              会话白名单持久化与模块状态分层。
            </p>
          </div>
          <div class="rounded-2xl bg-white/6 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
              Mock + Test
            </p>
            <p class="mt-2 text-sm text-slate-200">
              本地联调与单元测试共享同一组 handler。
            </p>
          </div>
        </div>
      </section>

      <section class="panel-surface flex flex-col justify-center p-8 lg:p-10">
        <div class="space-y-2">
          <p class="text-xs uppercase tracking-[0.3em] text-brand">
            Welcome Back
          </p>
          <h2 class="text-3xl font-semibold text-slate-900">
            登录后台脚手架
          </h2>
          <p class="text-sm text-slate-600">
            默认演示账号为 <strong>admin / admin123</strong>，仅用于本地规范验证。
          </p>
        </div>

        <el-form
          :model="formState"
          class="mt-8 space-y-4"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item
            label="用户名"
            required
          >
            <el-input
              v-model="formState.username"
              autocomplete="username"
              placeholder="请输入用户名"
            />
          </el-form-item>

          <el-form-item
            label="密码"
            required
          >
            <el-input
              v-model="formState.password"
              autocomplete="current-password"
              placeholder="请输入密码"
              show-password
              type="password"
            />
          </el-form-item>

          <div class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            登录后默认拥有仪表盘与用户管理权限，用于验证菜单过滤、受保护路由和占位会话持久化。
          </div>

          <el-button
            :loading="isSubmitting"
            class="!mt-6 w-full"
            size="large"
            type="primary"
            @click="handleSubmit"
          >
            进入系统
          </el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ROUTE_NAMES } from '@/router/route-names'
import { useSessionStore } from '@/stores/session'
import { normalizeErrorMessage } from '@/shared/utils/error'

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()

const isSubmitting = ref(false)
const formState = reactive({
  username: 'admin',
  password: 'admin123'
})

async function handleSubmit() {
  isSubmitting.value = true

  try {
    await sessionStore.login({
      username: formState.username,
      password: formState.password
    })

    const redirectPath =
      typeof route.query.redirect === 'string' ? route.query.redirect : undefined

    await router.replace(
      redirectPath
        ? redirectPath
        : {
            name: ROUTE_NAMES.dashboard
          }
    )

    ElMessage.success('登录成功，已进入脚手架后台')
  } catch (error) {
    ElMessage.error(normalizeErrorMessage(error, '登录失败，请检查账号信息'))
  } finally {
    isSubmitting.value = false
  }
}
</script>

