<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  TechnicalTrackingView as TechnicalTrackingViewModel,
} from '../types/technical-workflow';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from 'element-plus';

import {
  getTechnicalTracking,
  listPendingTechnicalTasks,
  startSlideStaining,
} from '../api/technical-workflow-service';
import StainingProcessDialog from '../components/StainingProcessDialog.vue';
import TechnicalTaskStartDialog from '../components/TechnicalTaskStartDialog.vue';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatNullable,
  formatObjectType,
  formatQualityStatus,
  formatSlideStatus,
  formatTaskStatus,
} from '../utils/format';

interface TableInstance {
  clearSelection: () => void;
  toggleRowSelection: (
    row: StainingTaskRow,
    selected?: boolean,
    ignoreSelectable?: boolean,
  ) => void;
}

interface StainingTaskRow {
  index: number;
  pathologyNo: string;
  patientId: string;
  patientName: string;
  slideNo: string;
  slideType: string;
  sliceOperation: string;
  stainingOperation: string;
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
  sliceOperation: string;
  stainingOperation: string;
}

const STAINING_TYPE_OPTIONS = [
  { label: '不限类型', value: 'ALL' },
  { label: 'HE', value: 'HE' },
  { label: '免疫组化', value: 'IHC' },
  { label: '特殊染色', value: 'SPECIAL_STAIN' },
] as const;

const route = useRoute();

const pageError = ref('');
const loading = ref(false);
const trackingLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const selectedPendingRows = ref<StainingTaskRow[]>([]);
const selectedCompletedRows = ref<CompletedSlideRow[]>([]);
const trackingResult = ref<null | TechnicalTrackingViewModel>(null);
const pendingTableRef = ref<null | TableInstance>(null);
const startDialogVisible = ref(false);
const processDialogVisible = ref(false);
const pendingAutoProcessTaskId = ref('');

const filters = reactive({
  completedPage: 1,
  completedSize: 10,
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
    patientId: '-',
    patientName: '-',
    sliceOperation: formatNullable(task.sampledByName ?? task.assignedToName),
    slideNo: formatNullable(task.objectId),
    slideType: formatObjectType(task.objectType),
    stainingOperation: formatTaskStatus(task.taskStatus),
    task,
  })),
);

const selectedPendingRow = computed(
  () => selectedPendingRows.value[0] ?? null,
);
const selectedTask = computed(
  () => selectedPendingRow.value?.task ?? null,
);

const completedRows = computed<CompletedSlideRow[]>(() =>
  (trackingResult.value?.slides ?? []).map((slide, index) => ({
    index: index + 1,
    pathologyNo: formatNullable(
      trackingResult.value?.pathologyNo ?? selectedTask.value?.pathologyNo,
    ),
    patientId: '-',
    patientName: '-',
    slideId: slide.slideId,
    slideNo: formatNullable(slide.slideNo),
    slideStatus: slide.slideStatus,
    slideType: formatObjectType('SLIDE'),
    sliceOperation: formatQualityStatus(slide.qualityStatus),
    stainingOperation: formatSlideStatus(slide.slideStatus),
  })),
);

const visiblePendingRows = computed(() => pendingRows.value);
const overdueCount = computed(
  () => pendingRows.value.filter((row) => row.task.timedOut).length,
);
const stainedCount = computed(
  () =>
    completedRows.value.filter((row) => row.slideStatus === 'STAINED').length,
);
const selectedCompletedCount = computed(
  () => selectedCompletedRows.value.length,
);
const pendingStats = computed(() => [
  {
    accent: 'sky',
    label: '当日应切总数',
    value: total.value,
  },
  {
    accent: 'emerald',
    label: '已切',
    value: pendingRows.value.filter(
      (row) => row.task.taskStatus === 'IN_PROGRESS',
    ).length,
  },
  {
    accent: 'amber',
    label: '未出片',
    value: total.value,
  },
  {
    accent: 'rose',
    label: '已出片',
    value: stainedCount.value,
  },
]);

const completedPageCount = computed(() =>
  Math.max(1, Math.ceil(completedRows.value.length / filters.completedSize)),
);
const visibleCompletedRows = computed(() => {
  const start = (filters.completedPage - 1) * filters.completedSize;
  return completedRows.value.slice(start, start + filters.completedSize);
});
const canProcessSelectedTask = computed(
  () => selectedTask.value?.taskStatus === 'IN_PROGRESS',
);
const canStartSelectedTask = computed(
  () => selectedTask.value?.taskStatus === 'PENDING',
);

function selectPendingRow(row: null | StainingTaskRow, openProcess = false) {
  if (!row) {
    selectedPendingRows.value = [];
    return;
  }
  selectedPendingRows.value = [row];
  pendingTableRef.value?.clearSelection();
  pendingTableRef.value?.toggleRowSelection(row, true);

  if (!openProcess) {
    return;
  }
  if (row.task.taskStatus === 'PENDING') {
    pendingAutoProcessTaskId.value = row.task.id;
    startDialogVisible.value = true;
    return;
  }
  if (row.task.taskStatus === 'IN_PROGRESS') {
    processDialogVisible.value = true;
  }
}

async function loadTrackingForTask(task: null | PendingTechnicalTaskItem) {
  if (!task?.caseId) {
    trackingResult.value = null;
    return;
  }

  trackingLoading.value = true;
  try {
    trackingResult.value = await getTechnicalTracking(task.caseId);
    selectedCompletedRows.value = [];
    filters.completedPage = 1;
  } catch (error) {
    trackingResult.value = null;
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    trackingLoading.value = false;
  }
}

async function loadPendingData(options?: {
  openProcess?: boolean;
  preferredTaskId?: string;
}) {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks({
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      size: filters.size,
      taskType: 'STAINING',
      timedOutOnly: filters.timedOutOnly,
    });

    pendingItems.value = result.items;
    total.value = result.total;

    const deepLinkedTaskId =
      typeof route.query.taskId === 'string' ? route.query.taskId : '';
    const preferredTaskId =
      options?.preferredTaskId ||
      pendingAutoProcessTaskId.value ||
      deepLinkedTaskId ||
      selectedTask.value?.id ||
      result.items[0]?.id;

    if (preferredTaskId) {
      const matchedRow =
        visiblePendingRows.value.find(
          (row) => row.task.id === preferredTaskId,
        ) ?? null;
      if (matchedRow) {
        selectPendingRow(
          matchedRow,
          Boolean(options?.openProcess || pendingAutoProcessTaskId.value || deepLinkedTaskId),
        );
      } else {
        selectPendingRow(null);
      }
    } else {
      selectPendingRow(null);
    }
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

function handlePendingRowClick(row: StainingTaskRow) {
  selectPendingRow(row);
}

function handleRefresh() {
  void loadPendingData();
}

function handleQuery() {
  filters.page = 1;
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

function openPrimaryAction() {
  if (selectedPendingRows.value.length > 1) {
    ElMessage.warning('当前仅支持单张玻片染色出片，请只勾选 1 张');
    return;
  }

  const row = selectedPendingRow.value;
  if (!row) {
    ElMessage.warning('请先从左侧勾选 1 张待出片玻片');
    return;
  }
  if (row.task.taskStatus === 'PENDING') {
    pendingAutoProcessTaskId.value = row.task.id;
    startDialogVisible.value = true;
    return;
  }
  if (row.task.taskStatus === 'IN_PROGRESS') {
    processDialogVisible.value = true;
    return;
  }
  ElMessage.warning('当前任务状态不支持染色出片');
}

function handleStartSubmitted() {
  startDialogVisible.value = false;
  const taskId = pendingAutoProcessTaskId.value;
  pendingAutoProcessTaskId.value = '';
  void loadPendingData({
    openProcess: true,
    preferredTaskId: taskId || undefined,
  });
}

function handleProcessSubmitted() {
  processDialogVisible.value = false;
  void loadPendingData();
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

watch(selectedPendingRow, (task) => {
  void loadTrackingForTask(task?.task ?? null);
});

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
  void loadPendingData();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>

<template>
  <Page>
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
              :disabled="!canStartSelectedTask && !canProcessSelectedTask"
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
              <ElSelect v-model="filters.stainingType">
                <ElOption
                  v-for="option in STAINING_TYPE_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
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
              <span>当前页 {{ filters.page }} / {{ Math.max(1, Math.ceil(total / filters.size)) }}</span>
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
              @row-click="handlePendingRowClick"
              @selection-change="handlePendingSelectionChange"
            >
              <ElTableColumn
                type="selection"
                width="42"
              />
              <ElTableColumn
                label="序"
                type="index"
                width="52"
              />
              <ElTableColumn
                label="玻片编号"
                min-width="140"
              >
                <template #default="{ row }">
                  {{ row.slideNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="玻片类型"
                min-width="120"
              >
                <template #default="{ row }">
                  {{ row.slideType }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="病理号"
                min-width="140"
              >
                <template #default="{ row }">
                  {{ row.pathologyNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="病人"
                min-width="120"
              >
                <template #default="{ row }">
                  {{ row.patientName }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="主班备注"
                min-width="180"
              >
                <template #default="{ row }">
                  {{ formatNullable(row.task.productionRemarks ?? row.task.remarks) }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="切片操作"
                min-width="120"
              >
                <template #default="{ row }">
                  {{ row.sliceOperation }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="出片操作"
                min-width="120"
              >
                <template #default="{ row }">
                  <ElTag
                    :type="row.task.taskStatus === 'IN_PROGRESS' ? 'warning' : 'info'"
                  >
                    {{ row.stainingOperation }}
                  </ElTag>
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

        <section v-loading="trackingLoading" class="legacy-panel legacy-panel--right">
          <header class="legacy-panel__header legacy-panel__header--right">
            <div>
              <h3 class="legacy-panel__title">已完成出片</h3>
              <p class="legacy-panel__subtitle">
                当前仅展示选中病例的追踪结果，完成后会同步回写病例状态。
              </p>
            </div>
            <div class="legacy-panel__meta legacy-panel__meta--right">
              <span>当前病例 {{ formatNullable(trackingResult?.pathologyNo ?? selectedTask?.pathologyNo) }}</span>
              <span>本次清零后扫码数（{{ selectedCompletedCount }}）</span>
            </div>
          </header>

          <div class="legacy-workbench-tools">
            <ElButton disabled>扫码清零</ElButton>
            <ElButton disabled>打印清零码</ElButton>
            <ElButton disabled>校验</ElButton>
          </div>

          <div v-if="visibleCompletedRows.length > 0" class="legacy-table-shell">
            <ElTable
              border
              :data="visibleCompletedRows"
              :row-key="(row) => row.slideId"
              table-layout="fixed"
              @selection-change="handleCompletedSelectionChange"
            >
              <ElTableColumn
                type="selection"
                width="42"
              />
              <ElTableColumn
                label="序"
                type="index"
                width="52"
              />
              <ElTableColumn
                label="玻片编号"
                min-width="140"
              >
                <template #default="{ row }">
                  {{ row.slideNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="玻片类型"
                min-width="120"
              >
                <template #default="{ row }">
                  {{ row.slideType }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="病理号"
                min-width="140"
              >
                <template #default="{ row }">
                  {{ row.pathologyNo }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="病人"
                min-width="120"
              >
                <template #default="{ row }">
                  {{ row.patientName }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="切片操作"
                min-width="120"
              >
                <template #default="{ row }">
                  {{ row.sliceOperation }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="出片操作"
                min-width="120"
              >
                <template #default="{ row }">
                  <ElTag
                    :type="row.slideStatus === 'STAINED' ? 'success' : 'info'"
                  >
                    {{ row.stainingOperation }}
                  </ElTag>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
          <ElEmpty v-else description="当前病例暂无已完成出片记录" />

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

    <TechnicalTaskStartDialog
      v-model="startDialogVisible"
      confirm-text="开始染色"
      :submit-action="(taskId, payload) => startSlideStaining({ ...payload, taskId })"
      :success-message="(task) => `任务 ${task.id} 已开始染色`"
      :task="selectedTask"
      terminal-placeholder="染色终端编码"
      title="开始染色"
      @submitted="handleStartSubmitted"
    />

    <StainingProcessDialog
      v-model="processDialogVisible"
      :task="selectedTask"
      @submitted="handleProcessSubmitted"
    />
  </Page>
</template>

<style scoped>
.legacy-staining-workbench {
  display: flex;
  min-height: calc(100vh - 220px);
  flex-direction: column;
  gap: 16px;
}

.legacy-header,
.legacy-panel {
  background: #fff;
  border: 1px solid #d8e4ef;
  box-shadow: 0 8px 24px rgb(15 23 42 / 6%);
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.legacy-stat-card {
  min-height: 84px;
  padding: 12px 14px;
  color: #0f172a;
  background: linear-gradient(135deg, #f8fbff 0%, #eef5fb 100%);
  border: 1px solid #d7e7f4;
}

.legacy-stat-card[data-accent='amber'] {
  background: linear-gradient(135deg, #fff9eb 0%, #ffeec3 100%);
  border-color: #f3d38f;
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

.legacy-stat-card__label {
  font-size: 12px;
  line-height: 18px;
  color: #475569;
}

.legacy-stat-card__value {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}

.legacy-action-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #e2e8f0;
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
  margin-left: 6px;
  padding: 0 6px;
  color: #fff;
  background: #ef4444;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
}

.legacy-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr);
  gap: 16px;
}

.legacy-panel {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.legacy-panel--right {
  background: linear-gradient(180deg, #fbfdff 0%, #ffffff 100%);
}

.legacy-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
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
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.legacy-panel__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  color: #475569;
  font-size: 12px;
  line-height: 18px;
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
