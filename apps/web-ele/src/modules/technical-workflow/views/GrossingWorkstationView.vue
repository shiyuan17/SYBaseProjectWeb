<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  WorkstationQueueItem,
} from '../types/technical-workflow';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  RotateCw,
  Search,
} from '@vben/icons';

import {
  ElAlert,
  ElBadge,
  ElButton,
  ElCheckbox,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElInput,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTooltip,
} from 'element-plus';

import WorkbenchCapturedImagePanel from '#/modules/shared/components/WorkbenchCapturedImagePanel.vue';

import {
  listPendingTechnicalTasks,
  startGrossing,
} from '../api/technical-workflow-service';
import GrossingEmbeddingBoxTable from '../components/GrossingEmbeddingBoxTable.vue';
import GrossingSpecimenTabs from '../components/GrossingSpecimenTabs.vue';
import TechnicalOperatorFields from '../components/TechnicalOperatorFields.vue';
import { useGrossingWorkbench } from '../composables/useGrossingWorkbench';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatCaseStatus,
  formatDateTime,
  formatNullable,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import { buildWorkstationQueueItems } from '../utils/workstation';

type GrossingTaskPayload = Record<string, unknown>;
type GrossingWorkbenchResizeHandle = 'left' | 'right';

interface GrossingTaskTableRow {
  alertLevel: WorkstationQueueItem['alertLevel'];
  applicationNo: string;
  blockPrintSummary: string;
  checkNo: string;
  clinicalDiagnosis: string;
  dataStatusText: string;
  freezeReminder: string;
  grossDescription: string;
  patientName: string;
  receiverName: string;
  requestDepartment: string;
  rowIndex: number;
  statusText: string;
  task: PendingTechnicalTaskItem;
  typeText: string;
}

interface CapturedImageItem {
  fileUrl: string;
  key: string;
  meta: string;
  sourceLabel: string;
  title: string;
}

interface GrossingDescriptionTemplate {
  content: string;
  id: string;
  keywords: string[];
  system: string;
  tissueName: string;
}

interface GrossingTemplateGroup {
  system: string;
  templates: GrossingDescriptionTemplate[];
}

const CLINICAL_HISTORY_FIELDS = [
  {
    key: 'historySummary',
    label: '病史摘要',
    placeholder: '请输入病史摘要',
    rows: 3,
  },
  {
    key: 'clinicalExamination',
    label: '临床检查',
    placeholder: '请输入临床检查',
    rows: 3,
  },
  {
    key: 'clinicalSubmissionRequirements',
    label: '临床送检要求',
    placeholder: '请输入临床送检要求',
    rows: 3,
  },
  {
    key: 'infectiousAndPastHistorySummary',
    label: '传染病史和过往病史',
    placeholder: '请输入传染病史和过往病史',
    rows: 3,
  },
  {
    key: 'externalPathologyDiagnosis',
    label: '外院病理诊断',
    placeholder: '请输入外院病理诊断',
    rows: 3,
  },
  {
    key: 'laboratoryExamination',
    label: '检验',
    placeholder: '请输入检验',
    rows: 3,
  },
  {
    key: 'imagingExamination',
    label: '影像检查',
    placeholder: '请输入影像检查',
    rows: 3,
  },
] as const;

type ClinicalHistoryFieldKey = (typeof CLINICAL_HISTORY_FIELDS)[number]['key'];
type ClinicalHistoryForm = Record<ClinicalHistoryFieldKey, string>;

const COMMON_GROSSING_COPY_TEXTS = ['cm', 'cm*cm', 'cm*cm*cm'] as const;

const GROSSING_DESCRIPTION_TEMPLATES: GrossingDescriptionTemplate[] = [
  {
    content: '送检：灰褐色条索状组织一条，长约cm，直径约0.2cm，全取1盒。',
    id: 'hematopoietic-bone-marrow',
    keywords: ['骨髓', '骨髓组织', '条索'],
    system: '淋巴造血系统',
    tissueName: '骨髓',
  },
  {
    content: '送检：灰红色肾组织数条，合计约cm，质软，全取1盒。',
    id: 'urinary-kidney',
    keywords: ['肾', '肾组织', '泌尿'],
    system: '泌尿系统',
    tissueName: '肾组织',
  },
  {
    content:
      '送检：胃组织数块，灰白灰红色，大小约cm*cm*cm，黏膜面未见明确溃疡，全取1盒。',
    id: 'digestive-stomach',
    keywords: ['胃', '胃体', '胃窦'],
    system: '消化系统',
    tissueName: '胃体',
  },
  {
    content:
      '送检：肠组织数块，灰白灰红色，大小约cm*cm*cm，切面灰白，质中，全取1盒。',
    id: 'digestive-intestine',
    keywords: ['肠', '结肠', '直肠'],
    system: '消化系统',
    tissueName: '结肠',
  },
  {
    content:
      '送检：肺组织一块，灰白灰红色，大小约cm*cm*cm，切面实性，质中，全取1盒。',
    id: 'respiratory-lung',
    keywords: ['肺', '肺叶', '肺组织'],
    system: '呼吸系统',
    tissueName: '肺组织',
  },
  {
    content:
      '送检：甲状腺组织一块，灰红色，大小约cm*cm*cm，切面见结节样区，质中，全取1盒。',
    id: 'endocrine-thyroid',
    keywords: ['甲状腺', '甲状腺叶', '结节'],
    system: '内分泌系统',
    tissueName: '甲状腺',
  },
  {
    content:
      '送检：输卵管组织一段，灰白灰红色，长约cm，直径约cm，切面管腔可见，全取1盒。',
    id: 'female-fallopian-tube',
    keywords: ['输卵管', '女性生殖'],
    system: '女性生殖系统',
    tissueName: '侧部分输卵管',
  },
];

const DISABLED_TOOLBAR_ACTIONS = [
  { icon: Download, label: '导出Excel' },
  { icon: undefined, label: '标本回收' },
  { icon: undefined, label: '修改检查组' },
  { icon: undefined, label: '特检医嘱' },
  { icon: undefined, label: '蜡块未收发标记' },
  { icon: undefined, label: '蜡块批量打印' },
] as const;

const DISABLED_DATE_ACTIONS = [
  { icon: ChevronLeft, label: '前1天' },
  { icon: ChevronRight, label: '后1天' },
] as const;

const grossingWorkbenchPaneMinWidths = {
  queue: 320,
  template: 300,
  workspace: 440,
};
const grossingWorkbenchResizerWidth = 10;
const grossingWorkbenchResizeStep = 2;

const route = useRoute();
const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);

const queueError = ref('');
const loading = ref(false);
const actionLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);
const total = ref(0);
const moreDrawerVisible = ref(false);
const templateSearchKeyword = ref('');
const selectedTemplateId = ref(GROSSING_DESCRIPTION_TEMPLATES[0]?.id ?? '');
const appendTemplateAfterApply = ref(true);
const countdownNow = ref(Date.now());
const grossingWorkstationLayoutRef = ref<HTMLElement>();
const paneWidths = reactive({
  queue: 30,
  template: 25,
  workspace: 45,
});
let freezeReminderTimer: number | undefined;

const filters = reactive({
  keyword:
    typeof route.query.pathologyNo === 'string' ? route.query.pathologyNo : '',
  page: 1,
  size: DEFAULT_PAGE_SIZE,
  timedOutOnly: route.query.mode === 'exception',
});

const routeTaskId = computed(() =>
  typeof route.query.taskId === 'string' ? route.query.taskId : '',
);
const shouldIncludeAllStatuses = computed(
  () => Boolean(filters.keyword.trim()) || Boolean(routeTaskId.value),
);
const shouldInitialLoad = computed(
  () =>
    Boolean(filters.keyword.trim()) ||
    Boolean(routeTaskId.value) ||
    filters.timedOutOnly,
);
const currentQuery = computed(() => ({
  includeAllStatuses: shouldIncludeAllStatuses.value || undefined,
  keyword: filters.keyword.trim() || undefined,
  page: filters.page,
  size: filters.size,
  taskId: routeTaskId.value || undefined,
  taskType: 'GROSSING',
  timedOutOnly: filters.timedOutOnly,
}));

const workbench = useGrossingWorkbench({
  onSubmitted: async () => {
    moreDrawerVisible.value = false;
    await loadPendingData();
  },
});
const clinicalHistoryForm = reactive<ClinicalHistoryForm>({
  clinicalExamination: '',
  clinicalSubmissionRequirements: '',
  externalPathologyDiagnosis: '',
  historySummary: '',
  imagingExamination: '',
  infectiousAndPastHistorySummary: '',
  laboratoryExamination: '',
});

const queueItems = computed(() =>
  buildWorkstationQueueItems(pendingItems.value, 'GROSSING'),
);
const currentPageError = computed(
  () => queueError.value || workbench.pageError.value,
);
const selectedCaseSummary = computed(
  () => workbench.workbenchContext.value?.caseSummary ?? null,
);
const selectedPathologyNo = computed(() =>
  formatNullable(
    selectedCaseSummary.value?.pathologyNo ?? selectedTask.value?.pathologyNo,
  ),
);
const selectedPatientName = computed(() =>
  formatNullable(
    selectedCaseSummary.value?.patientName ?? selectedTask.value?.patientName,
  ),
);
const selectedTaskFacts = computed(() => [
  {
    label: '住院号',
    value: formatNullable(selectedCaseSummary.value?.inpatientNo),
  },
  {
    label: '申请科室',
    value: formatNullable(selectedCaseSummary.value?.submittingDepartmentName),
  },
  {
    label: '病例状态',
    value: formatCaseStatus(selectedCaseSummary.value?.caseStatus),
  },
]);
watch(
  () => workbench.workbenchContext.value,
  (context) => {
    clinicalHistoryForm.historySummary = context?.clinicalHistory ?? '';
    clinicalHistoryForm.clinicalExamination = '';
    clinicalHistoryForm.clinicalSubmissionRequirements =
      context?.clinicalSubmissionRequirements ?? '';
    clinicalHistoryForm.infectiousAndPastHistorySummary =
      context?.infectiousAndPastHistorySummary ?? '';
    clinicalHistoryForm.externalPathologyDiagnosis =
      context?.externalPathologyDiagnosis ?? '';
    clinicalHistoryForm.laboratoryExamination = '';
    clinicalHistoryForm.imagingExamination = context?.relatedExaminations ?? '';
  },
  { immediate: true },
);
const capturedImageItems = computed<CapturedImageItem[]>(() => [
  ...workbench.enteredMediaAssets.value.map((asset) => ({
    fileUrl: asset.fileUrl,
    key: `current-${asset.specimenIndex}-${asset.assetIndex}-${asset.fileUrl || asset.fileName}`,
    meta: `${asset.specimenId} / 当前录入`,
    sourceLabel: '当前',
    title: asset.fileName || '当前录入影像',
  })),
  ...(workbench.workbenchContext.value?.mediaAssets ?? []).map((asset) => ({
    fileUrl: asset.fileUrl,
    key: `history-${asset.assetId}`,
    meta: [formatDateTime(asset.capturedAt), asset.capturedByName?.trim() || '']
      .filter((item) => item && item !== '-')
      .join(' / '),
    sourceLabel: '历史',
    title: asset.fileName || '历史影像',
  })),
]);
const grossingTaskRows = computed(() =>
  queueItems.value.map((item, index) => createGrossingTaskRow(item, index)),
);
const totalPageCount = computed(() =>
  Math.max(Math.ceil(total.value / filters.size), 1),
);
const selectedGrossingTemplate = computed(
  () =>
    GROSSING_DESCRIPTION_TEMPLATES.find(
      (item) => item.id === selectedTemplateId.value,
    ) ?? GROSSING_DESCRIPTION_TEMPLATES[0],
);
const visibleGrossingTemplates = computed(() => {
  const keyword = templateSearchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return GROSSING_DESCRIPTION_TEMPLATES;
  }
  return GROSSING_DESCRIPTION_TEMPLATES.filter((template) =>
    [
      template.system,
      template.tissueName,
      template.content,
      ...template.keywords,
    ].some((item) => item.toLowerCase().includes(keyword)),
  );
});
const grossingTemplateGroups = computed<GrossingTemplateGroup[]>(() => {
  const groups = new Map<string, GrossingDescriptionTemplate[]>();
  for (const template of visibleGrossingTemplates.value) {
    const templates = groups.get(template.system) ?? [];
    templates.push(template);
    groups.set(template.system, templates);
  }
  return [...groups.entries()].map(([system, templates]) => ({
    system,
    templates,
  }));
});
const activeTemplateSpecimenName = computed(
  () => workbench.activeSpecimenName.value || '当前标本',
);
const activeSpecimenIndex = computed(() =>
  workbench.specimenTabMetas.value.findIndex(
    (item) => item.key === workbench.activeSpecimenKey.value,
  ),
);
const canEditCapturedImages = computed(
  () =>
    Boolean(selectedTask.value) &&
    canOperateGrossingTask(selectedTask.value) &&
    Boolean(workbench.activeSpecimen.value) &&
    activeSpecimenIndex.value >= 0,
);
const workstationGridStyle = computed(() => ({
  gridTemplateColumns: `minmax(${grossingWorkbenchPaneMinWidths.queue}px, ${paneWidths.queue}fr) ${grossingWorkbenchResizerWidth}px minmax(${grossingWorkbenchPaneMinWidths.workspace}px, ${paneWidths.workspace}fr) ${grossingWorkbenchResizerWidth}px minmax(${grossingWorkbenchPaneMinWidths.template}px, ${paneWidths.template}fr)`,
}));

function parseDateTimeTimestamp(value: null | string | undefined) {
  const rawValue = value?.trim();
  if (!rawValue) {
    return null;
  }

  const localDateTimeMatch = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second = '0'] = localDateTimeMatch;
    const timestamp = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  const timestamp = Date.parse(rawValue);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(Math.abs(milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${hours}:${paddedMinutes}:${paddedSeconds}`;
}

function formatFreezeCountdown(
  task: PendingTechnicalTaskItem,
  payload: GrossingTaskPayload,
) {
  const deadlineTimestamp = parseDateTimeTimestamp(
    firstTextValue(
      task.deadlineAt,
      readPayloadText(payload, ['deadlineAt', 'freezeDeadlineAt']),
    ),
  );
  if (!deadlineTimestamp) {
    return task.timedOut ? '已超时' : '-';
  }

  const diff = deadlineTimestamp - countdownNow.value;
  return diff > 0
    ? `剩余 ${formatDuration(diff)}`
    : `已超时 ${formatDuration(diff)}`;
}

function parseGrossingTaskPayload(payload: null | string): GrossingTaskPayload {
  const rawPayload = payload?.trim();
  if (!rawPayload) {
    return {};
  }

  try {
    const parsedPayload = JSON.parse(rawPayload);
    return parsedPayload && typeof parsedPayload === 'object'
      ? (parsedPayload as GrossingTaskPayload)
      : {};
  } catch {
    return {};
  }
}

function readPayloadText(payload: GrossingTaskPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return '';
}

function firstTextValue(
  ...values: Array<null | string | undefined>
): null | string {
  return values.find((item) => item?.trim()) ?? null;
}

function createGrossingTaskRow(
  item: WorkstationQueueItem,
  index: number,
): GrossingTaskTableRow {
  const task = item.task;
  const payload = parseGrossingTaskPayload(task.payload);
  const isSelected = selectedTask.value?.id === task.id;
  const context = isSelected ? workbench.workbenchContext.value : null;
  const caseSummary = context?.caseSummary;
  const tracking = isSelected ? workbench.trackingResult.value : null;
  const activeSpecimen = isSelected ? workbench.activeSpecimen.value : null;
  const blockTotal =
    readPayloadText(payload, [
      'blockCount',
      'blockTotal',
      'samplingBlockCount',
    ]) || (tracking ? String(tracking.blocks.length) : '');
  const printedBlockCount = readPayloadText(payload, [
    'blockPrintCount',
    'printedBlockCount',
    'printedCount',
  ]);

  return {
    alertLevel: item.alertLevel,
    applicationNo: formatNullable(
      firstTextValue(
        task.applicationNo,
        caseSummary?.applicationNo,
        readPayloadText(payload, ['applicationNo', 'requestNo']),
      ),
    ),
    blockPrintSummary: formatNullable(
      blockTotal
        ? `${blockTotal}/${printedBlockCount || '-'}`
        : readPayloadText(payload, ['blockPrintSummary']),
    ),
    checkNo: formatNullable(
      firstTextValue(
        task.pathologyNo,
        readPayloadText(payload, ['checkNo', 'inspectionNo', 'pathologyNo']),
        task.applicationNo,
        task.id,
      ),
    ),
    clinicalDiagnosis: formatNullable(
      firstTextValue(
        context?.clinicalDiagnosis,
        readPayloadText(payload, [
          'clinicalDiagnosis',
          'diagnosis',
          'pathologyDiagnosis',
        ]),
      ),
    ),
    dataStatusText: formatGrossingTaskStatus(task.taskStatus),
    freezeReminder: formatFreezeCountdown(task, payload),
    grossDescription: formatNullable(
      firstTextValue(
        activeSpecimen?.grossDescription,
        readPayloadText(payload, [
          'grossDescription',
          'grossFinding',
          'macroscopicDescription',
        ]),
        task.productionRemarks,
        task.remarks,
      ),
    ),
    patientName: formatNullable(
      firstTextValue(
        caseSummary?.patientName,
        task.patientName,
        readPayloadText(payload, ['name', 'patient', 'patientName']),
      ),
    ),
    receiverName: formatNullable(
      firstTextValue(
        task.assignedToName,
        readPayloadText(payload, ['receiverName', 'receivedByName']),
      ),
    ),
    requestDepartment: formatNullable(
      firstTextValue(
        caseSummary?.submittingDepartmentName,
        readPayloadText(payload, [
          'applicationDepartmentName',
          'applyDept',
          'submittingDepartmentName',
        ]),
      ),
    ),
    rowIndex: (filters.page - 1) * filters.size + index + 1,
    statusText: formatGrossingTaskStatus(task.taskStatus),
    task,
    typeText: task.taskType?.trim()
      ? formatTaskType(task.taskType)
      : formatNullable(readPayloadText(payload, ['applicationType', 'type'])),
  };
}

function getGrossingTableRowKey(row: GrossingTaskTableRow) {
  return row.task.id;
}

function getTaskStatusTagType(taskStatus?: null | string) {
  if (taskStatus === 'IN_PROGRESS') {
    return 'warning';
  }
  if (taskStatus === 'COMPLETED') {
    return 'success';
  }
  return 'info';
}

function formatGrossingTaskStatus(taskStatus?: null | string) {
  return taskStatus === 'COMPLETED' ? '描写完成' : formatTaskStatus(taskStatus);
}

function getRowStatusTagType(alertLevel: WorkstationQueueItem['alertLevel']) {
  if (alertLevel === 'danger') {
    return 'danger';
  }
  if (alertLevel === 'warning') {
    return 'warning';
  }
  return 'info';
}

async function selectTask(taskId: string) {
  const matchedTask =
    pendingItems.value.find((item) => item.id === taskId) ?? null;
  selectedTask.value = matchedTask;
  if (matchedTask && !canOperateGrossingTask(matchedTask)) {
    workbench.resetWorkbenchState(matchedTask);
    return;
  }
  await workbench.initializeWorkbench(matchedTask);
}

async function loadPendingData(preferredTaskId?: string) {
  loading.value = true;
  queueError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;

    const deepLinkedTaskId = routeTaskId.value;
    const fallbackTaskId =
      preferredTaskId || deepLinkedTaskId || selectedTask.value?.id || '';
    const nextTaskId =
      (fallbackTaskId &&
        result.items.some((item) => item.id === fallbackTaskId) &&
        fallbackTaskId) ||
      result.items[0]?.id ||
      '';

    if (nextTaskId) {
      await selectTask(nextTaskId);
      return;
    }

    selectedTask.value = null;
    workbench.resetWorkbenchState(null);
  } catch (error) {
    queueError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function handleQuery() {
  filters.page = 1;
  if (!filters.keyword.trim()) {
    pendingItems.value = [];
    total.value = 0;
    selectedTask.value = null;
    workbench.resetWorkbenchState(null);
    return;
  }
  await loadPendingData();
}

async function handleRefresh() {
  if (!shouldInitialLoad.value) {
    pendingItems.value = [];
    total.value = 0;
    selectedTask.value = null;
    workbench.resetWorkbenchState(null);
    return;
  }
  await loadPendingData(selectedTask.value?.id);
}

async function toggleTimedOutOnly() {
  filters.timedOutOnly = !filters.timedOutOnly;
  filters.page = 1;
  await loadPendingData();
}

function openMoreDrawer() {
  if (!selectedTask.value) {
    ElMessage.warning('请先从左侧列表选择任务');
    return;
  }
  moreDrawerVisible.value = true;
}

function canOperateGrossingTask(task: null | PendingTechnicalTaskItem) {
  return task?.taskStatus === 'IN_PROGRESS';
}

async function uploadGrossingImage(file: File) {
  const specimenIndex = activeSpecimenIndex.value;
  if (!canEditCapturedImages.value || specimenIndex < 0) {
    ElMessage.warning('请先从左侧列表选择任务和可编辑标本');
    return false;
  }
  return workbench.uploadGrossingImageFile(specimenIndex, file);
}

function handleSaveGrossingDescription() {
  if (!workbench.activeSpecimen.value) {
    ElMessage.warning('当前没有可保存的大体描写');
    return;
  }
  ElMessage.success('大体描写已保存，取材完成时将一并提交');
}

function clampPaneWidth(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normalizePaneWidth(value: number) {
  return Number(value.toFixed(3));
}

function getPaneMinRatio(
  layoutWidth: number,
  pane: keyof typeof grossingWorkbenchPaneMinWidths,
) {
  return (
    (grossingWorkbenchPaneMinWidths[pane] /
      Math.max(layoutWidth - grossingWorkbenchResizerWidth * 2, 1)) *
    100
  );
}

function applyLeftResize(deltaPercent: number, layoutWidth: number) {
  const queueMin = getPaneMinRatio(layoutWidth, 'queue');
  const workspaceMin = getPaneMinRatio(layoutWidth, 'workspace');
  const pairedWidth = paneWidths.queue + paneWidths.workspace;
  const nextQueue = clampPaneWidth(
    paneWidths.queue + deltaPercent,
    queueMin,
    pairedWidth - workspaceMin,
  );

  paneWidths.queue = normalizePaneWidth(nextQueue);
  paneWidths.workspace = normalizePaneWidth(pairedWidth - nextQueue);
}

function applyRightResize(deltaPercent: number, layoutWidth: number) {
  const templateMin = getPaneMinRatio(layoutWidth, 'template');
  const workspaceMin = getPaneMinRatio(layoutWidth, 'workspace');
  const pairedWidth = paneWidths.workspace + paneWidths.template;
  const nextWorkspace = clampPaneWidth(
    paneWidths.workspace + deltaPercent,
    workspaceMin,
    pairedWidth - templateMin,
  );

  paneWidths.workspace = normalizePaneWidth(nextWorkspace);
  paneWidths.template = normalizePaneWidth(pairedWidth - nextWorkspace);
}

function resizeWorkbenchPane(
  handle: GrossingWorkbenchResizeHandle,
  deltaPercent: number,
  layoutWidth: number,
) {
  if (handle === 'left') {
    applyLeftResize(deltaPercent, layoutWidth);
    return;
  }

  applyRightResize(deltaPercent, layoutWidth);
}

function handleResizePointerDown(
  handle: GrossingWorkbenchResizeHandle,
  event: PointerEvent,
) {
  if (event.button !== 0) {
    return;
  }

  const layoutElement = grossingWorkstationLayoutRef.value;
  if (!layoutElement) {
    return;
  }

  event.preventDefault();
  const startX = event.clientX;
  const layoutWidth = layoutElement.getBoundingClientRect().width;
  const startWidths = { ...paneWidths };

  document.documentElement.classList.add('grossing-workbench-is-resizing');

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const deltaPercent = ((moveEvent.clientX - startX) / layoutWidth) * 100;
    paneWidths.queue = startWidths.queue;
    paneWidths.workspace = startWidths.workspace;
    paneWidths.template = startWidths.template;
    resizeWorkbenchPane(handle, deltaPercent, layoutWidth);
  };

  const stopResize = () => {
    document.documentElement.classList.remove('grossing-workbench-is-resizing');
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopResize, { once: true });
  window.addEventListener('pointercancel', stopResize, { once: true });
}

function handleResizeKeydown(
  handle: GrossingWorkbenchResizeHandle,
  event: KeyboardEvent,
) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return;
  }

  const layoutElement = grossingWorkstationLayoutRef.value;
  if (!layoutElement) {
    return;
  }

  event.preventDefault();
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  resizeWorkbenchPane(
    handle,
    direction * grossingWorkbenchResizeStep,
    layoutElement.getBoundingClientRect().width,
  );
}

function isTemplateMatchedToActiveSpecimen(
  template: GrossingDescriptionTemplate,
) {
  const specimenName = workbench.activeSpecimenName.value.toLowerCase();
  return template.keywords.some((keyword) =>
    specimenName.includes(keyword.toLowerCase()),
  );
}

function focusGrossingTemplatePanel() {
  if (!selectedTask.value) {
    ElMessage.warning('请先从左侧列表选择任务');
    return;
  }
  if (!workbench.activeSpecimen.value) {
    ElMessage.warning('请先选择可编辑标本');
    return;
  }
  const matchedTemplate = GROSSING_DESCRIPTION_TEMPLATES.find((template) =>
    isTemplateMatchedToActiveSpecimen(template),
  );
  selectedTemplateId.value =
    matchedTemplate?.id ?? GROSSING_DESCRIPTION_TEMPLATES[0]?.id ?? '';
}

function selectGrossingTemplate(template: GrossingDescriptionTemplate) {
  selectedTemplateId.value = template.id;
}

function selectTemplateSpecimen(specimenKey: string) {
  workbench.activeSpecimenKey.value = specimenKey;
  workbench.selectedEmbeddingBoxSpecimenKey.value = specimenKey;
}

function appendTextToActiveGrossingDescription(text: string) {
  const specimen = workbench.activeSpecimen.value;
  if (!specimen) {
    ElMessage.warning('请先选择可编辑标本');
    return false;
  }

  const currentDescription = specimen.grossDescription?.trim() ?? '';
  specimen.grossDescription = currentDescription
    ? `${currentDescription}\n${text}`
    : text;
  return true;
}

function copyGrossingTemplateText(text: string) {
  const appended = appendTextToActiveGrossingDescription(text);
  if (appended) {
    ElMessage.success(`已追加 ${text}`);
  }
}

function applySelectedGrossingTemplate() {
  const template = selectedGrossingTemplate.value;
  const specimen = workbench.activeSpecimen.value;
  if (!template || !specimen) {
    ElMessage.warning('请先选择可编辑标本和取材模板');
    return;
  }

  if (appendTemplateAfterApply.value) {
    const currentDescription = specimen.grossDescription?.trim() ?? '';
    specimen.grossDescription = currentDescription
      ? `${currentDescription}\n${template.content}`
      : template.content;
  } else {
    specimen.grossDescription = template.content;
  }

  ElMessage.success(
    appendTemplateAfterApply.value ? '已追加取材模板' : '已替换为取材模板',
  );
}

function applyGrossingTemplateWithMode(append: boolean) {
  appendTemplateAfterApply.value = append;
  applySelectedGrossingTemplate();
}

function appendGrossingTemplateDirectly(template: GrossingDescriptionTemplate) {
  selectedTemplateId.value = template.id;
  applyGrossingTemplateWithMode(true);
}

async function handleStartOrContinue() {
  if (!selectedTask.value) {
    ElMessage.warning('请先从左侧列表选择任务');
    return;
  }

  if (selectedTask.value.taskStatus === 'COMPLETED') {
    ElMessage.warning('已完成取材任务不能重复开始或完成');
    return;
  }

  if (selectedTask.value.taskStatus !== 'PENDING') {
    await workbench.loadWorkbenchContext();
    ElMessage.success('已刷新当前取材工作台');
    return;
  }

  actionLoading.value = true;
  queueError.value = '';
  try {
    await startGrossing({
      remarks: workbench.operatorForm.remarks.trim() || undefined,
      taskId: selectedTask.value.id,
      terminalCode: workbench.operatorForm.terminalCode.trim() || undefined,
    });
    ElMessage.success(`任务 ${selectedTask.value.id} 已开始取材`);
    await loadPendingData(selectedTask.value.id);
  } catch (error) {
    queueError.value = getWorkflowPageErrorMessage(error);
  } finally {
    actionLoading.value = false;
  }
}

onMounted(() => {
  freezeReminderTimer = window.setInterval(() => {
    countdownNow.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (freezeReminderTimer !== undefined) {
    window.clearInterval(freezeReminderTimer);
  }
});

if (shouldInitialLoad.value) {
  void loadPendingData();
}
</script>

<template>
  <Page>
    <div
      class="flex h-[calc(100vh-112px)] min-h-[560px] flex-col gap-2 overflow-hidden text-foreground"
    >
      <ElAlert
        v-if="currentPageError"
        :closable="false"
        :title="currentPageError"
        type="error"
        show-icon
      />

      <section class="rounded-md border border-border bg-card p-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <ElButton
            aria-label="刷新"
            :icon="RotateCw"
            :loading="loading"
            size="small"
            title="刷新"
            @click="void handleRefresh()"
          />
          <ElButton
            :disabled="selectedTask?.taskStatus === 'COMPLETED'"
            :loading="actionLoading"
            size="small"
            type="primary"
            @click="void handleStartOrContinue()"
          >
            取材
          </ElButton>

          <div class="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
            <ElInput
              v-model="filters.keyword"
              class="w-full sm:w-56"
              clearable
              placeholder="病人ID / 病理号 / 姓名"
              size="small"
              @keyup.enter="void handleQuery()"
            />
            <ElButton
              :icon="Search"
              :loading="loading"
              size="small"
              @click="void handleQuery()"
            >
              查询
            </ElButton>
          </div>

          <ElButton :icon="Ellipsis" size="small" @click="openMoreDrawer">
            更多
          </ElButton>

          <ElTooltip
            v-for="action in DISABLED_DATE_ACTIONS"
            :key="action.label"
            content="暂未接入日期筛选"
            placement="top"
          >
            <span class="inline-flex">
              <ElButton :icon="action.icon" disabled size="small">
                {{ action.label }}
              </ElButton>
            </span>
          </ElTooltip>

          <ElBadge :max="999" :value="total" class="mr-2">
            <ElButton size="small" @click="void handleRefresh()">
              取材任务
            </ElButton>
          </ElBadge>

          <ElButton
            :type="filters.timedOutOnly ? 'danger' : 'default'"
            size="small"
            @click="void toggleTimedOutOnly()"
          >
            延迟固定
          </ElButton>
        </div>

        <div
          class="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2"
        >
          <ElTooltip
            v-for="action in DISABLED_TOOLBAR_ACTIONS"
            :key="action.label"
            content="暂未接入"
            placement="top"
          >
            <span class="inline-flex">
              <ElButton :icon="action.icon" disabled size="small">
                {{ action.label }}
              </ElButton>
            </span>
          </ElTooltip>
        </div>
      </section>

      <section
        ref="grossingWorkstationLayoutRef"
        class="grossing-workbench-layout grid min-h-0 flex-1 grid-cols-1 items-stretch gap-2 overflow-hidden xl:gap-0"
        data-testid="grossing-workbench-layout"
        :style="workstationGridStyle"
      >
        <article
          class="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card"
        >
          <div class="min-h-0 flex-1 overflow-hidden">
            <ElTable
              v-loading="loading"
              border
              :current-row-key="selectedTask?.id"
              :data="grossingTaskRows"
              :row-key="getGrossingTableRowKey"
              highlight-current-row
              size="small"
              table-layout="fixed"
              @row-click="(row) => void selectTask(row.task.id)"
            >
              <ElTableColumn fixed="left" label="" width="44">
                <template #default="{ row }">
                  <ElCheckbox
                    :aria-label="`选择任务 ${row.checkNo}`"
                    :model-value="row.task.id === selectedTask?.id"
                    @change="() => void selectTask(row.task.id)"
                    @click.stop
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn fixed="left" label="序" width="52">
                <template #default="{ row }">
                  {{ row.rowIndex }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="检查号"
                min-width="130"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.checkNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="数据状态" min-width="96">
                <template #default="{ row }">
                  <ElTag
                    :type="getTaskStatusTagType(row.task.taskStatus)"
                    effect="plain"
                    size="small"
                  >
                    {{ row.dataStatusText }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn label="病人" min-width="110" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.patientName }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="类型" min-width="96" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.typeText }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="接收人"
                min-width="110"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.receiverName }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="冰冻超时/剩余提醒"
                min-width="150"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.freezeReminder }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态" min-width="96">
                <template #default="{ row }">
                  <ElTag
                    :type="getRowStatusTagType(row.alertLevel)"
                    effect="plain"
                    size="small"
                  >
                    {{ row.statusText }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="申请科室"
                min-width="120"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.requestDepartment }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="肉眼所见"
                min-width="180"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.grossDescription }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="病理诊断"
                min-width="180"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.clinicalDiagnosis }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="申请单号"
                min-width="140"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  {{ row.applicationNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="蜡块总数/打印数" min-width="140">
                <template #default="{ row }">
                  {{ row.blockPrintSummary }}
                </template>
              </ElTableColumn>
            </ElTable>
          </div>

          <footer
            class="flex min-h-10 flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-3 py-2"
          >
            <span class="shrink-0 text-xs text-muted-foreground">
              {{ filters.page }} / {{ totalPageCount }} 共 {{ total }} 条记录
            </span>
            <ElPagination
              v-model:current-page="filters.page"
              v-model:page-size="filters.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              background
              layout="sizes, prev, pager, next, jumper"
              size="small"
              @change="void loadPendingData()"
            />
          </footer>
        </article>

        <button
          aria-label="调整取材任务列表和描写工作区宽度"
          aria-orientation="vertical"
          class="grossing-workbench-resizer hidden xl:block"
          data-testid="grossing-workbench-resizer-left"
          title="拖拽调整取材任务列表和描写工作区宽度"
          type="button"
          @keydown="handleResizeKeydown('left', $event)"
          @pointerdown="handleResizePointerDown('left', $event)"
        ></button>

        <aside
          class="flex min-h-0 min-w-0 flex-col overflow-y-auto rounded-md border border-border bg-card"
        >
          <template v-if="selectedTask">
            <header
              class="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2"
            >
              <div class="min-w-0">
                <div
                  class="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-foreground"
                >
                  <span>病人: {{ selectedPatientName }}</span>
                  <span>病理号: {{ selectedPathologyNo }}</span>
                </div>
                <div
                  class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
                >
                  <span v-for="item in selectedTaskFacts" :key="item.label">
                    {{ item.label }}：{{ item.value }}
                  </span>
                </div>
              </div>
              <div class="flex shrink-0 flex-wrap items-center gap-1.5">
                <ElTag
                  :type="getTaskStatusTagType(selectedTask.taskStatus)"
                  effect="plain"
                  size="small"
                >
                  {{ formatGrossingTaskStatus(selectedTask.taskStatus) }}
                </ElTag>
                <ElButton
                  :disabled="!canOperateGrossingTask(selectedTask)"
                  :loading="workbench.submitting.value"
                  size="small"
                  type="primary"
                  @click="void workbench.submitGrossing()"
                >
                  取材完成
                </ElButton>
              </div>
            </header>

            <GrossingEmbeddingBoxTable
              v-model:selected-specimen-key="
                workbench.selectedEmbeddingBoxSpecimenKey.value
              "
              :can-add-embedding-box="
                canOperateGrossingTask(selectedTask) &&
                workbench.specimenNameOptions.value.length > 0
              "
              :embedding-box-rows="workbench.embeddingBoxRows.value"
              :embedding-remark-options="
                workbench.workflowReferenceOptions.value.embeddingRemarks
              "
              :specimen-options="workbench.specimenNameOptions.value"
              @add-embedding-boxes="workbench.addEmbeddingBoxes"
              @remove-embedding-box="workbench.removeEmbeddingBox"
            />

            <section class="relative border-b border-border">
              <div
                v-if="workbench.descriptionTab.value === 'grossDescription'"
                class="absolute right-3 top-2 z-10 flex items-center gap-2"
              >
                <ElButton
                  :disabled="!workbench.activeSpecimen.value"
                  size="small"
                  type="primary"
                  @click="handleSaveGrossingDescription"
                >
                  保存
                </ElButton>
                <ElButton
                  :disabled="!workbench.activeSpecimen.value"
                  size="small"
                  title="取材模板"
                  @click="focusGrossingTemplatePanel"
                >
                  取材模板
                </ElButton>
              </div>
              <ElTabs
                v-model="workbench.descriptionTab.value"
                class="px-3 pb-3 pr-36"
              >
                <ElTabPane label="大体描写" name="grossDescription">
                  <div class="grid gap-2 pt-2">
                    <ElInput
                      v-if="workbench.activeSpecimen.value"
                      v-model="workbench.activeSpecimen.value.grossDescription"
                      :rows="6"
                      placeholder="请输入当前标本的大体描写"
                      type="textarea"
                    />
                    <ElEmpty v-else description="当前没有可编辑的标本描写" />
                  </div>
                </ElTabPane>

                <ElTabPane label="临床病史" name="clinicalHistory">
                  <div class="grid gap-3 pt-2">
                    <label
                      v-for="field in CLINICAL_HISTORY_FIELDS"
                      :key="field.key"
                      class="grid gap-1.5"
                    >
                      <span class="text-xs font-semibold text-foreground">
                        {{ field.label }}
                      </span>
                      <ElInput
                        v-model="clinicalHistoryForm[field.key]"
                        :placeholder="field.placeholder"
                        :rows="field.rows"
                        type="textarea"
                      />
                    </label>
                  </div>
                </ElTabPane>

                <ElTabPane label="相关检查" name="relatedExaminations">
                  <div
                    class="min-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm leading-7 text-foreground"
                  >
                    {{
                      workbench.workbenchContext.value?.relatedExaminations ||
                      '当前病例暂无检查摘要'
                    }}
                    <div
                      v-if="workbench.workbenchContext.value?.checkItems.length"
                      class="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3"
                    >
                      <ElTag
                        v-for="item in workbench.workbenchContext.value
                          .checkItems"
                        :key="`${item.sequenceNo}-${item.name}`"
                        effect="plain"
                        size="small"
                      >
                        {{ item.name }}
                      </ElTag>
                    </div>
                  </div>
                </ElTabPane>
              </ElTabs>
            </section>

            <template
              v-if="workbench.descriptionTab.value !== 'clinicalHistory'"
            >
              <WorkbenchCapturedImagePanel
                :accept="workbench.grossingImageAccept"
                :can-edit="canEditCapturedImages"
                disabled-text="请先从左侧列表选择任务和可编辑标本"
                :items="capturedImageItems"
                scroll-mode="external"
                :upload-image-file="uploadGrossingImage"
              />
            </template>
          </template>

          <div v-else class="grid min-h-96 flex-1 place-items-center">
            <ElEmpty description="请先选择取材任务" />
          </div>
        </aside>

        <button
          aria-label="调整描写工作区和取材模板宽度"
          aria-orientation="vertical"
          class="grossing-workbench-resizer hidden xl:block"
          data-testid="grossing-workbench-resizer-right"
          title="拖拽调整描写工作区和取材模板宽度"
          type="button"
          @keydown="handleResizeKeydown('right', $event)"
          @pointerdown="handleResizePointerDown('right', $event)"
        ></button>

        <aside
          class="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card"
        >
          <header
            class="flex items-start justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2"
          >
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-foreground">取材模板</h3>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">
                当前标本：{{ activeTemplateSpecimenName }}
              </p>
            </div>
            <ElTag effect="plain" size="small" type="primary">模板</ElTag>
          </header>

          <template v-if="selectedTask">
            <section class="grid gap-2 border-b border-border p-3">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="text-xs font-semibold text-foreground">
                  常用:
                </span>
                <ElButton
                  v-for="item in COMMON_GROSSING_COPY_TEXTS"
                  :key="item"
                  size="small"
                  @click="copyGrossingTemplateText(item)"
                >
                  {{ item }}
                </ElButton>
              </div>
              <ElInput
                v-model="templateSearchKeyword"
                placeholder="输入标本名称或模板关键词"
              />
              <div class="flex flex-wrap items-center gap-3">
                <ElCheckbox v-model="appendTemplateAfterApply">
                  追加
                </ElCheckbox>
                <ElCheckbox :model-value="true" disabled>智能匹配</ElCheckbox>
              </div>
            </section>

            <section class="border-b border-border bg-muted/20">
              <div
                class="border-b border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground"
              >
                标本名称
              </div>
              <div class="grid max-h-36 overflow-auto">
                <button
                  v-for="item in workbench.specimenNameOptions.value"
                  :key="item.value"
                  class="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-left text-sm transition-colors hover:bg-background"
                  :class="
                    item.value === workbench.activeSpecimenKey.value
                      ? 'bg-background font-semibold text-primary'
                      : 'text-foreground'
                  "
                  type="button"
                  @click="selectTemplateSpecimen(item.value)"
                >
                  <span class="truncate">{{ item.label }}</span>
                  <ElTag
                    v-if="item.value === workbench.activeSpecimenKey.value"
                    effect="plain"
                    size="small"
                    type="primary"
                  >
                    当前
                  </ElTag>
                </button>
              </div>
            </section>

            <main class="min-h-0 flex-1 overflow-auto p-3">
              <div v-if="grossingTemplateGroups.length > 0" class="grid gap-3">
                <section
                  v-for="group in grossingTemplateGroups"
                  :key="group.system"
                  class="grid gap-2"
                >
                  <div
                    class="flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                  >
                    <span>{{ group.system }}</span>
                    <span class="h-px flex-1 bg-border"></span>
                  </div>
                  <div class="grid gap-2">
                    <button
                      v-for="template in group.templates"
                      :key="template.id"
                      class="rounded-md border p-3 text-left transition-colors hover:border-primary hover:bg-muted/30"
                      :class="
                        template.id === selectedTemplateId
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background'
                      "
                      type="button"
                      @click="selectGrossingTemplate(template)"
                      @dblclick.stop="appendGrossingTemplateDirectly(template)"
                    >
                      <div
                        class="flex items-start justify-between gap-2 text-sm font-semibold text-foreground"
                      >
                        <span>{{ template.tissueName }}</span>
                        <ElTag
                          v-if="isTemplateMatchedToActiveSpecimen(template)"
                          effect="plain"
                          size="small"
                          type="success"
                        >
                          推荐
                        </ElTag>
                      </div>
                      <p
                        class="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground"
                      >
                        {{ template.content }}
                      </p>
                    </button>
                  </div>
                </section>
              </div>
              <ElEmpty v-else description="未找到匹配的取材模板" />
            </main>

            <footer class="grid gap-2 border-t border-border p-3">
              <div
                class="min-w-0 truncate text-xs text-muted-foreground"
                :title="selectedGrossingTemplate?.content"
              >
                当前模板：{{ selectedGrossingTemplate?.tissueName || '-' }} /
                {{ selectedGrossingTemplate?.content || '请选择模板' }}
              </div>
              <div class="grid grid-cols-2 gap-2">
                <ElButton @click="applyGrossingTemplateWithMode(false)">
                  替换当前
                </ElButton>
                <ElButton
                  type="primary"
                  @click="applyGrossingTemplateWithMode(true)"
                >
                  追加模板
                </ElButton>
              </div>
            </footer>
          </template>

          <div v-else class="grid min-h-96 flex-1 place-items-center">
            <ElEmpty description="请先选择取材任务后使用模板" />
          </div>
        </aside>
      </section>
    </div>

    <ElDrawer
      v-model="moreDrawerVisible"
      :close-on-click-modal="false"
      :title="`更多取材操作 - ${selectedPathologyNo}`"
      size="74%"
    >
      <div class="flex flex-col gap-4 pb-16">
        <section
          class="overflow-hidden rounded-md border border-border bg-card"
        >
          <header
            class="border-b border-border bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground"
          >
            操作信息
          </header>
          <div class="p-3">
            <ElForm label-width="96px">
              <TechnicalOperatorFields
                :form="workbench.operatorForm"
                remarks-placeholder="必要时补充本次取材说明"
                terminal-placeholder="取材终端编码"
              />
            </ElForm>
          </div>
        </section>

        <section
          class="overflow-hidden rounded-md border border-border bg-card"
        >
          <header
            class="border-b border-border bg-muted/30 px-3 py-2 text-sm font-semibold text-foreground"
          >
            标本 / 蜡块 / 影像编辑
          </header>
          <div class="p-3">
            <GrossingSpecimenTabs
              v-model:active-specimen-key="workbench.activeSpecimenKey.value"
              :before-grossing-image-upload="
                workbench.beforeGrossingImageUpload
              "
              :body-part-tree-options="workbench.bodyPartTreeOptions.value"
              :complete-form="workbench.completeForm"
              :create-grossing-image-upload-request="
                workbench.createGrossingImageUploadRequest
              "
              :get-specimen-tab-label="workbench.getSpecimenTabLabel"
              :grossing-image-accept="workbench.grossingImageAccept"
              :is-specimen-uploading="workbench.isSpecimenUploading"
              :label-class="workbench.labelClass"
              :sampling-template-tree-options="
                workbench.samplingTemplateTreeOptions.value
              "
              :specimen-tab-metas="workbench.specimenTabMetas.value"
              :workflow-reference-options="
                workbench.workflowReferenceOptions.value
              "
              @add-block="workbench.addBlock"
              @add-media-asset="workbench.addMediaAsset"
              @add-specimen="workbench.addSpecimen"
              @remove-block="workbench.removeBlock"
              @remove-media-asset="workbench.removeMediaAsset"
              @remove-specimen="workbench.removeSpecimen"
            />
          </div>
        </section>

        <footer
          class="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background/95 py-3"
        >
          <ElButton
            :loading="workbench.contextLoading.value"
            @click="void workbench.loadWorkbenchContext()"
          >
            重新加载
          </ElButton>
          <ElButton
            @click="
              navigation.goToTracking({
                caseId: selectedTask?.caseId ?? undefined,
              })
            "
          >
            查看轨迹
          </ElButton>
          <ElButton
            :disabled="!canOperateGrossingTask(selectedTask)"
            :loading="workbench.submitting.value"
            type="primary"
            @click="void workbench.submitGrossing()"
          >
            完成取材
          </ElButton>
        </footer>
      </div>
    </ElDrawer>
  </Page>
</template>

<style scoped>
.grossing-workbench-resizer {
  position: relative;
  min-height: 360px;
  cursor: col-resize;
  background: transparent;
  border: 0;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.grossing-workbench-resizer::before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 50%;
  width: 2px;
  content: '';
  background: var(--el-border-color);
  border-radius: 999px;
  transform: translateX(-50%);
  transition:
    background-color 0.15s ease,
    width 0.15s ease;
}

.grossing-workbench-resizer:hover,
.grossing-workbench-resizer:focus-visible {
  outline: none;
  background: var(--el-color-primary-light-7);
}

.grossing-workbench-resizer:hover::before,
.grossing-workbench-resizer:focus-visible::before {
  width: 4px;
  background: var(--el-color-primary);
}

:global(.grossing-workbench-is-resizing),
:global(.grossing-workbench-is-resizing *) {
  cursor: col-resize !important;
  user-select: none;
}

@media (width < 1280px) {
  .grossing-workbench-layout {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}
</style>
