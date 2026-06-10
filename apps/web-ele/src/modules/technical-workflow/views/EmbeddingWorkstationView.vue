<script setup lang="ts">
import type {
  EmbeddingWorkstationSummary,
  PendingTechnicalTaskItem,
  TechnicalTrackingEmbeddingRecordSummary,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { UserRoundPen } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDrawer,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  cancelEmbedding,
  completeEmbedding,
  getEmbeddingWorkstationSummary,
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startEmbedding,
  updateEmbeddingQualityReview,
  updateTechnicalTaskRemarks,
} from '../api/technical-workflow-service';
import EmbeddingQualityReviewDialog from '../components/EmbeddingQualityReviewDialog.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatEvaluationResult,
  formatNullable,
  formatQcType,
  formatReworkType,
  formatTaskStatus,
} from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import {
  assignTechnicalOperatorForm,
  createTechnicalOperatorDefaults,
  normalizeTechnicalOperatorPayload,
} from '../utils/operator-form';

interface EvaluationDrawerRow {
  category: string;
  description: string;
  operator: string;
  status: string;
  time: null | string;
  title: string;
}

type EmbeddingWorkstationRecordRow = TechnicalTrackingEmbeddingRecordSummary & {
  pendingTask: null | PendingTechnicalTaskItem;
  rowKind: 'completed' | 'completion-pending';
};

interface PendingCompletionDraft {
  evaluationLevel: string;
  samplingEvaluation: string;
  sliceNotice: string;
}

interface EmbeddingQualityReviewDraftPayload {
  evaluationLevel: string;
  samplingEvaluation: string;
}

type PendingRemarksField = 'productionRemarks' | 'remarks';

const SLICE_NOTICE_OPTIONS = [
  '骨组织',
  '皮肤',
  '粘膜活检',
  '小活检',
  '其他',
] as const;
const SHIFT_REMARK_OPTIONS = ['未脱钙', '脱钙未完成', '其他'] as const;
const DEFAULT_EMBEDDING_EVALUATION_LEVEL = 'QUALIFIED';
const DEFAULT_SAMPLING_EVALUATION = '合格';

function createEmptySummary(): EmbeddingWorkstationSummary {
  return {
    completedCount: 0,
    completedRecords: [],
    pendingCount: 0,
    pendingTasks: [],
    workDate: null,
  };
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const navigation = useTechnicalWorkflowNavigation(router);

const pageError = ref('');
const loading = ref(false);
const summaryLoading = ref(false);
const trackingLoading = ref(false);
const completeLoading = ref(false);
const cancelEmbeddingLoading = ref(false);

const workstationSummary =
  ref<EmbeddingWorkstationSummary>(createEmptySummary());
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const total = ref(0);

const selectedTaskId = ref(
  typeof route.query.taskId === 'string' ? route.query.taskId : '',
);
const deepLinkedTaskId = ref(selectedTaskId.value);
const activeProcessingTaskId = ref('');

const historyDrawerVisible = ref(false);
const evaluationDrawerVisible = ref(false);
const taskDrawerVisible = ref(false);
const qualityReviewDialogVisible = ref(false);
const selectedQualityReviewRecord = ref<EmbeddingWorkstationRecordRow | null>(
  null,
);
const qualityReviewDialogMode = ref<'draft' | 'persist'>('persist');
const savingReviewIds = ref<string[]>([]);
const savingPendingRemarksTaskIds = ref<string[]>([]);
const selectedCompletedEmbeddingId = ref('');
const selectedCompletedEmbeddingIds = ref<string[]>([]);
const selectedPendingTaskIds = ref<string[]>([]);

const filters = reactive({
  keyword:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
});
let skipNextActivationRefresh = true;

const operatorForm = reactive(
  createTechnicalOperatorDefaults(userStore.userInfo ?? undefined),
);

const completeForm = reactive({
  blockCount: 1,
  deviceCode: '',
  embeddingBoxNo: '',
  evaluationLevel: DEFAULT_EMBEDDING_EVALUATION_LEVEL,
  samplingBlockId: '',
  samplingEvaluation: DEFAULT_SAMPLING_EVALUATION,
  sliceNotice: '',
});

const sliceNoticeDrafts = reactive<Record<string, string>>({});
const pendingCompletionDrafts = reactive<
  Record<string, PendingCompletionDraft>
>({});
const pendingRemarksEditor = reactive<{
  field: null | PendingRemarksField;
  productionRemarks: string;
  remarks: string;
  taskId: string;
}>({
  field: null,
  productionRemarks: '',
  remarks: '',
  taskId: '',
});

const selectedTask = computed(
  () =>
    pendingItems.value.find((item) => item.id === selectedTaskId.value) ?? null,
);

const selectedPendingTasks = computed(() =>
  pendingItems.value.filter((item) =>
    selectedPendingTaskIds.value.includes(item.id),
  ),
);

const currentCaseEmbeddingRecords = computed(
  () => trackingResult.value?.embeddingRecords ?? [],
);

const leftPendingItems = computed(() =>
  pendingItems.value.filter((item) => !isEmbeddingCompletionPendingTask(item)),
);

const pendingCompletionTasks = computed(() =>
  workstationSummary.value.pendingTasks.filter((item) =>
    isEmbeddingCompletionPendingTask(item),
  ),
);

const completedEmbeddingRecords = computed<EmbeddingWorkstationRecordRow[]>(
  () => [
    ...pendingCompletionTasks.value.map((item) =>
      mapPendingTaskToEmbeddingRow(item),
    ),
    ...workstationSummary.value.completedRecords.map((item) => ({
      ...item,
      pendingTask: null,
      rowKind: 'completed' as const,
    })),
  ],
);

const pendingItemIds = computed(() =>
  leftPendingItems.value.map((item) => item.id),
);

const completedEmbeddingRecordIds = computed(() =>
  completedEmbeddingRecords.value.map((item) => item.embeddingId),
);

const isAllPendingItemsSelected = computed(
  () =>
    pendingItemIds.value.length > 0 &&
    pendingItemIds.value.every((itemId) =>
      selectedPendingTaskIds.value.includes(itemId),
    ),
);

const isPendingSelectionIndeterminate = computed(
  () =>
    selectedPendingTaskIds.value.length > 0 && !isAllPendingItemsSelected.value,
);

const isAllCompletedEmbeddingRecordsSelected = computed(
  () =>
    completedEmbeddingRecordIds.value.length > 0 &&
    completedEmbeddingRecordIds.value.every((embeddingId) =>
      selectedCompletedEmbeddingIds.value.includes(embeddingId),
    ),
);

const isCompletedEmbeddingSelectionIndeterminate = computed(
  () =>
    selectedCompletedEmbeddingIds.value.length > 0 &&
    !isAllCompletedEmbeddingRecordsSelected.value,
);

const selectedCompletedEmbeddingRecord = computed(
  () =>
    completedEmbeddingRecords.value.find(
      (item) => item.embeddingId === selectedCompletedEmbeddingId.value,
    ) ??
    completedEmbeddingRecords.value[0] ??
    null,
);

const selectedCompletionPendingTasks = computed(() => {
  const selectedRows = completedEmbeddingRecords.value.filter((item) =>
    selectedCompletedEmbeddingIds.value.includes(item.embeddingId),
  );
  const selectedTasks = selectedRows
    .map((item) => item.pendingTask)
    .filter((item): item is PendingTechnicalTaskItem => item !== null);
  if (selectedTasks.length > 0) {
    return selectedTasks;
  }
  return selectedCompletedEmbeddingRecord.value?.pendingTask
    ? [selectedCompletedEmbeddingRecord.value.pendingTask]
    : [];
});

function isEmbeddingCompletionPendingTask(task: PendingTechnicalTaskItem) {
  return (
    task.taskStatus === 'EMBEDDING_CONFIRM_PENDING' ||
    task.taskStatus === 'IN_PROGRESS'
  );
}

function isEmbeddingReadyToComplete(task: PendingTechnicalTaskItem) {
  return (
    isEmbeddingCompletionPendingTask(task) ||
    activeProcessingTaskId.value === task.id
  );
}

function mapPendingTaskToEmbeddingRow(
  task: PendingTechnicalTaskItem,
): EmbeddingWorkstationRecordRow {
  const draft = pendingCompletionDrafts[task.id];
  return {
    caseId: task.caseId,
    embeddedByName: task.assignedToName ?? null,
    embeddingBoxId: '',
    embeddingBoxNo: null,
    embeddingId: `TASK-${task.id}`,
    embeddingRemarks: task.remarks,
    endedAt: task.startedAt,
    evaluationLevel: draft?.evaluationLevel ?? null,
    grossDescription: null,
    pathologyNo: task.pathologyNo,
    pendingTask: task,
    rowKind: 'completion-pending',
    sampledAt: task.sampledAt ?? null,
    sampledByName: task.sampledByName ?? null,
    samplingBlockCode: task.samplingBlockCode ?? task.objectDisplayNo ?? null,
    samplingBlockDescription: task.samplingBlockDescription ?? null,
    samplingBlockId: task.objectId ?? '',
    samplingEvaluation: draft?.samplingEvaluation ?? null,
    sliceNotice: draft?.sliceNotice ?? null,
    specimenId: task.specimenId ?? '',
    specimenName: null,
    startedAt: task.startedAt,
    taskId: task.id,
    taskStatus: task.taskStatus,
  };
}

const evaluationDrawerRows = computed<EvaluationDrawerRow[]>(() => {
  if (!trackingResult.value) {
    return [];
  }

  const rows: EvaluationDrawerRow[] = [];

  (trackingResult.value.embeddingEvaluationRecords ?? []).forEach((item) => {
    rows.push({
      category: '包埋评价',
      description: [
        `取材评价：${formatNullable(item.samplingEvaluation)}`,
        `包埋备注：${formatNullable(item.embeddingRemarks)}`,
      ].join(' / '),
      operator: formatNullable(item.embeddedByName),
      status: formatNullable(item.evaluationLevel),
      time: item.endedAt,
      title: `${formatNullable(item.samplingBlockCode)} / ${formatNullable(item.specimenName)}`,
    });
  });

  trackingResult.value.qcEvaluations.forEach((item) => {
    rows.push({
      category: '质控记录',
      description: [
        `质控类型：${formatQcType(item.qcType)}`,
        `问题：${formatNullable(item.issueDescription)}`,
        `建议：${formatNullable(item.improvementSuggestion)}`,
      ].join(' / '),
      operator: formatNullable(item.evaluatorName),
      status: formatEvaluationResult(item.evaluationResult),
      time: item.evaluatedAt,
      title: formatNullable(item.slideNo),
    });
  });

  trackingResult.value.reworks.forEach((item) => {
    rows.push({
      category: '返工记录',
      description: `返工原因：${formatNullable(item.reason)}`,
      operator: '-',
      status: formatTaskStatus(item.status),
      time: null,
      title: formatReworkType(item.reworkType),
    });
  });

  return rows.toSorted((left, right) => {
    const leftTime = left.time ? new Date(left.time).getTime() : 0;
    const rightTime = right.time ? new Date(right.time).getTime() : 0;
    return rightTime - leftTime;
  });
});

const canCompleteSelectedTask = computed(() => {
  if (selectedCompletionPendingTasks.value.length > 0) {
    return selectedCompletionPendingTasks.value.every(
      (item) =>
        getSamplingBlockIdFromTask(item).length > 0 &&
        isEmbeddingReadyToComplete(item),
    );
  }
  return false;
});

const canCancelSelectedEmbedding = computed(
  () =>
    selectedCompletionPendingTasks.value.length > 0 &&
    selectedCompletionPendingTasks.value.every(
      (item) => item.taskStatus === 'EMBEDDING_CONFIRM_PENDING',
    ),
);

const canConfirmSelectedTask = computed(() => {
  if (selectedPendingTasks.value.length > 0) {
    return selectedPendingTasks.value.every(
      (item) => item.taskStatus === 'PENDING',
    );
  }
  return selectedTask.value?.taskStatus === 'PENDING';
});

function resetCompleteForm(task: null | PendingTechnicalTaskItem) {
  completeForm.blockCount = 1;
  completeForm.deviceCode = '';
  completeForm.embeddingBoxNo = '';
  completeForm.evaluationLevel = DEFAULT_EMBEDDING_EVALUATION_LEVEL;
  completeForm.samplingBlockId =
    task?.objectType === 'SAMPLING_BLOCK' ? (task.objectId ?? '') : '';
  completeForm.samplingEvaluation = DEFAULT_SAMPLING_EVALUATION;
  completeForm.sliceNotice = '';
}

function getSamplingBlockIdFromTask(task: PendingTechnicalTaskItem) {
  return task.objectType === 'SAMPLING_BLOCK'
    ? (task.objectId ?? '').trim()
    : '';
}

function resolveEmbeddingActionTasks() {
  if (selectedPendingTasks.value.length > 0) {
    return {
      tasks: selectedPendingTasks.value,
      usePanelForm: false,
    };
  }
  const task = selectedTask.value;
  if (!task) {
    ElMessage.warning('请先选择待包埋任务');
    return null;
  }
  return {
    tasks: [task],
    usePanelForm: true,
  };
}

function resolveEmbeddingCompletionActionTasks() {
  if (selectedCompletionPendingTasks.value.length === 0) {
    ElMessage.warning('请先选择包埋确认待完成任务');
    return null;
  }
  return {
    tasks: selectedCompletionPendingTasks.value,
    usePanelForm: false,
  };
}

function resolveEmbeddingCancelActionTasks() {
  const tasks = selectedCompletionPendingTasks.value.filter(
    (item) => item.taskStatus === 'EMBEDDING_CONFIRM_PENDING',
  );
  if (tasks.length === 0) {
    ElMessage.warning('请先选择包埋确认待完成任务');
    return null;
  }
  return { tasks };
}

function resetOperatorForm() {
  assignTechnicalOperatorForm(operatorForm, userStore.userInfo ?? undefined);
}

function resetPanelState(task: null | PendingTechnicalTaskItem) {
  resetOperatorForm();
  resetCompleteForm(task);
}

function clearCurrentSelection() {
  selectedTaskId.value = '';
  activeProcessingTaskId.value = '';
  trackingResult.value = null;
  resetPanelState(null);
}

async function loadTrackingForTask(task: null | PendingTechnicalTaskItem) {
  if (!task?.caseId) {
    trackingResult.value = null;
    return;
  }
  trackingLoading.value = true;
  try {
    trackingResult.value = await getTechnicalTracking(task.caseId);
  } catch (error) {
    trackingResult.value = null;
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    trackingLoading.value = false;
  }
}

function resolvePreferredTaskId(
  items: PendingTechnicalTaskItem[],
  preferredTaskId?: string,
) {
  const candidates = [
    preferredTaskId,
    deepLinkedTaskId.value,
    selectedTaskId.value,
  ].filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  );
  for (const candidate of candidates) {
    if (items.some((item) => item.id === candidate)) {
      return candidate;
    }
  }
  return items[0]?.id ?? '';
}

async function loadSummary() {
  summaryLoading.value = true;
  try {
    workstationSummary.value = await getEmbeddingWorkstationSummary();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    summaryLoading.value = false;
  }
}

async function loadPendingData(preferredTaskId?: string) {
  loading.value = true;
  try {
    const result = await listPendingTechnicalTasks({
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      size: filters.size,
      taskStatus: 'PENDING',
      taskType: 'EMBEDDING',
    });
    pendingItems.value = result.items;
    total.value = result.total;

    const nextTaskId = resolvePreferredTaskId(result.items, preferredTaskId);
    deepLinkedTaskId.value = '';

    if (!nextTaskId) {
      clearCurrentSelection();
      return;
    }

    if (selectedTaskId.value !== nextTaskId) {
      selectedTaskId.value = nextTaskId;
      return;
    }

    if (selectedTask.value) {
      await loadTrackingForTask(selectedTask.value);
    }
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    loading.value = false;
  }
}

async function refreshWorkstation(preferredTaskId?: string) {
  await Promise.all([loadSummary(), loadPendingData(preferredTaskId)]);
}

async function refreshCurrentCaseData() {
  await Promise.all([loadSummary(), loadTrackingForTask(selectedTask.value)]);
}

async function refreshCompletedRecords() {
  await loadSummary();
}

function selectTask(taskId: string) {
  if (taskId === selectedTaskId.value) {
    return;
  }
  selectedTaskId.value = taskId;
}

function selectCompletedEmbedding(embeddingId: string) {
  selectedCompletedEmbeddingId.value = embeddingId;
}

function togglePendingTaskSelection(
  taskId: string,
  selected: boolean | number | string,
) {
  const nextSelected = Boolean(selected);
  selectedPendingTaskIds.value = nextSelected
    ? [...new Set([...selectedPendingTaskIds.value, taskId])]
    : selectedPendingTaskIds.value.filter((item) => item !== taskId);
}

function toggleAllPendingTaskSelections(selected: boolean | number | string) {
  selectedPendingTaskIds.value = selected ? [...pendingItemIds.value] : [];
}

function toggleCompletedEmbeddingSelection(
  embeddingId: string,
  selected: boolean | number | string,
) {
  selectedCompletedEmbeddingIds.value = selected
    ? [...new Set([...selectedCompletedEmbeddingIds.value, embeddingId])]
    : selectedCompletedEmbeddingIds.value.filter(
        (item) => item !== embeddingId,
      );
}

function toggleAllCompletedEmbeddingSelections(
  selected: boolean | number | string,
) {
  selectedCompletedEmbeddingIds.value = selected
    ? [...completedEmbeddingRecordIds.value]
    : [];
}

function isPendingRemarksEditing(
  item: PendingTechnicalTaskItem,
  field: PendingRemarksField,
) {
  return (
    pendingRemarksEditor.taskId === item.id &&
    pendingRemarksEditor.field === field
  );
}

function getPendingRemarksDraft(
  item: PendingTechnicalTaskItem,
  field: PendingRemarksField,
) {
  if (!isPendingRemarksEditing(item, field)) {
    return field === 'remarks'
      ? (item.remarks ?? '')
      : (item.productionRemarks ?? '');
  }
  return field === 'remarks'
    ? pendingRemarksEditor.remarks
    : pendingRemarksEditor.productionRemarks;
}

function getShiftRemarkOptions(item: PendingTechnicalTaskItem) {
  const currentProductionRemarks = item.productionRemarks?.trim();
  return currentProductionRemarks &&
    !SHIFT_REMARK_OPTIONS.includes(
      currentProductionRemarks as (typeof SHIFT_REMARK_OPTIONS)[number],
    )
    ? [currentProductionRemarks, ...SHIFT_REMARK_OPTIONS]
    : [...SHIFT_REMARK_OPTIONS];
}

function isSavingPendingRemarks(taskId: string) {
  return savingPendingRemarksTaskIds.value.includes(taskId);
}

function setSavingPendingRemarks(taskId: string, saving: boolean) {
  savingPendingRemarksTaskIds.value = saving
    ? [...new Set([...savingPendingRemarksTaskIds.value, taskId])]
    : savingPendingRemarksTaskIds.value.filter((item) => item !== taskId);
}

function beginPendingRemarksEdit(
  item: PendingTechnicalTaskItem,
  field: PendingRemarksField,
) {
  selectTask(item.id);
  pendingRemarksEditor.taskId = item.id;
  pendingRemarksEditor.field = field;
  pendingRemarksEditor.remarks = item.remarks ?? '';
  pendingRemarksEditor.productionRemarks = item.productionRemarks ?? '';
}

function updatePendingRemarksDraft(
  item: PendingTechnicalTaskItem,
  field: PendingRemarksField,
  value: string,
) {
  if (!isPendingRemarksEditing(item, field)) {
    beginPendingRemarksEdit(item, field);
  }
  if (field === 'remarks') {
    pendingRemarksEditor.remarks = value;
    return;
  }
  pendingRemarksEditor.productionRemarks = value;
}

function cancelPendingRemarksEdit() {
  pendingRemarksEditor.taskId = '';
  pendingRemarksEditor.field = null;
  pendingRemarksEditor.remarks = '';
  pendingRemarksEditor.productionRemarks = '';
}

function applyPendingTaskUpdate(nextTask: PendingTechnicalTaskItem) {
  pendingItems.value = pendingItems.value.map((item) =>
    item.id === nextTask.id ? { ...item, ...nextTask } : item,
  );
  workstationSummary.value = {
    ...workstationSummary.value,
    pendingTasks: workstationSummary.value.pendingTasks.map((item) =>
      item.id === nextTask.id ? { ...item, ...nextTask } : item,
    ),
  };
}

async function handlePendingRemarksSave(item: PendingTechnicalTaskItem) {
  const nextRemarks = pendingRemarksEditor.remarks.trim();
  const nextProductionRemarks = pendingRemarksEditor.productionRemarks.trim();
  const currentRemarks = item.remarks ?? '';
  const currentProductionRemarks = item.productionRemarks ?? '';

  if (
    nextRemarks === currentRemarks &&
    nextProductionRemarks === currentProductionRemarks
  ) {
    cancelPendingRemarksEdit();
    return;
  }

  setSavingPendingRemarks(item.id, true);
  try {
    const nextTask = await updateTechnicalTaskRemarks(item.id, {
      productionRemarks: nextProductionRemarks || null,
      remarks: nextRemarks || null,
    });
    applyPendingTaskUpdate(nextTask);
    ElMessage.success('任务备注已保存');
    cancelPendingRemarksEdit();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    setSavingPendingRemarks(item.id, false);
  }
}

async function savePendingRemarksEdit(
  item: PendingTechnicalTaskItem,
  field: PendingRemarksField,
) {
  if (!isPendingRemarksEditing(item, field)) {
    return;
  }
  await handlePendingRemarksSave(item);
}

async function handleSearch() {
  filters.page = 1;
  await refreshWorkstation();
}

function resolveEmbeddingCompletionRemarks(task: PendingTechnicalTaskItem) {
  return task.remarks?.trim() || operatorForm.remarks.trim() || null;
}

function getPendingCompletionDraft(taskId: string) {
  return pendingCompletionDrafts[taskId];
}

function updatePendingCompletionDraft(
  taskId: string,
  value: Partial<PendingCompletionDraft>,
) {
  pendingCompletionDrafts[taskId] = {
    evaluationLevel:
      value.evaluationLevel ??
      pendingCompletionDrafts[taskId]?.evaluationLevel ??
      DEFAULT_EMBEDDING_EVALUATION_LEVEL,
    samplingEvaluation:
      value.samplingEvaluation ??
      pendingCompletionDrafts[taskId]?.samplingEvaluation ??
      '',
    sliceNotice:
      value.sliceNotice ?? pendingCompletionDrafts[taskId]?.sliceNotice ?? '',
  };
}

function getEmbeddingRowSliceNotice(row: EmbeddingWorkstationRecordRow) {
  if (row.pendingTask) {
    return getPendingCompletionDraft(row.pendingTask.id)?.sliceNotice ?? '';
  }
  return sliceNoticeDrafts[row.embeddingId] ?? '';
}

function getCompletionEvaluationLevel(task: PendingTechnicalTaskItem) {
  return (
    getPendingCompletionDraft(task.id)?.evaluationLevel ||
    DEFAULT_EMBEDDING_EVALUATION_LEVEL
  );
}

function getCompletionSamplingEvaluation(task: PendingTechnicalTaskItem) {
  return (
    getPendingCompletionDraft(task.id)?.samplingEvaluation.trim() ||
    DEFAULT_SAMPLING_EVALUATION
  );
}

function getCompletionSliceNotice(task: PendingTechnicalTaskItem) {
  return getPendingCompletionDraft(task.id)?.sliceNotice.trim() || null;
}

async function completeEmbeddingTask(
  task: PendingTechnicalTaskItem,
  usePanelForm: boolean,
) {
  if (!isEmbeddingReadyToComplete(task)) {
    throw new Error('当前任务状态不支持完成包埋');
  }

  const samplingBlockId = usePanelForm
    ? completeForm.samplingBlockId.trim()
    : getSamplingBlockIdFromTask(task);
  const operatorPayload = normalizeTechnicalOperatorPayload(operatorForm);
  return completeEmbedding({
    ...operatorPayload,
    blockCount: completeForm.blockCount,
    deviceCode: completeForm.deviceCode.trim() || null,
    embeddingBoxNo: usePanelForm
      ? completeForm.embeddingBoxNo.trim() || null
      : null,
    evaluationLevel: usePanelForm
      ? completeForm.evaluationLevel || DEFAULT_EMBEDDING_EVALUATION_LEVEL
      : getCompletionEvaluationLevel(task),
    samplingBlockId,
    samplingEvaluation: usePanelForm
      ? completeForm.samplingEvaluation.trim() || DEFAULT_SAMPLING_EVALUATION
      : getCompletionSamplingEvaluation(task),
    sliceNotice: usePanelForm
      ? completeForm.sliceNotice.trim() || null
      : getCompletionSliceNotice(task),
    remarks: resolveEmbeddingCompletionRemarks(task),
    taskId: task.id,
  });
}

async function handleConfirmEmbedding() {
  const actionTasks = resolveEmbeddingActionTasks();
  if (!actionTasks) {
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }
  if (actionTasks.tasks.some((task) => task.taskStatus !== 'PENDING')) {
    ElMessage.warning('当前任务状态不支持确认包埋');
    return;
  }

  completeLoading.value = true;
  try {
    const results = await Promise.allSettled(
      actionTasks.tasks.map((task) =>
        startEmbedding({
          ...normalizeTechnicalOperatorPayload(operatorForm),
          taskId: task.id,
        }),
      ),
    );
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const succeededCount = results.length - failedResults.length;

    if (failedResults.length === 0) {
      ElMessage.success(
        actionTasks.tasks.length === 1
          ? '已确认包埋，状态已更新为包埋确认待完成'
          : `已确认包埋 ${actionTasks.tasks.length} 条任务，状态已更新为包埋确认待完成`,
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
          ? `已确认包埋 ${succeededCount} 条任务，${failedResults.length} 条失败`
          : '确认包埋失败，请重试',
      );
    }

    await refreshWorkstation();
  } finally {
    completeLoading.value = false;
  }
}

async function handleCompleteEmbedding() {
  const actionTasks = resolveEmbeddingCompletionActionTasks();
  if (!actionTasks) {
    return;
  }
  if (!operatorForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }
  if (
    actionTasks.tasks.some((task) =>
      actionTasks.usePanelForm
        ? !completeForm.samplingBlockId.trim()
        : !getSamplingBlockIdFromTask(task),
    )
  ) {
    ElMessage.warning('当前缺少取材块编号');
    return;
  }
  if (actionTasks.tasks.some((task) => !isEmbeddingReadyToComplete(task))) {
    ElMessage.warning('当前任务状态不支持完成包埋');
    return;
  }

  completeLoading.value = true;
  try {
    const results = await Promise.allSettled(
      actionTasks.tasks.map((task) =>
        completeEmbeddingTask(task, actionTasks.usePanelForm),
      ),
    );
    const failedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    const succeededCount = results.length - failedResults.length;

    if (failedResults.length === 0) {
      const firstResult = results[0];
      const embeddingResult =
        firstResult?.status === 'fulfilled' ? firstResult.value : null;
      let successMessage = `已完成包埋 ${actionTasks.tasks.length} 条任务`;
      if (actionTasks.tasks.length === 1 && embeddingResult) {
        successMessage = embeddingResult.markingSuccess
          ? `包埋完成，包埋盒 ${embeddingResult.embeddingBoxId} 打号成功`
          : `包埋完成，打号结果：${formatNullable(
              embeddingResult.markingMessage,
            )}`;
      }
      ElMessage.success(successMessage);
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
          ? `已完成包埋 ${succeededCount} 条任务，${failedResults.length} 条失败`
          : '包埋完成失败，请重试',
      );
    }

    activeProcessingTaskId.value = '';
    await refreshWorkstation();
  } finally {
    completeLoading.value = false;
  }
}

async function handleCancelEmbedding() {
  const actionTasks = resolveEmbeddingCancelActionTasks();
  if (!actionTasks) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定取消选中的 ${actionTasks.tasks.length} 条包埋确认待完成任务，并打回待包埋列表吗？`,
      '取消包埋',
      {
        cancelButtonText: '取消',
        confirmButtonText: '确定',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  cancelEmbeddingLoading.value = true;
  try {
    const payload = normalizeTechnicalOperatorPayload(operatorForm);
    const results = await Promise.allSettled(
      actionTasks.tasks.map((task) =>
        cancelEmbedding({
          remarks: payload.remarks,
          taskId: task.id,
          terminalCode: payload.terminalCode,
        }),
      ),
    );
    const firstFailure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (firstFailure) {
      throw firstFailure.reason;
    }
    selectedCompletedEmbeddingIds.value =
      selectedCompletedEmbeddingIds.value.filter(
        (embeddingId) =>
          !actionTasks.tasks.some((task) => embeddingId === `TASK-${task.id}`),
      );
    ElMessage.success(
      actionTasks.tasks.length > 1
        ? `已取消包埋 ${actionTasks.tasks.length} 条任务，并打回待包埋列表`
        : '已取消包埋，任务已打回待包埋列表',
    );
    await refreshWorkstation();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    cancelEmbeddingLoading.value = false;
  }
}

async function handleClearCurrent() {
  if (
    total.value > 0 ||
    pendingItems.value.length > 0 ||
    workstationSummary.value.pendingCount > 0 ||
    workstationSummary.value.pendingTasks.length > 0
  ) {
    ElMessage.warning('还有待处理的数据');
    return;
  }

  try {
    await ElMessageBox.confirm('确认今日包埋工作已完成了吗？', '确认清零', {
      cancelButtonText: '取消',
      confirmButtonText: '确定',
      type: 'info',
    });
  } catch {
    return;
  }
  clearCurrentSelection();
}

function isSavingReview(embeddingId: string) {
  return savingReviewIds.value.includes(embeddingId);
}

function setSavingReview(embeddingId: string, saving: boolean) {
  savingReviewIds.value = saving
    ? [...new Set([...savingReviewIds.value, embeddingId])]
    : savingReviewIds.value.filter((item) => item !== embeddingId);
}

async function handleSliceNoticeSave(
  row: TechnicalTrackingEmbeddingRecordSummary,
) {
  const nextSliceNotice = (sliceNoticeDrafts[row.embeddingId] ?? '').trim();
  const currentSliceNotice = row.sliceNotice ?? '';
  if (nextSliceNotice === currentSliceNotice) {
    return;
  }

  setSavingReview(row.embeddingId, true);
  try {
    await updateEmbeddingQualityReview(row.embeddingId, {
      evaluationLevel: row.evaluationLevel,
      samplingEvaluation: row.samplingEvaluation,
      sliceNotice: nextSliceNotice || null,
    });
    ElMessage.success('切片备注已保存');
    await refreshCompletedRecords();
  } catch (error) {
    sliceNoticeDrafts[row.embeddingId] = currentSliceNotice;
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    setSavingReview(row.embeddingId, false);
  }
}

function handleSliceNoticeChange(
  row: EmbeddingWorkstationRecordRow,
  value: unknown,
) {
  const nextValue = typeof value === 'string' ? value : String(value ?? '');
  if (row.pendingTask) {
    updatePendingCompletionDraft(row.pendingTask.id, {
      sliceNotice: nextValue,
    });
    ElMessage.success('切片备注已暂存，确认包埋完成时提交');
    return;
  }
  sliceNoticeDrafts[row.embeddingId] = nextValue;
  void handleSliceNoticeSave(row);
}

function openQualityReviewDialog(row: EmbeddingWorkstationRecordRow) {
  qualityReviewDialogMode.value = row.pendingTask ? 'draft' : 'persist';
  selectedQualityReviewRecord.value = row;
  qualityReviewDialogVisible.value = true;
}

async function handleQualityReviewSubmitted() {
  await refreshCurrentCaseData();
}

function handleQualityReviewDraftSubmitted(
  value: EmbeddingQualityReviewDraftPayload,
) {
  const taskId = selectedQualityReviewRecord.value?.pendingTask?.id;
  if (!taskId) {
    return;
  }
  updatePendingCompletionDraft(taskId, {
    evaluationLevel: value.evaluationLevel,
    samplingEvaluation: value.samplingEvaluation,
  });
  ElMessage.success('取材评价已暂存，确认包埋完成时提交');
}

function handleMore() {
  if (!selectedTask.value) {
    ElMessage.warning('请先选择任务后再查看更多信息');
    return;
  }
  void navigation.goToTracking({
    caseId: selectedTask.value.caseId,
    pathologyNo: selectedTask.value.pathologyNo ?? undefined,
    taskId: selectedTask.value.id,
  });
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key !== 'F9') {
    return;
  }
  event.preventDefault();
  if (canCompleteSelectedTask.value && !completeLoading.value) {
    void handleCompleteEmbedding();
    return;
  }
  if (canConfirmSelectedTask.value && !completeLoading.value) {
    void handleConfirmEmbedding();
  }
}

watch(selectedTaskId, async () => {
  const task = selectedTask.value;
  activeProcessingTaskId.value =
    task?.taskStatus === 'IN_PROGRESS' ||
    task?.taskStatus === 'EMBEDDING_CONFIRM_PENDING'
      ? task.id
      : '';
  resetPanelState(task);
  await loadTrackingForTask(task);
});

watch(
  completedEmbeddingRecords,
  (records) => {
    const completedRecords = records.filter(
      (item) => item.rowKind === 'completed',
    );
    const recordIds = new Set(completedRecords.map((item) => item.embeddingId));
    Object.keys(sliceNoticeDrafts).forEach((embeddingId) => {
      if (!recordIds.has(embeddingId)) {
        delete sliceNoticeDrafts[embeddingId];
      }
    });
    completedRecords.forEach((item) => {
      sliceNoticeDrafts[item.embeddingId] = item.sliceNotice ?? '';
    });
  },
  { immediate: true },
);

watch(
  completedEmbeddingRecords,
  (records) => {
    if (
      selectedCompletedEmbeddingId.value &&
      records.some(
        (item) => item.embeddingId === selectedCompletedEmbeddingId.value,
      )
    ) {
      return;
    }
    selectedCompletedEmbeddingId.value = records[0]?.embeddingId ?? '';
  },
  { immediate: true },
);

watch(pendingItems, (items) => {
  const itemIds = new Set(items.map((item) => item.id));
  selectedPendingTaskIds.value = selectedPendingTaskIds.value.filter((itemId) =>
    itemIds.has(itemId),
  );
});

watch(completedEmbeddingRecords, (records) => {
  const recordIds = new Set(records.map((item) => item.embeddingId));
  selectedCompletedEmbeddingIds.value =
    selectedCompletedEmbeddingIds.value.filter((embeddingId) =>
      recordIds.has(embeddingId),
    );
});

watch(pendingCompletionTasks, (tasks) => {
  const taskIds = new Set(tasks.map((item) => item.id));
  Object.keys(pendingCompletionDrafts).forEach((taskId) => {
    if (!taskIds.has(taskId)) {
      delete pendingCompletionDrafts[taskId];
    }
  });
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  void refreshWorkstation(selectedTaskId.value || undefined);
});

onActivated(() => {
  if (skipNextActivationRefresh) {
    skipNextActivationRefresh = false;
    return;
  }
  void refreshWorkstation(selectedTaskId.value || undefined);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        title="包埋工作站加载失败"
        type="error"
      >
        <template #default>{{ pageError }}</template>
      </ElAlert>

      <section class="grid max-w-[560px] gap-3 sm:grid-cols-2">
        <article
          class="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <div class="text-xs text-muted-foreground">待包埋数</div>
          <div class="mt-1 text-2xl font-semibold text-foreground">
            {{ summaryLoading ? '--' : workstationSummary.pendingCount }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground/70">
            统计范围：{{ workstationSummary.workDate || '服务端当日' }}
          </div>
        </article>
        <article
          class="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <div class="text-xs text-muted-foreground">已包埋数</div>
          <div class="mt-1 text-2xl font-semibold text-emerald-600">
            {{ summaryLoading ? '--' : workstationSummary.completedCount }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground/70">
            当日已完成记录实时汇总
          </div>
        </article>
      </section>

      <section
        class="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
      >
        <ElButton
          :disabled="!canConfirmSelectedTask || completeLoading"
          :loading="completeLoading"
          type="primary"
          @click="handleConfirmEmbedding"
        >
          确认包埋
        </ElButton>
        <ElInput
          v-model="filters.keyword"
          class="max-w-[280px]"
          clearable
          placeholder="病人ID/病理号"
          @keyup.enter="handleSearch"
        />
        <ElButton @click="handleSearch">查询</ElButton>
        <ElButton @click="handleMore">更多</ElButton>
        <ElButton @click="handleClearCurrent">确认清零</ElButton>
        <ElButton @click="taskDrawerVisible = true">包埋任务</ElButton>
        <ElButton
          :disabled="!selectedTask"
          @click="historyDrawerVisible = true"
        >
          包埋历史
        </ElButton>
        <ElButton
          :disabled="!selectedTask"
          @click="evaluationDrawerVisible = true"
        >
          评价记录
        </ElButton>
      </section>

      <section
        class="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]"
      >
        <article
          class="min-w-0 rounded-2xl border border-border bg-card shadow-sm"
        >
          <div
            class="flex items-center justify-between gap-3 border-b border-border px-5 py-4"
          >
            <div>
              <h2 class="text-base font-semibold text-foreground">
                待包埋列表
              </h2>
            </div>
            <div class="text-sm text-muted-foreground">共 {{ total }} 条</div>
          </div>

          <div class="overflow-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-accent text-muted-foreground">
                <tr>
                  <th class="w-12 px-4 py-3">
                    <ElCheckbox
                      :indeterminate="isPendingSelectionIndeterminate"
                      :model-value="isAllPendingItemsSelected"
                      aria-label="选择全部待包埋任务"
                      @click.stop
                      @update:model-value="toggleAllPendingTaskSelections"
                    />
                  </th>
                  <th class="px-4 py-3">病理号</th>
                  <th class="px-4 py-3">蜡块号</th>
                  <th class="px-4 py-3">备注</th>
                  <th class="px-4 py-3">取材操作</th>
                  <th class="px-4 py-3">主班备注</th>
                  <th class="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody v-if="leftPendingItems.length > 0">
                <tr
                  v-for="item in leftPendingItems"
                  :key="item.id"
                  :class="
                    item.id === selectedTaskId
                      ? 'bg-primary/10'
                      : 'hover:bg-accent'
                  "
                  class="cursor-pointer border-t border-border text-foreground"
                  @click="selectTask(item.id)"
                >
                  <td class="px-4 py-3">
                    <ElCheckbox
                      :model-value="selectedPendingTaskIds.includes(item.id)"
                      :aria-label="`选择待包埋任务 ${formatNullable(item.samplingBlockCode)}`"
                      @click.stop
                      @update:model-value="
                        (selected) =>
                          togglePendingTaskSelection(item.id, selected)
                      "
                    />
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.pathologyNo) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.samplingBlockCode) }}
                  </td>
                  <td class="min-w-[150px] px-4 py-3" @click.stop>
                    <ElInput
                      :model-value="getPendingRemarksDraft(item, 'remarks')"
                      aria-label="备注"
                      class="min-w-0"
                      :disabled="isSavingPendingRemarks(item.id)"
                      placeholder="备注"
                      size="small"
                      @blur="savePendingRemarksEdit(item, 'remarks')"
                      @focus="beginPendingRemarksEdit(item, 'remarks')"
                      @keyup.enter="savePendingRemarksEdit(item, 'remarks')"
                      @keyup.esc="cancelPendingRemarksEdit"
                      @update:model-value="
                        (value) =>
                          updatePendingRemarksDraft(item, 'remarks', value)
                      "
                    />
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.sampledByName) }} /
                    {{ formatDateTime(item.sampledAt) }}
                  </td>
                  <td class="min-w-[190px] px-4 py-3" @click.stop>
                    <ElSelect
                      :model-value="
                        getPendingRemarksDraft(item, 'productionRemarks')
                      "
                      aria-label="主班备注"
                      class="min-w-0"
                      clearable
                      :disabled="isSavingPendingRemarks(item.id)"
                      placeholder="主班备注"
                      size="small"
                      @change="
                        savePendingRemarksEdit(item, 'productionRemarks')
                      "
                      @click="
                        beginPendingRemarksEdit(item, 'productionRemarks')
                      "
                      @update:model-value="
                        (value) =>
                          updatePendingRemarksDraft(
                            item,
                            'productionRemarks',
                            value,
                          )
                      "
                    >
                      <ElOption value="" label="-" />
                      <ElOption
                        v-for="option in getShiftRemarkOptions(item)"
                        :key="option"
                        :label="option"
                        :value="option"
                      />
                    </ElSelect>
                  </td>
                  <td class="px-4 py-3">
                    <ElTag
                      :type="
                        item.taskStatus === 'EMBEDDING_CONFIRM_PENDING'
                          ? 'warning'
                          : item.taskStatus === 'IN_PROGRESS'
                            ? 'success'
                            : 'info'
                      "
                    >
                      {{ formatTaskStatus(item.taskStatus) }}
                    </ElTag>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="leftPendingItems.length === 0 && !loading" class="p-8">
              <ElEmpty description="当前没有待包埋任务" />
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground"
          >
            <span>第 {{ filters.page }} 页 / 每页 {{ filters.size }} 条</span>
            <div class="flex gap-2">
              <ElButton
                :disabled="filters.page <= 1"
                @click="
                  filters.page -= 1;
                  loadPendingData();
                "
              >
                上一页
              </ElButton>
              <ElButton
                :disabled="filters.page * filters.size >= total"
                @click="
                  filters.page += 1;
                  loadPendingData();
                "
              >
                下一页
              </ElButton>
            </div>
          </div>
        </article>

        <div class="grid min-h-0 min-w-0 gap-4">
          <article
            class="min-w-0 rounded-2xl border border-border bg-card shadow-sm"
          >
            <div
              class="flex items-center justify-between gap-3 border-b border-border px-5 py-4"
            >
              <div class="min-w-0">
                <h2 class="text-base font-semibold text-foreground">
                  已包埋蜡块列表
                </h2>
              </div>
              <div class="flex shrink-0 items-center gap-3">
                <div
                  v-if="summaryLoading"
                  class="text-sm text-muted-foreground/70"
                >
                  加载中...
                </div>
                <ElButton
                  class="shrink-0"
                  :disabled="
                    !canCancelSelectedEmbedding ||
                    cancelEmbeddingLoading ||
                    completeLoading
                  "
                  :loading="cancelEmbeddingLoading"
                  type="warning"
                  @click="handleCancelEmbedding"
                >
                  取消包埋
                </ElButton>
                <ElButton
                  class="shrink-0"
                  :disabled="
                    !canCompleteSelectedTask ||
                    completeLoading ||
                    cancelEmbeddingLoading
                  "
                  :loading="completeLoading"
                  type="primary"
                  @click="handleCompleteEmbedding"
                >
                  确认包埋完成
                </ElButton>
              </div>
            </div>

            <div class="border-b border-border bg-accent/60 px-5 py-4">
              <div
                class="grid gap-3 xl:grid-cols-[minmax(21rem,28rem)_minmax(0,1fr)]"
              >
                <div
                  class="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                  <div>
                    <div class="text-xs text-muted-foreground">蜡块号</div>
                    <div class="mt-1 text-sm font-medium text-foreground">
                      {{
                        formatNullable(
                          selectedCompletedEmbeddingRecord?.samplingBlockCode,
                        )
                      }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs text-muted-foreground">蜡块名称</div>
                    <div class="mt-1 text-sm text-foreground">
                      {{
                        formatNullable(
                          selectedCompletedEmbeddingRecord?.samplingBlockDescription,
                        )
                      }}
                    </div>
                  </div>
                  <div>
                    <div class="text-xs text-muted-foreground">标本名称</div>
                    <div class="mt-1 text-sm text-foreground">
                      {{
                        formatNullable(
                          selectedCompletedEmbeddingRecord?.specimenName,
                        )
                      }}
                    </div>
                  </div>
                </div>

                <div class="rounded-lg border border-border bg-card p-3">
                  <div class="mb-2 text-xs text-muted-foreground">大体所见</div>
                  <ElInput
                    :model-value="
                      selectedCompletedEmbeddingRecord?.grossDescription ?? ''
                    "
                    :rows="3"
                    class="embedding-gross-description"
                    placeholder="大体所见"
                    readonly
                    type="textarea"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="completedEmbeddingRecords.length > 0"
              class="overflow-x-auto"
            >
              <table class="min-w-[1220px] text-left text-sm">
                <thead class="bg-accent text-muted-foreground">
                  <tr>
                    <th class="w-12 px-4 py-3">
                      <ElCheckbox
                        :indeterminate="
                          isCompletedEmbeddingSelectionIndeterminate
                        "
                        :model-value="isAllCompletedEmbeddingRecordsSelected"
                        aria-label="选择全部已包埋蜡块"
                        @click.stop
                        @update:model-value="
                          toggleAllCompletedEmbeddingSelections
                        "
                      />
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      病理号
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      蜡块号
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      包埋备注
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      切片备注
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      取材评价
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      取材操作
                    </th>
                    <th class="px-4 py-3 font-medium whitespace-nowrap">
                      包埋操作
                    </th>
                    <th
                      class="sticky right-0 z-20 border-l border-border bg-accent px-4 py-3 font-medium whitespace-nowrap"
                    >
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in completedEmbeddingRecords"
                    :key="item.embeddingId"
                    :class="
                      item.embeddingId === selectedCompletedEmbeddingId
                        ? 'bg-primary/10'
                        : 'hover:bg-accent'
                    "
                    class="group cursor-pointer border-t border-border text-foreground"
                    @click="selectCompletedEmbedding(item.embeddingId)"
                  >
                    <td class="px-4 py-3 align-top">
                      <ElCheckbox
                        :model-value="
                          selectedCompletedEmbeddingIds.includes(
                            item.embeddingId,
                          )
                        "
                        :aria-label="`选择已包埋蜡块 ${formatNullable(item.samplingBlockCode)}`"
                        :disabled="!item.pendingTask"
                        @click.stop
                        @update:model-value="
                          (selected) =>
                            toggleCompletedEmbeddingSelection(
                              item.embeddingId,
                              selected,
                            )
                        "
                      />
                    </td>
                    <td class="px-4 py-3 align-top whitespace-nowrap">
                      {{ formatNullable(item.pathologyNo) }}
                    </td>
                    <td class="px-4 py-3 align-top whitespace-nowrap">
                      {{ formatNullable(item.samplingBlockCode) }}
                    </td>
                    <td class="min-w-[180px] px-4 py-3 align-top">
                      <span
                        class="block break-words leading-6 text-muted-foreground"
                      >
                        {{ formatNullable(item.embeddingRemarks) }}
                      </span>
                    </td>
                    <td class="min-w-[240px] px-4 py-3 align-top">
                      <div class="flex items-center gap-2">
                        <ElSelect
                          :model-value="getEmbeddingRowSliceNotice(item)"
                          class="min-w-0 flex-1"
                          allow-create
                          clearable
                          default-first-option
                          filterable
                          :loading="isSavingReview(item.embeddingId)"
                          placeholder="切片备注"
                          size="small"
                          @blur="
                            item.rowKind === 'completed' &&
                            handleSliceNoticeSave(item)
                          "
                          @change="
                            (value) => handleSliceNoticeChange(item, value)
                          "
                        >
                          <ElOption
                            v-for="option in SLICE_NOTICE_OPTIONS"
                            :key="option"
                            :label="option"
                            :value="option"
                          />
                        </ElSelect>
                      </div>
                    </td>
                    <td
                      class="min-w-[220px] px-4 py-3 align-top"
                      @dblclick.stop="openQualityReviewDialog(item)"
                    >
                      <div class="flex items-start gap-2">
                        <span class="line-clamp-2 flex-1 break-words leading-6">
                          {{ formatNullable(item.samplingEvaluation) }}
                        </span>
                        <ElButton
                          aria-label="编辑取材评价"
                          :icon="UserRoundPen"
                          circle
                          size="small"
                          text
                          title="编辑取材评价"
                          @click.stop="openQualityReviewDialog(item)"
                        />
                      </div>
                    </td>
                    <td
                      class="min-w-[180px] px-4 py-3 align-top text-muted-foreground"
                    >
                      <div class="leading-6">
                        {{ formatNullable(item.sampledByName) }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ formatDateTime(item.sampledAt) }}
                      </div>
                    </td>
                    <td
                      class="min-w-[180px] px-4 py-3 align-top text-muted-foreground"
                    >
                      <div class="leading-6">
                        {{ formatNullable(item.embeddedByName) }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ formatDateTime(item.endedAt) }}
                      </div>
                    </td>
                    <td
                      class="sticky right-0 z-10 border-l border-border px-4 py-3 align-top whitespace-nowrap"
                      :class="
                        item.embeddingId === selectedCompletedEmbeddingId
                          ? 'bg-primary/10'
                          : 'bg-card group-hover:bg-accent'
                      "
                    >
                      <ElTag
                        :type="
                          item.taskStatus === 'EMBEDDING_CONFIRM_PENDING'
                            ? 'warning'
                            : item.taskStatus === 'IN_PROGRESS'
                              ? 'success'
                              : 'info'
                        "
                      >
                        {{ formatTaskStatus(item.taskStatus) }}
                      </ElTag>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="p-8">
              <ElEmpty description="当前没有已包埋记录" />
            </div>
          </article>
        </div>
      </section>
    </div>

    <ElDrawer v-model="historyDrawerVisible" size="55%" title="包埋历史">
      <div v-if="currentCaseEmbeddingRecords.length > 0" class="overflow-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-accent text-muted-foreground">
            <tr>
              <th class="px-4 py-3">病理号</th>
              <th class="px-4 py-3">蜡块号</th>
              <th class="px-4 py-3">蜡块名称</th>
              <th class="px-4 py-3">包埋备注</th>
              <th class="px-4 py-3">包埋操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in currentCaseEmbeddingRecords"
              :key="item.embeddingId"
              class="border-t border-border"
            >
              <td class="px-4 py-3">{{ formatNullable(item.pathologyNo) }}</td>
              <td class="px-4 py-3">
                {{ formatNullable(item.samplingBlockCode) }}
              </td>
              <td class="px-4 py-3">
                {{ formatNullable(item.samplingBlockDescription) }}
              </td>
              <td class="px-4 py-3">
                {{ formatNullable(item.embeddingRemarks) }}
              </td>
              <td class="px-4 py-3">
                {{ formatNullable(item.embeddedByName) }} /
                {{ formatDateTime(item.endedAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ElEmpty v-else description="当前病例暂无包埋历史" />
    </ElDrawer>

    <ElDrawer v-model="evaluationDrawerVisible" size="52%" title="评价记录">
      <div v-if="evaluationDrawerRows.length > 0" class="flex flex-col gap-3">
        <article
          v-for="(item, index) in evaluationDrawerRows"
          :key="`${item.category}-${item.title}-${index}`"
          class="rounded-xl border border-border bg-card p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-foreground">
                {{ item.category }} / {{ item.title }}
              </div>
              <div class="mt-1 text-sm text-muted-foreground">
                {{ item.description }}
              </div>
            </div>
            <div class="text-right text-xs text-muted-foreground/70">
              <div>{{ item.status }}</div>
              <div>{{ item.operator }}</div>
              <div>{{ formatDateTime(item.time) }}</div>
            </div>
          </div>
        </article>
      </div>
      <ElEmpty v-else description="当前病例暂无评价记录" />
    </ElDrawer>

    <ElDrawer v-model="taskDrawerVisible" size="70%" title="包埋任务">
      <div class="grid gap-6">
        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-foreground">
              当日待处理任务
            </h3>
            <span class="text-sm text-muted-foreground">
              {{ workstationSummary.pendingCount }} 条
            </span>
          </div>
          <div
            v-if="workstationSummary.pendingTasks.length > 0"
            class="overflow-auto"
          >
            <table class="min-w-full text-left text-sm">
              <thead class="bg-accent text-muted-foreground">
                <tr>
                  <th class="px-4 py-3">病理号</th>
                  <th class="px-4 py-3">蜡块号</th>
                  <th class="px-4 py-3">备注</th>
                  <th class="px-4 py-3">取材操作</th>
                  <th class="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in workstationSummary.pendingTasks"
                  :key="item.id"
                  class="border-t border-border"
                >
                  <td class="px-4 py-3">
                    {{ formatNullable(item.pathologyNo) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.samplingBlockCode) }}
                  </td>
                  <td class="px-4 py-3">{{ formatNullable(item.remarks) }}</td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.sampledByName) }} /
                    {{ formatDateTime(item.sampledAt) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatTaskStatus(item.taskStatus) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ElEmpty v-else description="当日暂无待处理包埋任务" />
        </section>

        <section>
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-base font-semibold text-foreground">
              当日已处理记录
            </h3>
            <span class="text-sm text-muted-foreground">
              {{ workstationSummary.completedCount }} 条
            </span>
          </div>
          <div
            v-if="workstationSummary.completedRecords.length > 0"
            class="overflow-auto"
          >
            <table class="min-w-full text-left text-sm">
              <thead class="bg-accent text-muted-foreground">
                <tr>
                  <th class="px-4 py-3">病理号</th>
                  <th class="px-4 py-3">蜡块号</th>
                  <th class="px-4 py-3">包埋备注</th>
                  <th class="px-4 py-3">取材评价</th>
                  <th class="px-4 py-3">包埋操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in workstationSummary.completedRecords"
                  :key="item.embeddingId"
                  class="border-t border-border"
                >
                  <td class="px-4 py-3">
                    {{ formatNullable(item.pathologyNo) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.samplingBlockCode) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.embeddingRemarks) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.samplingEvaluation) }}
                  </td>
                  <td class="px-4 py-3">
                    {{ formatNullable(item.embeddedByName) }} /
                    {{ formatDateTime(item.endedAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ElEmpty v-else description="当日暂无已处理包埋记录" />
        </section>
      </div>
    </ElDrawer>

    <EmbeddingQualityReviewDialog
      v-model="qualityReviewDialogVisible"
      :mode="qualityReviewDialogMode"
      :row="selectedQualityReviewRecord"
      @draft-submitted="handleQualityReviewDraftSubmitted"
      @submitted="handleQualityReviewSubmitted"
    />
  </Page>
</template>
