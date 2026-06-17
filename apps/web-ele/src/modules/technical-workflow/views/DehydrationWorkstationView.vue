<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { resolveSpecimenWorkflowRowClassName } from '#/modules/specimen-workflow/utils/specimen-workflow-row-tone';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  completeDehydration,
  listPendingTechnicalTasks,
  startDehydration,
} from '../api/technical-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import {
  buildCreatedDateRangeParams,
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
  resolveRouteDateRange,
} from '../utils/date-range';
import {
  buildDehydrationWorkbenchStats,
  getDehydrationTaskOperator,
  getDehydrationTaskRemark,
} from '../utils/dehydration-workbench';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatTaskStatus } from '../utils/format';

import '#/modules/specimen-workflow/styles/specimen-workflow-row-tone.css';

const route = useRoute();
const dateRangeShortcuts = createDateRangePickerShortcuts();

const pageError = ref('');
const loading = ref(false);
const startLoading = ref(false);
const completeLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const selectedTaskId = ref('');
const selectedRows = ref<PendingTechnicalTaskItem[]>([]);

const filters = reactive({
  dateRange: resolveRouteDateRange(route.query),
  page: 1,
  pathologyNo:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  size: DEFAULT_PAGE_SIZE,
});

const routeTaskId = computed(() =>
  typeof route.query.taskId === 'string' ? route.query.taskId : '',
);
const shouldInitialLoad = computed(
  () =>
    filters.dateRange.length === 2 ||
    Boolean(filters.pathologyNo.trim()) ||
    Boolean(routeTaskId.value),
);
const currentQuery = computed(() => ({
  ...buildCreatedDateRangeParams(filters.dateRange),
  includeAllStatuses: true,
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskId: routeTaskId.value || undefined,
  taskType: 'DEHYDRATION',
}));

const selectedTask = computed(
  () =>
    pendingItems.value.find((item) => item.id === selectedTaskId.value) ?? null,
);
const stats = computed(() =>
  buildDehydrationWorkbenchStats(pendingItems.value),
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
  return resolveSpecimenWorkflowRowClassName(resolveDehydrationRowTone(row));
}

function handleSearch() {
  filters.page = 1;
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

function showDehydrationActionFeedback(options: {
  actionLabel: string;
  failedCount: number;
  noActionMessage: string;
  singleSuccessMessage: (taskId: string) => string;
  skippedCount: number;
  succeededCount: number;
  tasks: PendingTechnicalTaskItem[];
}) {
  if (options.succeededCount === 0) {
    ElMessage.warning(
      options.failedCount > 0
        ? `${options.actionLabel}失败，请重试`
        : options.noActionMessage,
    );
    return;
  }

  if (
    options.tasks.length === 1 &&
    options.failedCount === 0 &&
    options.skippedCount === 0
  ) {
    const firstTask = options.tasks[0];
    if (firstTask) {
      ElMessage.success(options.singleSuccessMessage(firstTask.id));
      return;
    }
  }

  const summaryParts = [
    `已${options.actionLabel} ${options.succeededCount} 条任务`,
  ];
  if (options.skippedCount > 0) {
    summaryParts.push(`跳过 ${options.skippedCount} 条`);
  }
  if (options.failedCount > 0) {
    summaryParts.push(`${options.failedCount} 条失败`);
  }

  const message = summaryParts.join('，');
  if (options.failedCount > 0) {
    ElMessage.warning(message);
    return;
  }
  ElMessage.success(message);
}

async function runDehydrationTaskAction(options: {
  actionLabel: string;
  loadingRef: typeof startLoading;
  noActionMessage: string;
  runTask: (task: PendingTechnicalTaskItem) => Promise<unknown>;
  shouldRunTask: (task: PendingTechnicalTaskItem) => boolean;
  singleSuccessMessage: (taskId: string) => string;
}) {
  const tasks = ensureActionTasks(options.actionLabel);
  if (!tasks) {
    return;
  }

  const actionableTasks = tasks.filter((task) => options.shouldRunTask(task));
  const skippedCount = tasks.length - actionableTasks.length;
  if (actionableTasks.length === 0) {
    ElMessage.warning(options.noActionMessage);
    return;
  }

  options.loadingRef.value = true;
  pageError.value = '';
  try {
    const results = await Promise.allSettled(
      actionableTasks.map((task) => options.runTask(task)),
    );
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const succeededCount = results.length - failedResults.length;

    if (failedResults.length > 0) {
      const firstFailure = failedResults[0];
      if (firstFailure) {
        pageError.value = getWorkflowPageErrorMessage(firstFailure.reason);
        reportInlineErrorDisabled(
          firstFailure.reason,
          getWorkflowPageErrorMessage,
        );
      }
    }
    showDehydrationActionFeedback({
      actionLabel: options.actionLabel,
      failedCount: failedResults.length,
      noActionMessage: options.noActionMessage,
      singleSuccessMessage: options.singleSuccessMessage,
      skippedCount,
      succeededCount,
      tasks,
    });
    await loadPendingData();
  } finally {
    options.loadingRef.value = false;
  }
}

async function handleStartDehydration() {
  await runDehydrationTaskAction({
    actionLabel: '开始脱水',
    loadingRef: startLoading,
    noActionMessage: '没有可开始脱水的任务',
    runTask: (task) => startDehydration({ taskId: task.id }),
    shouldRunTask: (task) => task.taskStatus === 'PENDING',
    singleSuccessMessage: (taskId) => `任务 ${taskId} 已开始脱水`,
  });
}

async function handleCompleteDehydration() {
  await runDehydrationTaskAction({
    actionLabel: '完成脱水',
    loadingRef: completeLoading,
    noActionMessage: '没有可完成脱水的任务',
    runTask: async (task) => {
      if (task.taskStatus === 'PENDING') {
        await startDehydration({ taskId: task.id });
      }
      await completeDehydration({ taskId: task.id });
    },
    shouldRunTask: (task) =>
      task.taskStatus === 'PENDING' || task.taskStatus === 'IN_PROGRESS',
    singleSuccessMessage: (taskId) => `任务 ${taskId} 已完成脱水`,
  });
}

if (shouldInitialLoad.value) {
  void loadPendingData();
}
</script>

<template>
  <Page :show-header="false">
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
              <ElFormItem class="mb-0" label="工作日期">
                <ElDatePicker
                  v-model="filters.dateRange"
                  :default-value="createDatePickerPanelDefaultValue()"
                  :disabled-date="disableFutureDate"
                  :shortcuts="dateRangeShortcuts"
                  class="w-[260px]"
                  end-placeholder="结束日期"
                  range-separator="至"
                  start-placeholder="开始日期"
                  type="daterange"
                  unlink-panels
                  value-format="YYYY-MM-DD"
                />
              </ElFormItem>
              <ElFormItem class="mb-0">
                <ElButton native-type="submit" type="primary">查询</ElButton>
              </ElFormItem>
            </ElForm>

            <div class="flex flex-wrap items-center gap-2">
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
            </div>
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
            <ElTableColumn fixed="right" label="状态" width="110">
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
  </Page>
</template>

<style scoped>
.dehydration-toolbar-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.dehydration-toolbar-form :deep(.el-form-item__content) {
  align-items: center;
}
</style>
