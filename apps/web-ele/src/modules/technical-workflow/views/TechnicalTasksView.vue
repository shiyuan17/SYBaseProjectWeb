<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

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
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { listPendingTechnicalTasks } from '../api/technical-workflow-service';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
import {
  DEFAULT_PAGE_SIZE,
  TASK_TYPE_ROUTE_MAP,
  TECHNICAL_OBJECT_TYPE_OPTIONS,
  TECHNICAL_TASK_STATUS_OPTIONS,
  TECHNICAL_TASK_TYPE_OPTIONS,
} from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { formatDateTime, formatNullable } from '../utils/format';

const router = useRouter();

const pageError = ref('');
const loading = ref(false);
const pendingItems = ref<PendingTechnicalTaskItem[]>([]);
const total = ref(0);

const filters = reactive({
  applicationNo: '',
  createdRange: [] as string[],
  objectType: '',
  page: 1,
  pathologyNo: '',
  size: DEFAULT_PAGE_SIZE,
  taskStatus: '',
  taskType: '',
  timedOutOnly: false,
});

const currentQuery = computed(() => ({
  applicationNo: filters.applicationNo.trim() || undefined,
  createdFrom: filters.createdRange[0] || undefined,
  createdTo: filters.createdRange[1] || undefined,
  objectType: filters.objectType || undefined,
  page: filters.page,
  pathologyNo: filters.pathologyNo.trim() || undefined,
  size: filters.size,
  taskStatus: filters.taskStatus || undefined,
  taskType: filters.taskType || undefined,
  timedOutOnly: filters.timedOutOnly,
}));

function getTaskStatusTagType(status?: null | string) {
  if (status === 'COMPLETED') {
    return 'success';
  }
  if (status === 'IN_PROGRESS') {
    return 'warning';
  }
  return 'info';
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
  filters.createdRange = [];
  filters.objectType = '';
  filters.page = 1;
  filters.pathologyNo = '';
  filters.size = DEFAULT_PAGE_SIZE;
  filters.taskStatus = '';
  filters.taskType = '';
  filters.timedOutOnly = false;
  void loadPendingData();
}

function goToWorkstation(row: PendingTechnicalTaskItem) {
  const targetPath = row.taskType ? TASK_TYPE_ROUTE_MAP[row.taskType] : '';
  if (!targetPath) {
    ElMessage.warning('当前任务类型尚未配置对应工作站入口');
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
  <Page
    title="任务池"
    description="统一展示当前账号可见的技术流程待办，支持超时筛选、按病理号深链查询，并可快速跳转到对应工位。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <WorkflowSectionCard
        title="任务筛选"
        description="查询参数与后端 `/technical-tasks/pending` 完全对齐，便于前后端联调和分页回放。"
      >
        <ElForm inline label-width="96px">
          <ElFormItem label="任务类型">
            <ElSelect
              v-model="filters.taskType"
              clearable
              placeholder="全部任务类型"
              style="width: 180px"
            >
              <ElOption
                v-for="option in TECHNICAL_TASK_TYPE_OPTIONS"
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
              placeholder="全部任务状态"
              style="width: 180px"
            >
              <ElOption
                v-for="option in TECHNICAL_TASK_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="对象类型">
            <ElSelect
              v-model="filters.objectType"
              clearable
              placeholder="全部对象类型"
              style="width: 180px"
            >
              <ElOption
                v-for="option in TECHNICAL_OBJECT_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="申请单号">
            <ElInput
              v-model="filters.applicationNo"
              clearable
              placeholder="请输入 applicationNo"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="病理号">
            <ElInput
              v-model="filters.pathologyNo"
              clearable
              placeholder="请输入 pathologyNo"
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>
          <ElFormItem label="创建时间">
            <ElDatePicker
              v-model="filters.createdRange"
              end-placeholder="结束时间"
              range-separator="至"
              start-placeholder="开始时间"
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

      <WorkflowSectionCard
        title="待办列表"
        description="每条任务都可直接跳转到目标工作站，或进入病例级技术追踪查看上下游状态。"
      >
        <ElTable v-loading="loading" :data="pendingItems" border>
          <ElTableColumn label="任务 ID" min-width="180" prop="id" />
          <ElTableColumn label="任务类型" min-width="120">
            <template #default="{ row }">
              {{ formatNullable(row.taskType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="任务状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="getTaskStatusTagType(row.taskStatus)">
                {{ formatNullable(row.taskStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="病理号" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.pathologyNo) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="申请单号" min-width="140" prop="applicationNo" />
          <ElTableColumn label="对象类型" min-width="140">
            <template #default="{ row }">
              {{ formatNullable(row.objectType) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="对象 ID" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.objectId) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="截止时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.deadlineAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="超时" min-width="120">
            <template #default="{ row }">
              <ElTag :type="row.timedOut ? 'danger' : 'info'">
                {{ row.timedOut ? '已超时' : '未超时' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="备注" min-width="180">
            <template #default="{ row }">
              {{ formatNullable(row.remarks) }}
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" min-width="180">
            <template #default="{ row }">
              <div class="flex gap-2">
                <ElButton link type="primary" @click="goToWorkstation(row)">
                  进入工作站
                </ElButton>
                <ElButton link type="success" @click="goToTracking(row)">
                  查看追踪
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
  </Page>
</template>
