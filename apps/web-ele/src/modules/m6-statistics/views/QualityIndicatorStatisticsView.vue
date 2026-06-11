<script setup lang="ts">
import type {
  MetricStatus,
  StatIndicatorView,
  StatReportQuery,
  StatReportResult,
  StatReportRow,
} from '../types/m6-statistics';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

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
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import {
  exportStatReport,
  listStatIndicators,
  queryStatReport,
} from '../api/m6-statistics-service';
import { buildStatReportFileName } from '../utils/report-query';

type PeriodMode = 'month' | 'quarter' | 'year';

const route = useRoute();

const loading = ref(false);
const exportLoading = ref(false);
const pageError = ref('');
const indicators = ref<StatIndicatorView[]>([]);
const report = ref<null | StatReportResult>(null);

const filters = reactive({
  dateRange: buildDefaultDateRange('month'),
  departmentId: '',
  departmentName: '',
  indicatorCode: '',
  periodMode: 'month' as PeriodMode,
});

const periodOptions = [
  { label: '月度', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];

const pageTitle = computed(() => String(route.meta.title || '质控指标统计'));
const pageDescription = computed(() =>
  String(
    route.meta.description ||
      '展示三甲质控指标、质量安全控制指标与数据源接入口径状态。',
  ),
);

const qualityIndicators = computed(() =>
  indicators.value.filter((item) => item.indicatorCategory === 'QUALITY'),
);

const rows = computed(() => report.value?.rows ?? []);

const statusSummary = computed(() => {
  const summary: Record<MetricStatus, number> = {
    AVAILABLE: 0,
    PARTIAL: 0,
    UNAVAILABLE: 0,
  };
  for (const row of rows.value) {
    if (row.metricStatus) {
      summary[row.metricStatus] += 1;
    }
  }
  return summary;
});

const statusSummaryItems = computed(() => [
  {
    count: statusSummary.value.AVAILABLE,
    label: '可用',
    status: 'AVAILABLE' as MetricStatus,
  },
  {
    count: statusSummary.value.PARTIAL,
    label: '部分可用',
    status: 'PARTIAL' as MetricStatus,
  },
  {
    count: statusSummary.value.UNAVAILABLE,
    label: '不可用',
    status: 'UNAVAILABLE' as MetricStatus,
  },
]);

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

function metricStatusLabel(status?: MetricStatus) {
  if (status === 'AVAILABLE') {
    return '可用';
  }
  if (status === 'PARTIAL') {
    return '部分可用';
  }
  if (status === 'UNAVAILABLE') {
    return '不可用';
  }
  return '未知';
}

function metricStatusTagType(status?: MetricStatus) {
  if (status === 'AVAILABLE') {
    return 'success';
  }
  if (status === 'PARTIAL') {
    return 'warning';
  }
  if (status === 'UNAVAILABLE') {
    return 'info';
  }
  return undefined;
}

function displayMetric(row: StatReportRow) {
  if (row.metricStatus === 'UNAVAILABLE') {
    return '未接入';
  }
  return row.metricUnit
    ? `${row.metricValue} ${row.metricUnit}`
    : row.metricValue;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPayload(): StatReportQuery {
  const [from, to] = filters.dateRange;
  return {
    category: 'QUALITY',
    departmentId: filters.departmentId || null,
    from: from || null,
    indicatorCode: filters.indicatorCode || null,
    to: to || null,
  };
}

async function loadIndicators() {
  indicators.value = await listStatIndicators('QUALITY');
}

async function handleQuery() {
  loading.value = true;
  pageError.value = '';
  try {
    report.value = await queryStatReport(buildPayload());
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '质控统计查询失败，请稍后重试';
    report.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await exportStatReport(buildPayload());
    if (result instanceof Blob) {
      downloadBlob(result, buildStatReportFileName('QUALITY', 'quality'));
      ElMessage.success('导出成功');
    }
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '导出失败，请稍后重试',
    );
  } finally {
    exportLoading.value = false;
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

function handleReset() {
  filters.periodMode = 'month';
  filters.dateRange = buildDefaultDateRange('month');
  filters.departmentId = '';
  filters.departmentName = '';
  filters.indicatorCode = '';
  report.value = null;
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadIndicators();
    await handleQuery();
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '质控统计基础数据加载失败';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page :show-header="false" :title="pageTitle" :description="pageDescription">
    <div class="flex flex-col gap-4">
      <DashboardSectionCard
        title="查询条件"
        description="支持月度、季度、年度与自定义时间范围，所有结果以 M6 后端统计口径为准。"
      >
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
          <ElFormItem label="指标筛选">
            <ElSelect
              v-model="filters.indicatorCode"
              clearable
              placeholder="请选择质控指标"
              style="width: 240px"
            >
              <ElOption
                v-for="item in qualityIndicators"
                :key="item.id"
                :label="item.indicatorName"
                :value="item.indicatorCode"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="handleQuery">
              查询
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
            <ElButton :loading="exportLoading" @click="handleExport">
              导出 CSV
            </ElButton>
          </ElFormItem>
        </ElForm>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="状态分布"
        description="缺少精确数据源的指标明确标记为不可用，不用近似口径冒充真实结果。"
      >
        <div class="grid gap-3 md:grid-cols-3">
          <div
            v-for="item in statusSummaryItems"
            :key="item.status"
            class="rounded border border-border bg-card px-4 py-3"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-muted-foreground">{{
                item.label
              }}</span>
              <ElTag :type="metricStatusTagType(item.status)">
                {{ metricStatusLabel(item.status) }}
              </ElTag>
            </div>
            <div class="mt-3 text-2xl font-semibold">{{ item.count }}</div>
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="质控指标总览"
        description="展示三甲十三项质控指标及质量安全控制指标的结果、状态和来源说明。"
      >
        <p v-if="pageError" class="mb-3 text-sm text-destructive">
          {{ pageError }}
        </p>
        <ElSkeleton v-if="loading" :rows="8" animated />
        <ElTable v-else-if="rows.length > 0" :data="rows" border>
          <ElTableColumn
            label="指标编码"
            min-width="190"
            prop="indicatorCode"
          />
          <ElTableColumn
            label="指标名称"
            min-width="240"
            prop="indicatorName"
          />
          <ElTableColumn label="结果" min-width="140">
            <template #default="{ row }">
              {{ displayMetric(row) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="120">
            <template #default="{ row }">
              <ElTag :type="metricStatusTagType(row.metricStatus)">
                {{ metricStatusLabel(row.metricStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="分子/分母" min-width="140">
            <template #default="{ row }">
              {{ row.numerator ?? '-' }} / {{ row.denominator ?? '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="数据来源与口径"
            min-width="320"
            prop="sourceNote"
            show-overflow-tooltip
          />
        </ElTable>
        <ElEmpty v-else description="当前筛选条件下暂无质控统计结果" />
      </DashboardSectionCard>
    </div>
  </Page>
</template>
