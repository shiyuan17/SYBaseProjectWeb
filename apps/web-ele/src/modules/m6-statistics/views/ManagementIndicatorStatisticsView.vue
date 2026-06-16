<script setup lang="ts">
import type {
  StatReportQuery,
  StatReportResult,
} from '../types/m6-statistics';
import type { RoleView } from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElSegmented,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import DashboardSectionCard from '#/modules/dashboard/components/DashboardSectionCard.vue';
import { listRoles } from '#/modules/system-management/api/system-management-service';
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  exportStatReport,
  queryStatReport,
} from '../api/m6-statistics-service';
import { buildStatReportFileName } from '../utils/report-query';
import {
  buildDisplayRows,
  metricStatusLabel,
  metricStatusTagType,
} from '../utils/report-workbench';

type PeriodMode = 'month' | 'quarter' | 'year';

const route = useRoute();
const userStore = useUserStore();

const loading = ref(false);
const exportLoading = ref<'' | 'OPERATION' | 'WORKLOAD'>('');
const pageError = ref('');
const roles = ref<RoleView[]>([]);
const operationReport = ref<null | StatReportResult>(null);
const workloadReport = ref<null | StatReportResult>(null);

const filters = reactive({
  dateRange: buildDefaultDateRange('month'),
  departmentId: '',
  departmentName: '',
  periodMode: 'month' as PeriodMode,
  roleId: '',
  workloadUserId: userStore.userInfo?.userId ?? '',
  workloadUserName: userStore.userInfo?.realName ?? '',
});

const periodOptions = [
  { label: '月度', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];

const roleOptions = computed(() =>
  roles.value.map((item) => ({
    label: item.roleName,
    value: item.id,
  })),
);

const pageTitle = computed(() => String(route.meta.title || '管理指标统计'));
const operationRows = computed(() =>
  buildDisplayRows(operationReport.value?.rows ?? []),
);
const workloadRows = computed(() =>
  buildDisplayRows(workloadReport.value?.rows ?? []),
);

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTime(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
    value.getSeconds(),
  )}`;
}

function buildDefaultDateRange(mode: PeriodMode) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  if (mode === 'year') {
    return [
      formatDateTime(new Date(year, 0, 1, 0, 0, 0)),
      formatDateTime(new Date(year, 11, 31, 23, 59, 59)),
    ];
  }

  if (mode === 'quarter') {
    return [
      formatDateTime(new Date(year, quarterStartMonth, 1, 0, 0, 0)),
      formatDateTime(new Date(year, quarterStartMonth + 3, 0, 23, 59, 59)),
    ];
  }

  return [
    formatDateTime(new Date(year, month, 1, 0, 0, 0)),
    formatDateTime(new Date(year, month + 1, 0, 23, 59, 59)),
  ];
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPayload(category: 'OPERATION' | 'WORKLOAD'): StatReportQuery {
  const [from, to] = filters.dateRange;
  return {
    category,
    departmentId: filters.departmentId || null,
    from: from || null,
    roleId: filters.roleId || null,
    to: to || null,
    workloadUserId: filters.workloadUserId || null,
  };
}

async function loadRoles() {
  roles.value = await listRoles();
}

async function handleQuery() {
  loading.value = true;
  pageError.value = '';
  try {
    const [operationResult, workloadResult] = await Promise.all([
      queryStatReport(buildPayload('OPERATION')),
      queryStatReport(buildPayload('WORKLOAD')),
    ]);
    operationReport.value = operationResult;
    workloadReport.value = workloadResult;
  } catch (error) {
    pageError.value =
      error instanceof Error
        ? error.message
        : '管理指标统计查询失败，请稍后重试';
    operationReport.value = null;
    workloadReport.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleExport(category: 'OPERATION' | 'WORKLOAD') {
  exportLoading.value = category;
  try {
    const result = await exportStatReport(buildPayload(category));
    if (result instanceof Blob) {
      downloadBlob(result, buildStatReportFileName(category, category));
      ElMessage.success('导出成功');
    }
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '导出失败，请稍后重试',
    );
  } finally {
    exportLoading.value = '';
  }
}

function handlePeriodModeChange(value: PeriodMode) {
  filters.periodMode = value;
  filters.dateRange = buildDefaultDateRange(value);
}

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.departmentId = department?.id ?? '';
  filters.departmentName = department?.name ?? '';
}

function handleUserChange(user: null | { id: string; name: string }) {
  filters.workloadUserId = user?.id ?? '';
  filters.workloadUserName = user?.name ?? '';
}

function handleReset() {
  filters.periodMode = 'month';
  filters.dateRange = buildDefaultDateRange('month');
  filters.departmentId = '';
  filters.departmentName = '';
  filters.roleId = '';
  filters.workloadUserId = userStore.userInfo?.userId ?? '';
  filters.workloadUserName = userStore.userInfo?.realName ?? '';
  operationReport.value = null;
  workloadReport.value = null;
}

onMounted(() => {
  void loadRoles().catch((error: unknown) => {
    pageError.value =
      error instanceof Error ? error.message : '管理指标统计基础数据加载失败';
  });
  void handleQuery();
});
</script>

<template>
  <Page :show-header="false" :title="pageTitle">
    <div class="flex flex-col gap-4">
      <DashboardSectionCard title="查询条件">
        <ElForm inline label-width="90px">
          <ElFormItem label="统计周期">
            <ElSegmented
              v-model="filters.periodMode"
              :options="periodOptions"
              @change="handlePeriodModeChange"
            />
          </ElFormItem>
          <ElFormItem label="时间范围">
            <ElDatePicker
              v-model="filters.dateRange"
              end-placeholder="结束时间"
              range-separator="至"
              start-placeholder="开始时间"
              style="width: 340px"
              type="datetimerange"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </ElFormItem>
          <ElFormItem label="送检科室">
            <DepartmentSelect
              v-model="filters.departmentId"
              :selected-label="filters.departmentName"
              placeholder="请选择科室"
              style="width: 220px"
              @change="handleDepartmentChange"
            />
          </ElFormItem>
          <ElFormItem label="角色">
            <ElSelect
              v-model="filters.roleId"
              clearable
              placeholder="请选择角色"
              style="width: 220px"
            >
              <ElOption
                v-for="item in roleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="人员">
            <SystemUserSelect
              v-model="filters.workloadUserId"
              :selected-label="filters.workloadUserName"
              placeholder="请选择人员"
              style="width: 220px"
              @change="handleUserChange"
            />
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="handleQuery">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
      </DashboardSectionCard>

      <p v-if="pageError" class="text-sm text-destructive">
        {{ pageError }}
      </p>
      <ElSkeleton v-if="loading" :rows="8" animated />

      <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSectionCard title="运营指标">
          <ElTable v-if="operationRows.length > 0" :data="operationRows" border>
            <ElTableColumn
              label="指标名称"
              min-width="180"
              prop="displayIndicatorName"
            />
            <ElTableColumn label="结果" min-width="140" prop="metricValue" />
            <ElTableColumn label="状态" min-width="120">
              <template #default="{ row }">
                <ElTag :type="metricStatusTagType(row.metricStatus)">
                  {{ metricStatusLabel(row.metricStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="数据来源与口径"
              min-width="240"
              prop="displaySourceNote"
              show-overflow-tooltip
            />
          </ElTable>
          <ElEmpty v-else description="当前筛选条件下暂无运营指标" />
          <div class="mt-3">
            <ElButton
              :loading="exportLoading === 'OPERATION'"
              @click="handleExport('OPERATION')"
            >
              导出运营 CSV
            </ElButton>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="工作量指标">
          <ElTable v-if="workloadRows.length > 0" :data="workloadRows" border>
            <ElTableColumn
              label="指标名称"
              min-width="180"
              prop="displayIndicatorName"
            />
            <ElTableColumn label="结果" min-width="140" prop="metricValue" />
            <ElTableColumn label="状态" min-width="120">
              <template #default="{ row }">
                <ElTag :type="metricStatusTagType(row.metricStatus)">
                  {{ metricStatusLabel(row.metricStatus) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="数据来源与口径"
              min-width="240"
              prop="displaySourceNote"
              show-overflow-tooltip
            />
          </ElTable>
          <ElEmpty v-else description="当前筛选条件下暂无工作量指标" />
          <div class="mt-3">
            <ElButton
              :loading="exportLoading === 'WORKLOAD'"
              @click="handleExport('WORKLOAD')"
            >
              导出工作量 CSV
            </ElButton>
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  </Page>
</template>
