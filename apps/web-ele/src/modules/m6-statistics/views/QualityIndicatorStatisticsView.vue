<script setup lang="ts">
import type {
  MetricStatus,
  StatIndicatorView,
  StatReportDetailQuery,
  StatReportDetailResult,
  StatReportQuery,
  StatReportResult,
} from '../types/m6-statistics';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElPagination,
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
  exportStatReportDetails,
  listStatIndicators,
  queryStatReport,
  queryStatReportDetails,
} from '../api/m6-statistics-service';
import { buildStatReportFileName } from '../utils/report-query';
import {
  buildDisplayRows,
  detailStatusLabel,
  detailStatusTagType,
  metricStatusLabel,
  metricStatusTagType,
} from '../utils/report-workbench';

type PeriodMode = 'month' | 'quarter' | 'year';

const route = useRoute();

const loading = ref(false);
const exportLoading = ref(false);
const detailDrawerVisible = ref(false);
const detailExportLoading = ref(false);
const detailLoading = ref(false);
const pageError = ref('');
const indicators = ref<StatIndicatorView[]>([]);
const report = ref<null | StatReportResult>(null);
const activeDetailIndicatorCode = ref('');
const activeDetailTitle = ref('');
const detailResult = ref<null | StatReportDetailResult>(null);

const filters = reactive({
  dateRange: buildDefaultDateRange('month'),
  departmentId: '',
  departmentName: '',
  indicatorCode: '',
  periodMode: 'month' as PeriodMode,
});

const detailPagination = reactive({
  page: 1,
  size: 10,
});

const periodOptions = [
  { label: '月度', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];

const pageTitle = computed(() => String(route.meta.title || '质控指标统计'));
const qualityIndicators = computed(() =>
  indicators.value.filter((item) => item.indicatorCategory === 'QUALITY'),
);

const rows = computed(() => buildDisplayRows(report.value?.rows ?? []));

const activeIndicatorName = computed(() => {
  if (!activeDetailIndicatorCode.value) {
    return '';
  }
  return (
    rows.value.find(
      (item) => item.indicatorCode === activeDetailIndicatorCode.value,
    )?.indicatorName ?? activeDetailIndicatorCode.value
  );
});

const detailSummaryItems = computed(() => [
  {
    count: detailResult.value?.eligibleCount ?? 0,
    label: '纳入病例',
    status: 'AVAILABLE' as MetricStatus,
  },
  {
    count: detailResult.value?.passCount ?? 0,
    label: '通过',
    status: 'AVAILABLE' as MetricStatus,
  },
  {
    count: detailResult.value?.failCount ?? 0,
    label: '未通过',
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

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildDetailFileName(indicatorCode: string) {
  return `${indicatorCode.toLowerCase()}-quality-detail.csv`;
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

function buildDetailPayload(): StatReportDetailQuery {
  const [from, to] = filters.dateRange;
  return {
    departmentId: filters.departmentId || null,
    from: from || null,
    indicatorCode: activeDetailIndicatorCode.value,
    page: detailPagination.page,
    size: detailPagination.size,
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

async function loadDetails() {
  if (!activeDetailIndicatorCode.value) {
    detailResult.value = null;
    return;
  }
  detailLoading.value = true;
  try {
    detailResult.value = await queryStatReportDetails(buildDetailPayload());
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '明细查询失败，请稍后重试',
    );
    detailResult.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function handleOpenDetails(
  row?: (typeof rows.value)[number],
) {
  activeDetailIndicatorCode.value = row?.indicatorCode ?? filters.indicatorCode;
  activeDetailTitle.value = row?.indicatorName ?? activeIndicatorName.value;
  detailPagination.page = 1;
  detailDrawerVisible.value = true;
  detailResult.value = null;
  await loadDetails();
}

async function handleDetailPageChange(page: number) {
  detailPagination.page = page;
  await loadDetails();
}

async function handleDetailSizeChange(size: number) {
  detailPagination.size = size;
  detailPagination.page = 1;
  await loadDetails();
}

async function handleExportDetails() {
  if (!activeDetailIndicatorCode.value) {
    return;
  }
  detailExportLoading.value = true;
  try {
    const result = await exportStatReportDetails(buildDetailPayload());
    if (result instanceof Blob) {
      downloadBlob(
        result,
        buildDetailFileName(activeDetailIndicatorCode.value),
      );
      ElMessage.success('明细导出成功');
    }
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '明细导出失败，请稍后重试',
    );
  } finally {
    detailExportLoading.value = false;
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

      <DashboardSectionCard title="质控指标总览">
        <p v-if="pageError" class="mb-3 text-sm text-destructive">
          {{ pageError }}
        </p>
        <ElSkeleton v-if="loading" :rows="8" animated />
        <ElTable v-else-if="rows.length > 0" :data="rows" border>
          <ElTableColumn
            label="指标名称"
            min-width="240"
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
          <ElTableColumn fixed="right" label="操作" width="120">
            <template #default="{ row }">
              <ElButton link type="primary" @click="handleOpenDetails(row)">
                查看明细
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
        <ElEmpty v-else description="当前筛选条件下暂无质控统计结果" />
      </DashboardSectionCard>

      <ElDrawer
        v-model="detailDrawerVisible"
        :title="`质控明细 - ${activeDetailTitle || activeIndicatorName}`"
        size="760px"
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-sm font-medium">
                {{ activeDetailTitle || activeIndicatorName }}
              </div>
            </div>
            <ElButton
              :loading="detailExportLoading"
              @click="handleExportDetails"
            >
              导出明细 CSV
            </ElButton>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <div
              v-for="item in detailSummaryItems"
              :key="item.label"
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

          <ElSkeleton v-if="detailLoading" :rows="5" animated />
          <template v-else>
            <ElTable
              v-if="detailResult?.items.length"
              :data="detailResult.items"
              border
            >
              <ElTableColumn
                label="病理号"
                min-width="160"
                prop="pathologyNo"
              />
              <ElTableColumn
                label="申请单号"
                min-width="160"
                prop="applicationNo"
              />
              <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
              <ElTableColumn
                label="发生时间"
                min-width="180"
                prop="occurredAt"
              />
              <ElTableColumn label="结论" min-width="120">
                <template #default="{ row }">
                  <ElTag :type="detailStatusTagType(row.detailStatus)">
                    {{ detailStatusLabel(row.detailStatus) }}
                  </ElTag>
                </template>
              </ElTableColumn>
              <ElTableColumn
                label="原因/说明"
                min-width="220"
                prop="reason"
                show-overflow-tooltip
              />
            </ElTable>
            <ElEmpty v-else description="当前筛选条件下暂无明细记录" />
            <div class="flex justify-end">
              <ElPagination
                :current-page="detailPagination.page"
                :page-size="detailPagination.size"
                :page-sizes="[10, 20, 50]"
                :total="detailResult?.total ?? 0"
                layout="total, sizes, prev, pager, next"
                @update:current-page="handleDetailPageChange"
                @update:page-size="handleDetailSizeChange"
              />
            </div>
          </template>
        </div>
      </ElDrawer>
    </div>
  </Page>
</template>
