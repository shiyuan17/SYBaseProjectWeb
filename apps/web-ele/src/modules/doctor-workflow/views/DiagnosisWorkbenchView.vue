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
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  acceptDiagnosticTask,
  cancelMedicalOrder,
  createMedicalOrder,
  getDiagnosticWorkbench,
  startDiagnosticTask,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  M4_MEDICAL_ORDER_PAGE_AUTHORITIES,
  M4_PERMISSION_CODES,
  M4_REPORT_PAGE_AUTHORITIES,
} from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatMedicalOrderStatus,
  formatMedicalOrderType,
  formatNullable,
  formatReportStatus,
} from '../utils/format';
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

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const loading = ref(false);
const operating = ref(false);
const orderOperating = ref(false);
const pageError = ref('');
const medicalOrderDialogVisible = ref(false);
const workbench = ref<DiagnosticWorkbenchView | null>(null);
const queryCaseId = ref('');

const actionForm = reactive<DiagnosticTaskActionRequest>(
  createDiagnosticTaskActionDefaults(),
);

const caseId = computed(() => firstQueryParam(route.query.caseId));
const currentTaskId = computed(() => firstQueryParam(route.query.taskId));
const accessCodeSet = computed(() => new Set(accessStore.accessCodes));
const currentUserId = computed(() => userStore.userInfo?.userId ?? '');
const currentUserName = computed(() => userStore.userInfo?.realName ?? '');
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

const MEDICAL_ORDER_TYPE_OPTIONS = [
  { label: '特殊染色', value: 'SPECIAL_STAIN' },
  { label: '重染', value: 'RE_STAIN' },
  { label: '免疫组化', value: 'IMMUNOHISTOCHEMISTRY' },
  { label: '其他', value: 'OTHER' },
] as const;

const selectedTask = computed(() => {
  if (!workbench.value) {
    return null;
  }
  return (
    workbench.value.diagnosticTasks.find(
      (item) => item.id === currentTaskId.value,
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

const medicalOrderForm = reactive<CreateMedicalOrderRequest>(
  createMedicalOrderDefaults(),
);

function clearWorkbench() {
  pageError.value = '';
  workbench.value = null;
}

async function loadWorkbench(targetCaseId = caseId.value) {
  const normalizedCaseId = targetCaseId.trim();
  if (!normalizedCaseId) {
    clearWorkbench();
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    workbench.value = await getDiagnosticWorkbench(normalizedCaseId);
  } catch (error) {
    workbench.value = null;
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function searchWorkbench() {
  const normalizedCaseId = queryCaseId.value.trim();
  if (!normalizedCaseId) {
    ElMessage.warning('请输入病例 ID');
    return;
  }

  void router.replace({
    path: '/doctor-workflow/workbench',
    query: {
      caseId: normalizedCaseId,
    },
  });
}

function handleReset() {
  queryCaseId.value = '';
  clearWorkbench();
  void router.replace({
    path: '/doctor-workflow/workbench',
    query: {},
  });
}

async function runTaskAction(
  action: 'accept' | 'start',
  task: null | PendingDiagnosticTaskItem,
) {
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
  if (!actionForm.operatorName) {
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
    await loadWorkbench();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    operating.value = false;
  }
}

function goToReport() {
  if (!caseId.value || !canOpenReport.value) {
    return;
  }

  void router.push({
    path: '/doctor-workflow/report',
    query: {
      caseId: caseId.value,
      pathologyNo: workbench.value?.pathologyNo ?? undefined,
      reportId: workbench.value?.currentReport?.reportId ?? undefined,
      taskId: (selectedTask.value?.id ?? currentTaskId.value) || undefined,
    },
  });
}

function openMedicalOrderDialog() {
  if (!caseId.value) {
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
      caseId.value,
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
    await loadWorkbench();
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
        remarks: '从诊断工作台取消医嘱',
        terminalCode: actionForm.terminalCode,
      }),
    );
    ElMessage.success('病理医嘱已取消');
    await loadWorkbench();
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
  caseId,
  (value) => {
    queryCaseId.value = value;
    if (!value) {
      clearWorkbench();
      return;
    }
    void loadWorkbench(value);
  },
  { immediate: true },
);
</script>

<template>
  <Page
    title="诊断工作台"
    description="按病例聚合展示诊断所需上下文，承载接单、开始诊断和报告编辑入口。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="false"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="病例查询"
        description="支持从菜单独立进入后按病例 ID 查询，也支持从诊断分派页深链进入。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="病例 ID" required>
            <ElInput
              v-model="queryCaseId"
              clearable
              placeholder="请输入病例 ID"
              style="width: 260px"
              @keyup.enter="searchWorkbench"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton
              :loading="loading"
              type="primary"
              @click="searchWorkbench"
            >
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="病例摘要"
        description="病例、申请单、临床诊断和当前报告摘要。"
      >
        <ElEmpty
          v-if="!caseId"
          description="请输入病例 ID，或从诊断分派页进入当前病例工作台。"
        />
        <ElEmpty
          v-else-if="!loading && !workbench"
          description="暂无病例数据"
        />
        <ElDescriptions v-else :column="3" border>
          <ElDescriptionsItem label="病例ID">
            {{ formatNullable(workbench?.caseId) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病理号">
            {{ formatNullable(workbench?.pathologyNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="患者">
            {{ formatNullable(workbench?.patientName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申请单号">
            {{ formatNullable(workbench?.applicationNo) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检科室">
            {{ formatNullable(workbench?.submittingDepartmentName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="送检医生">
            {{ formatNullable(workbench?.submittingDoctorName) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="病例状态">
            {{ formatNullable(workbench?.caseStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="报告状态">
            {{ formatReportStatus(workbench?.currentReport?.reportStatus) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="待修订">
            <ElTag :type="workbench?.hasPendingRevision ? 'warning' : 'info'">
              {{ workbench?.hasPendingRevision ? '是' : '否' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="3" label="临床诊断">
            {{ formatNullable(workbench?.clinicalDiagnosis) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :span="3" label="当前最终诊断">
            {{ formatNullable(workbench?.currentReport?.finalDiagnosis) }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </WorkflowSectionCard>

      <template v-if="workbench">
        <WorkflowSectionCard
          title="任务操作"
          description="接单和开始诊断会调用诊断任务动作接口。"
        >
          <ElForm inline label-width="80px">
            <ElFormItem label="操作人">
              <ElInput
                v-model="actionForm.operatorName"
                placeholder="请输入操作人姓名"
                style="width: 220px"
              />
            </ElFormItem>
            <ElFormItem label="终端">
              <ElInput
                v-model="actionForm.terminalCode"
                placeholder="终端编码"
                style="width: 180px"
              />
            </ElFormItem>
            <ElFormItem label="备注">
              <ElInput
                v-model="actionForm.remarks"
                placeholder="备注"
                style="width: 260px"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton
                v-if="canAccept"
                :disabled="!canAcceptSelectedTask"
                :loading="operating"
                type="primary"
                @click="runTaskAction('accept', selectedTask)"
              >
                接单
              </ElButton>
              <ElButton
                v-if="canStart"
                :disabled="!canStartSelectedTask"
                :loading="operating"
                type="success"
                @click="runTaskAction('start', selectedTask)"
              >
                开始诊断
              </ElButton>
              <ElButton v-if="canOpenReport" type="warning" @click="goToReport">
                报告编辑
              </ElButton>
            </ElFormItem>
          </ElForm>

          <ElAlert
            v-if="taskActionHint"
            :closable="false"
            :title="taskActionHint"
            class="mt-3"
            show-icon
            type="warning"
          />
        </WorkflowSectionCard>

        <WorkflowSectionCard title="诊断任务链">
          <ElTable v-loading="loading" :data="workbench.diagnosticTasks" border>
            <ElTableColumn label="任务号" min-width="180" prop="id" />
            <ElTableColumn label="类型" min-width="100">
              <template #default="{ row }">
                {{ formatDiagnosticTaskType(row.taskType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="状态" min-width="110">
              <template #default="{ row }">
                {{ formatDiagnosticTaskStatus(row.taskStatus) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="责任医生" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.diagnosisDoctorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="初诊医生" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.primaryDoctorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="审核医生" min-width="140">
              <template #default="{ row }">
                {{ formatNullable(row.reviewerName) }}
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="标本 / 蜡块 / 玻片">
          <div class="grid gap-4 xl:grid-cols-3">
            <ElTable :data="workbench.specimens" border>
              <ElTableColumn label="标本号" prop="specimenNo" />
              <ElTableColumn label="名称" prop="specimenName" />
              <ElTableColumn label="状态" prop="specimenStatus" />
            </ElTable>
            <ElTable :data="workbench.blocks" border>
              <ElTableColumn label="蜡块号" prop="blockCode" />
              <ElTableColumn label="包埋盒" prop="embeddingBoxNo" />
              <ElTableColumn label="借阅" prop="loanStatus" />
            </ElTable>
            <ElTable :data="workbench.slides" border>
              <ElTableColumn label="玻片号" prop="slideNo" />
              <ElTableColumn label="状态" prop="slideStatus" />
              <ElTableColumn label="质控" prop="qualityStatus" />
            </ElTable>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="修订 / 会诊 / 医嘱摘要">
          <template #extra>
            <div class="flex flex-wrap gap-2">
              <ElButton
                v-if="canCreateMedicalOrder"
                type="primary"
                @click="openMedicalOrderDialog"
              >
                新增医嘱
              </ElButton>
              <ElButton
                v-if="canOpenMedicalOrders"
                type="warning"
                @click="goToMedicalOrders"
              >
                进入医嘱工作台
              </ElButton>
            </div>
          </template>
          <div class="grid gap-4 xl:grid-cols-3">
            <ElTable :data="workbench.revisions" border>
              <ElTableColumn label="修订单" prop="requestId" />
              <ElTableColumn label="状态" prop="requestStatus" />
              <ElTableColumn label="申请人" prop="requestedByName" />
            </ElTable>
            <ElTable :data="workbench.consultations" border>
              <ElTableColumn label="会诊单" prop="consultationId" />
              <ElTableColumn label="状态" prop="status" />
              <ElTableColumn label="主持人" prop="hostName" />
            </ElTable>
            <ElTable :data="workbench.medicalOrders" border>
              <ElTableColumn label="医嘱号" prop="orderNumber" />
              <ElTableColumn label="类型">
                <template #default="{ row }">
                  {{ formatMedicalOrderType(row.orderType) }}
                </template>
              </ElTableColumn>
              <ElTableColumn label="状态">
                <template #default="{ row }">
                  {{ formatMedicalOrderStatus(row.status) }}
                </template>
              </ElTableColumn>
              <ElTableColumn
                v-if="canCancelMedicalOrder"
                label="操作"
                min-width="120"
              >
                <template #default="{ row }">
                  <ElButton
                    :disabled="row.status !== 'PENDING'"
                    :loading="orderOperating"
                    size="small"
                    type="danger"
                    @click="runCancelMedicalOrder(row)"
                  >
                    取消
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </div>
        </WorkflowSectionCard>

        <WorkflowSectionCard title="技术与诊断事件">
          <ElTable :data="workbench.recentEvents" border>
            <ElTableColumn label="节点" min-width="140" prop="nodeCode" />
            <ElTableColumn label="事件" min-width="140" prop="eventType" />
            <ElTableColumn label="状态" min-width="120" prop="eventStatus" />
            <ElTableColumn label="时间" min-width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.eventTime) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="内容" min-width="240" prop="eventContent" />
          </ElTable>
        </WorkflowSectionCard>
      </template>
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
            :rows="4"
            maxlength="1000"
            show-word-limit
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <ElInput v-model="medicalOrderForm.operatorName" />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="medicalOrderForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="medicalOrderForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElButton @click="medicalOrderDialogVisible = false">取消</ElButton>
        <ElButton
          :loading="orderOperating"
          type="primary"
          @click="submitMedicalOrder"
        >
          创建
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
