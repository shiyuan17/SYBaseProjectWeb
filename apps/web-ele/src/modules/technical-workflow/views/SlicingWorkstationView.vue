<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  SlicingSlidePrintResult,
  SlicingWorkbenchRow,
  SlicingWorkbenchView,
  TechnicalTrackingEmbeddingRecordSummary,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';
import type { TrackingTab } from '../utils/tracking';

import { computed, nextTick, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { UserRoundPen } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDrawer,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import CopyableIdentifier from '../../../components/CopyableIdentifier.vue';
import {
  cancelSlicingSlidePrintMergeGroups,
  completeSlicing,
  createSlicingSlidePrintMergeGroups,
  getSlicingWorkbench,
  getTechnicalTracking,
  printSlicingSlideMergeGroup,
  printSlicingSlides,
  startSlicing,
  updateTechnicalTaskRemarks,
} from '../api/technical-workflow-service';
import EmbeddingQualityReviewDialog from '../components/EmbeddingQualityReviewDialog.vue';
import SlicingProcessDialog from '../components/SlicingProcessDialog.vue';
import SlicingQcEvaluationDialog from '../components/SlicingQcEvaluationDialog.vue';
import TechnicalTaskStartDialog from '../components/TechnicalTaskStartDialog.vue';
import TechnicalTrackingDetailsSection from '../components/TechnicalTrackingDetailsSection.vue';
import TechnicalTrackingSummaryTables from '../components/TechnicalTrackingSummaryTables.vue';
import {
  buildDateRangeQueryParams,
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
  resolveRouteDateRange,
} from '../utils/date-range';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEmbeddingEvaluationLevel,
  formatEventStatus,
  formatNullable,
  formatSlicingSlideDisplayNo,
  formatTaskStatus,
  formatTechnicalTrackingEventContent,
} from '../utils/format';
import {
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';
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

const APPLICATION_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: '会诊',
  FROZEN: '冰冻',
  ROUTINE: '常规',
};

interface PrintedSlicingSlideBatchItem {
  result: SlicingSlidePrintResult;
  row: SlicingWorkbenchRow;
}

const EMPTY_WORKBENCH: SlicingWorkbenchView = {
  completedPage: 1,
  completedSize: 20,
  completedTodayList: [],
  completedTotal: 0,
  pendingList: [],
  pendingPrintList: [],
  pendingPrintTotal: 0,
  pendingPage: 1,
  pendingSize: 20,
  pendingSliceList: [],
  pendingSliceTotal: 0,
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
const route = useRoute();
const userStore = useUserStore();
const dateRangeShortcuts = createDateRangePickerShortcuts();

const workbench = ref<SlicingWorkbenchView>(EMPTY_WORKBENCH);
const activeTab = ref<'print' | 'slice'>('print');
const filters = reactive({
  applicationType: '',
  completedPage: 1,
  completedSize: 20,
  dateRange: resolveRouteDateRange(route.query),
  keyword: '',
  overdueOnly: false,
  pendingPage: 1,
  pendingSize: 20,
  pendingTodayOnly: false,
});
const printing = ref(false);
const mergingPrintGroups = ref(false);
const cancelingPrintGroups = ref(false);

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

function buildPendingTaskFromRow(
  row: SlicingWorkbenchRow,
): PendingTechnicalTaskItem {
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
}

const selectedPendingTasks = computed(() =>
  selectedPendingRows.value.map((row) => buildPendingTaskFromRow(row)),
);

const currentPendingTask = computed<null | PendingTechnicalTaskItem>(() =>
  selectedPendingTasks.value.length === 1
    ? (selectedPendingTasks.value[0] ?? null)
    : null,
);

const canCompleteSlicing = computed(() => {
  return (
    selectedPendingRows.value.length > 0 &&
    selectedPendingRows.value.every(
      (row) =>
        row.selectable &&
        ['IN_PROGRESS', 'PENDING'].includes(row.taskStatus ?? '') &&
        Boolean(row.embeddingBoxId),
    )
  );
});

function getRowTaskIds(row: SlicingWorkbenchRow) {
  if (row.taskIds.length > 0) {
    return row.taskIds;
  }

  return row.taskId ? [row.taskId] : [];
}

function getSelectedUniqueTaskIds(rows: SlicingWorkbenchRow[]) {
  return [...new Set(rows.flatMap((row) => getRowTaskIds(row)))];
}

const canMergeSlides = computed(() => {
  return (
    activeTab.value === 'print' &&
    selectedPendingRows.value.length >= 2 &&
    selectedPendingRows.value.every(
      (row) =>
        row.selectable &&
        !row.mergedPrintGroup &&
        Boolean(row.embeddingBoxId) &&
        getRowTaskIds(row).length > 0,
    ) &&
    !mergingPrintGroups.value
  );
});
const canCancelMergedSlides = computed(() => {
  return (
    activeTab.value === 'print' &&
    selectedPendingRows.value.length > 0 &&
    selectedPendingRows.value.every(
      (row) =>
        row.selectable && row.mergedPrintGroup && Boolean(row.printGroupId),
    ) &&
    !cancelingPrintGroups.value
  );
});
const canPrintSlides = computed(() => {
  return (
    activeTab.value === 'print' &&
    selectedPendingRows.value.length > 0 &&
    selectedPendingRows.value.every(
      (row) =>
        row.selectable &&
        (row.mergedPrintGroup
          ? Boolean(row.printGroupId)
          : Boolean(row.embeddingBoxId) && getRowTaskIds(row).length > 0),
    ) &&
    !printing.value
  );
});
const canOpenTrackingDrawer = computed(
  () => selectedWorkbenchRowCount.value === 1,
);
const canCreateQcEvaluation = computed(() => {
  return (
    selectedCompletedRows.value.length > 0 &&
    selectedCompletedRows.value.every(
      (row) => row.selectable && Boolean(row.slideId),
    )
  );
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
    formatTechnicalTrackingEventContent,
  ),
);

function selectableWorkbenchRow(row: SlicingWorkbenchRow) {
  return row.selectable;
}

function pendingRowKey(row: SlicingWorkbenchRow) {
  return row.printGroupId ?? row.taskId;
}

function completedRowKey(row: SlicingWorkbenchRow) {
  return `${row.taskId}:${row.slideId ?? row.embeddingBoxId ?? row.caseId}`;
}

function getPendingRemark(row: SlicingWorkbenchRow) {
  return row.slicingRemark ?? row.sliceNotice ?? null;
}

function getEmbeddingRemarks(row: SlicingWorkbenchRow) {
  return row.embeddingRemarks ?? row.embeddingClearRemark ?? null;
}

function formatApplicationTypeLabel(value?: null | string) {
  if (!value) {
    return '-';
  }
  return APPLICATION_TYPE_LABELS[value] ?? value;
}

function escapePrintText(value: null | number | string | undefined) {
  return String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPrintedSlicingSlideLabels(items: PrintedSlicingSlideBatchItem[]) {
  return items.flatMap(({ result, row }) => {
    const slideNos =
      result.slideNos.length > 0 ? result.slideNos : [row.slideNo || '-'];
    return slideNos.map((slideNo, index) => ({
      embeddingBoxNo: row.embeddingBoxNo,
      pathologyNo: row.pathologyNo,
      patientId: row.patientId,
      patientIdDisplay: row.patientIdDisplay ?? row.patientId,
      patientName: row.patientName,
      slideNo,
      specimenName: row.specimenName,
      total: result.printedSlideCount || slideNos.length,
      sequence: index + 1,
    }));
  });
}

function buildSlicingSlidePrintDocument(items: PrintedSlicingSlideBatchItem[]) {
  const labels = buildPrintedSlicingSlideLabels(items);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>玻片打印</title>
    <style>
      @page { margin: 0; size: 72mm 42mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SimHei", "Microsoft YaHei", sans-serif;
        color: #111827;
      }
      .slide-label {
        width: 72mm;
        height: 42mm;
        padding: 3mm;
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        gap: 1.1mm;
        page-break-after: always;
      }
      .slide-label:last-child {
        page-break-after: auto;
      }
      .primary {
        font-size: 6mm;
        font-weight: 700;
        line-height: 1.1;
        word-break: break-all;
      }
      .line {
        font-size: 4mm;
        line-height: 1.15;
        word-break: break-word;
      }
      .name {
        font-size: 5mm;
        font-weight: 700;
        line-height: 1.15;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    ${labels
        .map(
          (label) => `
    <section class="slide-label">
      <div class="primary">${escapePrintText(label.slideNo)}</div>
      <div class="line">病理号：${escapePrintText(label.pathologyNo)}</div>
      <div class="line">蜡块号：${escapePrintText(label.embeddingBoxNo)}</div>
      <div class="line">患者：${escapePrintText(label.patientName)} / ${escapePrintText(label.patientIdDisplay)}</div>
      <div class="name">${escapePrintText(label.specimenName)} (${escapePrintText(label.sequence)}/${escapePrintText(label.total)})</div>
    </section>`,
        )
        .join('')}
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
    </scr${'ipt'}>
  </body>
</html>`;
}

function writeSlicingSlidePrintDocument(
  printWindow: Window,
  items: PrintedSlicingSlideBatchItem[],
) {
  printWindow.document.open();
  printWindow.document.write(buildSlicingSlidePrintDocument(items));
  printWindow.document.close();
}

function getPendingDataSource() {
  return activeTab.value === 'print'
    ? workbench.value.pendingPrintList
    : workbench.value.pendingSliceList;
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

function resolveLegacyWorkDateFallback() {
  return filters.dateRange.length === 0 &&
    typeof route.query.workDate === 'string' &&
    route.query.workDate.trim()
    ? route.query.workDate
    : undefined;
}

async function resolveTaskRemarks(row: SlicingWorkbenchRow) {
  const trackingResult = await getTechnicalTracking(row.caseId, {
    ...buildDateRangeQueryParams(filters.dateRange),
    workDate: resolveLegacyWorkDateFallback(),
  });
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

async function directCompleteSlicing() {
  const tasks = selectedPendingTasks.value;
  if (tasks.length === 0) {
    ElMessage.warning('当前缺少待处理任务');
    return;
  }
  // 检查所有任务的包埋盒ID是否存在
  if (
    tasks.some(
      (task) => task.objectType !== 'EMBEDDING_BOX' || !task.objectId?.trim(),
    )
  ) {
    ElMessage.warning('部分任务缺少包埋盒编号，无法完成切片');
    return;
  }
  // 初始化操作员表单，使用当前用户信息
  const operatorForm = createTechnicalOperatorDefaults(
    userStore.userInfo ?? undefined,
  );
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人信息');
    return;
  }
  // 检查任务状态
  if (
    tasks.some(
      (task) => !['IN_PROGRESS', 'PENDING'].includes(task.taskStatus ?? ''),
    )
  ) {
    ElMessage.warning('当前任务状态不支持完成切片');
    return;
  }

  try {
    const payload = normalizeTechnicalOperatorPayload(operatorForm);
    const results = await Promise.allSettled(
      tasks.map(async (task) => {
        const embeddingBoxId = task.objectId?.trim();
        if (!embeddingBoxId) {
          throw new Error('部分任务缺少包埋盒编号，无法完成切片');
        }
        // 如果任务是PENDING，先开始切片
        if (task.taskStatus === 'PENDING') {
          await startSlicing({
            ...payload,
            taskId: task.id,
          });
        }
        // 完成切片，使用默认参数
        return completeSlicing({
          ...payload,
          deviceCode: null,
          embeddingBoxId,
          qualityIssue: null,
          sliceCountPerSlide: 1,
          sliceThickness: null,
          taskId: task.id,
        });
      }),
    );

    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const succeededCount = results.length - failedResults.length;

    if (failedResults.length === 0) {
      const firstResult = results[0];
      const slicingResult =
        firstResult?.status === 'fulfilled' ? firstResult.value : null;
      ElMessage.success(
        tasks.length === 1 && slicingResult
          ? `切片完成，已处理 ${slicingResult.slideIds.length} 张已打印玻片`
          : `已完成切片 ${tasks.length} 条任务`,
      );
    } else {
      const firstFailure = failedResults[0];
      let errorMsg = '未知错误';
      if (firstFailure?.reason) {
        errorMsg = getWorkflowPageErrorMessage(firstFailure.reason);
      }
      ElMessage.warning(
        succeededCount > 0
          ? `已完成切片 ${succeededCount} 条任务，${failedResults.length} 条失败：${errorMsg}`
          : `完成切片失败：${errorMsg}`,
      );
      if (succeededCount === 0) {
        return;
      }
    }

    // 刷新工作台
    await loadWorkbench();
  } catch (error) {
    const errorMsg = getWorkflowPageErrorMessage(error);
    ElMessage.error(`操作失败：${errorMsg}`);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  }
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
      applicationType: filters.applicationType || undefined,
      completedPage: filters.completedPage,
      completedSize: filters.completedSize,
      ...buildDateRangeQueryParams(filters.dateRange),
      keyword: filters.keyword.trim() || undefined,
      overdueOnly: filters.overdueOnly,
      pendingPage: filters.pendingPage,
      pendingSize: filters.pendingSize,
      pendingTodayOnly: filters.pendingTodayOnly,
      workDate: resolveLegacyWorkDateFallback(),
    });

    clearAllSelections();

    if (options?.reopenPendingTaskId) {
      await nextTick();
      const matchedRow = workbench.value.pendingSliceList.find(
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

async function handleApplicationTypeChange() {
  filters.pendingPage = 1;
  filters.completedPage = 1;
  await loadWorkbench();
}

async function toggleOverdueOnly() {
  filters.overdueOnly = !filters.overdueOnly;
  filters.pendingPage = 1;
  await loadWorkbench();
}

async function handlePendingPaginationChange() {
  await loadWorkbench();
}

function handleTabChange() {
  clearAllSelections();
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
  const rows = selectedPendingRows.value;
  if (rows.length === 0) {
    showSingleSelectionWarning('请在待切列表中至少勾选 1 行');
    return;
  }
  if (!canCompleteSlicing.value) {
    ElMessage.warning('当前勾选任务状态不支持完成切片');
    return;
  }
  directCompleteSlicing();
}

async function handlePrintSlides() {
  const rows = selectedPendingRows.value;
  if (rows.length === 0) {
    ElMessage.warning('请在玻片打印列表中至少勾选 1 行');
    return;
  }
  if (!canPrintSlides.value) {
    ElMessage.warning('当前勾选任务缺少玻片打印必要信息，无法打印玻片');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    ElMessage.warning('打印窗口被浏览器拦截，请允许弹出窗口后重试');
    return;
  }

  printing.value = true;
  pageError.value = '';
  try {
    const printedItems = await Promise.all(
      rows.map(async (row) => ({
        result:
          row.mergedPrintGroup && row.printGroupId
            ? await printSlicingSlideMergeGroup({
                printGroupId: row.printGroupId,
                printerCode: null,
                remarks: null,
                terminalCode: null,
              })
            : await printSlicingSlides({
                embeddingBoxId: row.embeddingBoxId,
                mergeAdjacent: false,
                printerCode: null,
                remarks: null,
                sourceSlideCount: 1,
                taskId: getRowTaskIds(row)[0] ?? row.taskId,
              }),
        row,
      })),
    );
    writeSlicingSlidePrintDocument(printWindow, printedItems);
    const printedSlideCount = printedItems.reduce(
      (total, item) => total + item.result.printedSlideCount,
      0,
    );
    ElMessage.success(`玻片打印完成，已生成 ${printedSlideCount} 张玻片`);
    await loadWorkbench();
  } catch (error) {
    printWindow.close();
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    printing.value = false;
  }
}

async function handleCreatePrintMergeGroups() {
  const rows = selectedPendingRows.value;
  if (rows.length === 0) {
    ElMessage.warning('请在玻片打印列表中至少勾选 1 行未打印记录');
    return;
  }
  if (!canMergeSlides.value) {
    ElMessage.warning('当前勾选记录包含已合片行或缺少蜡块信息，无法两两合片');
    return;
  }

  mergingPrintGroups.value = true;
  pageError.value = '';
  try {
    const result = await createSlicingSlidePrintMergeGroups({
      remarks: null,
      taskIds: getSelectedUniqueTaskIds(rows),
      terminalCode: null,
    });
    if (result.printGroupIds.length === 0) {
      ElMessage.warning('当前勾选记录没有可两两合片的组合');
    } else {
      ElMessage.success(`已生成 ${result.printGroupIds.length} 个合片组`);
    }
    await loadWorkbench();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    mergingPrintGroups.value = false;
  }
}

async function handleCancelPrintMergeGroups() {
  const rows = selectedPendingRows.value;
  if (rows.length === 0) {
    ElMessage.warning('请在玻片打印列表中勾选需要取消的合片行');
    return;
  }
  if (!canCancelMergedSlides.value) {
    ElMessage.warning('取消合片只支持未打印合片行');
    return;
  }

  cancelingPrintGroups.value = true;
  pageError.value = '';
  try {
    const printGroupIds = [
      ...new Set(
        rows.flatMap((row) => (row.printGroupId ? [row.printGroupId] : [])),
      ),
    ];
    const result = await cancelSlicingSlidePrintMergeGroups({
      printGroupIds,
      remarks: null,
      terminalCode: null,
    });
    ElMessage.success(`已取消 ${result.printGroupIds.length} 个合片组`);
    await loadWorkbench();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    cancelingPrintGroups.value = false;
  }
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
    const trackingResult = await getTechnicalTracking(row.caseId, {
      ...buildDateRangeQueryParams(filters.dateRange),
      workDate: resolveLegacyWorkDateFallback(),
    });
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
    const trackingResult = await getTechnicalTracking(row.caseId, {
      ...buildDateRangeQueryParams(filters.dateRange),
      workDate: resolveLegacyWorkDateFallback(),
    });
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
  if (selectedCompletedRows.value.length === 0) {
    showSingleSelectionWarning('请在今日已完成列表中至少勾选 1 行');
    return;
  }
  if (!canCreateQcEvaluation.value) {
    ElMessage.warning('当前勾选记录中存在不可评价的切片');
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
  return [
    row.timedOut ? 'is-overdue-row' : '',
    row.mergedPrintGroup ? 'is-merged-print-group-row' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

void loadWorkbench();
</script>

<template>
  <Page :show-header="false">
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
            <ElDatePicker
              v-model="filters.dateRange"
              :default-value="createDatePickerPanelDefaultValue()"
              :disabled-date="disableFutureDate"
              :shortcuts="dateRangeShortcuts"
              format="YYYY-MM-DD"
              end-placeholder="结束日期"
              range-separator="至"
              start-placeholder="开始日期"
              type="daterange"
              unlink-panels
              value-format="YYYY-MM-DD"
            />
          </div>
          <div class="legacy-query-bar__filter">
            <span class="legacy-query-bar__label">类型</span>
            <ElSelect
              v-model="filters.applicationType"
              class="legacy-application-type-select"
              placeholder="全部"
              @change="handleApplicationTypeChange"
            >
              <ElOption label="全部" value="" />
              <ElOption label="常规" value="ROUTINE" />
              <ElOption label="冰冻" value="FROZEN" />
            </ElSelect>
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
        <div v-if="activeTab === 'print'" class="legacy-action-bar__left">
          <ElButton
            :disabled="!canMergeSlides"
            :loading="mergingPrintGroups"
            type="success"
            @click="handleCreatePrintMergeGroups"
          >
            两两合片
          </ElButton>
          <ElButton
            :disabled="!canCancelMergedSlides"
            :loading="cancelingPrintGroups"
            @click="handleCancelPrintMergeGroups"
          >
            取消合片
          </ElButton>
          <ElButton
            :disabled="!canPrintSlides"
            :loading="printing"
            type="primary"
            @click="handlePrintSlides"
          >
            打印玻片
          </ElButton>
        </div>
        <div v-else class="legacy-action-bar__left">
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
      </section>

      <section class="legacy-panels">
        <article class="legacy-panel">
          <header class="legacy-panel__header">
            <div>
              <h3 class="legacy-panel__title">
                {{ activeTab === 'print' ? '玻片打印' : '切片' }}
              </h3>
              <p v-if="activeTab === 'slice'" class="legacy-panel__subtitle">
                只展示已完成玻片打印的待切任务，完成切片后右侧列表会立即刷新。
              </p>
            </div>
          </header>

          <ElTabs
            v-model="activeTab"
            class="legacy-slicing-tabs"
            @tab-change="handleTabChange"
          >
            <ElTabPane
              :label="`玻片打印(${workbench.pendingPrintTotal})`"
              name="print"
            />
            <ElTabPane
              :label="`切片(${workbench.pendingSliceTotal})`"
              name="slice"
            />
          </ElTabs>

          <ElTable
            ref="pendingTableRef"
            v-loading="loading"
            border
            :data="getPendingDataSource()"
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
            <template v-if="activeTab === 'print'">
              <ElTableColumn label="序" type="index" width="52" />
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
              <ElTableColumn label="病人ID" min-width="130">
                <template #default="{ row }">
                  <CopyableIdentifier
                    kind="patientId"
                    :fallback-value="row.patientId"
                    :value="row.patientIdDisplay"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="病理号" min-width="150">
                <template #default="{ row }">
                  <CopyableIdentifier
                    kind="pathologyNo"
                    :value="row.pathologyNo"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="蜡块号" min-width="120">
                <template #default="{ row }">
                  <span
                    :class="
                      row.mergedPrintGroup
                        ? 'legacy-merged-embedding-box-no'
                        : ''
                    "
                  >
                    {{ formatNullable(row.embeddingBoxNo) }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="包埋备注" min-width="160">
                <template #default="{ row }">
                  {{ formatNullable(getEmbeddingRemarks(row)) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="切片备注" min-width="160">
                <template #default="{ row }">
                  {{ formatNullable(getPendingRemark(row)) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="所属标本" min-width="180">
                <template #default="{ row }">
                  {{ formatNullable(row.specimenName) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="送检类型" min-width="110">
                <template #default="{ row }">
                  {{ formatApplicationTypeLabel(row.applicationType) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="包埋操作" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.embeddingOperatorName) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="申请科室" min-width="140">
                <template #default="{ row }">
                  {{ formatNullable(row.submittingDepartmentName) }}
                </template>
              </ElTableColumn>
            </template>
            <template v-else>
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
                  <CopyableIdentifier
                    kind="pathologyNo"
                    :value="row.pathologyNo"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn label="玻片号" min-width="140">
                <template #default="{ row }">
                  <span
                    :class="
                      row.combinedSlide ? 'legacy-merged-embedding-box-no' : ''
                    "
                  >
                    {{
                      formatSlicingSlideDisplayNo(
                        row.slideNo,
                        row.embeddingBoxNo,
                      )
                    }}
                  </span>
                </template>
              </ElTableColumn>
              <ElTableColumn label="打印状态" min-width="120">
                <template #default="{ row }">
                  <ElTag
                    size="small"
                    :type="
                      row.slidePrintStatus === 'PRINTED' ? 'success' : 'warning'
                    "
                  >
                    {{
                      row.slidePrintStatus === 'PRINTED' ? '已打印' : '待打印'
                    }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="已打印数" min-width="100">
                <template #default="{ row }">
                  {{ row.printedSlideCount }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="合并" min-width="100">
                <template #default="{ row }">
                  {{ row.combinedSlide ? '已合并' : '未合并' }}
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
                  <CopyableIdentifier
                    kind="patientId"
                    :fallback-value="row.patientId"
                    :value="row.patientIdDisplay"
                  />
                </template>
              </ElTableColumn>
            </template>
          </ElTable>

          <div class="legacy-panel__footer">
            <ElPagination
              v-model:current-page="filters.pendingPage"
              v-model:page-size="filters.pendingSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="
                activeTab === 'print'
                  ? workbench.pendingPrintTotal
                  : workbench.pendingSliceTotal
              "
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
                <CopyableIdentifier
                  kind="patientId"
                  :fallback-value="row.patientId"
                  :value="row.patientIdDisplay"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="病理号" min-width="150">
              <template #default="{ row }">
                <CopyableIdentifier
                  kind="pathologyNo"
                  :value="row.pathologyNo"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="玻片号" min-width="140">
              <template #default="{ row }">
                <span
                  :class="
                    row.combinedSlide ? 'legacy-merged-embedding-box-no' : ''
                  "
                >
                  {{
                    formatSlicingSlideDisplayNo(row.slideNo, row.embeddingBoxNo)
                  }}
                </span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="切片操作" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.slicingOperatorName) }}
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
      :tasks="selectedPendingTasks"
      @submitted="handleProcessSubmitted"
    />

    <SlicingQcEvaluationDialog
      v-model="qcDialogVisible"
      :row="selectedCompletedRow"
      :rows="selectedCompletedRows"
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

.legacy-query-bar__filter {
  display: flex;
  gap: 12px;
  align-items: center;
}

.legacy-application-type-select {
  width: 120px;
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

.legacy-action-bar__left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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

.legacy-slicing-tabs {
  padding: 0 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.legacy-panel :deep(.is-overdue-row > td) {
  background: hsl(var(--warning) / 12%);
}

.legacy-panel :deep(.is-merged-print-group-row > td) {
  background: hsl(var(--success) / 8%);
}

.legacy-merged-embedding-box-no {
  display: inline-flex;
  max-width: 100%;
  padding: 2px 8px;
  font-weight: 700;
  color: hsl(var(--success));
  overflow-wrap: anywhere;
  background: hsl(var(--success) / 12%);
  border: 1px solid hsl(var(--success) / 28%);
  border-radius: 4px;
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
  .legacy-query-bar__filter,
  .legacy-action-bar__left {
    justify-content: flex-start;
  }

  .legacy-stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
