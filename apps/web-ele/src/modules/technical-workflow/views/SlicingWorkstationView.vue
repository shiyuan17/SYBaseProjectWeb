<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  SlicingWorkbenchRow,
  SlicingWorkbenchView,
  TechnicalTrackingEmbeddingRecordSummary,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';
import type { TrackingTab } from '../utils/tracking';

import { computed, nextTick, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { UserRoundPen } from '@vben/icons';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDrawer,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  getSlicingWorkbench,
  getTechnicalTracking,
  startSlicing,
  updateTechnicalTaskRemarks,
} from '../api/technical-workflow-service';
import EmbeddingQualityReviewDialog from '../components/EmbeddingQualityReviewDialog.vue';
import SlicingProcessDialog from '../components/SlicingProcessDialog.vue';
import SlicingQcEvaluationDialog from '../components/SlicingQcEvaluationDialog.vue';
import TechnicalTaskStartDialog from '../components/TechnicalTaskStartDialog.vue';
import TechnicalTrackingDetailsSection from '../components/TechnicalTrackingDetailsSection.vue';
import TechnicalTrackingSummaryTables from '../components/TechnicalTrackingSummaryTables.vue';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEmbeddingEvaluationLevel,
  formatEventStatus,
  formatNullable,
  formatTaskStatus,
} from '../utils/format';
import {
  buildTrackingTreeData,
  buildWorkflowTimelineSteps,
  filterTrackingQcEvaluations,
  filterTrackingReworks,
  filterTrackingTasks,
  resolveSelectedTrackingNodeId,
} from '../utils/tracking';
import { buildWorkstationCaseContext } from '../utils/workstation';

interface SelectableTableInstance {
  clearSelection: () => void;
  toggleRowSelection: (
    row: SlicingWorkbenchRow,
    selected?: boolean,
    ignoreSelectable?: boolean,
  ) => void;
}

const SHIFT_REMARK_OPTIONS = ['未包埋', '包埋未完成', '其他'] as const;

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
const embeddingQualityReviewDialogVisible = ref(false);
const pendingAutoProcessTaskId = ref('');
const selectedEmbeddingQualityReviewRecord =
  ref<null | TechnicalTrackingEmbeddingRecordSummary>(null);
const embeddingQualityReviewLoadingTaskIds = ref<string[]>([]);
const savingShiftRemarkTaskIds = ref<string[]>([]);

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

function isSavingShiftRemark(row: SlicingWorkbenchRow) {
  return savingShiftRemarkTaskIds.value.includes(row.taskId);
}

function setSavingShiftRemark(taskId: string, saving: boolean) {
  savingShiftRemarkTaskIds.value = saving
    ? [...new Set([...savingShiftRemarkTaskIds.value, taskId])]
    : savingShiftRemarkTaskIds.value.filter((item) => item !== taskId);
}

function isLoadingEmbeddingQualityReview(row: SlicingWorkbenchRow) {
  return embeddingQualityReviewLoadingTaskIds.value.includes(row.taskId);
}

function setLoadingEmbeddingQualityReview(taskId: string, loading: boolean) {
  embeddingQualityReviewLoadingTaskIds.value = loading
    ? [...new Set([...embeddingQualityReviewLoadingTaskIds.value, taskId])]
    : embeddingQualityReviewLoadingTaskIds.value.filter(
        (item) => item !== taskId,
      );
}

function applyShiftRemarkUpdate(taskId: string, shiftRemark: null | string) {
  workbench.value = {
    ...workbench.value,
    pendingList: workbench.value.pendingList.map((item) =>
      item.taskId === taskId ? { ...item, shiftRemark } : item,
    ),
    completedTodayList: workbench.value.completedTodayList.map((item) =>
      item.taskId === taskId ? { ...item, shiftRemark } : item,
    ),
  };
}

async function resolveTaskRemarks(row: SlicingWorkbenchRow) {
  const trackingResult = await getTechnicalTracking(row.caseId);
  const matchedTask = trackingResult.technicalTasks.find(
    (item) => item.id === row.taskId,
  );
  if (!matchedTask) {
    throw new Error('未找到当前切片任务备注');
  }
  return matchedTask.remarks ?? null;
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

async function handleShiftRemarkSave(
  row: SlicingWorkbenchRow,
  value: boolean | number | string,
) {
  const nextShiftRemark = String(value).trim();
  const currentShiftRemark = row.shiftRemark ?? '';
  if (nextShiftRemark === currentShiftRemark) {
    return;
  }

  setSavingShiftRemark(row.taskId, true);
  try {
    const remarks = await resolveTaskRemarks(row);
    await updateTechnicalTaskRemarks(row.taskId, {
      productionRemarks: nextShiftRemark || null,
      remarks: remarks?.trim() || null,
    });
    applyShiftRemarkUpdate(row.taskId, nextShiftRemark || null);
    ElMessage.success('主班备注已保存');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    setSavingShiftRemark(row.taskId, false);
  }
}

async function openEmbeddingQualityReview(row: SlicingWorkbenchRow) {
  if (!row.embeddingBoxId) {
    ElMessage.warning('当前缺少可评价的包埋盒记录');
    return;
  }

  setLoadingEmbeddingQualityReview(row.taskId, true);
  try {
    const trackingResult = await getTechnicalTracking(row.caseId);
    const matchedRecord =
      trackingResult.embeddingRecords?.find(
        (item) => item.embeddingBoxId === row.embeddingBoxId,
      ) ??
      trackingResult.embeddingRecords?.find(
        (item) =>
          item.specimenId === row.specimenId &&
          item.pathologyNo === row.pathologyNo,
      ) ??
      null;
    if (!matchedRecord) {
      ElMessage.warning('未找到对应的包埋评价记录');
      return;
    }
    selectedEmbeddingQualityReviewRecord.value = matchedRecord;
    embeddingQualityReviewDialogVisible.value = true;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    setLoadingEmbeddingQualityReview(row.taskId, false);
  }
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
    trackingDrawerActiveTab.value =
      mode === 'history' ? 'timeline' : 'abnormal';
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

async function handleEmbeddingQualityReviewSubmitted() {
  await loadWorkbench();
  await refreshTrackingDrawer();
}

function pendingRowClassName({ row }: { row: SlicingWorkbenchRow }) {
  return row.timedOut ? 'is-overdue-row' : '';
}

void loadWorkbench();
</script>

<template>
  <Page>
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
        </div>

        <div class="legacy-action-bar__right">
          <ElCheckbox
            v-model="filters.pendingTodayOnly"
            @change="handlePendingTodayOnlyChange"
          >
            只看今天待切
          </ElCheckbox>
          <span class="legacy-selection-tip"> 可用操作要求恰好选中 1 行 </span>
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
                <ElSelect
                  :model-value="row.shiftRemark ?? ''"
                  clearable
                  :loading="isSavingShiftRemark(row)"
                  placeholder="主班备注"
                  size="small"
                  @change="(value) => handleShiftRemarkSave(row, value ?? '')"
                >
                  <ElOption
                    v-for="option in SHIFT_REMARK_OPTIONS"
                    :key="option"
                    :label="option"
                    :value="option"
                  />
                </ElSelect>
              </template>
            </ElTableColumn>
            <ElTableColumn label="包埋评价" min-width="120">
              <template #default="{ row }">
                <div class="legacy-editable-cell">
                  <span class="legacy-editable-cell__content">
                    {{
                      formatEmbeddingEvaluationLevel(row.embeddingEvaluation)
                    }}
                  </span>
                  <ElButton
                    aria-label="编辑包埋评价"
                    :icon="UserRoundPen"
                    :loading="isLoadingEmbeddingQualityReview(row)"
                    circle
                    size="small"
                    text
                    title="编辑包埋评价"
                    @click.stop="openEmbeddingQualityReview(row)"
                  />
                </div>
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
                用于查看今日完成切片和异常记录。
              </p>
            </div>
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
                {{ formatEmbeddingEvaluationLevel(row.embeddingEvaluation) }}
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

    <EmbeddingQualityReviewDialog
      v-model="embeddingQualityReviewDialogVisible"
      :row="selectedEmbeddingQualityReviewRecord"
      title="包埋评价"
      @submitted="handleEmbeddingQualityReviewSubmitted"
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
          <TechnicalTrackingSummaryTables
            :tracking-result="trackingDrawerResult"
          />
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
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 8px 24px hsl(var(--foreground) / 6%);
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
  color: hsl(var(--foreground));
  background: hsl(var(--accent) / 70%);
  border: 1px solid hsl(var(--border));
}

.legacy-stat-card[data-accent='amber'] {
  background: hsl(var(--warning) / 14%);
  border-color: hsl(var(--warning) / 34%);
}

.legacy-stat-card[data-accent='cyan'] {
  background: hsl(var(--primary) / 10%);
  border-color: hsl(var(--primary) / 24%);
}

.legacy-stat-card[data-accent='emerald'] {
  background: hsl(var(--success) / 12%);
  border-color: hsl(var(--success) / 32%);
}

.legacy-stat-card[data-accent='rose'] {
  background: hsl(var(--destructive) / 12%);
  border-color: hsl(var(--destructive) / 30%);
}

.legacy-stat-card[data-accent='sky'] {
  background: hsl(var(--primary) / 12%);
  border-color: hsl(var(--primary) / 28%);
}

.legacy-stat-card[data-accent='slate'] {
  background: hsl(var(--muted) / 70%);
  border-color: hsl(var(--border));
}

.legacy-stat-card[data-accent='teal'] {
  background: hsl(var(--success) / 10%);
  border-color: hsl(var(--success) / 28%);
}

.legacy-stat-card__label {
  font-size: 13px;
  line-height: 20px;
  color: hsl(var(--muted-foreground));
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
  border-top: 1px solid hsl(var(--border));
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
  color: hsl(var(--foreground));
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
  color: hsl(var(--muted-foreground));
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
  background: hsl(var(--accent) / 70%);
  border-bottom: 1px solid hsl(var(--border));
}

.legacy-panel__header--right {
  background: hsl(var(--success) / 10%);
}

.legacy-panel__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.legacy-panel__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.legacy-panel :deep(.el-table) {
  --el-table-header-bg-color: hsl(var(--accent));
  --el-table-row-hover-bg-color: hsl(var(--accent-hover));
}

.legacy-panel :deep(.is-overdue-row > td) {
  background: hsl(var(--warning) / 12%);
}

.legacy-panel__footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 16px;
  border-top: 1px solid hsl(var(--border));
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
