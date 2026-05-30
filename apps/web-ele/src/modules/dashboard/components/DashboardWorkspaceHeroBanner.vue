<script setup lang="ts">
import { ElButton } from 'element-plus';

defineProps<{
  domainCount: number;
  heroTitle: string;
  heroValue: string;
  quickEntryCount: number;
  unreadCount: number;
  userName: string;
  visibleDomainTitles: string;
  warningRiskCount: number;
}>();

defineEmits<{
  refresh: [];
}>();
</script>

<template>
  <section
    class="dashboard-hero relative overflow-hidden rounded-[32px] border border-border bg-card px-6 py-6 text-foreground shadow-sm"
  >
    <div
      class="dashboard-hero__backdrop pointer-events-none absolute inset-0"
    ></div>
    <div class="relative flex flex-col gap-6">
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="max-w-3xl">
          <div
            class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
          >
            <span>角色驾驶舱</span>
            <span class="text-[var(--el-border-color)]">•</span>
            <span>{{ visibleDomainTitles || '待办聚焦模式' }}</span>
          </div>
          <h2
            class="mt-4 text-3xl font-semibold tracking-tight text-foreground"
          >
            你好，{{ userName }}
          </h2>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            当前页面汇总角色待办、预警、常用入口与通知。
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
          >
            未读通知 {{ unreadCount }}
          </span>
          <ElButton
            class="!border-border !bg-background/85 !text-foreground hover:!border-primary/40 hover:!bg-primary/5"
            plain
            @click="$emit('refresh')"
          >
            刷新工作台
          </ElButton>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
        >
          <div
            class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            重点待办
          </div>
          <div class="mt-3 text-3xl font-semibold text-foreground">
            {{ heroValue }}
          </div>
          <div class="mt-2 text-sm text-muted-foreground">
            {{ heroTitle }}
          </div>
        </article>
        <article
          class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
        >
          <div
            class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            高风险预警
          </div>
          <div class="mt-3 text-3xl font-semibold text-foreground">
            {{ warningRiskCount }}
          </div>
          <div class="mt-2 text-sm text-muted-foreground">
            包含高风险与提醒级异常
          </div>
        </article>
        <article
          class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
        >
          <div
            class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            业务域覆盖
          </div>
          <div class="mt-3 text-3xl font-semibold text-foreground">
            {{ domainCount }}
          </div>
          <div class="mt-2 text-sm text-muted-foreground">
            当前首页共汇聚 {{ visibleDomainTitles || '暂无可见域' }}
          </div>
        </article>
        <article
          class="rounded-[24px] border border-border bg-background/75 p-4 shadow-sm backdrop-blur"
        >
          <div
            class="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            快捷入口
          </div>
          <div class="mt-3 text-3xl font-semibold text-foreground">
            {{ quickEntryCount }}
          </div>
          <div class="mt-2 text-sm text-muted-foreground">
            当前权限下的常用入口
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-hero__backdrop {
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 16%, transparent),
      transparent 34%
    ),
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--el-color-success) 14%, transparent),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-bg-color) 92%, transparent),
      color-mix(in srgb, var(--el-fill-color-light) 78%, transparent)
    );
}
</style>
