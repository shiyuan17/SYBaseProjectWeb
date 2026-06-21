<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  SlideStainingResult,
  TechnicalTrackingSlideSummary,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTooltip,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  completeSlideStaining,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startSlideStaining,
} from '../api/technical-workflow-service';
import {
  buildCreatedDateRangeParams,
  buildDateRangeQueryParams,
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
  resolveRouteDateRange,
} from '../utils/date-range';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatNullable,
  formatObjectType,
  formatPatientIdDisplay,
  formatQualityStatus,
  formatSlicingSlideDisplayNo,
  formatSlideStatus,
  formatTaskStatus,
} from '../utils/format';

interface TableInstance {
  clearSelection: () => void;
}

interface StainingTaskRow {
  index: number;
  pathologyNo: string;
  patientId: string;
  patientName: string;
  slideNo: string;
  slideType: string;
  sliceOperation: OperationInfo;
  stainingOperation: OperationInfo;
  task: PendingTechnicalTaskItem;
}

interface CompletedSlideRow {
  index: number;
  pathologyNo: string;
  patientId: string;
  patientName: string;
  slideId: string;
  slideNo: string;
  slideStatus: null | string;
  slideType: string;
  sliceOperation: OperationInfo;
  stainingOperation: OperationInfo;
}

interface OperationInfo {
  fallback: string;
  operatedAt: string;
  operatorName: string;
}

const STAINING_TYPE_OPTIONS = [
  { label: '不限类型', value: 'ALL' },
  { label: 'HE', value: 'HE' },
  { label: '免疫组化', value: 'IHC' },
  { label: '特殊染色', value: 'SPECIAL_STAIN' },
] as const;

const route = useRoute();
const dateRangeShortcuts = createDateRangePickerShortcuts();

const pageError = ref('');
const loading = ref(false);
const completedLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const completedRows = ref<CompletedSlideRow[]>([]);
const total = ref(0);
const selectedPendingRows = ref<StainingTaskRow[]>([]);
const selectedCompletedRows = ref<CompletedSlideRow[]>([]);
const pendingTableRef = ref<null | TableInstance>(null);
const processing = ref(false);

const filters = reactive({
  completedPage: 1,
  completedSize: 10,
  dateRange: resolveRouteDateRange(route.query),
  keyword:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  stainingType: 'ALL',
  page: 1,
  size: 20,
  timedOutOnly: route.query.mode === 'exception',
});

const pendingRows = computed<StainingTaskRow[]>(() =>
  pendingItems.value.map((task, index) => ({
    index: index + 1,
    pathologyNo: formatNullable(task.pathologyNo),
    patientId: formatPatientIdDisplay(task.patientIdDisplay, task.patientId),
    patientName: formatNullable(task.patientName),
    slideNo: resolveStainingSlideDisplayNo(
      task.objectDisplayNo ?? task.samplingBlockCode,
      task.samplingBlockDescription,
    ),
    slideType: formatObjectType(task.objectType),
    sliceOperation: buildOperationInfo({
      fallback: formatNullable(task.sampledByName),
      operatedAt: task.sampledAt,
      operatorName: task.sampledByName,
    }),
    stainingOperation: buildOperationInfo({
      fallback: formatTaskStatus(task.taskStatus),
      operatedAt: task.completedAt ?? task.startedAt,
      operatorName: task.assignedToName,
    }),
    task,
  })),
);

const visiblePendingRows = computed(() => pendingRows.value);
const overdueCount = computed(
  () => pendingRows.value.filter((row) => row.task.timedOut).length,
);
const selectedCompletedCount = computed(
  () => selectedCompletedRows.value.length,
);
const pendingStats = computed(() => [
  {
    accent: 'sky',
    label: '待染色',
    value: total.value,
  },
  {
    accent: 'rose',
    label: '超时',
    value: overdueCount.value,
  },
  {
    accent: 'emerald',
    label: '完成',
    value: completedRows.value.length,
  },
]);

const completedPageCount = computed(() =>
  Math.max(1, Math.ceil(completedRows.value.length / filters.completedSize)),
);
const visibleCompletedRows = computed(() => {
  const start = (filters.completedPage - 1) * filters.completedSize;
  return completedRows.value.slice(start, start + filters.completedSize);
});
const canProcessSelectedTasks = computed(
  () =>
    selectedPendingRows.value.length > 0 &&
    selectedPendingRows.value.every((row) => isProcessableTask(row.task)),
);

function buildOperationInfo(options: {
  fallback?: null | string;
  operatedAt?: null | string;
  operatorName?: null | string;
}): OperationInfo {
  return {
    fallback: formatNullable(options.fallback),
    operatedAt: formatDateTime(options.operatedAt),
    operatorName: formatNullable(options.operatorName),
  };
}

function hasOperationDetail(operation: OperationInfo) {
  return operation.operatorName !== '-' || operation.operatedAt !== '-';
}

function getOperationTitle(operation: OperationInfo) {
  return operation.operatorName === '-'
    ? operation.fallback
    : operation.operatorName;
}

function shouldShowOperationTime(operation: OperationInfo) {
  return operation.operatedAt !== '-';
}

function findSlideTechnicalTask(
  tracking: TechnicalTrackingViewModel,
  slide: TechnicalTrackingSlideSummary,
  taskType: 'SLICING' | 'STAINING',
) {
  const tasks = tracking.technicalTasks.filter(
    (task) => task.taskType === taskType,
  );
  const relatedObjectIds = new Set(
    [
      slide.slideId,
      slide.slideNo,
      slide.embeddingBoxId,
      slide.specimenId,
    ].filter(Boolean),
  );

  return (
    tasks.find((task) => relatedObjectIds.has(task.objectId?.trim() ?? '')) ??
    (tasks.length === 1 ? tasks[0] : null)
  );
}

function resolveStainingSlideDisplayNo(
  primaryDisplayNo?: null | string,
  fallbackDisplayNo?: null | string,
) {
  return formatSlicingSlideDisplayNo(primaryDisplayNo, fallbackDisplayNo);
}

function buildCompletedRowsFromTracking(
  tracking: TechnicalTrackingViewModel,
  taskContext: PendingTechnicalTaskItem,
): CompletedSlideRow[] {
  return tracking.slides.map((slide, index) => {
    const slicingTask = findSlideTechnicalTask(tracking, slide, 'SLICING');
    const stainingTask = findSlideTechnicalTask(tracking, slide, 'STAINING');
    const matchedEmbeddingBox = tracking.embeddingBoxes.find(
      (item) => item.embeddingBoxId === slide.embeddingBoxId,
    );

    return {
      index: index + 1,
      pathologyNo: formatNullable(
        tracking.pathologyNo ?? taskContext.pathologyNo,
      ),
      patientId: formatPatientIdDisplay(
        taskContext.patientIdDisplay,
        taskContext.patientId,
      ),
      patientName: formatNullable(taskContext.patientName),
      slideId: slide.slideId,
      slideNo: resolveStainingSlideDisplayNo(
        taskContext.objectDisplayNo ?? taskContext.samplingBlockCode,
        matchedEmbeddingBox?.embeddingBoxNo ?? slide.slideNo,
      ),
      slideStatus: slide.slideStatus,
      slideType: formatObjectType('SLIDE'),
      sliceOperation: buildOperationInfo({
        fallback: formatQualityStatus(slide.qualityStatus),
        operatedAt: slicingTask?.completedAt ?? slicingTask?.startedAt,
        operatorName: slicingTask?.assignedToName,
      }),
      stainingOperation: buildOperationInfo({
        fallback: formatSlideStatus(slide.slideStatus),
        operatedAt: stainingTask?.completedAt ?? stainingTask?.startedAt,
        operatorName: stainingTask?.assignedToName,
      }),
    };
  });
}

function buildFallbackCompletedRow(
  result: SlideStainingResult,
  taskContext: PendingTechnicalTaskItem,
): CompletedSlideRow {
  return {
    index: 1,
    pathologyNo: formatNullable(taskContext.pathologyNo),
    patientId: formatPatientIdDisplay(
      taskContext.patientIdDisplay,
      taskContext.patientId,
    ),
    patientName: formatNullable(taskContext.patientName),
    slideId: result.slideId || taskContext.objectId || result.taskId,
    slideNo: resolveStainingSlideDisplayNo(
      taskContext.objectDisplayNo ?? taskContext.samplingBlockCode,
      taskContext.samplingBlockDescription,
    ),
    slideStatus: 'STAINED',
    slideType: formatObjectType('SLIDE'),
    sliceOperation: buildOperationInfo({
      fallback: formatNullable(taskContext.sampledByName),
      operatedAt: taskContext.sampledAt,
      operatorName: taskContext.sampledByName,
    }),
    stainingOperation: buildOperationInfo({
      fallback: formatSlideStatus('STAINED'),
      operatedAt: taskContext.completedAt,
      operatorName: taskContext.assignedToName,
    }),
  };
}

function upsertCompletedRow(row: CompletedSlideRow) {
  completedRows.value = [
    row,
    ...completedRows.value.filter((item) => item.slideId !== row.slideId),
  ].map((item, index) => ({ ...item, index: index + 1 }));
  selectedCompletedRows.value = [];
  filters.completedPage = 1;
}

function clearPendingSelection() {
  selectedPendingRows.value = [];
  pendingTableRef.value?.clearSelection();
}

async function appendCompletedResult(
  result: SlideStainingResult,
  taskContext: PendingTechnicalTaskItem,
) {
  completedLoading.value = true;
  try {
    const tracking = await getTechnicalTracking(taskContext.caseId, {
      ...buildDateRangeQueryParams(filters.dateRange),
      workDate:
        filters.dateRange.length === 0 &&
        typeof route.query.workDate === 'string' &&
        route.query.workDate.trim()
          ? route.query.workDate
          : undefined,
    });
    const matchedRow =
      buildCompletedRowsFromTracking(tracking, taskContext).find(
        (row) => row.slideId === result.slideId,
      ) ?? buildFallbackCompletedRow(result, taskContext);
    upsertCompletedRow(matchedRow);
  } catch (error) {
    upsertCompletedRow(buildFallbackCompletedRow(result, taskContext));
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    completedLoading.value = false;
  }
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks({
      ...buildCreatedDateRangeParams(filters.dateRange),
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      size: filters.size,
      taskType: 'STAINING',
      timedOutOnly: filters.timedOutOnly,
    });

    pendingItems.value = result.items;
    total.value = result.total;
    clearPendingSelection();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    loading.value = false;
  }
}

function handlePendingSelectionChange(rows: StainingTaskRow[]) {
  selectedPendingRows.value = rows;
}

function handleCompletedSelectionChange(rows: CompletedSlideRow[]) {
  selectedCompletedRows.value = rows;
}

function handleRefresh() {
  void loadPendingData();
}

function handleQuery() {
  filters.page = 1;
  completedRows.value = [];
  selectedCompletedRows.value = [];
  filters.completedPage = 1;
  void loadPendingData();
}

function toggleOverdueOnly() {
  filters.timedOutOnly = !filters.timedOutOnly;
  filters.page = 1;
  void loadPendingData();
}

function openMoreActions() {
  ElMessage.warning('更多操作待接入');
}

function isProcessableTask(task: PendingTechnicalTaskItem) {
  return task.taskStatus === 'PENDING' || task.taskStatus === 'IN_PROGRESS';
}

function getTaskSlideId(task: PendingTechnicalTaskItem) {
  return (task.objectId ?? '').trim();
}

function getSelectedRowsForProcessing() {
  const rows = [...selectedPendingRows.value];
  if (rows.length === 0) {
    ElMessage.warning('请先从左侧勾选待出片玻片');
    return [];
  }
  if (rows.some((row) => !isProcessableTask(row.task))) {
    ElMessage.warning('当前任务状态不支持染色出片');
    return [];
  }
  if (rows.some((row) => !getTaskSlideId(row.task))) {
    ElMessage.warning('当前任务缺少玻片编号');
    return [];
  }
  return rows;
}

async function completeSelectedStainingTask(row: StainingTaskRow) {
  const task = row.task;
  const operatorPayload = {
    remarks: null,
    terminalCode: null,
  };

  if (task.taskStatus === 'PENDING') {
    await startSlideStaining({
      ...operatorPayload,
      taskId: task.id,
    });
  } else if (task.taskStatus !== 'IN_PROGRESS') {
    throw new Error('当前任务状态不支持染色出片');
  }

  const result = await completeSlideStaining({
    ...operatorPayload,
    qualityIssue: null,
    slideId: getTaskSlideId(task),
    stainingType: 'HE',
    taskId: task.id,
  });

  return { result, task };
}

async function openPrimaryAction() {
  if (processing.value) {
    return;
  }

  const rows = getSelectedRowsForProcessing();
  if (rows.length === 0) {
    return;
  }

  processing.value = true;
  pageError.value = '';
  let batchErrorMessage = '';
  try {
    const results = await Promise.allSettled(
      rows.map((row) => completeSelectedStainingTask(row)),
    );
    const succeededResults = results.filter(
      (
        result,
      ): result is PromiseFulfilledResult<{
        result: SlideStainingResult;
        task: PendingTechnicalTaskItem;
      }> => result.status === 'fulfilled',
    );
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    for (const fulfilled of succeededResults) {
      await appendCompletedResult(fulfilled.value.result, fulfilled.value.task);
    }

    if (failedResults.length === 0) {
      ElMessage.success(
        rows.length === 1
          ? '染色出片已记录'
          : `已记录染色出片 ${rows.length} 条`,
      );
    } else {
      const firstFailure = failedResults[0];
      if (firstFailure) {
        batchErrorMessage = getWorkflowPageErrorMessage(firstFailure.reason);
        pageError.value = batchErrorMessage;
        reportInlineErrorDisabled(
          firstFailure.reason,
          getWorkflowPageErrorMessage,
        );
      }
      ElMessage.warning(
        succeededResults.length > 0
          ? `已记录 ${succeededResults.length} 条，${failedResults.length} 条失败`
          : '染色出片记录失败，请重试',
      );
    }
  } finally {
    await loadPendingData();
    if (batchErrorMessage) {
      pageError.value = batchErrorMessage;
    }
    processing.value = false;
  }
}

function handlePendingPageChange() {
  void loadPendingData();
}

function handleCompletedPageChange() {
  if (filters.completedPage > completedPageCount.value) {
    filters.completedPage = completedPageCount.value;
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key !== 'F9') {
    return;
  }
  event.preventDefault();
  openPrimaryAction();
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  void loadPendingData();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <Page :show-header="false">
    <div class="legacy-staining-workbench">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
      />

      <section class="legacy-header">
        <div class="legacy-header__top">
          <div class="legacy-toolbar">
            <ElButton :loading="loading" @click="handleRefresh">刷新</ElButton>
            <ElButton
              :disabled="!canProcessSelectedTasks || processing"
              :loading="processing"
              type="primary"
              @click="openPrimaryAction"
            >
              染色出片(F9)
            </ElButton>

            <div class="legacy-search-bar">
              <ElInput
                v-model="filters.keyword"
                clearable
                placeholder="病人ID/病理号"
                @keyup.enter="handleQuery"
              />
              <ElDatePicker
                v-model="filters.dateRange"
                :default-value="createDatePickerPanelDefaultValue()"
                :disabled-date="disableFutureDate"
                :shortcuts="dateRangeShortcuts"
                end-placeholder="结束日期"
                range-separator="至"
                start-placeholder="开始日期"
                type="daterange"
                unlink-panels
                value-format="YYYY-MM-DD"
              />
              <ElTooltip
                content="染色类型筛选待后端分类口径确认"
                placement="top"
              >
                <span class="inline-flex">
                  <ElSelect v-model="filters.stainingType" disabled>
                    <ElOption
                      v-for="option in STAINING_TYPE_OPTIONS"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ElSelect>
                </span>
              </ElTooltip>
              <ElButton :loading="loading" @click="handleQuery">查询</ElButton>
              <ElButton @click="openMoreActions">更多</ElButton>
            </div>
          </div>

          <div class="legacy-stat-grid">
            <article
              v-for="card in pendingStats"
              :key="card.label"
              class="legacy-stat-card"
              :data-accent="card.accent"
            >
              <div class="legacy-stat-card__label">{{ card.label }}</div>
              <div class="legacy-stat-card__value">{{ card.value }}</div>
            </article>
          </div>
        </div>

        <div class="legacy-action-row">
          <div class="legacy-action-row__left">
            <ElTooltip
              v-for="label in ['取消出片', '质控评价', '拍照', '确认清零']"
              :key="label"
              content="待接入"
              placement="top"
            >
              <ElButton disabled>{{ label }}</ElButton>
            </ElTooltip>
          </div>
          <ElButton
            :type="filters.timedOutOnly ? 'danger' : 'default'"
            :plain="!filters.timedOutOnly"
            @click="toggleOverdueOnly"
          >
            {{ filters.timedOutOnly ? '查看全部' : '过期任务' }}
            <span class="legacy-badge">{{ overdueCount }}</span>
          </ElButton>
        </div>
      </section>

      <div class="legacy-grid">
        <section class="legacy-panel">
          <header class="legacy-panel__header">
            <div>
              <h3 class="legacy-panel__title">待出片列表</h3>
              <p class="legacy-panel__subtitle">
                按病理号或病人ID查询待办，支持同一病例多张玻片连续处理。
              </p>
            </div>
            <div class="legacy-panel__meta">
              <span>
                当前页 {{ filters.page }} /
                {{ Math.max(1, Math.ceil(total / filters.size)) }}
              </span>
              <span>可选任务 {{ visiblePendingRows.length }}</span>
            </div>
          </header>

          <div v-if="visiblePendingRows.length > 0" class="legacy-table-shell">
            <ElTable
              ref="pendingTableRef"
              v-loading="loading"
              border
              :data="visiblePendingRows"
              :row-class-name="
                ({ row }) => (row.task.timedOut ? 'is-overdue-row' : '')
              "
              :row-key="(row) => row.task.id"
              table-layout="fixed"
              @selection-change="handlePendingSelectionChange"
            >
              <ElTableColumn type="selection" width="42" />
              <ElTableColumn label="序" type="index" width="52" />
              <ElTableColumn label="玻片编号" min-width="140">
                <template #default="{ row }">
                  {{ row.slideNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="玻片类型" min-width="120">
                <template #default="{ row }">
                  {{ row.slideType }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="病理号" min-width="140">
                <template #default="{ row }">
                  {{ row.pathologyNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="病人" min-width="120">
                <template #default="{ row }">
                  {{ row.patientName }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="主班备注" min-width="180">
                <template #default="{ row }">
                  {{
                    formatNullable(
                      row.task.shiftRemark ??
                        row.task.productionRemarks ??
                        row.task.remarks,
                    )
                  }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="切片操作" min-width="120">
                <template #default="{ row }">
                  <div
                    class="legacy-operation-cell"
                    :class="{
                      'legacy-operation-cell--muted': !hasOperationDetail(
                        row.sliceOperation,
                      ),
                    }"
                  >
                    <div class="legacy-operation-cell__operator">
                      {{ getOperationTitle(row.sliceOperation) }}
                    </div>
                    <div
                      v-if="shouldShowOperationTime(row.sliceOperation)"
                      class="legacy-operation-cell__time"
                    >
                      {{ row.sliceOperation.operatedAt }}
                    </div>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="出片操作" min-width="120">
                <template #default="{ row }">
                  <div
                    class="legacy-operation-cell"
                    :class="{
                      'legacy-operation-cell--muted': !hasOperationDetail(
                        row.stainingOperation,
                      ),
                    }"
                  >
                    <div class="legacy-operation-cell__operator">
                      {{ getOperationTitle(row.stainingOperation) }}
                    </div>
                    <div
                      v-if="shouldShowOperationTime(row.stainingOperation)"
                      class="legacy-operation-cell__time"
                    >
                      {{ row.stainingOperation.operatedAt }}
                    </div>
                  </div>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
          <ElEmpty v-else description="当前筛选下暂无待出片任务" />

          <div class="legacy-panel__footer">
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="total, sizes, prev, pager, next"
              @change="handlePendingPageChange"
            />
          </div>
        </section>

        <section
          v-loading="completedLoading"
          class="legacy-panel legacy-panel--right"
        >
          <header class="legacy-panel__header legacy-panel__header--right">
            <div>
              <h3 class="legacy-panel__title">已完成出片</h3>
              <p class="legacy-panel__subtitle">
                展示本次页面连续完成的出片记录，切换待办不会清空。
              </p>
            </div>
            <div class="legacy-panel__meta legacy-panel__meta--right">
              <span>本次完成 {{ completedRows.length }}</span>
              <span>已选中（{{ selectedCompletedCount }}）</span>
            </div>
          </header>

          <div class="legacy-workbench-tools">
            <ElButton disabled>扫码清零</ElButton>
            <ElButton disabled>打印清零码</ElButton>
            <ElButton disabled>校验</ElButton>
          </div>

          <div
            v-if="visibleCompletedRows.length > 0"
            class="legacy-table-shell"
          >
            <ElTable
              border
              :data="visibleCompletedRows"
              :row-key="(row) => row.slideId"
              table-layout="fixed"
              @selection-change="handleCompletedSelectionChange"
            >
              <ElTableColumn type="selection" width="42" />
              <ElTableColumn label="序" type="index" width="52" />
              <ElTableColumn label="玻片编号" min-width="140">
                <template #default="{ row }">
                  {{ row.slideNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="玻片类型" min-width="120">
                <template #default="{ row }">
                  {{ row.slideType }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="病理号" min-width="140">
                <template #default="{ row }">
                  {{ row.pathologyNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="病人" min-width="120">
                <template #default="{ row }">
                  {{ row.patientName }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="切片操作" min-width="120">
                <template #default="{ row }">
                  <div
                    class="legacy-operation-cell"
                    :class="{
                      'legacy-operation-cell--muted': !hasOperationDetail(
                        row.sliceOperation,
                      ),
                    }"
                  >
                    <div class="legacy-operation-cell__operator">
                      {{ getOperationTitle(row.sliceOperation) }}
                    </div>
                    <div
                      v-if="shouldShowOperationTime(row.sliceOperation)"
                      class="legacy-operation-cell__time"
                    >
                      {{ row.sliceOperation.operatedAt }}
                    </div>
                  </div>
                </template>
              </ElTableColumn>
              <ElTableColumn label="出片操作" min-width="120">
                <template #default="{ row }">
                  <div
                    class="legacy-operation-cell"
                    :class="{
                      'legacy-operation-cell--muted': !hasOperationDetail(
                        row.stainingOperation,
                      ),
                    }"
                  >
                    <div class="legacy-operation-cell__operator">
                      {{ getOperationTitle(row.stainingOperation) }}
                    </div>
                    <div
                      v-if="shouldShowOperationTime(row.stainingOperation)"
                      class="legacy-operation-cell__time"
                    >
                      {{ row.stainingOperation.operatedAt }}
                    </div>
                  </div>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
          <ElEmpty v-else description="本次暂无已完成出片记录" />

          <div class="legacy-panel__footer">
            <ElPagination
              v-model:current-page="filters.completedPage"
              v-model:page-size="filters.completedSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="completedRows.length"
              background
              layout="total, sizes, prev, pager, next"
              @change="handleCompletedPageChange"
            />
          </div>
        </section>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.legacy-staining-workbench {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: calc(100vh - 220px);
}

.legacy-header,
.legacy-panel {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 8px 24px hsl(var(--foreground) / 6%);
}

.legacy-header {
  padding: 16px;
}

.legacy-header__top {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.95fr);
  gap: 16px;
  align-items: start;
}

.legacy-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.legacy-search-bar {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.legacy-search-bar :deep(.el-input),
.legacy-search-bar :deep(.el-select) {
  min-width: 0;
}

.legacy-search-bar :deep(.el-input) {
  width: 240px;
}

.legacy-search-bar :deep(.el-select) {
  width: 140px;
}

.legacy-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.legacy-stat-card {
  min-height: 84px;
  padding: 12px 14px;
  color: hsl(var(--foreground));
  background: hsl(var(--accent) / 70%);
  border: 1px solid hsl(var(--border));
}

.legacy-stat-card[data-accent='amber'] {
  background: hsl(var(--warning) / 14%);
  border-color: hsl(var(--warning) / 34%);
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

.legacy-stat-card__label {
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
}

.legacy-stat-card__value {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.legacy-action-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid hsl(var(--border));
}

.legacy-action-row__left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.legacy-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 0 6px;
  margin-left: 6px;
  font-size: 12px;
  line-height: 18px;
  color: #fff;
  background: #ef4444;
  border-radius: 999px;
}

.legacy-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr);
  gap: 16px;
}

.legacy-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.legacy-panel--right {
  background: hsl(var(--card));
}

.legacy-panel__header {
  display: flex;
  gap: 12px;
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

.legacy-panel__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
  font-size: 12px;
  line-height: 18px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.legacy-panel__meta--right {
  align-items: flex-end;
}

.legacy-workbench-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px 10px;
}

.legacy-table-shell {
  min-height: 0;
}

.legacy-operation-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 20px;
  color: hsl(var(--foreground));
  white-space: normal;
}

.legacy-operation-cell--muted {
  color: hsl(var(--muted-foreground));
}

.legacy-operation-cell__operator {
  font-size: 14px;
  font-weight: 500;
}

.legacy-operation-cell__time {
  font-size: 13px;
  color: hsl(var(--foreground));
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

@media (max-width: 1440px) {
  .legacy-header__top {
    grid-template-columns: 1fr;
  }

  .legacy-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .legacy-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 960px) {
  .legacy-action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .legacy-search-bar :deep(.el-input) {
    width: 100%;
  }

  .legacy-search-bar :deep(.el-select) {
    width: 100%;
  }
}
</style>
