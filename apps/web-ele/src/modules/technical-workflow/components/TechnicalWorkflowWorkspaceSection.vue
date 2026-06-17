<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  WorkstationSummaryBucket,
} from '../types/technical-workflow';

import { ElButton, ElSkeleton, ElTag } from 'element-plus';

import {
  formatNullable,
  formatObjectType,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  abnormalItems: PendingTechnicalTaskItem[];
  canAccessAnyM3: boolean;
  canAccessFrozen: boolean;
  canAccessReceipt: boolean;
  canAccessRework: boolean;
  canAccessSpecimenRegistration: boolean;
  canAccessTracking: boolean;
  currentWorkingBucket: null | WorkstationSummaryBucket;
  frozenReminder: PendingTechnicalTaskItem[];
  loading: boolean;
  pendingSpecimenRegistrationCount: number;
  regularBuckets: WorkstationSummaryBucket[];
}>();

const emit = defineEmits<{
  goToCurrentWorkflow: [];
  goToFrozen: [];
  goToPath: [path: string];
  goToRework: [task?: PendingTechnicalTaskItem];
  goToSpecimenRegistration: [];
  goToTask: [task: PendingTechnicalTaskItem];
  goToTaskPool: [];
  goToTracking: [task?: PendingTechnicalTaskItem];
}>();
</script>

<template>
  <WorkflowSectionCard
    v-if="canAccessReceipt"
    title="标本接收入口"
    description="标本接收已恢复为制片管理的首步菜单，接收岗可继续沿用原页面和原权限完成接收。"
  >
    <div class="rounded-2xl border border-border bg-card p-4">
      <div class="text-sm font-semibold text-foreground">进入标本接收</div>
      <div class="mt-2 text-xs text-muted-foreground">
        菜单入口现位于 `/technical-workflow/specimen-receipt`， 原业务页
        `/workflow/pathology-receipt` 仍兼容现有链路和外部跳转。
      </div>
      <div class="mt-3">
        <ElButton
          type="primary"
          @click="emit('goToPath', '/technical-workflow/specimen-receipt')"
        >
          打开标本接收
        </ElButton>
      </div>
    </div>
  </WorkflowSectionCard>

  <template v-if="canAccessAnyM3">
    <WorkflowSectionCard
      title="常规制片总览"
      description="当前常规制片主链改为接收后先登记、再进任务池和工位，任务池继续承担可选调度入口。"
    >
      <ElSkeleton v-if="loading" :rows="6" animated />
      <div v-else class="flex flex-col gap-4">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in regularBuckets"
            :key="item.taskType"
            class="rounded-2xl border border-border bg-card p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-foreground">
                  {{ item.title }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  当前工位队列摘要
                </div>
              </div>
              <ElTag
                :type="
                  item.timedOut > 0
                    ? 'danger'
                    : item.inProgress > 0
                      ? 'warning'
                      : 'info'
                "
              >
                {{ item.timedOut > 0 ? '异常' : '正常' }}
              </ElTag>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3 text-center">
              <div class="rounded-xl bg-muted px-2 py-3">
                <div class="text-xs text-muted-foreground">待处理</div>
                <div class="mt-1 text-lg font-semibold text-foreground">
                  {{ item.pending }}
                </div>
              </div>
              <div class="rounded-xl bg-muted px-2 py-3">
                <div class="text-xs text-muted-foreground">处理中</div>
                <div class="mt-1 text-lg font-semibold text-foreground">
                  {{ item.inProgress }}
                </div>
              </div>
              <div class="rounded-xl bg-muted px-2 py-3">
                <div class="text-xs text-muted-foreground">超时</div>
                <div class="mt-1 text-lg font-semibold text-foreground">
                  {{ item.timedOut }}
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            v-if="canAccessSpecimenRegistration"
            class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            type="button"
            @click="emit('goToSpecimenRegistration')"
          >
            <div class="text-sm font-semibold text-foreground">
              进入标本登记
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              {{
                pendingSpecimenRegistrationCount > 0
                  ? `当前有 ${pendingSpecimenRegistrationCount} 条接收后待登记病例，建议优先处理。`
                  : '当前没有待登记病例，可继续进入任务池或目标工位。'
              }}
            </div>
          </button>

          <button
            class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            type="button"
            @click="emit('goToCurrentWorkflow')"
          >
            <div class="text-sm font-semibold text-foreground">
              继续当前工位处理中任务
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              {{
                currentWorkingBucket
                  ? `${currentWorkingBucket.title} 当前处理中 ${currentWorkingBucket.inProgress} 条`
                  : '当前没有正在处理中的工位任务，可直接进入任务池。'
              }}
            </div>
          </button>

          <button
            class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary"
            type="button"
            @click="emit('goToTaskPool')"
          >
            <div class="text-sm font-semibold text-foreground">
              进入任务池调度
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              任务池继续承担统一调度与病例连续查看，分派和认领保留，但不再作为后续处理的强制前置。
            </div>
          </button>

          <button
            class="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!canAccessFrozen"
            type="button"
            @click="emit('goToFrozen')"
          >
            <div class="text-sm font-semibold text-foreground">
              进入冰冻工作台
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              冰冻链作为并列技术链独立展示，不混入常规制片任务池。
            </div>
          </button>

          <div class="rounded-2xl border border-border bg-card p-4">
            <div class="text-sm font-semibold text-foreground">
              返工 / 技术追踪
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              从异常入口进入返工闭环，或按病例进入技术追踪核对主流程与质控事件。
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <ElButton
                v-if="canAccessRework"
                size="small"
                type="warning"
                @click="emit('goToRework')"
              >
                返工
              </ElButton>
              <ElButton
                v-if="canAccessTracking"
                plain
                size="small"
                type="primary"
                @click="emit('goToTracking')"
              >
                技术追踪
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </WorkflowSectionCard>

    <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <WorkflowSectionCard
        title="冰冻工作台提醒"
        description="冰冻链保持独立入口，在入口页只承担提醒和快速进入，避免与常规技术任务语义混淆。"
      >
        <div
          v-if="!canAccessFrozen"
          class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
        >
          当前账号未开通冰冻工作台权限。
        </div>
        <div v-else class="flex flex-col gap-3">
          <div class="rounded-2xl border border-border bg-card p-4">
            <div class="text-sm font-semibold text-foreground">
              冰冻并列技术链
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              当前先通过入口页和导航层明确展示冰冻链，后续第二阶段再考虑统一摘要与设备联动。
            </div>
            <div class="mt-3">
              <ElButton type="primary" @click="emit('goToFrozen')">
                打开冰冻工作台
              </ElButton>
            </div>
          </div>

          <article
            v-for="item in frozenReminder"
            :key="item.id"
            class="rounded-2xl border border-border bg-card p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-foreground">
                  {{ formatNullable(item.pathologyNo) }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ formatTaskType(item.taskType) }} /
                  {{ formatNullable(item.objectId) }}
                </div>
              </div>
              <ElTag :type="item.timedOut ? 'danger' : 'info'">
                {{ item.timedOut ? '超时' : formatTaskStatus(item.taskStatus) }}
              </ElTag>
            </div>
          </article>

          <div
            v-if="frozenReminder.length === 0"
            class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
          >
            当前没有来自统一任务列表的冰冻提醒，冰冻链仍可从独立工作台进入。
          </div>
        </div>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="异常与返工入口"
        description="入口页统一承接超时、返工和带备注任务，强调返工/追踪属于同一异常闭环，而不是散落在各工位说明里。"
      >
        <div v-if="abnormalItems.length > 0" class="flex flex-col gap-3">
          <article
            v-for="item in abnormalItems"
            :key="item.id"
            class="rounded-2xl border border-border bg-card p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-foreground">
                  {{ formatNullable(item.pathologyNo) }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ formatTaskType(item.taskType) }} /
                  {{ formatObjectType(item.objectType) }} /
                  {{ formatNullable(item.objectId) }}
                </div>
              </div>
              <ElTag
                :type="
                  item.timedOut
                    ? 'danger'
                    : item.taskType === 'REWORK'
                      ? 'warning'
                      : 'info'
                "
              >
                {{ item.timedOut ? '超时' : formatTaskStatus(item.taskStatus) }}
              </ElTag>
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              {{
                item.remarks ? `备注：${item.remarks}` : '当前任务无备注信息。'
              }}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <ElButton link type="primary" @click="emit('goToTask', item)">
                进入处理
              </ElButton>
              <ElButton
                v-if="canAccessTracking"
                link
                @click="emit('goToTracking', item)"
              >
                查看追踪
              </ElButton>
            </div>
          </article>
        </div>
        <div
          v-else
          class="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
        >
          当前没有异常任务
        </div>
      </WorkflowSectionCard>
    </div>
  </template>
</template>
