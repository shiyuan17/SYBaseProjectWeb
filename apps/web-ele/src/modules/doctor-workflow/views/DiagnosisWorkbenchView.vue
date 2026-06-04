<script setup lang="ts">
import type {
  CreateMedicalOrderRequest,
  DiagnosticTaskActionRequest,
  DiagnosticWorkbenchView,
  MedicalOrderSummary,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  acceptDiagnosticTask,
  cancelMedicalOrder,
  createMedicalOrder,
  getDiagnosticWorkbench,
  listPendingDiagnosticTasks,
  startDiagnosticTask,
} from '../api/doctor-workflow-service';
import DiagnosisWorkbenchDetailPane from '../components/DiagnosisWorkbenchDetailPane.vue';
import DiagnosisWorkbenchQueueTable from '../components/DiagnosisWorkbenchQueueTable.vue';
import DiagnosisWorkbenchToolbar from '../components/DiagnosisWorkbenchToolbar.vue';
import {
  DEFAULT_PAGE_SIZE,
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
} from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import { firstQueryParam } from '../utils/route';
import {
  ACCEPTABLE_TASK_STATUSES,
  buildTaskActionBlockedMessage as buildWorkbenchTaskActionBlockedMessage,
  matchesAllowedStatus,
  STARTABLE_TASK_STATUSES,
} from '../utils/workbench';
import {
  buildCancelMedicalOrderRequest,
  buildCreateMedicalOrderRequest,
  createDiagnosticTaskActionDefaults,
  createMedicalOrderDefaults,
  validateMedicalOrderForm,
} from '../utils/workbench-form';
import {
  buildDiagnosisWorkbenchQueueStats,
  resolveWorkbenchSelection,
} from '../utils/workbench-view';

const MEDICAL_ORDER_TYPE_OPTIONS = [
  { label: '特殊染色', value: 'SPECIAL_STAIN' },
  { label: '重染', value: 'RE_STAIN' },
  { label: '免疫组化', value: 'IMMUNOHISTOCHEMISTRY' },
  { label: '其他', value: 'OTHER' },
] as const;

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const queueLoading = ref(false);
const detailLoading = ref(false);
const operating = ref(false);
const orderOperating = ref(false);
const pageError = ref('');
const medicalOrderDialogVisible = ref(false);
const pendingItems = ref<PendingDiagnosticTaskItem[]>([]);
const workbench = ref<DiagnosticWorkbenchView | null>(null);
const selectedCaseId = ref('');
const selectedTaskId = ref('');
const selfRouteQueryKey = ref('');

const filters = reactive({
  page: 1,
  pathologyNo: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
});

const actionForm = reactive<DiagnosticTaskActionRequest>(
  createDiagnosticTaskActionDefaults(),
);
const medicalOrderForm = reactive<CreateMedicalOrderRequest>(
  createMedicalOrderDefaults(),
);

const routeCaseId = computed(() => firstQueryParam(route.query.caseId));
const routePathologyNo = computed(() =>
  firstQueryParam(route.query.pathologyNo),
);
const routeTaskId = computed(() => firstQueryParam(route.query.taskId));
const routeQueryKey = computed(
  () => `${routeCaseId.value}|${routePathologyNo.value}|${routeTaskId.value}`,
);
const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskStatus: filters.taskStatus || undefined,
  taskType: filters.taskType || undefined,
}));
const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');
const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
const queueStats = computed(() =>
  buildDiagnosisWorkbenchQueueStats(pendingItems.value),
);
const canAccept = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.ACCEPT),
);
const canStart = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.START),
);
const canOpenReport = computed(() =>
  M4_REPORT_PAGE_AUTHORITIES.some((code) => accessCodeSet.value.has(code)),
);
const canCreateMedicalOrder = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_CREATE),
);
const canCancelMedicalOrder = computed(() =>
  accessCodeSet.value.has(M4_PERMISSION_CODES.MEDICAL_ORDER_CANCEL),
);
const canOpenMedicalOrders = computed(() =>
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES.some((code) =>
    accessCodeSet.value.has(code),
  ),
);

const selectedTask = computed(() => {
  const selectedFromQueue = pendingItems.value.find(
    (item) => item.id === selectedTaskId.value,
  );
  if (selectedFromQueue) {
    return selectedFromQueue;
  }
  if (!workbench.value) {
    return null;
  }
  return (
    workbench.value.diagnosticTasks.find(
      (item) => item.id === selectedTaskId.value,
    ) ??
    workbench.value.diagnosticTasks[0] ??
    null
  );
});

const selectedTaskAssigneeLabel = computed(() => {
  const task = selectedTask.value;
  if (!task) {
    return '';
  }

  const labels = [task.diagnosisDoctorName, task.primaryDoctorName].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return labels.length > 0 ? [...new Set(labels)].join(' / ') : '';
});

const isAssignedToCurrentUser = computed(() => {
  const task = selectedTask.value;
  const userId = currentUserId.value;

  return Boolean(
    task &&
    userId &&
    (userId === task.diagnosisDoctorUserId ||
      userId === task.primaryDoctorUserId),
  );
});

const canAcceptSelectedTask = computed(() => {
  const taskStatus = selectedTask.value?.taskStatus ?? '';
  return (
    canAccept.value &&
    isAssignedToCurrentUser.value &&
    matchesAllowedStatus(taskStatus, ACCEPTABLE_TASK_STATUSES)
  );
});

const canStartSelectedTask = computed(() => {
  const taskStatus = selectedTask.value?.taskStatus ?? '';
  return (
    canStart.value &&
    isAssignedToCurrentUser.value &&
    matchesAllowedStatus(taskStatus, STARTABLE_TASK_STATUSES)
  );
});

function buildTaskActionBlockedMessage(
  action: 'accept' | 'start',
  task: null | PendingDiagnosticTaskItem,
) {
  return buildWorkbenchTaskActionBlockedMessage(
    action,
    task,
    isAssignedToCurrentUser.value,
    selectedTaskAssigneeLabel.value,
  );
}

const acceptBlockedMessage = computed(() =>
  canAccept.value
    ? buildTaskActionBlockedMessage('accept', selectedTask.value)
    : '',
);
const startBlockedMessage = computed(() =>
  canStart.value
    ? buildTaskActionBlockedMessage('start', selectedTask.value)
    : '',
);
const taskActionHint = computed(
  () => acceptBlockedMessage.value || startBlockedMessage.value,
);

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
      pendingItems.value,
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

function handleReset() {
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

async function runTaskAction(action: 'accept' | 'start') {
  const task = selectedTask.value;
  if (action === 'accept' && !canAccept.value) {
    ElMessage.warning('当前账号没有接单权限');
    return;
  }
  if (action === 'start' && !canStart.value) {
    ElMessage.warning('当前账号没有开始诊断权限');
    return;
  }

  const blockedMessage =
    action === 'accept'
      ? buildTaskActionBlockedMessage('accept', task)
      : buildTaskActionBlockedMessage('start', task);
  if (blockedMessage) {
    ElMessage.warning(blockedMessage);
    return;
  }
  if (!actionForm.operatorName.trim()) {
    ElMessage.warning('请填写操作人姓名');
    return;
  }
  if (!task) {
    ElMessage.warning('当前病例没有可操作的诊断任务');
    return;
  }

  operating.value = true;
  try {
    if (action === 'accept') {
      await acceptDiagnosticTask(task.id, actionForm);
      ElMessage.success('诊断任务已接单');
    } else {
      await startDiagnosticTask(task.id, actionForm);
      ElMessage.success('诊断任务已开始');
    }
    await loadQueue({ forceDetailReload: true });
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

function goToReport() {
  const caseId = selectedCaseId.value || routeCaseId.value;
  if (!caseId || !canOpenReport.value) {
    return;
  }

  void router.push({
    path: '/doctor-workflow/report',
    query: {
      caseId,
      pathologyNo: workbench.value?.pathologyNo ?? undefined,
      reportId: workbench.value?.currentReport?.reportId ?? undefined,
      taskId: (selectedTask.value?.id ?? routeTaskId.value) || undefined,
    },
  });
}

function openMedicalOrderDialog() {
  const caseId = selectedCaseId.value || (workbench.value?.caseId ?? '');
  if (!caseId) {
    ElMessage.warning('请先选择病例');
    return;
  }
  if (!canCreateMedicalOrder.value) {
    ElMessage.warning('当前账号没有创建医嘱权限');
    return;
  }

  Object.assign(
    medicalOrderForm,
    createMedicalOrderDefaults(
      caseId,
      currentUserName.value || actionForm.operatorName,
      currentUserId.value,
      actionForm.terminalCode,
    ),
  );
  medicalOrderDialogVisible.value = true;
}

async function submitMedicalOrder() {
  const validationMessage = validateMedicalOrderForm(medicalOrderForm);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }

  orderOperating.value = true;
  try {
    await createMedicalOrder(buildCreateMedicalOrderRequest(medicalOrderForm));
    medicalOrderDialogVisible.value = false;
    ElMessage.success('病理医嘱已创建');
    await loadQueue({ forceDetailReload: true });
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    orderOperating.value = false;
  }
}

async function runCancelMedicalOrder(order: MedicalOrderSummary) {
  if (!canCancelMedicalOrder.value) {
    ElMessage.warning('当前账号没有取消医嘱权限');
    return;
  }
  if (order.status !== 'PENDING') {
    ElMessage.warning('仅待处理医嘱可取消');
    return;
  }

  const operatorName = currentUserName.value || actionForm.operatorName;
  if (!operatorName.trim()) {
    ElMessage.warning('请先补齐当前登录账号姓名');
    return;
  }

  orderOperating.value = true;
  try {
    await cancelMedicalOrder(
      order.orderId,
      buildCancelMedicalOrderRequest({
        operatorName,
        operatorUserId: currentUserId.value,
        remarks: '从诊断平台工作站取消医嘱',
        terminalCode: actionForm.terminalCode,
      }),
    );
    ElMessage.success('病理医嘱已取消');
    await loadQueue({ forceDetailReload: true });
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    orderOperating.value = false;
  }
}

function goToMedicalOrders() {
  if (!canOpenMedicalOrders.value) {
    return;
  }
  void router.push({
    path: '/doctor-workflow/medical-orders',
    query: {
      pathologyNo: workbench.value?.pathologyNo ?? undefined,
    },
  });
}

watch(
  currentUserName,
  (value) => {
    if (!actionForm.operatorName && value) {
      actionForm.operatorName = value;
    }
  },
  { immediate: true },
);

watch(
  routeQueryKey,
  (value) => {
    if (value === selfRouteQueryKey.value) {
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
</script>

<template>
  <Page
    title="诊断平台工作站"
    description="按病例聚合展示诊断所需上下文，承载接单、开始诊断和报告编辑入口。"
  >
    <div class="flex flex-col gap-2">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <DiagnosisWorkbenchToolbar
        :keyword="filters.pathologyNo"
        :loading="queueLoading"
        :stats="queueStats"
        :task-status="filters.taskStatus"
        :task-type="filters.taskType"
        @refresh="handleRefresh"
        @reset="handleReset"
        @search="handleSearch"
        @update:keyword="filters.pathologyNo = $event"
        @update:task-status="filters.taskStatus = $event"
        @update:task-type="filters.taskType = $event"
      />

      <div
        class="grid min-h-0 gap-3 xl:grid-cols-[minmax(430px,0.82fr)_minmax(0,1.48fr)]"
      >
        <DiagnosisWorkbenchQueueTable
          :items="pendingItems"
          :loading="queueLoading"
          :selected-task-id="selectedTaskId"
          class="min-h-[360px] xl:h-[calc(100vh-270px)]"
          @select="selectQueueTask"
        />

        <DiagnosisWorkbenchDetailPane
          :action-form="actionForm"
          :can-accept="canAccept"
          :can-accept-selected-task="canAcceptSelectedTask"
          :can-cancel-medical-order="canCancelMedicalOrder"
          :can-create-medical-order="canCreateMedicalOrder"
          :can-open-medical-orders="canOpenMedicalOrders"
          :can-open-report="canOpenReport"
          :can-start="canStart"
          :can-start-selected-task="canStartSelectedTask"
          :loading="detailLoading"
          :operating="operating"
          :order-operating="orderOperating"
          :selected-task="selectedTask"
          :selected-task-assignee-label="selectedTaskAssigneeLabel"
          :task-action-hint="taskActionHint"
          :workbench="workbench"
          class="min-h-[360px]"
          @accept="runTaskAction('accept')"
          @cancel-medical-order="runCancelMedicalOrder"
          @open-medical-order-dialog="openMedicalOrderDialog"
          @open-medical-orders="goToMedicalOrders"
          @open-report="goToReport"
          @start="runTaskAction('start')"
          @update:operator-name="actionForm.operatorName = $event"
          @update:remarks="actionForm.remarks = $event"
          @update:terminal-code="actionForm.terminalCode = $event"
        />
      </div>
    </div>

    <ElDialog
      v-model="medicalOrderDialogVisible"
      title="创建病理医嘱"
      width="640px"
    >
      <ElForm label-width="100px">
        <ElFormItem label="病例 ID" required>
          <ElInput v-model="medicalOrderForm.caseId" disabled />
        </ElFormItem>
        <ElFormItem label="医嘱类型" required>
          <ElSelect
            v-model="medicalOrderForm.orderType"
            placeholder="请选择医嘱类型"
            style="width: 220px"
          >
            <ElOption
              v-for="option in MEDICAL_ORDER_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="医嘱内容" required>
          <ElInput
            v-model="medicalOrderForm.orderContent"
            :rows="3"
            placeholder="请输入医嘱内容"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="medicalOrderForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端">
          <ElInput v-model="medicalOrderForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput
            v-model="medicalOrderForm.remarks"
            :rows="2"
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="medicalOrderDialogVisible = false">取消</ElButton>
          <ElButton
            :loading="orderOperating"
            type="primary"
            @click="submitMedicalOrder"
          >
            提交医嘱
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </Page>
</template>
