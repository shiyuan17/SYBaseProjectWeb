<script lang="ts" setup>
import type { PendingTechnicalTaskItem, WorkstationSummaryBucket } from '../types/technical-workflow';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { ElAlert, ElButton, ElSkeleton, ElTag } from 'element-plus';

import { listPendingTechnicalTasks } from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import { M3_WORKFLOW_ROUTE_ITEMS } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatNullable,
  formatObjectType,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import { buildWorkstationSummaryBuckets } from '../utils/workstation';

const router = useRouter();
const accessStore = useAccessStore();
const loading = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);

const targetPath = computed(() => {
  const accessCodes = new Set(accessStore.accessCodes);
  return (
    M3_WORKFLOW_ROUTE_ITEMS.find((item) => accessCodes.has(item.code))?.path ?? null
  );
});

const summaryBuckets = computed<WorkstationSummaryBucket[]>(() =>
  buildWorkstationSummaryBuckets(pendingItems.value).filter((item) =>
    accessStore.accessCodes.includes(
      M3_WORKFLOW_ROUTE_ITEMS.find((routeItem) => routeItem.path === item.path)?.code ?? '',
    ),
  ),
);

const recentAbnormalItems = computed(() =>
  pendingItems.value
    .filter((item) => item.timedOut || item.taskType === 'REWORK' || item.remarks)
    .slice(0, 8),
);

const quickRoutes = computed(() =>
  summaryBuckets.value.slice(0, 4).map((item) => ({
    ...item,
    label: item.inProgress > 0 ? '继续处理中任务' : '进入处理',
  })),
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

function goToPath(path: string, mode: 'exception' | 'queue' = 'queue') {
  void router.push({
    path,
    query: {
      mode,
    },
  });
}

onMounted(() => {
  if (targetPath.value) {
    void loadDashboard();
  }
});
</script>

<template>
  <div v-if="!targetPath" class="flex min-h-[360px] items-center justify-center">
    <Fallback status="403" />
  </div>
  <Page
    v-else
    title="生产总控台"
    description="按工位查看待办、处理中与异常风险。"
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
        title="工位总览"
        description="基于可见待办任务汇总各工位状态。"
      >
        <ElSkeleton v-if="loading" :rows="6" animated />
        <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in summaryBuckets"
            :key="item.taskType"
            class="rounded-lg border border-border bg-card p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-foreground">{{ item.title }}</div>
                <div class="mt-1 text-xs text-muted-foreground">当前可见工位队列</div>
              </div>
              <ElTag :type="item.timedOut > 0 ? 'danger' : item.inProgress > 0 ? 'warning' : 'info'">
                {{ item.timedOut > 0 ? '有异常' : '正常' }}
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
            <div class="mt-4">
              <ElButton class="w-full" type="primary" @click="goToPath(item.path, item.timedOut > 0 ? 'exception' : 'queue')">
                {{ item.inProgress > 0 ? '继续处理' : '进入处理' }}
              </ElButton>
            </div>
          </article>
        </div>
      </WorkflowSectionCard>

      <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <WorkflowSectionCard
          title="快捷入口"
          description="展示当前账号常用的工位入口。"
        >
          <div class="grid gap-3 md:grid-cols-2">
            <button
              v-for="item in quickRoutes"
              :key="item.taskType"
              class="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary"
              type="button"
              @click="goToPath(item.path, item.inProgress > 0 ? 'queue' : 'queue')"
            >
              <div class="text-sm font-semibold text-foreground">{{ item.title }}</div>
              <div class="mt-2 text-xs text-muted-foreground">
                {{ item.label }}，当前待处理 {{ item.pending }} 条，处理中 {{ item.inProgress }} 条。
              </div>
            </button>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="异常待处理"
          description="展示超时、返工和带备注的任务。"
        >
          <div v-if="recentAbnormalItems.length > 0" class="flex flex-col gap-3">
            <article
              v-for="item in recentAbnormalItems"
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
                {{ item.remarks ? `备注：${item.remarks}` : '该任务无备注信息。' }}
              </div>
              <div class="mt-3">
                <ElButton
                  link
                  type="primary"
                  @click="goToPath(item.taskType === 'REWORK' ? '/technical-workflow/rework' : (summaryBuckets.find((bucket) => bucket.taskType === item.taskType)?.path ?? '/technical-workflow/tasks'), 'exception')"
                >
                  进入处理
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
