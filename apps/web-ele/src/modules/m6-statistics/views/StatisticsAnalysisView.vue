<script setup lang="ts">
import type {
  StatIndicatorCategory,
  StatIndicatorView,
  StatReportResult,
  StatReportTemplateView,
} from '../types/m6-statistics';

import type { RoleView } from '#/modules/system-management/types/system-management';

import { computed, onMounted, reactive, ref, watch } from 'vue';
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
} from 'element-plus';

import DashboardSectionCard from '#/modules/dashboard/components/DashboardSectionCard.vue';
import { listRoles } from '#/modules/system-management/api/system-management-service';
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';
import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

import {
  exportStatReport,
  listStatIndicators,
  listStatReportTemplates,
  queryStatReport,
} from '../api/m6-statistics-service';
import { M6_STAT_CATEGORY_TABS } from '../constants';
import {
  buildStatReportFileName,
  buildStatReportPayload,
} from '../utils/report-query';

const userStore = useUserStore();
const route = useRoute();

const loading = ref(false);
const exportLoading = ref(false);
const pageError = ref('');

const activeCategory = ref<StatIndicatorCategory>('QUALITY');
const indicators = ref<StatIndicatorView[]>([]);
const templates = ref<StatReportTemplateView[]>([]);
const roles = ref<RoleView[]>([]);
const report = ref<null | StatReportResult>(null);

const filters = reactive({
  dateRange: [] as string[],
  departmentId: '',
  departmentName: '',
  indicatorCode: '',
  operatorName: userStore.userInfo?.realName ?? '',
  operatorUserId: userStore.userInfo?.userId ?? '',
  roleId: '',
  templateCode: '',
});

const availableTemplates = computed(() =>
  templates.value.filter((item) => item.templateType === activeCategory.value),
);

const availableIndicators = computed(() =>
  indicators.value.filter(
    (item) => item.indicatorCategory === activeCategory.value,
  ),
);

const roleOptions = computed(() =>
  roles.value.map((item) => ({
    label: item.roleName,
    value: item.id,
  })),
);

const categoryOptions = computed(() => [...M6_STAT_CATEGORY_TABS]);
const pageTitle = computed(() => String(route.meta.title || '统计分析'));
const pageDescription = computed(() =>
  String(
    route.meta.description ||
      '面向质控、运营和工作量的正式统计报表入口，支持按模板或单指标查询并导出 CSV。',
  ),
);

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPayload() {
  return buildStatReportPayload(activeCategory.value, filters);
}

async function loadReferenceData() {
  loading.value = true;
  pageError.value = '';
  try {
    const [indicatorResult, templateResult, roleResult] = await Promise.all([
      listStatIndicators(),
      listStatReportTemplates(),
      listRoles(),
    ]);
    indicators.value = indicatorResult;
    templates.value = templateResult;
    roles.value = roleResult;
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '统计基础数据加载失败';
  } finally {
    loading.value = false;
  }
}

async function handleQuery() {
  loading.value = true;
  pageError.value = '';
  try {
    report.value = await queryStatReport(buildPayload());
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
    const result = await exportStatReport(buildPayload());
    if (result instanceof Blob) {
      downloadBlob(
        result,
        buildStatReportFileName(activeCategory.value, filters.templateCode),
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

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.departmentId = department?.id ?? '';
  filters.departmentName = department?.name ?? '';
}

function handleUserChange(user: null | { id: string; name: string }) {
  filters.operatorUserId = user?.id ?? '';
  filters.operatorName = user?.name ?? '';
}

function handleReset() {
  filters.dateRange = [];
  filters.departmentId = '';
  filters.departmentName = '';
  filters.indicatorCode = '';
  filters.operatorName = userStore.userInfo?.realName ?? '';
  filters.operatorUserId = userStore.userInfo?.userId ?? '';
  filters.roleId = '';
  filters.templateCode = '';
  report.value = null;
}

watch(activeCategory, () => {
  filters.templateCode = '';
  filters.indicatorCode = '';
  report.value = null;
});

onMounted(async () => {
  await loadReferenceData();
  await handleQuery();
});
</script>

<template>
  <Page :show-header="false" :title="pageTitle" :description="pageDescription">
    <div class="flex flex-col gap-4">
      <DashboardSectionCard
        title="统计分类"
        description="首页分析页只展示轻量概览，正式统计查询统一在这里完成。"
      >
        <ElSegmented v-model="activeCategory" :options="categoryOptions" />
      </DashboardSectionCard>

      <DashboardSectionCard
        title="查询条件"
        description="支持模板、指标、时间范围、科室、角色和人员筛选。"
      >
        <ElForm inline label-width="90px">
          <ElFormItem label="统计模板">
            <ElSelect
              v-model="filters.templateCode"
              clearable
              placeholder="请选择统计模板"
              style="width: 220px"
            >
              <ElOption
                v-for="item in availableTemplates"
                :key="item.id"
                :label="item.templateName"
                :value="item.templateCode"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="统计指标">
            <ElSelect
              v-model="filters.indicatorCode"
              clearable
              placeholder="请选择统计指标"
              style="width: 220px"
            >
              <ElOption
                v-for="item in availableIndicators"
                :key="item.id"
                :label="item.indicatorName"
                :value="item.indicatorCode"
              />
            </ElSelect>
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
              v-model="filters.operatorUserId"
              :selected-label="filters.operatorName"
              placeholder="请选择人员"
              @change="handleUserChange"
            />
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
        title="报表结果"
        description="当前结果完全以 M6 后端统计口径返回值为准。"
      >
        <ElSkeleton v-if="loading" :rows="8" animated />
        <ElTable v-else-if="report?.rows?.length" :data="report.rows" border>
          <ElTableColumn
            label="指标编码"
            min-width="180"
            prop="indicatorCode"
          />
          <ElTableColumn
            label="指标名称"
            min-width="220"
            prop="indicatorName"
          />
          <ElTableColumn label="结果值" min-width="140" prop="metricValue" />
          <ElTableColumn label="单位" min-width="120" prop="metricUnit" />
        </ElTable>
        <ElEmpty v-else description="当前筛选条件下暂无统计结果" />
      </DashboardSectionCard>
    </div>
  </Page>
</template>
