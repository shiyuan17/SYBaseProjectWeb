<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  assignTechnicalTask,
  listPendingTechnicalTasks,
  releaseTechnicalTask,
} from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  DEFAULT_PAGE_SIZE,
  TASK_TYPE_ROUTE_MAP,
  TASK_TYPE_TITLE_MAP,
  TECHNICAL_TASK_PRIORITY_OPTIONS,
  TECHNICAL_TASK_STATUS_OPTIONS,
  TECHNICAL_TASK_TYPE_OPTIONS,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  formatDateTime,
  formatNullable,
  formatTaskPriority,
  formatTaskStatus,
  formatTaskType,
} from '../utils/format';

const router = useRouter();
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const submittingAssignment = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);
const assignmentDialogVisible = ref(false);
const selectedTask = ref<null | PendingTechnicalTaskItem>(null);

const stationOptions = [
  { label: '取材台', value: 'GROSSING' },
  { label: '脱水工作站', value: 'DEHYDRATION' },
  { label: '包埋工作站', value: 'EMBEDDING' },
  { label: '切片工作站', value: 'SLICING' },
  { label: '染色出片', value: 'STAINING' },
  { label: '返工工作站', value: 'REWORK' },
];

const filters = reactive({
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

const assignmentForm = reactive({
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

const taskStats = computed(() => {
  const activeItems = pendingItems.value.filter(
    (item) => item.taskStatus !== 'COMPLETED',
  );
  return [
    {
      label: '待生产标本',
      value: activeItems.length,
      tone: 'primary',
    },
    {
      label: '急诊/快速',
      value: pendingItems.value.filter((item) => item.priority === 'STAT').length,
      tone: 'danger',
    },
    {
      label: '今日已完成',
      value: pendingItems.value.filter((item) => item.taskStatus === 'COMPLETED').length,
      tone: 'success',
    },
    {
      label: '超时风险',
      value: pendingItems.value.filter((item) => item.timedOut).length,
      tone: 'warning',
    },
  ];
});

function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
}

function getPriorityTagType(priority?: null | string) {
  if (priority === 'STAT') {
    return 'danger';
  }
  if (priority === 'PRIORITY') {
    return 'warning';
  }
  return 'info';
}

function formatCurrentNode(row: PendingTechnicalTaskItem) {
  return TASK_TYPE_TITLE_MAP[row.currentNode ?? row.taskType ?? ''] ?? formatTaskType(row.currentNode ?? row.taskType);
}

function formatResponsible(row: PendingTechnicalTaskItem) {
  return row.assignedToName?.trim() || '未分派';
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
  assignmentForm.stationCode = row.stationCode ?? row.currentNode ?? row.taskType ?? '';
  assignmentForm.stationName =
    row.stationName ??
    stationOptions.find((item) => item.value === assignmentForm.stationCode)?.label ??
    '';
  assignmentForm.terminalCode = '';
  assignmentDialogVisible.value = true;
}

function syncStationName(stationCode: string) {
  assignmentForm.stationName =
    stationOptions.find((item) => item.value === stationCode)?.label ?? '';
}

function handleAssignedUserChange(user: null | { id: string; name: string }) {
  assignmentForm.assignedToUserId = user?.id ?? '';
  assignmentForm.assignedToName = user?.name ?? '';
}

async function submitAssignment() {
  if (!selectedTask.value) {
    return;
  }
  if (!assignmentForm.operatorName.trim()) {
    ElMessage.warning('请填写操作人');
    return;
  }

  submittingAssignment.value = true;
  try {
    await assignTechnicalTask(selectedTask.value.id, {
      assignedToName: assignmentForm.assignedToName.trim() || null,
      assignedToUserId: assignmentForm.assignedToUserId.trim() || null,
      expectedCompletedAt: assignmentForm.expectedCompletedAt || null,
      operatorName: assignmentForm.operatorName.trim(),
      operatorUserId: assignmentForm.operatorUserId.trim() || null,
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
    ElMessage.error(getWorkflowPageErrorMessage(error));
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
      operatorName,
      operatorUserId: userStore.userInfo?.userId ?? null,
      remarks: '任务池释放责任人',
    });
    ElMessage.success('任务已释放');
    await loadPendingData();
  } catch (error) {
    ElMessage.error(getWorkflowPageErrorMessage(error));
  }
}

function goToWorkstation(row: PendingTechnicalTaskItem) {
  const targetPath = row.taskType ? TASK_TYPE_ROUTE_MAP[row.taskType] : '';
  if (!targetPath) {
    ElMessage.warning('当前任务类型未配置工作站入口');
    return;
  }

  void router.push({
    path: targetPath,
    query: {
      caseId: row.caseId,
      objectId: row.objectId ?? undefined,
      objectType: row.objectType ?? undefined,
      pathologyNo: row.pathologyNo ?? undefined,
      taskId: row.id,
      mode: row.timedOut ? 'exception' : 'queue',
    },
  });
}

function goToTracking(row: PendingTechnicalTaskItem) {
  void router.push({
    path: '/technical-workflow/tracking',
    query: {
      caseId: row.caseId,
    },
  });
}

void loadPendingData();
</script>

<template>
  <Page title="任务池" description="生产任务调度、分派与时效监控。">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <div class="grid gap-4 md:grid-cols-4">
        <section
          v-for="item in taskStats"
          :key="item.label"
          class="rounded border border-border bg-background p-4"
        >
          <div class="text-sm text-[var(--el-text-color-secondary)]">{{ item.label }}</div>
          <div class="mt-2 text-2xl font-semibold text-foreground">{{ item.value }}</div>
        </section>
      </div>

      <WorkflowSectionCard title="任务筛选" description="按任务类型、优先级、节点和分派状态查看生产任务。">
        <ElForm inline label-width="96px">
          <ElFormItem label="任务类型">
            <ElSelect v-model="filters.taskType" clearable placeholder="全部" style="width: 160px">
              <ElOption
                v-for="option in TECHNICAL_TASK_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="优先级">
            <ElSelect v-model="filters.priority" clearable placeholder="全部" style="width: 140px">
              <ElOption
                v-for="option in TECHNICAL_TASK_PRIORITY_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="任务状态">
            <ElSelect v-model="filters.taskStatus" clearable placeholder="全部" style="width: 150px">
              <ElOption
                v-for="option in TECHNICAL_TASK_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="当前节点">
            <ElSelect v-model="filters.currentNode" clearable placeholder="全部" style="width: 160px">
              <ElOption
                v-for="option in TECHNICAL_TASK_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="分派状态">
            <ElSelect
              v-model="filters.assignmentStatus"
              clearable
              placeholder="全部"
              style="width: 150px"
            >
              <ElOption label="未分派" value="UNASSIGNED" />
              <ElOption label="已分派" value="ASSIGNED" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="责任人">
            <ElInput
              v-model="filters.assignedToUserId"
              clearable
              placeholder="责任人ID"
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="申请单号">
            <ElInput
              v-model="filters.applicationNo"
              clearable
              placeholder="申请单号"
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="病理号">
            <ElInput
              v-model="filters.pathologyNo"
              clearable
              placeholder="病理号"
              style="width: 180px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="接收时间">
            <ElDatePicker
              v-model="filters.createdRange"
              end-placeholder="结束"
              range-separator="至"
              start-placeholder="开始"
              type="datetimerange"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="仅超时">
            <ElSwitch v-model="filters.timedOutOnly" />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">查询</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </WorkflowSectionCard>

      <WorkflowSectionCard title="生产任务" description="按病理号、节点、责任技师和期望完成时间推进。">
        <ElTable v-loading="loading" :data="visibleItems" border>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本/对象" min-width="180">
            <template #default="{ row }">
              <div class="font-medium">{{ formatNullable(row.objectId) }}</div>
              <div class="text-xs text-[var(--el-text-color-secondary)]">
                {{ formatNullable(row.specimenId) }}
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="任务类型" min-width="120">
            <template #default="{ row }">
              {{ formatTaskType(row.taskType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="优先级" min-width="100">
            <template #default="{ row }">
              <ElTag :type="getPriorityTagType(row.priority)">
                {{ formatTaskPriority(row.priority) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="接收时间" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.receivedAt || row.createdAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="当前节点" min-width="130">
            <template #default="{ row }">
              {{ formatCurrentNode(row) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="责任技师" min-width="130">
            <template #default="{ row }">
              <ElTag :type="row.assignedToUserId ? 'success' : 'info'">
                {{ formatResponsible(row) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="110">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatTaskStatus(row.taskStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="期望完成" min-width="170">
            <template #default="{ row }">
              {{ formatDateTime(row.expectedCompletedAt || row.deadlineAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="备注" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.productionRemarks || row.remarks) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="240">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <ElButton link type="primary" @click="openAssignDialog(row)">分派</ElButton>
                <ElButton
                  v-if="row.assignedToUserId"
                  link
                  type="warning"
                  @click="releaseAssignment(row)"
                >
                  释放
                </ElButton>
                <ElButton link type="success" @click="goToWorkstation(row)">进入工位</ElButton>
                <ElButton link @click="goToTracking(row)">追踪</ElButton>
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
      v-model="assignmentDialogVisible"
      :close-on-click-modal="false"
      title="任务分派"
      width="640px"
    >
      <ElForm label-width="120px">
        <ElFormItem label="病理号">
          <ElInput :model-value="selectedTask?.pathologyNo ?? ''" disabled />
        </ElFormItem>
        <ElFormItem label="任务类型">
          <ElInput :model-value="formatTaskType(selectedTask?.taskType)" disabled />
        </ElFormItem>
        <ElFormItem label="优先级">
          <ElSelect v-model="assignmentForm.priority" class="w-full">
            <ElOption
              v-for="option in TECHNICAL_TASK_PRIORITY_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="分派工作台">
          <ElSelect
            v-model="assignmentForm.stationCode"
            class="w-full"
            @change="syncStationName"
          >
            <ElOption
              v-for="option in stationOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="责任技师">
          <SystemUserSelect
            v-model="assignmentForm.assignedToUserId"
            :selected-label="assignmentForm.assignedToName"
            placeholder="请选择或搜索责任技师"
            @change="handleAssignedUserChange"
          />
        </ElFormItem>
        <ElFormItem label="期望完成时间">
          <ElDatePicker
            v-model="assignmentForm.expectedCompletedAt"
            class="w-full"
            placeholder="选择时间"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </ElFormItem>
        <ElFormItem label="生产备注">
          <ElInput
            v-model="assignmentForm.productionRemarks"
            :rows="3"
            placeholder="特殊处理要求"
            type="textarea"
          />
        </ElFormItem>
        <ElFormItem label="操作人">
          <ElInput v-model="assignmentForm.operatorName" clearable />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="assignmentDialogVisible = false">取消</ElButton>
        <ElButton :loading="submittingAssignment" type="primary" @click="submitAssignment">
          确认分派
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
