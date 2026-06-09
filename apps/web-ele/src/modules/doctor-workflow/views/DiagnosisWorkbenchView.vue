<script setup lang="ts">
import type {
  DiagnosticReportPrintPreview,
  DiagnosticWorkbenchView,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';
import type { DiagnosisWorkbenchQueueQuickFilter } from '../utils/workbench-view';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElAlert, ElMessage } from 'element-plus';

import WorkbenchCapturedImagePanel from '#/modules/shared/components/WorkbenchCapturedImagePanel.vue';

import {
  getDiagnosticWorkbench,
  listPendingDiagnosticTasks,
} from '../api/doctor-workflow-service';
import DiagnosisWorkbenchDetailPane from '../components/DiagnosisWorkbenchDetailPane.vue';
import DiagnosisWorkbenchMedicalOrderPane from '../components/DiagnosisWorkbenchMedicalOrderPane.vue';
import DiagnosisWorkbenchQueueTable from '../components/DiagnosisWorkbenchQueueTable.vue';
import DiagnosisWorkbenchReportEditor from '../components/DiagnosisWorkbenchReportEditor.vue';
import DiagnosisWorkbenchToolbar from '../components/DiagnosisWorkbenchToolbar.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import { firstQueryParam } from '../utils/route';
import {
  buildDiagnosisWorkbenchQueueStats,
  filterDiagnosisWorkbenchQueueItems,
  resolveWorkbenchSelection,
} from '../utils/workbench-view';

type DiagnosisWorkbenchResizeHandle = 'left' | 'right';

interface DiagnosisCapturedImageItem {
  fileUrl: string;
  key: string;
  meta: string;
  objectUrl: string;
  sourceLabel: string;
  title: string;
}

const route = useRoute();
const router = useRouter();

const queueLoading = ref(false);
const detailLoading = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingDiagnosticTaskItem[]>([]);
const workbench = ref<DiagnosticWorkbenchView | null>(null);
const reportPrintPreview = ref<DiagnosticReportPrintPreview | null>(null);
const selectedCaseId = ref('');
const selectedTaskId = ref('');
const selfRouteQueryKey = ref('');
const printPreviewVisible = ref(false);
const activeQuickFilter = ref<DiagnosisWorkbenchQueueQuickFilter>('ALL');
const assignedRange = ref<string[]>(createDefaultAssignedRange());
const diagnosisCapturedImagesByCaseId = reactive<
  Record<string, DiagnosisCapturedImageItem[]>
>({});
const diagnosisImageAccept = 'image/jpeg,image/png,image/webp,image/bmp';
const diagnosisImageMaxSize = 20 * 1024 * 1024;
const diagnosisImageTypes = new Set(diagnosisImageAccept.split(','));
const workstationLayoutRef = ref<HTMLElement>();
const paneWidths = reactive({
  materials: 33,
  queue: 26,
  report: 41,
});

const filters = reactive({
  page: 1,
  pathologyNo: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
});

const routeCaseId = computed(() => firstQueryParam(route.query.caseId));
const routePathologyNo = computed(() =>
  firstQueryParam(route.query.pathologyNo),
);
const routeTaskId = computed(() => firstQueryParam(route.query.taskId));
const routeQueryKey = computed(
  () => `${routeCaseId.value}|${routePathologyNo.value}|${routeTaskId.value}`,
);
const isCurrentWorkbenchRoute = computed(
  () =>
    route.name === 'DiagnosisWorkbench' ||
    route.path === '/doctor-workflow/workbench',
);
const currentQuery = computed(() => ({
  assignedFrom: assignedRange.value[0] || undefined,
  assignedTo: assignedRange.value[1] || undefined,
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskStatus: filters.taskStatus || undefined,
  taskType: filters.taskType || undefined,
}));
const dateRangePendingItems = computed(() =>
  filterDiagnosisWorkbenchQueueItems(
    pendingItems.value,
    'ALL',
    assignedRange.value,
  ),
);
const visiblePendingItems = computed(() =>
  filterDiagnosisWorkbenchQueueItems(
    dateRangePendingItems.value,
    activeQuickFilter.value,
    assignedRange.value,
  ),
);
const queueStats = computed(() =>
  buildDiagnosisWorkbenchQueueStats(dateRangePendingItems.value),
);
const selectedCapturedImages = computed(() =>
  selectedCaseId.value
    ? (diagnosisCapturedImagesByCaseId[selectedCaseId.value] ?? [])
    : [],
);
const canCaptureDiagnosisImage = computed(() => Boolean(selectedCaseId.value));
const workstationGridStyle = computed(() => ({
  gridTemplateColumns: `${paneWidths.queue}fr 6px ${paneWidths.report}fr 6px ${paneWidths.materials}fr`,
}));

function validateDiagnosisImageFile(file: File) {
  if (!diagnosisImageTypes.has(file.type)) {
    ElMessage.warning('仅支持 JPG、PNG、WEBP、BMP 格式的诊断采图');
    return false;
  }
  if (file.size > diagnosisImageMaxSize) {
    ElMessage.warning('单张诊断采图不能超过 20MB');
    return false;
  }
  return true;
}

async function uploadDiagnosisImage(file: File) {
  const caseId = selectedCaseId.value.trim();
  if (!caseId) {
    ElMessage.warning('请先从左侧选择病例');
    return false;
  }
  if (!validateDiagnosisImageFile(file)) {
    return false;
  }

  const objectUrl = URL.createObjectURL(file);
  const item: DiagnosisCapturedImageItem = {
    fileUrl: objectUrl,
    key: `${caseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    meta: [
      workbench.value?.pathologyNo?.trim() || selectedTaskId.value,
      '当前诊断',
    ]
      .filter(Boolean)
      .join(' / '),
    objectUrl,
    sourceLabel: '当前',
    title: file.name || '诊断采图',
  };
  diagnosisCapturedImagesByCaseId[caseId] = [
    item,
    ...(diagnosisCapturedImagesByCaseId[caseId] ?? []),
  ];
  ElMessage.success('诊断采图已加入当前病例');
  return true;
}

function revokeDiagnosisCaptureObjectUrls() {
  for (const items of Object.values(diagnosisCapturedImagesByCaseId)) {
    for (const item of items) {
      URL.revokeObjectURL(item.objectUrl);
    }
  }
}

function syncRouteToSelection(task: PendingDiagnosticTaskItem) {
  const query = {
    caseId: task.caseId,
    pathologyNo: task.pathologyNo ?? undefined,
    taskId: task.id,
  };

  selfRouteQueryKey.value = `${query.caseId}|${query.pathologyNo ?? ''}|${query.taskId}`;
  void router.replace({
    path: '/doctor-workflow/workbench',
    query,
  });
}

function createDefaultAssignedRange() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 2);
  return [formatDateForPicker(start), formatDateForPicker(end)];
}

function formatDateForPicker(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clearWorkbenchSelection() {
  selectedCaseId.value = '';
  selectedTaskId.value = '';
  workbench.value = null;
}

async function loadWorkbench(caseId: string) {
  if (!caseId.trim()) {
    workbench.value = null;
    return;
  }

  detailLoading.value = true;
  pageError.value = '';
  try {
    workbench.value = await getDiagnosticWorkbench(caseId.trim());
  } catch (error) {
    workbench.value = null;
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    detailLoading.value = false;
  }
}

async function selectQueueTask(
  task: PendingDiagnosticTaskItem,
  options: { forceDetailReload?: boolean; syncRoute?: boolean } = {},
) {
  const caseChanged = selectedCaseId.value !== task.caseId;
  const taskChanged = selectedTaskId.value !== task.id;

  selectedCaseId.value = task.caseId;
  selectedTaskId.value = task.id;

  if (options.syncRoute !== false) {
    syncRouteToSelection(task);
  }

  if (caseChanged || options.forceDetailReload || !workbench.value) {
    await loadWorkbench(task.caseId);
    return;
  }

  if (taskChanged && !workbench.value) {
    await loadWorkbench(task.caseId);
  }
}

async function loadQueue(
  options: {
    forceDetailReload?: boolean;
    preserveRouteSelection?: boolean;
  } = {},
) {
  queueLoading.value = true;
  pageError.value = '';

  try {
    const result = await listPendingDiagnosticTasks(currentQuery.value);
    pendingItems.value = result.items;

    const preferredTaskId = options.preserveRouteSelection
      ? routeTaskId.value || selectedTaskId.value
      : selectedTaskId.value || routeTaskId.value;
    const preferredCaseId = options.preserveRouteSelection
      ? routeCaseId.value || selectedCaseId.value
      : selectedCaseId.value || routeCaseId.value;

    const nextSelection = resolveWorkbenchSelection(
      visiblePendingItems.value,
      preferredTaskId,
      preferredCaseId,
    );

    if (nextSelection) {
      await selectQueueTask(nextSelection, {
        forceDetailReload: options.forceDetailReload,
      });
      return;
    }

    if (preferredCaseId) {
      selectedCaseId.value = preferredCaseId;
      selectedTaskId.value = preferredTaskId;
      await loadWorkbench(preferredCaseId);
      return;
    }

    clearWorkbenchSelection();
  } catch (error) {
    clearWorkbenchSelection();
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    queueLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadQueue({ forceDetailReload: true });
}

function handleQuickFilter(filter: DiagnosisWorkbenchQueueQuickFilter) {
  activeQuickFilter.value = filter;
  filters.page = 1;

  if (filter === 'ALL' || filter === 'UNSIGNED_REPORT') {
    filters.taskStatus = '';
    filters.taskType = '';
  } else if (
    filter === 'ASSIGNED' ||
    filter === 'COMPLETED' ||
    filter === 'IN_PROGRESS'
  ) {
    filters.taskStatus = filter;
    filters.taskType = '';
  } else {
    filters.taskStatus = '';
    filters.taskType = filter;
  }

  void loadQueue({ forceDetailReload: true });
}

function handleReset() {
  activeQuickFilter.value = 'ALL';
  assignedRange.value = createDefaultAssignedRange();
  filters.page = 1;
  filters.pathologyNo = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.taskStatus = '';
  filters.taskType = '';
  clearWorkbenchSelection();

  selfRouteQueryKey.value = '||';
  void router.replace({
    path: '/doctor-workflow/workbench',
    query: {},
  });

  void loadQueue({ forceDetailReload: true });
}

function handleRefresh() {
  void loadQueue({ forceDetailReload: Boolean(selectedCaseId.value) });
}

function refreshCurrentWorkbench() {
  if (!selectedCaseId.value) {
    return;
  }
  void loadWorkbench(selectedCaseId.value);
}

function handleReportPrintPreviewChange(
  preview: DiagnosticReportPrintPreview | null,
) {
  reportPrintPreview.value = preview;
}

function applyPaneWidths(nextWidths: {
  materials: number;
  queue: number;
  report: number;
}) {
  const minWidth = 18;
  const total = nextWidths.queue + nextWidths.report + nextWidths.materials;
  if (
    total <= 0 ||
    nextWidths.queue < minWidth ||
    nextWidths.report < minWidth ||
    nextWidths.materials < minWidth
  ) {
    return;
  }

  paneWidths.queue = nextWidths.queue;
  paneWidths.report = nextWidths.report;
  paneWidths.materials = nextWidths.materials;
}

function handleResizePointerDown(
  handle: DiagnosisWorkbenchResizeHandle,
  event: PointerEvent,
) {
  if (event.button !== 0) {
    return;
  }

  const layoutElement = workstationLayoutRef.value;
  if (!layoutElement) {
    return;
  }

  event.preventDefault();
  const startX = event.clientX;
  const startWidths = { ...paneWidths };
  const layoutWidth = layoutElement.getBoundingClientRect().width;

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const deltaPercent = ((moveEvent.clientX - startX) / layoutWidth) * 100;
    if (handle === 'left') {
      applyPaneWidths({
        ...startWidths,
        queue: startWidths.queue + deltaPercent,
        report: startWidths.report - deltaPercent,
      });
      return;
    }

    applyPaneWidths({
      ...startWidths,
      materials: startWidths.materials - deltaPercent,
      report: startWidths.report + deltaPercent,
    });
  };

  const stopResize = () => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopResize);
    window.removeEventListener('pointercancel', stopResize);
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', stopResize, { once: true });
  window.addEventListener('pointercancel', stopResize, { once: true });
}

watch(
  () => ({
    isActive: isCurrentWorkbenchRoute.value,
    queryKey: routeQueryKey.value,
  }),
  ({ isActive, queryKey }) => {
    if (!isActive) {
      return;
    }

    if (queryKey === selfRouteQueryKey.value) {
      selfRouteQueryKey.value = '';
      return;
    }

    filters.pathologyNo = routePathologyNo.value;
    selectedCaseId.value = routeCaseId.value;
    selectedTaskId.value = routeTaskId.value;
    void loadQueue({
      forceDetailReload: Boolean(routeCaseId.value),
      preserveRouteSelection: true,
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  revokeDiagnosisCaptureObjectUrls();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-2">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <DiagnosisWorkbenchToolbar
        v-model:assigned-range="assignedRange"
        :active-quick-filter="activeQuickFilter"
        :keyword="filters.pathologyNo"
        :loading="queueLoading"
        :stats="queueStats"
        :task-type="filters.taskType"
        @quick-filter="handleQuickFilter"
        @refresh="handleRefresh"
        @reset="handleReset"
        @search="handleSearch"
        @update:keyword="filters.pathologyNo = $event"
        @update:task-type="filters.taskType = $event"
      />

      <div
        ref="workstationLayoutRef"
        class="diagnosis-workbench-layout grid min-h-0 gap-3 xl:items-stretch xl:gap-0"
        :style="workstationGridStyle"
      >
        <DiagnosisWorkbenchQueueTable
          :items="visiblePendingItems"
          :loading="queueLoading"
          :selected-task-id="selectedTaskId"
          class="min-h-[360px] min-w-[320px] xl:h-[calc(100vh-270px)]"
          @select="selectQueueTask"
        />

        <button
          aria-label="调整诊断队列和报告预览编辑宽度"
          class="diagnosis-workbench-resizer mx-1 hidden xl:block"
          data-testid="diagnosis-workbench-resizer-left"
          type="button"
          @pointerdown="handleResizePointerDown('left', $event)"
        ></button>

        <DiagnosisWorkbenchReportEditor
          v-model:print-preview-visible="printPreviewVisible"
          :loading="detailLoading"
          :workbench="workbench"
          class="min-h-[360px] min-w-[440px] xl:h-[calc(100vh-270px)]"
          @preview-change="handleReportPrintPreviewChange"
        />

        <button
          aria-label="调整报告预览编辑和诊断材料区宽度"
          class="diagnosis-workbench-resizer mx-1 hidden xl:block"
          data-testid="diagnosis-workbench-resizer-right"
          type="button"
          @pointerdown="handleResizePointerDown('right', $event)"
        ></button>

        <DiagnosisWorkbenchDetailPane
          :print-preview="reportPrintPreview"
          :workbench="workbench"
          class="min-h-[360px] min-w-[380px] xl:h-[calc(100vh-270px)] xl:overflow-auto"
        >
          <template #medical-orders>
            <DiagnosisWorkbenchMedicalOrderPane
              embedded
              :loading="detailLoading"
              :workbench="workbench"
              @refresh="refreshCurrentWorkbench"
            />
          </template>
          <template #capture>
            <section
              class="diagnosis-capture-section flex min-h-[320px] flex-col border border-border bg-card"
            >
              <header
                class="flex items-center justify-between gap-3 border-b border-border px-3 py-2"
              >
                <h3 class="text-sm font-semibold text-foreground">采图区</h3>
              </header>
              <WorkbenchCapturedImagePanel
                :accept="diagnosisImageAccept"
                :can-edit="canCaptureDiagnosisImage"
                disabled-text="请先从左侧选择病例"
                empty-description="当前病例暂无诊断采图"
                :items="selectedCapturedImages"
                preview-hint="当前病例拍照实时预览"
                :upload-image-file="uploadDiagnosisImage"
              />
            </section>
          </template>
        </DiagnosisWorkbenchDetailPane>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.diagnosis-workbench-resizer {
  min-height: 360px;
  cursor: col-resize;
  background: transparent;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.diagnosis-workbench-resizer:hover,
.diagnosis-workbench-resizer:focus-visible {
  outline: none;
  background: var(--el-color-primary-light-7);
}

.diagnosis-capture-section {
  border-radius: 6px;
}

@media (width < 1280px) {
  .diagnosis-workbench-layout {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}
</style>
