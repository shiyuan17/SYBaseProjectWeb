<script setup lang="ts">
import type { WorkstationSummaryBucket } from '../types/technical-workflow';
import type {
  WorkflowChainStep,
  WorkflowMapCard,
  WorkflowOverviewCard,
} from '../types/technical-workflow-entry';

import { ElButton } from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  currentWorkingBucket: null | WorkstationSummaryBucket;
  overviewCards: WorkflowOverviewCard[];
  workflowLead: string;
  workflowMapCards: WorkflowMapCard[];
  workflowSteps: WorkflowChainStep[];
}>();

const emit = defineEmits<{
  goToCurrentWorkflow: [];
  goToPath: [path: string];
  goToTaskPool: [];
}>();
</script>

<template>
  <WorkflowSectionCard
    title="模块概览"
    description="先回答技术组当前在做什么、覆盖哪些链路、最后把什么交给下游。"
  >
    <div class="grid gap-4 md:grid-cols-3">
      <article
        v-for="item in overviewCards"
        :key="item.title"
        class="rounded-2xl border border-border bg-[linear-gradient(180deg,var(--el-bg-color)_0%,rgba(250,245,240,0.6)_100%)] p-4"
      >
        <div class="text-base font-semibold text-foreground">
          {{ item.title }}
        </div>
        <div class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ item.description }}
        </div>
      </article>
    </div>
  </WorkflowSectionCard>

  <WorkflowSectionCard
    title="核心功能地图"
    description="把入口、主链、异常链和对象状态放在同一张图里，帮助现场先建立全局认知。"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <article
        v-for="item in workflowMapCards"
        :key="item.title"
        class="rounded-2xl border border-border bg-card p-4"
      >
        <div class="text-base font-semibold text-foreground">
          {{ item.title }}
        </div>
        <ul
          class="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm leading-6 text-muted-foreground"
        >
          <li v-for="entry in item.items" :key="entry">{{ entry }}</li>
        </ul>
      </article>
    </div>
  </WorkflowSectionCard>

  <WorkflowSectionCard
    title="典型工作流程"
    description="参考旧系统的技术工作站分析，把当前 Web 入口整理为从接收到染色出片的连续主链。"
  >
    <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="flex flex-col gap-3">
        <article
          v-for="item in workflowSteps"
          :key="item.title"
          class="rounded-2xl border border-border bg-[linear-gradient(180deg,#fff,#fbf7f2)] p-4"
        >
          <div
            class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
          >
            <div class="max-w-3xl">
              <div
                class="inline-flex rounded-full bg-[#f4dfd9] px-3 py-1 text-xs font-semibold text-[#8c3f2f]"
              >
                {{ item.title }}
              </div>
              <div class="mt-3 text-base font-semibold text-foreground">
                {{ item.description }}
              </div>
              <div class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ item.helperText }}
              </div>
            </div>
            <ElButton
              v-if="item.routePath"
              class="shrink-0"
              type="primary"
              @click="emit('goToPath', item.routePath)"
            >
              {{ item.actionLabel }}
            </ElButton>
          </div>
        </article>
      </div>

      <div
        class="rounded-2xl border border-border bg-[linear-gradient(180deg,#fffaf2,#fffdf9)] p-5"
      >
        <div class="text-base font-semibold text-foreground">当前流程建议</div>
        <div class="mt-3 text-sm leading-6 text-muted-foreground">
          {{ workflowLead }}
        </div>
        <div class="mt-5 flex flex-col gap-3">
          <button
            class="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            type="button"
            @click="emit('goToCurrentWorkflow')"
          >
            <div class="text-sm font-semibold text-foreground">
              继续当前工位处理中任务
            </div>
            <div class="mt-2 text-xs leading-5 text-muted-foreground">
              {{
                currentWorkingBucket
                  ? `${currentWorkingBucket.title} 当前处理中 ${currentWorkingBucket.inProgress} 条`
                  : '当前没有正在处理中的工位任务，可直接进入任务池。'
              }}
            </div>
          </button>

          <button
            class="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            type="button"
            @click="emit('goToTaskPool')"
          >
            <div class="text-sm font-semibold text-foreground">
              进入任务池调度
            </div>
            <div class="mt-2 text-xs leading-5 text-muted-foreground">
              任务池继续作为 M3
              唯一统一调度入口，适合分派、释放和按病例连续处理。
            </div>
          </button>
        </div>
      </div>
    </div>
  </WorkflowSectionCard>
</template>
