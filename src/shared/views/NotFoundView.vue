<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-6">
    <div class="panel-surface max-w-lg p-8 text-center">
      <p class="text-xs uppercase tracking-[0.3em] text-brand">
        404
      </p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-900">
        页面不存在
      </h1>
      <p class="mt-3 text-sm text-slate-600">
        你访问的地址不存在，或者当前账号没有该入口。可以返回登录页重新选择导航入口。
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <RouterLink to="/dashboard">
          <el-button type="primary">
            返回仪表盘
          </el-button>
        </RouterLink>
        <RouterLink to="/login">
          <el-button plain>
            去登录页
          </el-button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

