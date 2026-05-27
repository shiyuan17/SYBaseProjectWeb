<script setup lang="ts">
import type { PendingTechnicalTaskItem, WorkstationSummaryBucket } from '../types/technical-workflow';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElAlert, ElButton, ElSkeleton, ElTag } from 'element-plus';

import { listPendingTechnicalTasks } from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M3_WORKFLOW_ROUTE_ITEMS, TECHNICAL_WORKFLOW_ROUTE_META } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatNullable,
  formatObjectType,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import { buildWorkstationSummaryBuckets } from '../utils/workstation';

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);
const accessStore = useAccessStore();

const loading = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);

const accessCodes = computed(() => new Set(accessStore.accessCodes));

const canAccessAnyM3 = computed(() =>
  M3_WORKFLOW_ROUTE_ITEMS.some((item) => accessCodes.value.has(item.code)),
);

const canAccessFrozen = computed(() =>
  accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.FROZEN.authorityCode),
);

const canAccessRework = computed(() =>
  accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.REWORK.authorityCode),
);

const canAccessTracking = computed(() =>
  accessCodes.value.has(TECHNICAL_WORKFLOW_ROUTE_META.TRACKING.authorityCode),
);

const accessibleBuckets = computed<WorkstationSummaryBucket[]>(() =>
  buildWorkstationSummaryBuckets(pendingItems.value).filter((item) => {
    const routeItem = M3_WORKFLOW_ROUTE_ITEMS.find((candidate) => candidate.path === item.path);
    return routeItem ? accessCodes.value.has(routeItem.code) : false;
  }),
);

const regularBuckets = computed(() =>
  accessibleBuckets.value.filter((item) => item.chain === 'REGULAR'),
);

const currentWorkingBucket = computed(() =>
  regularBuckets.value
    .filter((item) => item.inProgress > 0)
    .sort((left, right) => right.inProgress - left.inProgress)[0] ?? regularBuckets.value[0] ?? null,
);

const abnormalItems = computed(() =>
  pendingItems.value
    .filter((item) => item.timedOut || item.taskType === 'REWORK' || item.remarks)
    .slice(0, 8),
);

const frozenReminder = computed(() =>
  pendingItems.value.filter((item) => item.taskType === 'FROZEN' || item.currentNode === 'FROZEN').slice(0, 5),
);

async function loadDashboard() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks({
      page: 1,
      size: 200,
      timedOutOnly: false,
    });
    pendingItems.value = result.items;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (canAccessAnyM3.value) {
    void loadDashboard();
  }
});
</script>

<template>
  <div v-if="!canAccessAnyM3" class="flex min-h-[360px] items-center justify-center">
    <Fallback status="403" />
  </div>
  <Page
    v-else
    title="制片生产入口"
    description="围绕常规制片主链、冰冻工作台和异常闭环组织入口，让 M3 从任务调度到返工追踪保持连续。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="常规制片总览"
        description="当前常规制片主链按任务池统一调度，支持从入口继续处理中任务或直接进入调度视图。"
      >
        <ElSkeleton v-if="loading" :rows="6" animated />
        <div v-else class="flex flex-col gap-4">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="item in regularBuckets"
              :key="item.taskType"
              class="rounded-lg border border-border bg-card p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-foreground">{{ item.title }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">当前工位队列摘要</div>
                </div>
                <ElTag :type="item.timedOut > 0 ? 'danger' : item.inProgress > 0 ? 'warning' : 'info'">
                  {{ item.timedOut > 0 ? '异常' : '正常' }}
                </ElTag>
              </div>
              <div class="mt-4 grid grid-cols-3 gap-3 text-center">
                <div class="rounded-md bg-muted px-2 py-3">
                  <div class="text-xs text-muted-foreground">待处理</div>
                  <div class="mt-1 text-lg font-semibold text-foreground">{{ item.pending }}</div>
                </div>
                <div class="rounded-md bg-muted px-2 py-3">
                  <div class="text-xs text-muted-foreground">处理中</div>
                  <div class="mt-1 text-lg font-semibold text-foreground">{{ item.inProgress }}</div>
                </div>
                <div class="rounded-md bg-muted px-2 py-3">
                  <div class="text-xs text-muted-foreground">超时</div>
                  <div class="mt-1 text-lg font-semibold text-foreground">{{ item.timedOut }}</div>
                </div>
              </div>
            </article>
          </div>

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <button
              class="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              type="button"
              @click="currentWorkingBucket ? navigation.goToPath(currentWorkingBucket.path, { mode: currentWorkingBucket.inProgress > 0 ? 'queue' : 'exception' }) : navigation.goToTasks()"
            >
              <div class="text-sm font-semibold text-foreground">继续当前工位处理中任务</div>
              <div class="mt-2 text-xs text-muted-foreground">
                {{ currentWorkingBucket ? `${currentWorkingBucket.title} 当前处理中 ${currentWorkingBucket.inProgress} 条` : '当前没有正在处理中的工位任务，可直接进入任务池。' }}
              </div>
            </button>

            <button
              class="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              type="button"
              @click="navigation.goToTasks({ mode: 'queue' })"
            >
              <div class="text-sm font-semibold text-foreground">进入任务池调度</div>
              <div class="mt-2 text-xs text-muted-foreground">
                任务池继续作为 M3 唯一统一调度入口，适合分派、释放和按病例连续处理。
              </div>
            </button>

            <button
              class="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!canAccessFrozen"
              type="button"
              @click="navigation.goToFrozen()"
            >
              <div class="text-sm font-semibold text-foreground">进入冰冻工作台</div>
              <div class="mt-2 text-xs text-muted-foreground">
                冰冻链作为并列技术链独立展示，不混入常规制片任务池。
              </div>
            </button>

            <div class="rounded-lg border border-border bg-card p-4">
              <div class="text-sm font-semibold text-foreground">返工 / 技术追踪</div>
              <div class="mt-2 text-xs text-muted-foreground">
                从异常入口进入返工闭环，或按病例进入技术追踪核对主流程与质控事件。
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <ElButton v-if="canAccessRework" size="small" type="warning" @click="navigation.goToRework({ mode: 'exception' })">
                  返工
                </ElButton>
                <ElButton v-if="canAccessTracking" plain size="small" type="primary" @click="navigation.goToTracking()">
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
          <div v-if="!canAccessFrozen" class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            当前账号未开通冰冻工作台权限。
          </div>
          <div v-else class="flex flex-col gap-3">
            <div class="rounded-lg border border-border bg-card p-4">
              <div class="text-sm font-semibold text-foreground">冰冻并列技术链</div>
              <div class="mt-2 text-xs text-muted-foreground">
                当前先通过入口页和导航层明确展示冰冻链，后续第二阶段再考虑统一摘要与设备联动。
              </div>
              <div class="mt-3">
                <ElButton type="primary" @click="navigation.goToFrozen()">打开冰冻工作台</ElButton>
              </div>
            </div>

            <article
              v-for="item in frozenReminder"
              :key="item.id"
              class="rounded-lg border border-border bg-card p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-foreground">{{ formatNullable(item.pathologyNo) }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ formatTaskType(item.taskType) }} / {{ formatNullable(item.objectId) }}
                  </div>
                </div>
                <ElTag :type="item.timedOut ? 'danger' : 'info'">
                  {{ item.timedOut ? '超时' : formatTaskStatus(item.taskStatus) }}
                </ElTag>
              </div>
            </article>

            <div
              v-if="frozenReminder.length === 0"
              class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
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
              class="rounded-lg border border-border bg-card p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-foreground">
                    {{ formatNullable(item.pathologyNo) }}
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ formatTaskType(item.taskType) }} / {{ formatObjectType(item.objectType) }} / {{ formatNullable(item.objectId) }}
                  </div>
                </div>
                <ElTag :type="item.timedOut ? 'danger' : item.taskType === 'REWORK' ? 'warning' : 'info'">
                  {{ item.timedOut ? '超时' : formatTaskStatus(item.taskStatus) }}
                </ElTag>
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                {{ item.remarks ? `备注：${item.remarks}` : '当前任务无备注信息。' }}
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <ElButton
                  link
                  type="primary"
                  @click="item.taskType === 'REWORK' ? navigation.goToRework({ caseId: item.caseId, mode: 'exception', pathologyNo: item.pathologyNo ?? undefined }) : navigation.goToTask(item, 'exception')"
                >
                  进入处理
                </ElButton>
                <ElButton
                  v-if="canAccessTracking"
                  link
                  @click="navigation.goToTracking({ caseId: item.caseId, objectId: item.objectId ?? undefined, objectType: item.objectType ?? undefined, pathologyNo: item.pathologyNo ?? undefined, taskId: item.id, tab: 'abnormal' })"
                >
                  查看追踪
                </ElButton>
              </div>
            </article>
          </div>
          <div v-else class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            当前没有异常任务
          </div>
        </WorkflowSectionCard>
      </div>
    </div>
  </Page>
</template>
