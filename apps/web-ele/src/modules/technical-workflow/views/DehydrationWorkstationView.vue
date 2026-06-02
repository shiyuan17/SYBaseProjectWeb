<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
} from '../types/technical-workflow';

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

import {
  completeDehydration,
  listPendingTechnicalTasks,
  startDehydration,
} from '../api/technical-workflow-service';
import { DEFAULT_PAGE_SIZE } from '../constants';
import {
  buildDehydrationWorkbenchStats,
  getDehydrationTaskOperator,
  getDehydrationTaskRemark,
} from '../utils/dehydration-workbench';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

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

const filters = reactive({
  page: 1,
  pathologyNo:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  size: DEFAULT_PAGE_SIZE,
  timedOutOnly: route.query.mode === 'exception',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskType: 'DEHYDRATION',
  timedOutOnly: filters.timedOutOnly,
}));

const selectedTask = computed(
  () =>
    pendingItems.value.find((item) => item.id === selectedTaskId.value) ?? null,
);
const stats = computed(() => buildDehydrationWorkbenchStats(pendingItems.value));
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
    preferredTaskId && pendingItems.value.some((item) => item.id === preferredTaskId)
      ? preferredTaskId
      : pendingItems.value[0]?.id || '';
  selectedTaskId.value = nextTaskId;
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;

    const deepLinkedTaskId =
      typeof route.query.taskId === 'string' ? route.query.taskId : '';
    syncSelectedTask(deepLinkedTaskId || selectedTaskId.value || result.items[0]?.id);
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    loading.value = false;
  }
}

function handleSelectionChange(rows: PendingTechnicalTaskItem[]) {
  if (rows.length > 0) {
    selectedTaskId.value = rows.at(-1)?.id ?? selectedTaskId.value;
  }
}

function handleCurrentChange(task: null | PendingTechnicalTaskItem) {
  if (task?.id) {
    selectedTaskId.value = task.id;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData();
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

async function handleStartDehydration() {
  const task = ensureSelectedTask('开始脱水');
  if (!task) {
    return;
  }
  if (task.taskStatus !== 'PENDING') {
    ElMessage.warning('仅待处理任务可以开始脱水');
    return;
  }

  startLoading.value = true;
  pageError.value = '';
  try {
    await startDehydration({
      taskId: task.id,
    });
    ElMessage.success(`任务 ${task.id} 已开始脱水`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    startLoading.value = false;
  }
}

async function handleCompleteDehydration() {
  const task = ensureSelectedTask('完成脱水');
  if (!task) {
    return;
  }
  if (task.taskStatus !== 'IN_PROGRESS') {
    ElMessage.warning('请先开始脱水');
    return;
  }

  completeLoading.value = true;
  pageError.value = '';
  try {
    await completeDehydration({
      taskId: task.id,
    });
    ElMessage.success(`任务 ${task.id} 已完成脱水`);
    await loadPendingData();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    completeLoading.value = false;
  }
}

void loadPendingData();
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">

      <section class="rounded-lg border border-border bg-card">
        <div class="flex flex-col gap-3 border-b border-border px-4 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <ElButton
              :loading="startLoading"
              size="small"
              type="primary"
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

            <div class="ml-auto">
              <ElForm inline size="small" @submit.prevent="handleSearch">
                <ElFormItem class="mb-0" label="病理号">
                  <ElInput
                    v-model="filters.pathologyNo"
                    class="w-48"
                    clearable
                    placeholder="请输入病理号"
                    @keyup.enter="handleSearch"
                  />
                </ElFormItem>
                <ElFormItem class="mb-0">
                  <ElButton native-type="submit" type="primary">查询</ElButton>
                </ElFormItem>
                <ElFormItem class="mb-0">
                  <ElBadge :value="timedOutCount" :hidden="timedOutCount === 0">
                    <ElButton
                      :type="filters.timedOutOnly ? 'danger' : 'default'"
                      @click="toggleTimedOutOnly"
                    >
                      {{ filters.timedOutOnly ? '仅异常任务' : '异常任务' }}
                    </ElButton>
                  </ElBadge>
                </ElFormItem>
              </ElForm>
            </div>
          </div>

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
        </div>

        <div class="px-4 pb-4 pt-4">
          <ElTable
            v-loading="loading"
            :data="pendingItems"
            border
            current-row-key="id"
            highlight-current-row
            row-key="id"
            @current-change="handleCurrentChange"
            @selection-change="handleSelectionChange"
          >
            <ElTableColumn type="selection" width="44" />
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
  </Page>
</template>
