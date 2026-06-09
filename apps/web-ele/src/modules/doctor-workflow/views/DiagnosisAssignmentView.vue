<script setup lang="ts">
import type {
  AssignDiagnosticTaskRequest,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import type { SystemUser } from '#/modules/system-management/types/system-management';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
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

import { listSystemUsers } from '#/modules/system-management/api/system-management-service';

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
  formatApplicationType,
  formatDiagnosticTaskStatus,
  formatNullable,
  formatReportStatus,
} from '../utils/format';

type BatchAssignRole = 'primary' | 'reviewer';

interface AssignmentDoctor {
  id: string;
  loginName: string;
  name: string;
}

interface AssignmentDoctorRow extends AssignmentDoctor {
  primarySliceCount: number;
  reviewerSliceCount: number;
}

interface AssignmentDoctorField {
  name: string;
  userId: string;
}

interface BatchAssignResult {
  failed: number;
  skipped: number;
  success: number;
}

const accessStore = useAccessStore();

const loading = ref(false);
const doctorsLoading = ref(false);
const assigning = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingDiagnosticTaskItem[]>([]);
const assignmentDoctors = ref<AssignmentDoctor[]>([]);
const selectedDoctorId = ref('');
const selectedTasks = ref<PendingDiagnosticTaskItem[]>([]);
const total = ref(0);

const filters = reactive({
  page: 1,
  pathologyNo: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
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
const selectedDoctor = computed(
  () =>
    doctorRows.value.find((item) => item.id === selectedDoctorId.value) ?? null,
);
const batchActionDisabled = computed(
  () =>
    !canAssign.value ||
    assigning.value ||
    selectedDoctor.value === null ||
    selectedTasks.value.length === 0,
);
const primaryAssignedCount = computed(
  () =>
    pendingItems.value.filter((item) => Boolean(item.primaryDoctorUserId))
      .length,
);
const reviewerAssignedCount = computed(
  () =>
    pendingItems.value.filter((item) => Boolean(item.reviewerUserId)).length,
);
const doctorRows = computed<AssignmentDoctorRow[]>(() =>
  assignmentDoctors.value.map((doctor) => ({
    ...doctor,
    primarySliceCount: countAssignedTasks(doctor.id, 'primary'),
    reviewerSliceCount: countAssignedTasks(doctor.id, 'reviewer'),
  })),
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

function formatReportColumnStatus(row: PendingDiagnosticTaskItem) {
  return row.reportStatus
    ? formatReportStatus(row.reportStatus)
    : formatDiagnosticTaskStatus(row.taskStatus);
}

function mapAssignmentDoctor(user: SystemUser): AssignmentDoctor {
  return {
    id: user.id,
    loginName: user.loginName,
    name: user.name,
  };
}

function countAssignedTasks(userId: string, role: BatchAssignRole) {
  const key = role === 'primary' ? 'primaryDoctorUserId' : 'reviewerUserId';
  return pendingItems.value.filter((item) => item[key] === userId).length;
}

async function loadAssignmentDoctors() {
  doctorsLoading.value = true;
  try {
    const result = await listSystemUsers({
      enabled: true,
      page: 1,
      size: 200,
    });
    assignmentDoctors.value = result.items.map((item) =>
      mapAssignmentDoctor(item),
    );
    if (
      selectedDoctorId.value &&
      !assignmentDoctors.value.some(
        (item) => item.id === selectedDoctorId.value,
      )
    ) {
      selectedDoctorId.value = '';
    }
  } catch (error) {
    ElMessage.error(getDoctorWorkflowPageErrorMessage(error));
  } finally {
    doctorsLoading.value = false;
  }
}

async function loadPendingData() {
  loading.value = true;
  pageError.value = '';
  selectedTasks.value = [];
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

function handleTaskSelectionChange(rows: PendingDiagnosticTaskItem[]) {
  selectedTasks.value = rows;
}

function selectDoctor(row: AssignmentDoctorRow) {
  selectedDoctorId.value = row.id;
}

function hasAssignee(userId?: null | string, name?: null | string) {
  return Boolean(userId?.trim() && name?.trim());
}

function createSelectedDoctorField(
  doctor: AssignmentDoctorRow,
): AssignmentDoctorField | null {
  const userId = doctor.id.trim();
  const name = doctor.name.trim();
  return userId && name ? { name, userId } : null;
}

function resolveDoctorField(
  userId: null | string | undefined,
  name: null | string | undefined,
  fallback: AssignmentDoctorField,
): AssignmentDoctorField {
  return hasAssignee(userId, name)
    ? {
        name: name?.trim() ?? '',
        userId: userId?.trim() ?? '',
      }
    : fallback;
}

function buildBatchAssignPayload(
  task: PendingDiagnosticTaskItem,
  role: BatchAssignRole,
  doctor: AssignmentDoctorRow,
): AssignDiagnosticTaskRequest | null {
  const selectedDoctorField = createSelectedDoctorField(doctor);
  if (!selectedDoctorField) {
    return null;
  }
  const diagnosisDoctor = resolveDoctorField(
    task.diagnosisDoctorUserId,
    task.diagnosisDoctorName,
    selectedDoctorField,
  );
  const primaryDoctor =
    role === 'primary'
      ? selectedDoctorField
      : resolveDoctorField(
          task.primaryDoctorUserId,
          task.primaryDoctorName,
          selectedDoctorField,
        );
  const reviewerDoctor =
    role === 'reviewer'
      ? selectedDoctorField
      : resolveDoctorField(
          task.reviewerUserId,
          task.reviewerName,
          selectedDoctorField,
        );

  return {
    diagnosisDoctorName: diagnosisDoctor.name,
    diagnosisDoctorUserId: diagnosisDoctor.userId,
    primaryDoctorName: primaryDoctor.name,
    primaryDoctorUserId: primaryDoctor.userId,
    remarks: task.remarks ?? '',
    reviewerName: reviewerDoctor.name,
    reviewerUserId: reviewerDoctor.userId,
    terminalCode: '',
  };
}

function showBatchAssignResult(
  role: BatchAssignRole,
  result: BatchAssignResult,
) {
  const actionName = role === 'primary' ? '初步分片' : '签发分片';
  if (result.success > 0 && result.skipped === 0 && result.failed === 0) {
    ElMessage.success(`${actionName}完成，共处理 ${result.success} 条任务`);
    return;
  }
  if (result.success > 0) {
    ElMessage.warning(
      `${actionName}完成 ${result.success} 条，跳过 ${result.skipped} 条，失败 ${result.failed} 条`,
    );
    return;
  }
  if (result.skipped > 0 && result.failed === 0) {
    ElMessage.warning('选中任务缺少接口必填医生字段，已全部跳过');
    return;
  }
  ElMessage.error(`${actionName}失败，请稍后重试`);
}

async function submitBatchAssign(role: BatchAssignRole) {
  if (!canAssign.value) {
    ElMessage.warning('当前账号没有分派权限');
    return;
  }
  if (!selectedDoctor.value) {
    ElMessage.warning('请先选择左侧分片用户');
    return;
  }
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请先勾选右侧诊断任务');
    return;
  }

  const tasks = [...selectedTasks.value];
  const doctor = selectedDoctor.value;
  const result: BatchAssignResult = {
    failed: 0,
    skipped: 0,
    success: 0,
  };

  assigning.value = true;
  try {
    for (const task of tasks) {
      const payload = buildBatchAssignPayload(task, role, doctor);
      if (!payload) {
        result.skipped += 1;
        continue;
      }
      try {
        await assignDiagnosticTask(task.id, payload);
        result.success += 1;
      } catch {
        result.failed += 1;
      }
    }
    selectedTasks.value = [];
    if (result.success > 0) {
      await loadPendingData();
    }
    showBatchAssignResult(role, result);
  } finally {
    assigning.value = false;
  }
}

void loadAssignmentDoctors();
void loadPendingData();
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard
        title="诊断分片"
        description="选择左侧用户后，勾选右侧任务进行初步分片或签发分片。"
      >
        <div class="flex flex-col gap-3">
          <ElForm class="flex flex-wrap items-center gap-x-2 gap-y-1" inline>
            <ElFormItem label="任务类型">
              <ElSelect
                v-model="filters.taskType"
                clearable
                class="w-44 min-w-[176px] flex-none"
                placeholder="全部类型"
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
                class="w-44 min-w-[176px] flex-none"
                placeholder="全部状态"
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
                class="w-56"
                placeholder="请输入病理号"
                @keyup.enter="handleSearch"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton type="primary" @click="handleSearch">查询</ElButton>
              <ElButton @click="handleReset">重置</ElButton>
            </ElFormItem>
          </ElForm>

          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span>当前列表: {{ pendingItems.length }} / {{ total }}</span>
            <span>已选任务: {{ selectedTasks.length }}</span>
            <span>初步分片: {{ primaryAssignedCount }}</span>
            <span>签发分片: {{ reviewerAssignedCount }}</span>
            <span v-if="selectedDoctor">
              当前用户: {{ selectedDoctor.name }}
            </span>
          </div>

          <div v-if="canAssign" class="flex flex-wrap items-center gap-2">
            <ElButton
              :disabled="batchActionDisabled"
              :loading="assigning"
              type="success"
              @click="submitBatchAssign('primary')"
            >
              初步分片
            </ElButton>
            <ElButton
              :disabled="batchActionDisabled"
              :loading="assigning"
              type="primary"
              @click="submitBatchAssign('reviewer')"
            >
              签发分片
            </ElButton>
            <ElButton disabled title="接口待接入">取消分片</ElButton>
            <ElButton disabled title="接口待接入">分片清零</ElButton>
          </div>
        </div>
      </WorkflowSectionCard>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <WorkflowSectionCard
          title="用户分片列表"
          description="计数仅统计当前右侧已加载任务。"
        >
          <ElTable
            v-loading="doctorsLoading"
            :data="doctorRows"
            border
            height="560"
            highlight-current-row
            row-key="id"
            :row-class-name="
              ({ row }) =>
                row.id === selectedDoctorId
                  ? 'assignment-doctor-row--selected'
                  : ''
            "
            @row-click="selectDoctor"
          >
            <ElTableColumn label="用户名" min-width="120">
              <template #default="{ row }">
                <div class="font-medium">{{ row.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ row.loginName }}
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn
              align="center"
              label="初步分片数"
              min-width="92"
              prop="primarySliceCount"
            />
            <ElTableColumn
              align="center"
              label="签发分片数"
              min-width="92"
              prop="reviewerSliceCount"
            />
            <ElTableColumn align="center" label="操作" width="72">
              <template #default="{ row }">
                <ElButton link type="primary" @click.stop="selectDoctor(row)">
                  选择
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </WorkflowSectionCard>

        <WorkflowSectionCard
          title="诊断任务列表"
          description="勾选任务后，可为左侧选中用户执行对应分片。"
        >
          <ElTable
            v-loading="loading"
            :data="pendingItems"
            border
            height="560"
            row-key="id"
            @selection-change="handleTaskSelectionChange"
          >
            <ElTableColumn type="selection" width="44" />
            <ElTableColumn align="center" label="序" type="index" width="52" />
            <ElTableColumn label="初诊阅片" min-width="100">
              <template #default="{ row }">
                {{ formatNullable(row.primaryDoctorName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="签发阅片" min-width="100">
              <template #default="{ row }">
                {{ formatNullable(row.reviewerName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="报告状态" min-width="100">
              <template #default="{ row }">
                <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                  {{ formatReportColumnStatus(row) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn label="病理号" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.pathologyNo) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="病人ID" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.patientId) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="姓名" min-width="120">
              <template #default="{ row }">
                {{ formatNullable(row.patientName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="检查项目" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.checkItem) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="送检类型" min-width="120">
              <template #default="{ row }">
                {{ formatApplicationType(row.applicationType) }}
              </template>
            </ElTableColumn>
            <ElTableColumn align="right" label="蜡块数" min-width="90">
              <template #default="{ row }">
                {{ formatNullable(row.blockCount) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="送检科室" min-width="150">
              <template #default="{ row }">
                {{ formatNullable(row.submittingDepartmentName) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="送检标本" min-width="180">
              <template #default="{ row }">
                {{ formatNullable(row.specimenName) }}
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
    </div>
  </Page>
</template>

<style scoped>
:deep(.assignment-doctor-row--selected) {
  --el-table-tr-bg-color: var(--el-color-primary-light-9);
}
</style>
