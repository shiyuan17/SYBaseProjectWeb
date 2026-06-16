<script setup lang="ts">
import type {
  StatIndicatorView,
  StatReportDetailResult,
  StatReportResult,
  StatReportTemplateView,
} from '../types/m6-statistics';
import type {
  DisplayStatReportRow,
  PeriodMode,
  ReportWorkbenchFilterState,
  WorkbenchTab,
} from '../utils/report-workbench';

import type { RoleView } from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ElMessage, ElSegmented, ElSkeleton } from 'element-plus';

import DashboardSectionCard from '#/modules/dashboard/components/DashboardSectionCard.vue';
import { listRoles } from '#/modules/system-management/api/system-management-service';

import {
  exportStatReport,
  exportStatReportDetails,
  listStatIndicators,
  listStatReportTemplates,
  queryStatReport,
  queryStatReportDetails,
} from '../api/m6-statistics-service';
import ReportChartPanel from '../components/ReportChartPanel.vue';
import ReportDetailDrawer from '../components/ReportDetailDrawer.vue';
import ReportMetricCards from '../components/ReportMetricCards.vue';
import ReportResultTable from '../components/ReportResultTable.vue';
import ReportWorkbenchFilters from '../components/ReportWorkbenchFilters.vue';
import { buildStatReportFileName } from '../utils/report-query';
import {
  buildBreakdownChartOption,
  buildDefaultDateRange,
  buildDetailFileName,
  buildDetailPayload,
  buildDisplayRows,
  buildInitialFilters,
  buildReportPayload,
  buildTrendChartOption,
  buildWorkbenchRowsCsvBlob,
  filterIndicatorsForTab,
  filterRowsForTab,
  filterTemplatesForTab,
  getReportWorkbenchTab,
  mergeWorkloadReports,
  normalizeQualityGroup,
  normalizeWorkbenchTab,
  reportWorkbenchTabs,
  resetFilters,
  splitQualityRows,
} from '../utils/report-workbench';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const pageError = ref('');
const loading = ref(false);
const referenceLoading = ref(false);
const exportLoading = ref(false);
const detailDrawerVisible = ref(false);
const detailLoading = ref(false);
const detailExportLoading = ref(false);
const activeTab = ref<WorkbenchTab>(normalizeWorkbenchTab(route.query.tab));
const activeQualityGroup = ref<'medical' | 'professional'>(
  normalizeQualityGroup(route.query.qualityGroup),
);
const indicators = ref<StatIndicatorView[]>([]);
const templates = ref<StatReportTemplateView[]>([]);
const roles = ref<RoleView[]>([]);
const report = ref<null | StatReportResult>(null);
const detailResult = ref<null | StatReportDetailResult>(null);
const activeDetailIndicator = ref<DisplayStatReportRow | null>(null);

const filters = reactive(buildInitialFilters(userStore.userInfo));
const detailPagination = reactive({
  page: 1,
  size: 10,
});

const pageTitle = computed(() => String(route.meta.title || '统计报表工作台'));
const pageDescription = computed(() =>
  String(
    route.meta.description ||
      '面向医疗质量分析报表的统一统计工作台，支持工作量、质控、冰冻、报告更改与不合格标本分析。',
  ),
);

const activeTabConfig = computed(() => getReportWorkbenchTab(activeTab.value));
const availableTemplates = computed(() =>
  filterTemplatesForTab(
    templates.value,
    activeTab.value,
    activeTabConfig.value,
  ),
);
const availableIndicators = computed(() =>
  filterIndicatorsForTab(
    indicators.value,
    activeTab.value,
    activeTabConfig.value,
  ),
);
const displayRows = computed(() => buildDisplayRows(report.value?.rows ?? []));
const visibleRows = computed(() => {
  if (activeTab.value !== 'quality') {
    return displayRows.value;
  }
  return splitQualityRows(displayRows.value, activeQualityGroup.value);
});
const topMetricRows = computed(() => visibleRows.value.slice(0, 4));
const trendChartOption = computed(() =>
  buildTrendChartOption(visibleRows.value),
);
const breakdownChartOption = computed(() =>
  buildBreakdownChartOption(visibleRows.value),
);

function buildPayload() {
  return buildReportPayload(activeTabConfig.value, filters);
}

function syncWorkbenchQuery(
  tab: WorkbenchTab,
  qualityGroup: 'medical' | 'professional',
) {
  void router.replace({
    query: {
      ...route.query,
      qualityGroup,
      tab,
    },
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function loadReferenceData() {
  referenceLoading.value = true;
  pageError.value = '';
  try {
    const [indicatorResult, templateResult, roleResult] = await Promise.all([
      listStatIndicators(),
      listStatReportTemplates(),
      listRoles().catch(() => []),
    ]);
    indicators.value = indicatorResult;
    templates.value = templateResult;
    roles.value = roleResult;
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '统计基础数据加载失败';
  } finally {
    referenceLoading.value = false;
  }
}

async function queryWorkloadReports() {
  const [operationReport, workloadReport] = await Promise.all([
    queryStatReport({ ...buildPayload(), category: 'OPERATION' }),
    queryStatReport({ ...buildPayload(), category: 'WORKLOAD' }),
  ]);
  return mergeWorkloadReports(operationReport, workloadReport);
}

async function queryActiveReport() {
  if (activeTab.value === 'workload') {
    return queryWorkloadReports();
  }

  const result = await queryStatReport(buildPayload());
  return {
    ...result,
    rows: filterRowsForTab(result.rows, activeTabConfig.value),
  } satisfies StatReportResult;
}

async function handleQuery() {
  loading.value = true;
  pageError.value = '';
  try {
    report.value = await queryActiveReport();
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '统计查询失败，请稍后重试';
    report.value = null;
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    if (activeTab.value === 'workload') {
      downloadBlob(
        buildWorkbenchRowsCsvBlob(report.value?.rows ?? []),
        buildStatReportFileName('WORKLOAD', 'workload'),
      );
      ElMessage.success('导出成功');
      return;
    }

    const result = await exportStatReport(buildPayload());
    if (result instanceof Blob) {
      downloadBlob(
        result,
        buildStatReportFileName(
          activeTabConfig.value.category,
          filters.templateCode || activeTab.value,
        ),
      );
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

function buildActiveDetailPayload() {
  return buildDetailPayload(
    activeDetailIndicator.value?.indicatorCode ?? '',
    filters,
    detailPagination,
  );
}

async function loadDetails() {
  if (!activeDetailIndicator.value?.indicatorCode) {
    detailResult.value = null;
    return;
  }
  detailLoading.value = true;
  try {
    detailResult.value = await queryStatReportDetails(
      buildActiveDetailPayload(),
    );
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : '明细查询失败，请稍后重试',
    );
    detailResult.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function handleOpenDetails(row: DisplayStatReportRow) {
  activeDetailIndicator.value = row;
  detailPagination.page = 1;
  detailResult.value = null;
  detailDrawerVisible.value = true;
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
  if (!activeDetailIndicator.value?.indicatorCode) {
    return;
  }
  detailExportLoading.value = true;
  try {
    const result = await exportStatReportDetails(buildActiveDetailPayload());
    if (result instanceof Blob) {
      downloadBlob(
        result,
        buildDetailFileName(activeDetailIndicator.value.indicatorCode),
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

function handleTabChange() {
  filters.templateCode = '';
  filters.indicatorCode = '';
  report.value = null;
  detailDrawerVisible.value = false;
  syncWorkbenchQuery(activeTab.value, activeQualityGroup.value);
  void handleQuery();
}

function handlePeriodModeChange(value: PeriodMode) {
  filters.periodMode = value;
  filters.dateRange = buildDefaultDateRange(value);
}

function handleFilterChange(
  field: Exclude<keyof ReportWorkbenchFilterState, 'periodMode'>,
  value: string | string[],
) {
  if (field === 'dateRange') {
    filters.dateRange = Array.isArray(value) ? value : [];
    return;
  }
  filters[field] = String(value);
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
  resetFilters(filters, userStore.userInfo);
  report.value = null;
}

watch(
  () => [route.query.tab, route.query.qualityGroup] as const,
  ([tab, qualityGroup]) => {
    const nextTab = normalizeWorkbenchTab(tab);
    const nextQualityGroup = normalizeQualityGroup(qualityGroup);
    if (activeTab.value !== nextTab) {
      activeTab.value = nextTab;
    }
    if (activeQualityGroup.value !== nextQualityGroup) {
      activeQualityGroup.value = nextQualityGroup;
    }
  },
  { immediate: true },
);

watch(activeQualityGroup, (value) => {
  syncWorkbenchQuery(activeTab.value, value);
});

function handleCloseDetails() {
  detailDrawerVisible.value = false;
}

watch(activeTab, handleTabChange);

onMounted(async () => {
  await loadReferenceData();
  await handleQuery();
});
</script>

<template>
  <Page :show-header="false" :title="pageTitle" :description="pageDescription">
    <div class="flex flex-col gap-4">
      <DashboardSectionCard
        title="报表工作台"
        description="按附件医疗质量分析报表组织为单入口多 tab，跨模块流程增强另行实施。"
      >
        <ElSegmented
          v-model="activeTab"
          :options="
            reportWorkbenchTabs.map((item) => ({
              label: item.title,
              value: item.key,
            }))
          "
        />
        <p class="mt-3 text-sm text-muted-foreground">
          {{ activeTabConfig.description }}
        </p>
      </DashboardSectionCard>

      <DashboardSectionCard title="查询条件">
        <ReportWorkbenchFilters
          :active-tab="activeTab"
          :export-loading="exportLoading"
          :filters="filters"
          :indicators="availableIndicators"
          :loading="loading"
          :roles="roles"
          :templates="availableTemplates"
          @department-change="handleDepartmentChange"
          @export="handleExport"
          @filter-change="handleFilterChange"
          @period-mode-change="handlePeriodModeChange"
          @query="handleQuery"
          @reset="handleReset"
          @user-change="handleUserChange"
        />
      </DashboardSectionCard>

      <p v-if="pageError" class="text-sm text-destructive">
        {{ pageError }}
      </p>

      <ElSkeleton v-if="loading || referenceLoading" :rows="8" animated />
      <template v-else>
        <ReportMetricCards :rows="topMetricRows" />

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DashboardSectionCard
            title="趋势/对比图"
            description="优先使用后端 trendPoints，未返回时按当前指标结果生成对比图。"
          >
            <ReportChartPanel
              empty-text="当前指标暂无趋势图数据"
              :loading="loading"
              :option="trendChartOption"
            />
          </DashboardSectionCard>

          <DashboardSectionCard
            title="原因/状态分布"
            description="优先使用后端 breakdowns，未返回时展示指标可用性状态分布。"
          >
            <ReportChartPanel
              empty-text="当前指标暂无分布图数据"
              :loading="loading"
              :option="breakdownChartOption"
            />
          </DashboardSectionCard>
        </div>

        <DashboardSectionCard
          title="报表结果"
          description="当前结果以 M6 后端统计口径返回值为准。"
        >
          <ReportResultTable
            :active-tab="activeTab"
            :detail-enabled="activeTabConfig.detailEnabled"
            :quality-group="activeQualityGroup"
            :rows="visibleRows"
            @open-details="handleOpenDetails"
            @update:quality-group="activeQualityGroup = $event"
          />
        </DashboardSectionCard>
      </template>

      <ReportDetailDrawer
        :active-detail-indicator="activeDetailIndicator"
        :detail-drawer-visible="detailDrawerVisible"
        :detail-export-loading="detailExportLoading"
        :detail-loading="detailLoading"
        :detail-pagination="detailPagination"
        :detail-result="detailResult"
        @close="handleCloseDetails"
        @export="handleExportDetails"
        @page-change="handleDetailPageChange"
        @size-change="handleDetailSizeChange"
      />
    </div>
  </Page>
</template>
