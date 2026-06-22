<script setup lang="ts">
import type {
  AssignDiagnosticTaskRequest,
  PendingDiagnosticTaskItem,
} from '../types/doctor-workflow';

import type { SystemUser } from '#/modules/system-management/types/system-management';

import { computed, nextTick, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { ChevronLeft, ChevronRight } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
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
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
} from '#/modules/technical-workflow/utils/date-range';

import CopyableIdentifier from '../../../components/CopyableIdentifier.vue';
import {
  assignDiagnosticTask,
  listAssignableDiagnosticTasks,
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
const DEFAULT_DATE_RANGE_LENGTH_DAYS = 1;

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

interface PartialAssignDoctorFields {
  diagnosisDoctorName?: string;
  diagnosisDoctorUserId?: string;
  primaryDoctorName?: string;
  primaryDoctorUserId?: string;
  reviewerName?: string;
  reviewerUserId?: string;
}

interface BatchAssignResult {
  failed: number;
  skipped: number;
  success: number;
}

const accessStore = useAccessStore();
const dateRangeShortcuts = createDateRangePickerShortcuts();

const loading = ref(false);
const doctorsLoading = ref(false);
const assigning = ref(false);
const pageError = ref('');
const pendingItems = ref<PendingDiagnosticTaskItem[]>([]);
const assignmentDoctors = ref<AssignmentDoctor[]>([]);
const selectedDoctorId = ref('');
const selectedTasks = ref<PendingDiagnosticTaskItem[]>([]);
const selectedTaskId = ref('');
const taskTableRef = ref<null | {
  toggleRowSelection: (
    row: PendingDiagnosticTaskItem,
    selected?: boolean,
  ) => void;
}>(null);
const total = ref(0);

const filters = reactive({
  dateRange: [] as string[],
  page: 1,
  pathologyNo: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
});

function parseDateValue(value: string) {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateValue(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveShiftableDateRange(range: string[]) {
  const start = range[0] ? parseDateValue(range[0]) : null;
  const end = range[1] ? parseDateValue(range[1]) : null;
  if (start && end) {
    return { end, start };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    end: addDays(today, DEFAULT_DATE_RANGE_LENGTH_DAYS - 1),
    start: today,
  };
}

const currentQuery = computed(() => ({
  dateFrom: filters.dateRange[0] || undefined,
  dateTo: filters.dateRange[1] || undefined,
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

function syncDefaultDoctorSelection() {
  if (
    selectedDoctorId.value &&
    doctorRows.value.some((item) => item.id === selectedDoctorId.value)
  ) {
    return;
  }
  selectedDoctorId.value = doctorRows.value[0]?.id ?? '';
}

async function applyDefaultTaskSelection() {
  await nextTick();
  const firstTask = pendingItems.value[0];
  if (!firstTask) {
    selectedTaskId.value = '';
    return;
  }
  selectedTaskId.value = firstTask.id;
  taskTableRef.value?.toggleRowSelection(firstTask, true);
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
    syncDefaultDoctorSelection();
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
  selectedTaskId.value = '';
  try {
    const result = await listAssignableDiagnosticTasks(currentQuery.value);
    pendingItems.value = result.items;
    total.value = result.total;
    await applyDefaultTaskSelection();
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
  filters.dateRange = [];
  filters.page = 1;
  filters.pathologyNo = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.taskStatus = '';
  filters.taskType = '';
  void loadPendingData();
}

function shiftDateRange(days: number) {
  const { end, start } = resolveShiftableDateRange(filters.dateRange);
  filters.dateRange = [
    formatDateValue(addDays(start, days)),
    formatDateValue(addDays(end, days)),
  ];
  filters.page = 1;
  void loadPendingData();
}

function handleTaskSelectionChange(rows: PendingDiagnosticTaskItem[]) {
  selectedTasks.value = rows;
  selectedTaskId.value = rows[0]?.id ?? '';
}

async function toggleTaskRowSelection(row: PendingDiagnosticTaskItem) {
  const selected = selectedTasks.value.some((item) => item.id === row.id);
  taskTableRef.value?.toggleRowSelection(row, !selected);
  selectedTaskId.value = selected ? (selectedTasks.value[0]?.id ?? '') : row.id;
  await nextTick();
}

function selectDoctor(row: AssignmentDoctorRow) {
  selectedDoctorId.value = row.id;
}

function createSelectedDoctorField(
  doctor: AssignmentDoctorRow,
): AssignmentDoctorField | null {
  const userId = doctor.id.trim();
  const name = doctor.name.trim();
  return userId && name ? { name, userId } : null;
}

function buildBatchAssignPayload(
  role: BatchAssignRole,
  doctor: AssignmentDoctorRow,
): AssignDiagnosticTaskRequest | null {
  const selectedDoctorField = createSelectedDoctorField(doctor);
  if (!selectedDoctorField) {
    return null;
  }
  const doctorFields: PartialAssignDoctorFields =
    role === 'primary'
      ? {
          diagnosisDoctorName: selectedDoctorField.name,
          diagnosisDoctorUserId: selectedDoctorField.userId,
          primaryDoctorName: selectedDoctorField.name,
          primaryDoctorUserId: selectedDoctorField.userId,
        }
      : {
          reviewerName: selectedDoctorField.name,
          reviewerUserId: selectedDoctorField.userId,
        };

  return {
    ...doctorFields,
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
      const payload = buildBatchAssignPayload(role, doctor);
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
  <Page :show-header="false">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

      <WorkflowSectionCard title="诊断分片">
        <div class="flex flex-col gap-3">
          <ElForm class="flex flex-wrap items-center gap-x-2 gap-y-1" inline>
            <ElFormItem label="创建日期">
              <ElDatePicker
                v-model="filters.dateRange"
                class="w-[248px]"
                clearable
                :default-value="createDatePickerPanelDefaultValue()"
                :disabled-date="disableFutureDate"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                :shortcuts="dateRangeShortcuts"
                start-placeholder="开始日期"
                type="daterange"
                unlink-panels
                value-format="YYYY-MM-DD"
              />
            </ElFormItem>
            <ElFormItem>
              <ElButton @click="shiftDateRange(-1)">
                <ChevronLeft class="mr-1 size-4" />
                前1天
              </ElButton>
              <ElButton @click="shiftDateRange(1)">
                <ChevronRight class="mr-1 size-4" />
                后1天
              </ElButton>
            </ElFormItem>
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
            ref="taskTableRef"
            v-loading="loading"
            :data="pendingItems"
            border
            height="560"
            row-key="id"
            :row-class-name="
              ({ row }) =>
                row.id === selectedTaskId ? 'diagnosis-task-row--selected' : ''
            "
            @row-click="toggleTaskRowSelection"
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
                <CopyableIdentifier
                  kind="pathologyNo"
                  :value="row.pathologyNo"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="病人ID" min-width="120">
              <template #default="{ row }">
                <CopyableIdentifier
                  kind="patientId"
                  :fallback-value="row.patientId"
                  :value="row.patientIdDisplay"
                />
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
  --el-table-tr-bg-color: color-mix(
    in srgb,
    var(--el-color-primary-light-9) 74%,
    white
  );
}

:deep(.assignment-doctor-row--selected td),
:deep(.diagnosis-task-row--selected td) {
  box-shadow:
    inset 0 1px 0 rgb(64 158 255 / 14%),
    inset 0 -1px 0 rgb(64 158 255 / 14%);
}

:deep(.assignment-doctor-row--selected td:first-child),
:deep(.diagnosis-task-row--selected td:first-child) {
  box-shadow:
    inset 3px 0 0 var(--el-color-primary),
    inset 0 1px 0 rgb(64 158 255 / 14%),
    inset 0 -1px 0 rgb(64 158 255 / 14%);
}

:deep(.assignment-doctor-row--selected .font-medium),
:deep(.diagnosis-task-row--selected .cell) {
  color: var(--el-text-color-primary);
}

:deep(.diagnosis-task-row--selected) {
  --el-table-tr-bg-color: color-mix(
    in srgb,
    var(--el-color-success-light-9) 82%,
    white
  );
}
</style>
