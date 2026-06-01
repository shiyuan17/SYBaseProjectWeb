<script setup lang="ts">
import type {
  PendingTechnicalTaskItem,
  TechnicalTaskAssignmentForm,
  TechnicalTaskBoardViewMode,
  TechnicalTaskCaseGroup,
  TechnicalTaskPoolFilters,
  TechnicalTaskStatCard,
} from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import {
  assignTechnicalTask,
  claimTechnicalTask,
  listPendingTechnicalTasks,
  releaseTechnicalTask,
  updateTechnicalTaskPriority,
} from '../api/technical-workflow-service';
import TechnicalTaskAssignmentDialog from '../components/TechnicalTaskAssignmentDialog.vue';
import TechnicalTaskBulkActionsBar from '../components/TechnicalTaskBulkActionsBar.vue';
import TechnicalTaskCaseBoard from '../components/TechnicalTaskCaseBoard.vue';
import TechnicalTaskFilterPanel from '../components/TechnicalTaskFilterPanel.vue';
import TechnicalTaskStatsGrid from '../components/TechnicalTaskStatsGrid.vue';
import TechnicalTaskTablePanel from '../components/TechnicalTaskTablePanel.vue';
import {
  DEFAULT_PAGE_SIZE,
  TECHNICAL_TASK_PRIORITY_OPTIONS,
  TECHNICAL_TASK_STATUS_OPTIONS,
  TECHNICAL_TASK_TYPE_OPTIONS,
} from '../constants';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import { getWorkflowPageErrorMessage } from '../utils/error';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const submittingAssignment = ref(false);
const bulkLoading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const assignmentDialogVisible = ref(false);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);
const selectedTaskIds = ref<string[]>([]);
const viewMode = ref<TechnicalTaskBoardViewMode>('task');
const bulkPriority = ref('NORMAL');

const stationOptions = [
  { label: '取材台', value: 'GROSSING' },
  { label: '脱水工作站', value: 'DEHYDRATION' },
  { label: '包埋工作站', value: 'EMBEDDING' },
  { label: '切片工作站', value: 'SLICING' },
  { label: '染色出片', value: 'STAINING' },
  { label: '返工工作站', value: 'REWORK' },
];

const filters = reactive<TechnicalTaskPoolFilters>({
  applicationNo: '',
  assignedToUserId: '',
  assignmentStatus: '',
  createdRange: [] as string[],
  currentNode: '',
  page: 1,
  pathologyNo: '',
  priority: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
  timedOutOnly: false,
});

const filtersModel = computed({
  get: () => filters,
  set: (nextFilters: TechnicalTaskPoolFilters) => {
    Object.assign(filters, nextFilters);
  },
});

const currentPageModel = computed({
  get: () => filters.page,
  set: (page: number) => {
    filters.page = page;
    void loadPendingData();
  },
});

const pageSizeModel = computed({
  get: () => filters.size,
  set: (size: number) => {
    filters.size = size;
    void loadPendingData();
  },
});

const assignmentForm = reactive<TechnicalTaskAssignmentForm>({
  assignedToName: '',
  assignedToUserId: '',
  expectedCompletedAt: '',
  operatorName: '',
  operatorUserId: '',
  priority: 'NORMAL',
  productionRemarks: '',
  stationCode: '',
  stationName: '',
  terminalCode: '',
});

const assignmentFormModel = computed({
  get: () => assignmentForm,
  set: (nextForm: TechnicalTaskAssignmentForm) => {
    Object.assign(assignmentForm, nextForm);
  },
});

const currentQuery = computed(() => ({
  applicationNo: filters.applicationNo.trim() || undefined,
  assignedToUserId:
    filters.assignmentStatus === 'ASSIGNED'
      ? filters.assignedToUserId.trim() || undefined
      : undefined,
  createdFrom: filters.createdRange[0] || undefined,
  createdTo: filters.createdRange[1] || undefined,
  currentNode: filters.currentNode || undefined,
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  priority: filters.priority || undefined,
  size: filters.size,
  taskStatus: filters.taskStatus || undefined,
  taskType: filters.taskType || undefined,
  timedOutOnly: filters.timedOutOnly,
}));

const visibleItems = computed(() => {
  if (filters.assignmentStatus === 'UNASSIGNED') {
    return pendingItems.value.filter((item) => !item.assignedToUserId);
  }
  return pendingItems.value;
});

const groupedItems = computed<TechnicalTaskCaseGroup[]>(() => {
  const grouped = new Map<string, PendingTechnicalTaskItem[]>();
  visibleItems.value.forEach((item) => {
    const key = item.caseId || item.pathologyNo || item.id;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  });
  return [...grouped.entries()].map(([key, items]) => ({
    caseId: items[0]?.caseId ?? key,
    items,
    pathologyNo: items[0]?.pathologyNo ?? '',
    taskCount: items.length,
    timedOutCount: items.filter((item) => item.timedOut).length,
  }));
});

const selectedRows = computed(() =>
  visibleItems.value.filter((item) => selectedTaskIds.value.includes(item.id)),
);

const taskStats = computed<TechnicalTaskStatCard[]>(() => {
  const activeItems = pendingItems.value.filter(
    (item) => item.taskStatus !== 'COMPLETED',
  );
  return [
    {
      label: '待生产标本',
      value: activeItems.length,
    },
    {
      label: '急诊/加急',
      value: pendingItems.value.filter((item) => item.priority === 'STAT')
        .length,
    },
    {
      label: '今日已完成',
      value: pendingItems.value.filter(
        (item) => item.taskStatus === 'COMPLETED',
      ).length,
    },
    {
      label: '超时风险',
      value: pendingItems.value.filter((item) => item.timedOut).length,
    },
  ];
});

function handleSelectionChange(rows: PendingTechnicalTaskItem[]) {
  selectedTaskIds.value = rows.map((item) => item.id);
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingTechnicalTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData();
}

function handleReset() {
  filters.applicationNo = '';
  filters.assignedToUserId = '';
  filters.assignmentStatus = '';
  filters.createdRange = [];
  filters.currentNode = '';
  filters.page = 1;
  filters.pathologyNo = '';
  filters.priority = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.taskStatus = '';
  filters.taskType = '';
  filters.timedOutOnly = false;
  selectedTaskIds.value = [];
  void loadPendingData();
}

function openAssignDialog(row: PendingTechnicalTaskItem) {
  selectedTask.value = row;
  assignmentForm.assignedToName = row.assignedToName ?? '';
  assignmentForm.assignedToUserId = row.assignedToUserId ?? '';
  assignmentForm.expectedCompletedAt = row.expectedCompletedAt ?? '';
  assignmentForm.operatorName = userStore.userInfo?.realName ?? '';
  assignmentForm.operatorUserId = userStore.userInfo?.userId ?? '';
  assignmentForm.priority = row.priority ?? 'NORMAL';
  assignmentForm.productionRemarks = row.productionRemarks ?? '';
  assignmentForm.stationCode =
    row.stationCode ?? row.currentNode ?? row.taskType ?? '';
  assignmentForm.stationName =
    row.stationName ??
    stationOptions.find((item) => item.value === assignmentForm.stationCode)
      ?.label ??
    '';
  assignmentForm.terminalCode = '';
  assignmentDialogVisible.value = true;
}

async function submitAssignment() {
  if (!selectedTask.value) {
    return;
  }
  if (!assignmentForm.operatorName.trim()) {
    ElMessage.warning('请先确认当前登录人');
    return;
  }

  submittingAssignment.value = true;
  try {
    await assignTechnicalTask(selectedTask.value.id, {
      assignedToName: assignmentForm.assignedToName.trim() || null,
      assignedToUserId: assignmentForm.assignedToUserId.trim() || null,
      expectedCompletedAt: assignmentForm.expectedCompletedAt || null,
      priority: assignmentForm.priority,
      productionRemarks: assignmentForm.productionRemarks.trim() || null,
      stationCode: assignmentForm.stationCode || null,
      stationName: assignmentForm.stationName || null,
      terminalCode: assignmentForm.terminalCode.trim() || null,
    });
    ElMessage.success('任务已分派');
    assignmentDialogVisible.value = false;
    await loadPendingData();
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submittingAssignment.value = false;
  }
}

async function releaseAssignment(row: PendingTechnicalTaskItem) {
  const operatorName = userStore.userInfo?.realName;
  if (!operatorName) {
    ElMessage.warning('请先确认当前操作人');
    return;
  }
  try {
    await releaseTechnicalTask(row.id, {
      remarks: '任务池释放责任人',
    });
    ElMessage.success('任务已释放');
    await loadPendingData();
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  }
}

async function runBulkClaim() {
  const operatorName = userStore.userInfo?.realName;
  const operatorUserId = userStore.userInfo?.userId;
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择任务');
    return;
  }
  if (!operatorName || !operatorUserId) {
    ElMessage.warning('请先确认当前操作人');
    return;
  }
  bulkLoading.value = true;
  try {
    await Promise.all(
      selectedRows.value.map((row) =>
        claimTechnicalTask(row.id, {
          assignedToName: operatorName,
          assignedToUserId: operatorUserId,
          remarks: '任务池批量认领',
        }),
      ),
    );
    ElMessage.success(`已认领 ${selectedRows.value.length} 条任务`);
    selectedTaskIds.value = [];
    await loadPendingData();
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    bulkLoading.value = false;
  }
}

async function runBulkRelease() {
  const operatorName = userStore.userInfo?.realName;
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择任务');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('请先确认当前操作人');
    return;
  }
  bulkLoading.value = true;
  try {
    await Promise.all(
      selectedRows.value.map((row) =>
        releaseTechnicalTask(row.id, {
          remarks: '任务池批量释放责任人',
        }),
      ),
    );
    ElMessage.success(`已释放 ${selectedRows.value.length} 条任务`);
    selectedTaskIds.value = [];
    await loadPendingData();
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    bulkLoading.value = false;
  }
}

async function runBulkPriorityUpdate() {
  const operatorName = userStore.userInfo?.realName;
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择任务');
    return;
  }
  if (!operatorName) {
    ElMessage.warning('请先确认当前操作人');
    return;
  }
  bulkLoading.value = true;
  try {
    await Promise.all(
      selectedRows.value.map((row) =>
        updateTechnicalTaskPriority(row.id, {
          priority: bulkPriority.value,
          productionRemarks: '任务池批量调整优先级',
        }),
      ),
    );
    ElMessage.success(`已调整 ${selectedRows.value.length} 条任务优先级`);
    selectedTaskIds.value = [];
    await loadPendingData();
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    bulkLoading.value = false;
  }
}

function goToWorkstation(row: PendingTechnicalTaskItem) {
  void navigation.goToTask(row, row.timedOut ? 'exception' : 'queue');
}

function goToTracking(row: PendingTechnicalTaskItem) {
  void navigation.goToTracking({
    caseId: row.caseId,
    objectId: row.objectId ?? undefined,
    objectType: row.objectType ?? undefined,
    pathologyNo: row.pathologyNo ?? undefined,
    taskId: row.id,
  });
}

function goToCaseTracking(group: TechnicalTaskCaseGroup) {
  void navigation.goToTracking({
    caseId: group.caseId,
    pathologyNo: group.pathologyNo || undefined,
  });
}

void loadPendingData();
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <TechnicalTaskStatsGrid :items="taskStats" />

      <TechnicalTaskFilterPanel
        v-model:filter-state="filtersModel"
        :priority-options="TECHNICAL_TASK_PRIORITY_OPTIONS"
        :status-options="TECHNICAL_TASK_STATUS_OPTIONS"
        :task-type-options="TECHNICAL_TASK_TYPE_OPTIONS"
        @reset="handleReset"
        @search="handleSearch"
      />

      <TechnicalTaskBulkActionsBar
        v-model:bulk-priority="bulkPriority"
        v-model:view-mode="viewMode"
        :bulk-loading="bulkLoading"
        :priority-options="TECHNICAL_TASK_PRIORITY_OPTIONS"
        :selected-count="selectedTaskIds.length"
        @bulk-claim="runBulkClaim"
        @bulk-priority-update="runBulkPriorityUpdate"
        @bulk-release="runBulkRelease"
      />

      <TechnicalTaskCaseBoard
        v-if="viewMode === 'case'"
        :groups="groupedItems"
        :loading="loading"
        @open-tracking="goToCaseTracking"
        @open-workstation="goToWorkstation"
      />

      <TechnicalTaskTablePanel
        v-else
        v-model:current-page="currentPageModel"
        v-model:page-size="pageSizeModel"
        :items="visibleItems"
        :loading="loading"
        :total="total"
        @assign="openAssignDialog"
        @open-tracking="goToTracking"
        @open-workstation="goToWorkstation"
        @release="releaseAssignment"
        @selection-change="handleSelectionChange"
      />
    </div>

    <TechnicalTaskAssignmentDialog
      v-model:form="assignmentFormModel"
      v-model:visible="assignmentDialogVisible"
      :priority-options="TECHNICAL_TASK_PRIORITY_OPTIONS"
      :station-options="stationOptions"
      :submitting="submittingAssignment"
      :task="selectedTask"
      @submit="submitAssignment"
    />
  </Page>
</template>
