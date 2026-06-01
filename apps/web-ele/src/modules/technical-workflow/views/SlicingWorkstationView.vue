<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  SlicingWorkbenchRow,
  SlicingWorkbenchView,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';
import type { TrackingTab } from '../utils/tracking';

import { computed, nextTick, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDrawer,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from 'element-plus';

import {
  getSlicingWorkbench,
  getTechnicalTracking,
  startSlicing,
} from '../api/technical-workflow-service';
import SlicingProcessDialog from '../components/SlicingProcessDialog.vue';
import SlicingQcEvaluationDialog from '../components/SlicingQcEvaluationDialog.vue';
import TechnicalTaskStartDialog from '../components/TechnicalTaskStartDialog.vue';
import TechnicalTrackingDetailsSection from '../components/TechnicalTrackingDetailsSection.vue';
import TechnicalTrackingSummaryTables from '../components/TechnicalTrackingSummaryTables.vue';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  buildTrackingTreeData,
  buildWorkflowTimelineSteps,
  filterTrackingQcEvaluations,
  filterTrackingReworks,
  filterTrackingTasks,
  resolveSelectedTrackingNodeId,
} from '../utils/tracking';
import {
  formatDateTime,
  formatEventStatus,
  formatNullable,
  formatTaskStatus,
} from '../utils/format';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { buildWorkstationCaseContext } from '../utils/workstation';

interface SelectableTableInstance {
  clearSelection: () => void;
  toggleRowSelection: (
    row: SlicingWorkbenchRow,
    selected?: boolean,
    ignoreSelectable?: boolean,
  ) => void;
}

const EMPTY_WORKBENCH: SlicingWorkbenchView = {
  completedPage: 1,
  completedSize: 20,
  completedTodayList: [],
  completedTotal: 0,
  pendingList: [],
  pendingPage: 1,
  pendingSize: 20,
  pendingTotal: 0,
  stats: {
    completedDeptTodayCount: 0,
    completedMineTodayCount: 0,
    overdueCount: 0,
    pendingPrintCount: 0,
    pendingTodayCount: 0,
    pendingTomorrowCount: 0,
  },
};

const LEGACY_PLACEHOLDER_ACTIONS = [
  '重打玻片',
  '重新分片',
  '重补台片',
  '终止',
  '手术预约',
  '确认清零',
] as const;

const pageError = ref('');
const loading = ref(false);

const workbench = ref<SlicingWorkbenchView>(EMPTY_WORKBENCH);
const filters = reactive({
  completedPage: 1,
  completedSize: 20,
  keyword: '',
  overdueOnly: false,
  pendingPage: 1,
  pendingSize: 20,
  pendingTodayOnly: false,
});

const pendingTableRef = ref<null | SelectableTableInstance>(null);
const completedTableRef = ref<null | SelectableTableInstance>(null);
const selectedPendingRows = ref<SlicingWorkbenchRow[]>([]);
const selectedCompletedRows = ref<SlicingWorkbenchRow[]>([]);

const startDialogVisible = ref(false);
const processDialogVisible = ref(false);
const qcDialogVisible = ref(false);
const pendingAutoProcessTaskId = ref('');

const trackingDrawerVisible = ref(false);
const trackingDrawerLoading = ref(false);
const trackingDrawerTitle = ref('切片历史');
const trackingDrawerMode = ref<'evaluation' | 'history'>('history');
const trackingDrawerResult = ref<null | TechnicalTrackingViewModel>(null);
const trackingDrawerActiveTab = ref<TrackingTab>('timeline');
const trackingDrawerSelectedNodeId = ref('');
const trackingDrawerSourceRow = ref<null | SlicingWorkbenchRow>(null);

const selectedPendingRow = computed(() =>
  selectedPendingRows.value.length === 1
    ? (selectedPendingRows.value[0] ?? null)
    : null,
);
const selectedCompletedRow = computed(() =>
  selectedCompletedRows.value.length === 1
    ? (selectedCompletedRows.value[0] ?? null)
    : null,
);
const selectedWorkbenchRowCount = computed(
  () => selectedPendingRows.value.length + selectedCompletedRows.value.length,
);
const selectedWorkbenchRow = computed(() => {
  if (selectedWorkbenchRowCount.value !== 1) {
    return null;
  }
  return selectedPendingRow.value ?? selectedCompletedRow.value;
});

const currentPendingTask = computed<null | PendingTechnicalTaskItem>(() => {
  const row = selectedPendingRow.value;
  if (!row) {
    return null;
  }
  return {
    applicationId: row.caseId,
    applicationNo: row.pathologyNo ?? '',
    assignedToName: null,
    assignedToUserId: null,
    caseId: row.caseId,
    completedAt: null,
    createdAt: null,
    currentNode: 'SLICING',
    deadlineAt: null,
    expectedCompletedAt: null,
    id: row.taskId,
    objectId: row.embeddingBoxId,
    objectType: 'EMBEDDING_BOX',
    pathologyNo: row.pathologyNo ?? null,
    payload: null,
    priority: null,
    productionRemarks: row.shiftRemark ?? null,
    receivedAt: null,
    remarks: row.sliceNotice ?? row.slicingRemark ?? null,
    sampledAt: null,
    sampledByName: null,
    samplingBlockCode: null,
    samplingBlockDescription: null,
    specimenId: row.specimenId ?? null,
    startedAt: null,
    stationCode: null,
    stationName: null,
    taskStatus: row.taskStatus ?? null,
    taskType: 'SLICING',
    timedOut: row.timedOut,
    timeoutRuleCode: null,
  };
});

const canCompleteSlicing = computed(() => {
  const row = selectedPendingRow.value;
  return Boolean(
    row &&
      row.selectable &&
      ['IN_PROGRESS', 'PENDING'].includes(row.taskStatus ?? ''),
  );
});
const canOpenTrackingDrawer = computed(
  () => selectedWorkbenchRowCount.value === 1,
);
const canCreateQcEvaluation = computed(() => {
  const row = selectedCompletedRow.value;
  return Boolean(row && row.selectable && row.slideId);
});

const statCards = computed(() => [
  {
    accent: 'sky',
    label: '今日待切',
    value: workbench.value.stats.pendingTodayCount,
  },
  {
    accent: 'cyan',
    label: '明日待切',
    value: workbench.value.stats.pendingTomorrowCount,
  },
  {
    accent: 'emerald',
    label: '今日我已切',
    value: workbench.value.stats.completedMineTodayCount,
  },
  {
    accent: 'teal',
    label: '今日全科已切',
    value: workbench.value.stats.completedDeptTodayCount,
  },
  {
    accent: filters.overdueOnly ? 'rose' : 'amber',
    label: '过期任务',
    value: workbench.value.stats.overdueCount,
  },
  {
    accent: 'slate',
    label: '待打印玻片',
    value: workbench.value.stats.pendingPrintCount,
  },
]);

const trackingDrawerContext = computed(() =>
  trackingDrawerResult.value
    ? buildWorkstationCaseContext(trackingDrawerResult.value)
    : null,
);
const trackingDrawerTreeData = computed(() =>
  buildTrackingTreeData(trackingDrawerContext.value),
);
const trackingDrawerSelectedNode = computed(() => {
  if (!trackingDrawerContext.value || !trackingDrawerSelectedNodeId.value) {
    return null;
  }
  return (
    trackingDrawerContext.value.progressNodes.find(
      (item) => item.id === trackingDrawerSelectedNodeId.value,
    ) ?? null
  );
});
const trackingDrawerFilteredTasks = computed(() =>
  filterTrackingTasks(
    trackingDrawerResult.value,
    trackingDrawerSelectedNode.value,
  ),
);
const trackingDrawerFilteredReworks = computed(() =>
  filterTrackingReworks(
    trackingDrawerResult.value,
    trackingDrawerSelectedNode.value,
  ),
);
const trackingDrawerFilteredQcEvaluations = computed(() =>
  filterTrackingQcEvaluations(
    trackingDrawerResult.value,
    trackingDrawerSelectedNode.value,
  ),
);
const trackingDrawerTimelineSteps = computed(() =>
  buildWorkflowTimelineSteps(
    trackingDrawerResult.value,
    trackingDrawerContext.value,
    formatDateTime,
    formatEventStatus,
    formatNullable,
    formatTaskStatus,
  ),
);

function selectableWorkbenchRow(row: SlicingWorkbenchRow) {
  return row.selectable;
}

function pendingRowKey(row: SlicingWorkbenchRow) {
  return row.taskId;
}

function completedRowKey(row: SlicingWorkbenchRow) {
  return `${row.taskId}:${row.slideId ?? row.embeddingBoxId ?? row.caseId}`;
}

function getPendingRemark(row: SlicingWorkbenchRow) {
  return row.slicingRemark ?? row.sliceNotice ?? null;
}

function getTrackingObjectId(row: SlicingWorkbenchRow) {
  return row.slideId || row.embeddingBoxId || row.specimenId || row.caseId;
}

function clearAllSelections() {
  pendingTableRef.value?.clearSelection();
  completedTableRef.value?.clearSelection();
  selectedPendingRows.value = [];
  selectedCompletedRows.value = [];
}

function showSingleSelectionWarning(message: string) {
  ElMessage.warning(message);
}

function requireSelectedPendingRow() {
  if (selectedPendingRows.value.length !== 1) {
    showSingleSelectionWarning('请在待切列表中恰好勾选 1 行');
    return null;
  }
  return selectedPendingRows.value[0];
}

function requireSelectedCompletedRow() {
  if (selectedCompletedRows.value.length !== 1) {
    showSingleSelectionWarning('请在今日已完成列表中恰好勾选 1 行');
    return null;
  }
  return selectedCompletedRows.value[0];
}

function requireSelectedWorkbenchRow() {
  if (selectedWorkbenchRowCount.value !== 1 || !selectedWorkbenchRow.value) {
    showSingleSelectionWarning('请在左右列表中恰好勾选 1 行');
    return null;
  }
  return selectedWorkbenchRow.value;
}

async function loadWorkbench(options?: {
  openProcess?: boolean;
  reopenPendingTaskId?: string;
}) {
  loading.value = true;
  pageError.value = '';
  try {
    workbench.value = await getSlicingWorkbench({
      completedPage: filters.completedPage,
      completedSize: filters.completedSize,
      keyword: filters.keyword.trim() || undefined,
      overdueOnly: filters.overdueOnly,
      pendingPage: filters.pendingPage,
      pendingSize: filters.pendingSize,
      pendingTodayOnly: filters.pendingTodayOnly,
    });

    clearAllSelections();

    if (options?.reopenPendingTaskId) {
      await nextTick();
      const matchedRow = workbench.value.pendingList.find(
        (item) => item.taskId === options.reopenPendingTaskId,
      );
      if (matchedRow) {
        pendingTableRef.value?.toggleRowSelection(matchedRow, true);
        if (options.openProcess && matchedRow.taskStatus === 'IN_PROGRESS') {
          processDialogVisible.value = true;
        }
      }
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    loading.value = false;
  }
}

async function handleQuery() {
  filters.pendingPage = 1;
  filters.completedPage = 1;
  await loadWorkbench();
}

async function toggleOverdueOnly() {
  filters.overdueOnly = !filters.overdueOnly;
  filters.pendingPage = 1;
  await loadWorkbench();
}

async function handlePendingTodayOnlyChange() {
  filters.pendingPage = 1;
  await loadWorkbench();
}

async function handlePendingPaginationChange() {
  await loadWorkbench();
}

async function handleCompletedPaginationChange() {
  await loadWorkbench();
}

function handlePendingSelectionChange(rows: SlicingWorkbenchRow[]) {
  if (rows.length > 0 && selectedCompletedRows.value.length > 0) {
    completedTableRef.value?.clearSelection();
    selectedCompletedRows.value = [];
  }
  selectedPendingRows.value = rows;
}

function handleCompletedSelectionChange(rows: SlicingWorkbenchRow[]) {
  if (rows.length > 0 && selectedPendingRows.value.length > 0) {
    pendingTableRef.value?.clearSelection();
    selectedPendingRows.value = [];
  }
  selectedCompletedRows.value = rows;
}

function openCompleteSlicing() {
  const row = requireSelectedPendingRow();
  if (!row) {
    return;
  }
  if (row.taskStatus === 'PENDING') {
    pendingAutoProcessTaskId.value = row.taskId;
    startDialogVisible.value = true;
    return;
  }
  if (row.taskStatus === 'IN_PROGRESS') {
    processDialogVisible.value = true;
    return;
  }
  ElMessage.warning('当前任务状态不支持完成切片');
}

async function handleStartSubmitted() {
  startDialogVisible.value = false;
  const pendingTaskId = pendingAutoProcessTaskId.value;
  pendingAutoProcessTaskId.value = '';
  await loadWorkbench(
    pendingTaskId
      ? { openProcess: true, reopenPendingTaskId: pendingTaskId }
      : undefined,
  );
}

async function handleProcessSubmitted() {
  processDialogVisible.value = false;
  await loadWorkbench();
}

async function loadTrackingDrawerForRow(
  row: SlicingWorkbenchRow,
  mode: 'evaluation' | 'history',
) {
  trackingDrawerTitle.value = mode === 'history' ? '切片历史' : '评价记录';
  trackingDrawerMode.value = mode;
  trackingDrawerVisible.value = true;
  trackingDrawerLoading.value = true;
  trackingDrawerSourceRow.value = row;

  try {
    const trackingResult = await getTechnicalTracking(row.caseId);
    trackingDrawerResult.value = trackingResult;
    trackingDrawerActiveTab.value = mode === 'history' ? 'timeline' : 'abnormal';
    trackingDrawerSelectedNodeId.value = resolveSelectedTrackingNodeId(
      {
        objectId: getTrackingObjectId(row),
      },
      trackingDrawerActiveTab.value,
      trackingResult,
    );
  } catch (error) {
    trackingDrawerResult.value = null;
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    trackingDrawerLoading.value = false;
  }
}

async function openTrackingDrawer(mode: 'evaluation' | 'history') {
  const row = requireSelectedWorkbenchRow();
  if (!row) {
    return;
  }
  await loadTrackingDrawerForRow(row, mode);
}

function openQcEvaluation() {
  const row = requireSelectedCompletedRow();
  if (!row || !row.slideId) {
    return;
  }
  qcDialogVisible.value = true;
}

function handleTrackingNodeClick(data: { id: string }) {
  trackingDrawerSelectedNodeId.value = data.id;
}

async function refreshTrackingDrawer() {
  if (!trackingDrawerVisible.value || !trackingDrawerSourceRow.value) {
    return;
  }
  await loadTrackingDrawerForRow(
    trackingDrawerSourceRow.value,
    trackingDrawerMode.value,
  );
}

async function handleQcSubmitted() {
  qcDialogVisible.value = false;
  await loadWorkbench();
  await refreshTrackingDrawer();
}

function pendingRowClassName({
  row,
}: {
  row: SlicingWorkbenchRow;
}) {
  return row.timedOut ? 'is-overdue-row' : '';
}

void loadWorkbench();
</script>

<template>
  <Page
    title="切片工作站"
    description="参照旧站结构重排为顶部统计查询、左右双表和上下工具栏，保留本轮已打通的核心切片能力。"
  >
    <div class="legacy-slicing-workbench flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
      />

      <section class="legacy-header">
        <div class="legacy-stats-grid">
          <article
            v-for="card in statCards"
            :key="card.label"
            class="legacy-stat-card"
            :data-accent="card.accent"
          >
            <div class="legacy-stat-card__label">{{ card.label }}</div>
            <div class="legacy-stat-card__value">{{ card.value }}</div>
          </article>
        </div>

        <div class="legacy-query-bar">
          <div class="legacy-query-bar__search">
            <span class="legacy-query-bar__label">检索</span>
            <ElInput
              v-model="filters.keyword"
              clearable
              placeholder="请输入病人ID或病理号"
              @keyup.enter="handleQuery"
            />
          </div>
          <div class="legacy-query-bar__actions">
            <ElButton :loading="loading" type="primary" @click="handleQuery">
              查询
            </ElButton>
            <ElButton
              :disabled="!canOpenTrackingDrawer"
              @click="openTrackingDrawer('history')"
            >
              切片历史
            </ElButton>
            <ElButton
              :disabled="!canOpenTrackingDrawer"
              @click="openTrackingDrawer('evaluation')"
            >
              评价记录
            </ElButton>
            <ElButton
              :plain="!filters.overdueOnly"
              :type="filters.overdueOnly ? 'danger' : 'default'"
              @click="toggleOverdueOnly"
            >
              {{ filters.overdueOnly ? '查看全部' : '过期任务' }}
            </ElButton>
          </div>
        </div>
      </section>

      <section class="legacy-action-bar">
        <div class="legacy-action-bar__left">
          <ElButton
            :disabled="!canCompleteSlicing"
            type="primary"
            @click="openCompleteSlicing"
          >
            完成切片
          </ElButton>
          <ElButton
            :disabled="!canCreateQcEvaluation"
            type="success"
            @click="openQcEvaluation"
          >
            质控评价
          </ElButton>
          <ElTooltip
            v-for="label in LEGACY_PLACEHOLDER_ACTIONS"
            :key="label"
            content="待补后端能力"
            placement="top"
          >
            <ElButton disabled>{{ label }}</ElButton>
          </ElTooltip>
        </div>

        <div class="legacy-action-bar__right">
          <ElCheckbox
            v-model="filters.pendingTodayOnly"
            @change="handlePendingTodayOnlyChange"
          >
            只看今天待切
          </ElCheckbox>
          <span class="legacy-selection-tip">
            可用操作要求恰好选中 1 行
          </span>
        </div>
      </section>

      <section class="legacy-panels">
        <article class="legacy-panel">
          <header class="legacy-panel__header">
            <div>
              <h3 class="legacy-panel__title">待切列表</h3>
              <p class="legacy-panel__subtitle">
                优先承接今天待切与过期任务，完成切片后右侧列表会立即刷新。
              </p>
            </div>
          </header>

          <ElTable
            ref="pendingTableRef"
            v-loading="loading"
            border
            :data="workbench.pendingList"
            :row-class-name="pendingRowClassName"
            :row-key="pendingRowKey"
            table-layout="fixed"
            @selection-change="handlePendingSelectionChange"
          >
            <ElTableColumn
              type="selection"
              width="46"
              :selectable="selectableWorkbenchRow"
            />
            <ElTableColumn label="病人" min-width="120">
              <template #default="{ row }">
                <div class="font-medium text-foreground">
                  {{ formatNullable(row.patientName) }}
                </div>
                <div class="mt-1 flex flex-wrap gap-2">
                  <ElTag v-if="row.timedOut" size="small" type="danger">
                    过期
                  </ElTag>
                  <ElTag size="small" type="info">
                    {{ formatTaskStatus(row.taskStatus) }}
                  </ElTag>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="病理号" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.pathologyNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="玻片号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.slideNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="取材评价" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.grossingEvaluation) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="切片备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(getPendingRemark(row)) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋清零备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingClearRemark) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="主班备注" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.shiftRemark) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋评价" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingEvaluation) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋操作" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingOperatorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="所属标本" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.specimenName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="病人ID" min-width="160">
              <template #default="{ row }">
                {{ formatNullable(row.patientId) }}
              </template>
            </ElTableColumn>
          </ElTable>

          <div class="legacy-panel__footer">
            <ElPagination
              v-model:current-page="filters.pendingPage"
              v-model:page-size="filters.pendingSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="workbench.pendingTotal"
              background
              layout="total, sizes, prev, pager, next"
              @change="handlePendingPaginationChange"
            />
          </div>
        </article>

        <article class="legacy-panel">
          <header class="legacy-panel__header legacy-panel__header--right">
            <div>
              <h3 class="legacy-panel__title">今日已完成</h3>
              <p class="legacy-panel__subtitle">
                用于补录质控评价、查看异常记录，本轮取消完成仅保留占位。
              </p>
            </div>
            <ElTooltip content="待补后端能力" placement="top">
              <ElButton disabled>取消完成</ElButton>
            </ElTooltip>
          </header>

          <ElTable
            ref="completedTableRef"
            v-loading="loading"
            border
            :data="workbench.completedTodayList"
            :row-key="completedRowKey"
            table-layout="fixed"
            @selection-change="handleCompletedSelectionChange"
          >
            <ElTableColumn
              type="selection"
              width="46"
              :selectable="selectableWorkbenchRow"
            />
            <ElTableColumn label="病人" min-width="120">
              <template #default="{ row }">
                <div class="font-medium text-foreground">
                  {{ formatNullable(row.patientName) }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ formatDateTime(row.completedAt) }}
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="病人ID" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.patientId) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="病理号" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.pathologyNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="玻片号" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.slideNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="切片操作" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.slicingOperatorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="切片备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.slicingRemark) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋清零备注" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingClearRemark) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋操作" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingOperatorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋评价" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.embeddingEvaluation) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="所属标本" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.specimenName) }}
              </template>
            </ElTableColumn>
          </ElTable>

          <div class="legacy-panel__footer">
            <ElPagination
              v-model:current-page="filters.completedPage"
              v-model:page-size="filters.completedSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="workbench.completedTotal"
              background
              layout="total, sizes, prev, pager, next"
              @change="handleCompletedPaginationChange"
            />
          </div>
        </article>
      </section>
    </div>

    <TechnicalTaskStartDialog
      v-model="startDialogVisible"
      confirm-text="开始切片"
      remarks-placeholder="必要时补充开始说明"
      :submit-action="(taskId, payload) => startSlicing({ ...payload, taskId })"
      :success-message="(task) => `任务 ${task.id} 已开始切片`"
      :task="currentPendingTask"
      terminal-placeholder="切片终端编码"
      title="开始切片"
      @submitted="handleStartSubmitted"
    />

    <SlicingProcessDialog
      v-model="processDialogVisible"
      :task="currentPendingTask"
      @submitted="handleProcessSubmitted"
    />

    <SlicingQcEvaluationDialog
      v-model="qcDialogVisible"
      :row="selectedCompletedRow"
      @submitted="handleQcSubmitted"
    />

    <ElDrawer
      v-model="trackingDrawerVisible"
      :close-on-click-modal="false"
      :title="trackingDrawerTitle"
      size="88%"
    >
      <div v-loading="trackingDrawerLoading" class="flex flex-col gap-4 pb-4">
        <template v-if="trackingDrawerResult && trackingDrawerContext">
          <TechnicalTrackingDetailsSection
            v-model:active-tab="trackingDrawerActiveTab"
            :context="trackingDrawerContext"
            :filtered-qc-evaluations="trackingDrawerFilteredQcEvaluations"
            :filtered-reworks="trackingDrawerFilteredReworks"
            :filtered-tasks="trackingDrawerFilteredTasks"
            :selected-node="trackingDrawerSelectedNode"
            :selected-node-id="trackingDrawerSelectedNodeId"
            :tracking-result="trackingDrawerResult"
            :tree-data="trackingDrawerTreeData"
            :workflow-timeline-steps="trackingDrawerTimelineSteps"
            @node-click="handleTrackingNodeClick"
          />
          <TechnicalTrackingSummaryTables :tracking-result="trackingDrawerResult" />
        </template>

        <div
          v-else
          class="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
        >
          当前没有可展示的切片追踪记录。
        </div>
      </div>
    </ElDrawer>
  </Page>
</template>

<style scoped>
.legacy-slicing-workbench {
  min-height: calc(100vh - 220px);
}

.legacy-header,
.legacy-action-bar,
.legacy-panel {
  background: #ffffff;
  border: 1px solid #d8e4ef;
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
}

.legacy-header {
  padding: 18px;
}

.legacy-stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.legacy-stat-card {
  min-height: 90px;
  padding: 14px 16px;
  color: #0f172a;
  background: linear-gradient(135deg, #f8fbff 0%, #eef5fb 100%);
  border: 1px solid #d7e7f4;
}

.legacy-stat-card[data-accent='amber'] {
  background: linear-gradient(135deg, #fff9eb 0%, #ffeec3 100%);
  border-color: #f3d38f;
}

.legacy-stat-card[data-accent='cyan'] {
  background: linear-gradient(135deg, #f0fbff 0%, #dff4fb 100%);
  border-color: #bee5f0;
}

.legacy-stat-card[data-accent='emerald'] {
  background: linear-gradient(135deg, #f2fff9 0%, #ddf7ea 100%);
  border-color: #b9e7cf;
}

.legacy-stat-card[data-accent='rose'] {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe1e1 100%);
  border-color: #f5b4b4;
}

.legacy-stat-card[data-accent='sky'] {
  background: linear-gradient(135deg, #f2f7ff 0%, #dcecff 100%);
  border-color: #bdd6ff;
}

.legacy-stat-card[data-accent='slate'] {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  border-color: #d6dfeb;
}

.legacy-stat-card[data-accent='teal'] {
  background: linear-gradient(135deg, #effdfc 0%, #d7f5f2 100%);
  border-color: #b3e8e1;
}

.legacy-stat-card__label {
  font-size: 13px;
  line-height: 20px;
  color: #475569;
}

.legacy-stat-card__value {
  margin-top: 14px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}

.legacy-query-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.legacy-query-bar__search {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.legacy-query-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.legacy-query-bar__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.legacy-action-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.legacy-action-bar__left,
.legacy-action-bar__right {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.legacy-selection-tip {
  font-size: 12px;
  color: #64748b;
}

.legacy-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

.legacy-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.legacy-panel__header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px 12px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4fa 100%);
  border-bottom: 1px solid #d8e4ef;
}

.legacy-panel__header--right {
  background: linear-gradient(180deg, #f9fcfb 0%, #edf7f4 100%);
}

.legacy-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.legacy-panel__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: #64748b;
}

.legacy-panel :deep(.el-table) {
  --el-table-header-bg-color: #f6f9fc;
  --el-table-row-hover-bg-color: #f8fbff;
}

.legacy-panel :deep(.is-overdue-row > td) {
  background: #fff7ed;
}

.legacy-panel__footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 16px;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 1600px) {
  .legacy-stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .legacy-panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .legacy-query-bar,
  .legacy-action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .legacy-query-bar__actions,
  .legacy-action-bar__left,
  .legacy-action-bar__right {
    justify-content: flex-start;
  }

  .legacy-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
