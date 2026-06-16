<script setup lang="ts">
import type { WorkflowRiskCard } from '../types/technical-workflow-entry';

import { ElTag } from 'element-plus';

defineProps<{
  badgeClass: string;
  riskCards: WorkflowRiskCard[];
}>();

function getRiskTagType(level: WorkflowRiskCard['level']) {
  if (level === 'danger') {
    return 'danger';
  }
  if (level === 'success') {
    return 'success';
  }
  if (level === 'warning') {
    return 'warning';
  }
  return 'info';
}
</script>

<template>
  <section
    class="overflow-hidden rounded-2xl border border-[#c97a4f]/20 bg-[linear-gradient(135deg,#7a3425_0%,#35241d_100%)] p-6 text-white shadow-sm"
  >
    <div
      class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
    >
      <div class="max-w-4xl">
        <div
          class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
        >
          Technical Workflow
        </div>
        <h2 class="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
          把制片管理从“页面入口”整理成“可连续推进的生产流程”
        </h2>
        <p class="mt-3 text-sm leading-6 text-white/85 md:text-base">
          当前入口页同时承担流程导览、任务摘要和异常提醒，让接收、常规制片、冰冻和返工追踪在一个视图里形成连续认知。
        </p>
        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <span :class="badgeClass">主菜单：制片管理</span>
          <span :class="badgeClass">对象：病例 / 标本 / 蜡块 / 玻片</span>
          <span :class="badgeClass">目标：从任务调度推进到产物流转</span>
        </div>
      </div>

      <div class="grid w-full gap-3 sm:grid-cols-2 xl:max-w-xl">
        <div
          v-for="item in riskCards"
          :key="item.title"
          class="rounded-2xl border border-white/12 bg-card/10 px-4 py-4 backdrop-blur-sm"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm text-white/78">{{ item.title }}</div>
            <ElTag :type="getRiskTagType(item.level)">
              {{ item.title }}
            </ElTag>
          </div>
          <div class="mt-3 text-3xl font-semibold leading-none text-white">
            {{ item.value }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
