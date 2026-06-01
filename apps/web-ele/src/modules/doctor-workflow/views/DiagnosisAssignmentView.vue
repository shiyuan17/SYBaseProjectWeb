<script setup lang="ts">
import type { PendingDiagnosticTaskItem } from '../types/doctor-workflow';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

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
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  assignDiagnosticTask,
  listPendingDiagnosticTasks,
} from '../api/doctor-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  DEFAULT_PAGE_SIZE,
  DIAGNOSTIC_TASK_STATUS_OPTIONS,
  DIAGNOSTIC_TASK_TYPE_OPTIONS,
  M4_PERMISSION_CODES,
} from '../constants';
import { getDoctorWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatNullable,
} from '../utils/format';

const router = useRouter();
const accessStore = useAccessStore();
const userStore = useUserStore();

const loading = ref(false);
const assigning = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingDiagnosticTaskItem[]>([]);
const total = ref(0);
const selectedTask = ref<null | PendingDiagnosticTaskItem>(null);
const assignDialogVisible = computed({
  get: () => selectedTask.value !== null,
  set: (visible: boolean) => {
    if (!visible) {
      selectedTask.value = null;
    }
  },
});

const filters = reactive({
  page: 1,
  pathologyNo: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
});

const assignForm = reactive({
  diagnosisDoctorName: '',
  diagnosisDoctorUserId: '',
  operatorName: '',
  operatorUserId: '',
  primaryDoctorName: '',
  primaryDoctorUserId: '',
  remarks: '',
  reviewerName: '',
  reviewerUserId: '',
  terminalCode: '',
});

const currentQuery = computed(() => ({
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskStatus: filters.taskStatus || undefined,
  taskType: filters.taskType || undefined,
}));
const canAssign = computed(() =>
  accessStore.accessCodes.includes(M4_PERMISSION_CODES.ASSIGN),
);

function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS' || status === 'ACCEPTED') {
    return 'warning';
  }
  if (status === 'ASSIGNED') {
    return 'primary';
  }
  return 'info';
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  try {
    const result = await listPendingDiagnosticTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;
  } catch (error) {
    pageError.value = getDoctorWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData();
}

function handleReset() {
  filters.page = 1;
  filters.pathologyNo = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.taskStatus = '';
  filters.taskType = '';
  void loadPendingData();
}

function openAssignDialog(row: PendingDiagnosticTaskItem) {
  if (!canAssign.value) {
    ElMessage.warning('当前账号没有分派权限');
    return;
  }
  selectedTask.value = row;
  assignForm.diagnosisDoctorName = row.diagnosisDoctorName ?? '';
  assignForm.diagnosisDoctorUserId = row.diagnosisDoctorUserId ?? '';
  assignForm.primaryDoctorName = row.primaryDoctorName ?? '';
  assignForm.primaryDoctorUserId = row.primaryDoctorUserId ?? '';
  assignForm.reviewerName = row.reviewerName ?? '';
  assignForm.reviewerUserId = row.reviewerUserId ?? '';
  assignForm.operatorName = userStore.userInfo?.realName ?? '';
  assignForm.operatorUserId = userStore.userInfo?.userId ?? '';
  assignForm.remarks = '';
  assignForm.terminalCode = '';
}

function handleDiagnosisDoctorChange(
  user: null | { id: string; name: string },
) {
  assignForm.diagnosisDoctorUserId = user?.id ?? '';
  assignForm.diagnosisDoctorName = user?.name ?? '';
}

function handlePrimaryDoctorChange(user: null | { id: string; name: string }) {
  assignForm.primaryDoctorUserId = user?.id ?? '';
  assignForm.primaryDoctorName = user?.name ?? '';
}

function handleReviewerChange(user: null | { id: string; name: string }) {
  assignForm.reviewerUserId = user?.id ?? '';
  assignForm.reviewerName = user?.name ?? '';
}

function handleOperatorChange(user: null | { id: string; name: string }) {
  assignForm.operatorUserId = user?.id ?? '';
  assignForm.operatorName = user?.name ?? '';
}

async function submitAssign() {
  if (!selectedTask.value) {
    return;
  }
  if (
    !assignForm.diagnosisDoctorUserId ||
    !assignForm.primaryDoctorUserId ||
    !assignForm.reviewerUserId ||
    !assignForm.operatorUserId
  ) {
    ElMessage.warning('请完整填写责任医生、初诊医生、审核医生和操作人');
    return;
  }

  assigning.value = true;
  try {
    await assignDiagnosticTask(selectedTask.value.id, { ...assignForm });
    ElMessage.success('诊断任务已分派');
    selectedTask.value = null;
    await loadPendingData();
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    assigning.value = false;
  }
}

function goToWorkbench(row: PendingDiagnosticTaskItem) {
  void router.push({
    path: '/doctor-workflow/workbench',
    query: {
      caseId: row.caseId,
      pathologyNo: row.pathologyNo ?? undefined,
      taskId: row.id,
    },
  });
}

void loadPendingData();
</script>

<template>
  <Page
    title="诊断分片工作站"
    description="查询待处理诊断任务，完成责任医生、初诊医生和审核医生分派，并保留病例深链进入诊断工作台。"
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
        title="任务筛选"
        description="按任务类型、状态和病理号查询待分派诊断任务。"
      >
        <ElForm inline label-width="88px">
          <ElFormItem label="任务类型">
            <ElSelect
              v-model="filters.taskType"
              clearable
              placeholder="全部类型"
              style="width: 180px"
            >
              <ElOption
                v-for="option in DIAGNOSTIC_TASK_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="任务状态">
            <ElSelect
              v-model="filters.taskStatus"
              clearable
              placeholder="全部状态"
              style="width: 180px"
            >
              <ElOption
                v-for="option in DIAGNOSTIC_TASK_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="病理号">
            <ElInput
              v-model="filters.pathologyNo"
              clearable
              placeholder="请输入病理号"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard
        title="待分派任务"
        description="后端返回的 `/diagnostic-tasks/pending` 任务池，操作后刷新列表。"
      >
        <ElTable v-loading="loading" :data="pendingItems" border>
          <ElTableColumn label="任务号" min-width="180" prop="id" />
          <ElTableColumn label="任务类型" min-width="110">
            <template #default="{ row }">
              {{ formatDiagnosticTaskType(row.taskType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatDiagnosticTaskStatus(row.taskStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="患者" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.patientName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="责任医生" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.diagnosisDoctorName) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="派发时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.assignedAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="190">
            <template #default="{ row }">
              <div class="flex gap-2">
                <ElButton
                  v-if="canAssign"
                  link
                  type="primary"
                  @click="openAssignDialog(row)"
                >
                  分派
                </ElButton>
                <ElButton link type="success" @click="goToWorkbench(row)">
                  工作台
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>

        <div class="mt-4 flex justify-end">
          <ElPagination
            v-model:current-page="filters.page"
            v-model:page-size="filters.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @change="loadPendingData"
          />
        </div>
      </WorkflowSectionCard>
    </div>

    <ElDialog
      v-model="assignDialogVisible"
      title="分派诊断任务"
      width="680px"
      @closed="selectedTask = null"
    >
      <ElForm label-width="120px">
        <ElFormItem label="责任医生" required>
          <SystemUserSelect
            v-model="assignForm.diagnosisDoctorUserId"
            :selected-label="assignForm.diagnosisDoctorName"
            placeholder="请选择责任医生"
            @change="handleDiagnosisDoctorChange"
          />
        </ElFormItem>
        <ElFormItem label="初诊医生" required>
          <SystemUserSelect
            v-model="assignForm.primaryDoctorUserId"
            :selected-label="assignForm.primaryDoctorName"
            placeholder="请选择初诊医生"
            @change="handlePrimaryDoctorChange"
          />
        </ElFormItem>
        <ElFormItem label="审核医生" required>
          <SystemUserSelect
            v-model="assignForm.reviewerUserId"
            :selected-label="assignForm.reviewerName"
            placeholder="请选择审核医生"
            @change="handleReviewerChange"
          />
        </ElFormItem>
        <ElFormItem label="操作人" required>
          <SystemUserSelect
            v-model="assignForm.operatorUserId"
            :selected-label="assignForm.operatorName"
            placeholder="请选择操作人"
            @change="handleOperatorChange"
          />
        </ElFormItem>
        <ElFormItem label="终端编码">
          <ElInput v-model="assignForm.terminalCode" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="assignForm.remarks" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="selectedTask = null">取消</ElButton>
        <ElButton :loading="assigning" type="primary" @click="submitAssign">
          确认分派
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
