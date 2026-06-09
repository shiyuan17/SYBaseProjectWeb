<script setup lang="ts">
import type { Ref } from 'vue';

import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElBadge,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  completeDehydration,
  listPendingTechnicalTasks,
  startDehydration,
} from '../api/technical-workflow-service';
import DehydrationBatchOperationDialog from '../components/DehydrationBatchOperationDialog.vue';
import DehydrationCreateBatchDialog from '../components/DehydrationCreateBatchDialog.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import {
  buildDehydrationWorkbenchStats,
  getDehydrationTaskOperator,
  getDehydrationTaskRemark,
} from '../utils/dehydration-workbench';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatTaskStatus } from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';

const route = useRoute();
const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const pageError = ref('');
const loading = ref(false);
const startLoading = ref(false);
const completeLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const selectedTaskId = ref('');
const selectedRows = ref<PendingTechnicalTaskItem[]>([]);
const createBatchDialogVisible = ref(false);
const batchOperationDialogVisible = ref(false);
const latestBatchId = ref('');

const filters = reactive({
  page: 1,
  pathologyNo:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  size: DEFAULT_PAGE_SIZE,
  timedOutOnly: route.query.mode === 'exception',
});

const routeTaskId = computed(() =>
  typeof route.query.taskId === 'string' ? route.query.taskId : '',
);
const shouldIncludeAllStatuses = computed(
  () => Boolean(filters.pathologyNo.trim()) || Boolean(routeTaskId.value),
);
const shouldInitialLoad = computed(
  () =>
    Boolean(filters.pathologyNo.trim()) ||
    Boolean(routeTaskId.value) ||
    filters.timedOutOnly,
);
const currentQuery = computed(() => ({
  includeAllStatuses: shouldIncludeAllStatuses.value || undefined,
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskId: routeTaskId.value || undefined,
  taskType: 'DEHYDRATION',
  timedOutOnly: filters.timedOutOnly,
}));

const selectedTask = computed(
  () =>
    pendingItems.value.find((item) => item.id === selectedTaskId.value) ?? null,
);
const createBatchTasks = computed(() => {
  if (selectedRows.value.length > 0) {
    return selectedRows.value;
  }
  if (selectedTask.value) {
    return [selectedTask.value];
  }
  return [];
});
const stats = computed(() =>
  buildDehydrationWorkbenchStats(pendingItems.value),
);
const timedOutCount = computed(
  () => pendingItems.value.filter((item) => item.timedOut).length,
);

function getStatusTagType(task: PendingTechnicalTaskItem) {
  if (task.timedOut) {
    return 'danger';
  }
  if (task.taskStatus === 'IN_PROGRESS') {
    return 'warning';
  }
  if (task.taskStatus === 'COMPLETED') {
    return 'success';
  }
  return 'info';
}

function syncSelectedTask(preferredTaskId?: string) {
  const nextTaskId =
    preferredTaskId &&
    pendingItems.value.some((item) => item.id === preferredTaskId)
      ? preferredTaskId
      : pendingItems.value[0]?.id || '';
  selectedTaskId.value = nextTaskId;
}

function clearPendingData() {
  pendingItems.value = [];
  selectedRows.value = [];
  selectedTaskId.value = '';
  total.value = 0;
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    selectedRows.value = [];
    total.value = result.total;

    const deepLinkedTaskId = routeTaskId.value;
    syncSelectedTask(
      deepLinkedTaskId || selectedTaskId.value || result.items[0]?.id,
    );
    return result.items;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    return null;
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(rows: PendingTechnicalTaskItem[]) {
  selectedRows.value = rows;
  if (rows.length > 0) {
    selectedTaskId.value = rows.at(-1)?.id ?? selectedTaskId.value;
  }
}

function handleCurrentChange(task: null | PendingTechnicalTaskItem) {
  if (task?.id) {
    selectedTaskId.value = task.id;
  }
}

function isDehydrationTaskSelectable(task: PendingTechnicalTaskItem) {
  return task.taskStatus === 'PENDING' || task.taskStatus === 'IN_PROGRESS';
}

function resolveDehydrationRowTone(task: PendingTechnicalTaskItem) {
  if (task.timedOut) {
    return 'failed';
  }
  if (task.taskStatus === 'PENDING') {
    return 'actionable';
  }
  if (task.taskStatus === 'IN_PROGRESS') {
    return 'in-progress';
  }
  if (task.taskStatus === 'COMPLETED') {
    return 'completed';
  }
  return 'blocked';
}

function resolveDehydrationRowClassName({
  row,
}: {
  row: PendingTechnicalTaskItem;
}) {
  return `dehydration-workflow-row--${resolveDehydrationRowTone(row)}`;
}

function handleSearch() {
  filters.page = 1;
  if (!filters.pathologyNo.trim()) {
    clearPendingData();
    return;
  }
  void loadPendingData();
}

async function startSingleDehydrationTask(task: PendingTechnicalTaskItem) {
  if (task.taskStatus !== 'PENDING') {
    ElMessage.warning('仅待处理任务可以开始脱水');
    return;
  }

  startLoading.value = true;
  pageError.value = '';
  try {
    await startDehydration({ taskId: task.id });
    ElMessage.success(`任务 ${task.id} 已开始脱水`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
    ElMessage.warning('开始脱水失败，请重试');
  } finally {
    startLoading.value = false;
  }
}

async function handleScanEnter() {
  filters.page = 1;
  if (!filters.pathologyNo.trim()) {
    clearPendingData();
    return;
  }

  const loadedItems = await loadPendingData();
  if (!loadedItems) {
    return;
  }

  const currentTask =
    selectedTask.value ??
    loadedItems.find((item) => item.id === selectedTaskId.value) ??
    loadedItems[0];
  if (!currentTask) {
    ElMessage.warning('未查询到可开始脱水的蜡块任务');
    return;
  }

  await startSingleDehydrationTask(currentTask);
}

function toggleTimedOutOnly() {
  filters.timedOutOnly = !filters.timedOutOnly;
  filters.page = 1;
  void loadPendingData();
}

function ensureSelectedTask(actionLabel: string) {
  if (selectedTask.value) {
    return selectedTask.value;
  }
  ElMessage.warning(`请先选择需要${actionLabel}的蜡块任务`);
  return null;
}

function ensureActionTasks(actionLabel: string) {
  if (selectedRows.value.length > 0) {
    return selectedRows.value;
  }
  const task = ensureSelectedTask(actionLabel);
  return task ? [task] : null;
}

async function runDehydrationTaskAction(options: {
  actionLabel: string;
  batchSuccessMessage: string;
  invalidStatusMessage: string;
  loadingRef: Ref<boolean>;
  requiredStatus: PendingTechnicalTaskItem['taskStatus'];
  runAction: (taskId: string) => Promise<unknown>;
  singleSuccessMessage: (taskId: string) => string;
}) {
  const tasks = ensureActionTasks(options.actionLabel);
  if (!tasks) {
    return;
  }
  if (tasks.some((task) => task.taskStatus !== options.requiredStatus)) {
    ElMessage.warning(options.invalidStatusMessage);
    return;
  }

  options.loadingRef.value = true;
  pageError.value = '';
  try {
    const results = await Promise.allSettled(
      tasks.map((task) => options.runAction(task.id)),
    );
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const succeededCount = results.length - failedResults.length;

    if (failedResults.length === 0) {
      const firstTask = tasks[0];
      ElMessage.success(
        tasks.length === 1 && firstTask
          ? options.singleSuccessMessage(firstTask.id)
          : options.batchSuccessMessage,
      );
    } else {
      const firstFailure = failedResults[0];
      if (firstFailure) {
        pageError.value = getWorkflowPageErrorMessage(firstFailure.reason);
        reportInlineErrorDisabled(
          firstFailure.reason,
          getWorkflowPageErrorMessage,
        );
      }
      ElMessage.warning(
        succeededCount > 0
          ? `已成功${options.actionLabel} ${succeededCount} 条任务，${failedResults.length} 条失败`
          : `${options.actionLabel}失败，请重试`,
      );
    }
    await loadPendingData();
  } finally {
    options.loadingRef.value = false;
  }
}

function openTracking(task = selectedTask.value) {
  const nextTask = task ?? ensureSelectedTask('查看轨迹');
  if (!nextTask) {
    return;
  }
  void navigation.goToTracking({
    caseId: nextTask.caseId,
    objectId: nextTask.objectId ?? undefined,
    objectType: nextTask.objectType ?? undefined,
    pathologyNo: nextTask.pathologyNo ?? undefined,
    taskId: nextTask.id,
  });
}

function openCreateBatchDialog() {
  const tasks = createBatchTasks.value;
  if (tasks.length === 0) {
    ensureSelectedTask('创建脱水批次');
    return;
  }

  const caseIds = new Set(tasks.map((item) => item.caseId).filter(Boolean));
  if (caseIds.size > 1) {
    ElMessage.warning('创建脱水批次仅支持选择同一病例的蜡块任务');
    return;
  }

  createBatchDialogVisible.value = true;
}

function openBatchOperationDialog() {
  batchOperationDialogVisible.value = true;
}

function handleBatchCreated(result: { batchId: string }) {
  latestBatchId.value = result.batchId;
  batchOperationDialogVisible.value = true;
  void loadPendingData();
}

function handleBatchSubmitted(result: { batchId: string }) {
  latestBatchId.value = result.batchId;
  void loadPendingData();
}

async function handleStartDehydration() {
  await runDehydrationTaskAction({
    actionLabel: '开始脱水',
    batchSuccessMessage: `已开始脱水 ${selectedRows.value.length} 条任务`,
    invalidStatusMessage: '仅待处理任务可以开始脱水',
    loadingRef: startLoading,
    requiredStatus: 'PENDING',
    runAction: (taskId) => startDehydration({ taskId }),
    singleSuccessMessage: (taskId) => `任务 ${taskId} 已开始脱水`,
  });
}

async function handleCompleteDehydration() {
  await runDehydrationTaskAction({
    actionLabel: '完成脱水',
    batchSuccessMessage: `已完成脱水 ${selectedRows.value.length} 条任务`,
    invalidStatusMessage: '请先开始脱水',
    loadingRef: completeLoading,
    requiredStatus: 'IN_PROGRESS',
    runAction: (taskId) => completeDehydration({ taskId }),
    singleSuccessMessage: (taskId) => `任务 ${taskId} 已完成脱水`,
  });
}

if (shouldInitialLoad.value) {
  void loadPendingData();
}
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <section class="rounded-lg border border-border bg-card">
        <div class="flex flex-col gap-4 border-b border-border px-4 py-3">
          <div class="flex flex-wrap items-center gap-5 text-sm">
            <div
              v-for="item in stats"
              :key="item.label"
              class="flex items-baseline gap-1 text-foreground"
            >
              <span class="text-muted-foreground">{{ item.label }}</span>
              <span
                :class="{
                  'text-danger': item.tone === 'danger',
                  'text-primary': item.tone === 'info',
                  'text-success': item.tone === 'success',
                  'text-warning': item.tone === 'warning',
                }"
                class="text-3xl font-semibold leading-none"
              >
                {{ item.value }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <ElForm
              class="dehydration-toolbar-form shrink-0"
              inline
              size="small"
              @submit.prevent="handleSearch"
            >
              <ElFormItem class="mb-0" label="病理号">
                <ElInput
                  v-model="filters.pathologyNo"
                  class="w-48"
                  clearable
                  placeholder="请输入病理号"
                  @keydown.enter.prevent="handleScanEnter"
                />
              </ElFormItem>
              <ElFormItem class="mb-0">
                <ElButton native-type="submit" type="primary">查询</ElButton>
              </ElFormItem>
            </ElForm>

            <div class="flex flex-wrap items-center gap-2">
              <ElButton
                size="small"
                type="primary"
                @click="openCreateBatchDialog"
              >
                创建批次
              </ElButton>
              <ElButton size="small" @click="openBatchOperationDialog">
                批次操作
              </ElButton>
              <ElButton
                :loading="startLoading"
                size="small"
                @click="handleStartDehydration"
              >
                开始脱水
              </ElButton>
              <ElButton
                :loading="completeLoading"
                size="small"
                @click="handleCompleteDehydration"
              >
                脱水完成
              </ElButton>
              <ElButton size="small" @click="openTracking()">脱水追踪</ElButton>
            </div>

            <ElBadge
              :value="timedOutCount"
              :hidden="timedOutCount === 0"
              class="ml-auto"
            >
              <ElButton
                :type="filters.timedOutOnly ? 'danger' : 'default'"
                size="small"
                @click="toggleTimedOutOnly"
              >
                {{ filters.timedOutOnly ? '仅异常任务' : '异常任务' }}
              </ElButton>
            </ElBadge>
          </div>
        </div>

        <div class="px-4 pb-4 pt-4">
          <ElTable
            v-loading="loading"
            :data="pendingItems"
            :row-class-name="resolveDehydrationRowClassName"
            border
            current-row-key="id"
            highlight-current-row
            row-key="id"
            @current-change="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <ElTableColumn
              :selectable="isDehydrationTaskSelectable"
              type="selection"
              width="44"
            />
            <ElTableColumn label="序" width="60">
              <template #default="{ $index }">
                {{ (filters.page - 1) * filters.size + $index + 1 }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="病理号" min-width="140">
              <template #default="{ row }">
                {{ row.pathologyNo || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="蜡块号" min-width="120">
              <template #default="{ row }">
                {{ row.samplingBlockCode || row.objectId || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="蜡块名称" min-width="180">
              <template #default="{ row }">
                {{ row.samplingBlockDescription || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="备注" min-width="180">
              <template #default="{ row }">
                {{ getDehydrationTaskRemark(row) || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="取材操作" min-width="120">
              <template #default="{ row }">
                {{ row.sampledByName || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="取材时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.sampledAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作人" min-width="120">
              <template #default="{ row }">
                {{ getDehydrationTaskOperator(row) || '-' }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="脱水开始时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.startedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="脱水完成时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.completedAt) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="110">
              <template #default="{ row }">
                <ElTag :type="getStatusTagType(row)">
                  {{ formatTaskStatus(row.taskStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
          </ElTable>

          <div class="mt-4 flex justify-end">
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next"
              @change="loadPendingData"
            />
          </div>
        </div>
      </section>
    </div>

    <DehydrationCreateBatchDialog
      v-model="createBatchDialogVisible"
      :task="selectedTask"
      :tasks="createBatchTasks"
      @created="handleBatchCreated"
    />
    <DehydrationBatchOperationDialog
      v-model="batchOperationDialogVisible"
      :initial-batch-id="latestBatchId"
      @submitted="handleBatchSubmitted"
    />
  </Page>
</template>

<style scoped>
.dehydration-toolbar-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.dehydration-toolbar-form :deep(.el-form-item__content) {
  align-items: center;
}

:deep(.dehydration-workflow-row--actionable > td) {
  background: hsl(var(--primary) / 8%) !important;
}

:deep(.dehydration-workflow-row--in-progress > td) {
  background: hsl(var(--warning) / 10%) !important;
}

:deep(.dehydration-workflow-row--completed > td) {
  background: hsl(var(--success) / 12%) !important;
}

:deep(.dehydration-workflow-row--blocked > td) {
  background: hsl(var(--muted) / 70%) !important;
}

:deep(.dehydration-workflow-row--failed > td) {
  background: hsl(var(--destructive) / 12%) !important;
}

:deep(.dehydration-workflow-row--actionable > td:first-child) {
  box-shadow: inset 3px 0 0 hsl(var(--primary));
}

:deep(.dehydration-workflow-row--in-progress > td:first-child) {
  box-shadow: inset 3px 0 0 hsl(var(--warning));
}

:deep(.dehydration-workflow-row--completed > td:first-child) {
  box-shadow: inset 3px 0 0 hsl(var(--success));
}

:deep(.dehydration-workflow-row--blocked > td:first-child) {
  box-shadow: inset 3px 0 0 hsl(var(--border));
}

:deep(.dehydration-workflow-row--failed > td:first-child) {
  box-shadow: inset 3px 0 0 hsl(var(--destructive));
}
</style>
