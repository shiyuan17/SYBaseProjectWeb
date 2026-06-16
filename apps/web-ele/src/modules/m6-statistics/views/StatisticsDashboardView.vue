<script setup lang="ts">
import type {
  StatDashboardCard,
  StatDashboardResult,
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
  ElSkeleton,
  ElTag,
} from 'element-plus';

import DashboardSectionCard from '#/modules/dashboard/components/DashboardSectionCard.vue';
import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import { queryStatDashboard } from '../api/m6-statistics-service';
import { localizeIndicatorName } from '../utils/report-workbench';

const route = useRoute();

const loading = ref(false);
const pageError = ref('');
const dashboard = ref<null | StatDashboardResult>(null);

const filters = reactive({
  dateRange: [] as string[],
  departmentId: '',
  departmentName: '',
});

const pageTitle = computed(() => String(route.meta.title || '统计仪表盘'));

const summaryCards = computed(() => dashboard.value?.summaryCards ?? []);
const qualityCards = computed(() => dashboard.value?.qualityCards ?? []);
const operationCards = computed(() => dashboard.value?.operationCards ?? []);
const workloadCards = computed(() => dashboard.value?.workloadCards ?? []);

function buildPayload() {
  return {
    departmentId: filters.departmentId || undefined,
    from: filters.dateRange[0] || undefined,
    to: filters.dateRange[1] || undefined,
  };
}

function formatMetric(card: StatDashboardCard) {
  const metricValue = card.metricValue?.trim() || '-';
  const metricUnit = card.metricUnit.trim().toUpperCase();
  if (metricUnit === 'PERCENT' || metricUnit === '%') {
    return `${metricValue}%`;
  }
  if (metricUnit === 'COUNT') {
    return `${metricValue} 例`;
  }
  if (metricUnit === 'CNY' || metricUnit === 'RMB') {
    return `${metricValue} 元`;
  }
  return [metricValue, card.metricUnit].filter(Boolean).join(' ');
}

function metricStatusLabel(status: StatDashboardCard['metricStatus']) {
  if (status === 'AVAILABLE') {
    return '可用';
  }
  if (status === 'PARTIAL') {
    return '部分';
  }
  if (status === 'UNAVAILABLE') {
    return '不可用';
  }
  return '未标记';
}

function metricStatusType(status: StatDashboardCard['metricStatus']) {
  if (status === 'AVAILABLE') {
    return 'success';
  }
  if (status === 'PARTIAL') {
    return 'warning';
  }
  if (status === 'UNAVAILABLE') {
    return 'info';
  }
  return 'info';
}

function handleDepartmentChange(
  department: null | { id: string; name: string },
) {
  filters.departmentId = department?.id ?? '';
  filters.departmentName = department?.name ?? '';
}

async function loadDashboard() {
  loading.value = true;
  pageError.value = '';
  try {
    dashboard.value = await queryStatDashboard(buildPayload());
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '统计仪表盘加载失败';
    dashboard.value = null;
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filters.dateRange = [];
  filters.departmentId = '';
  filters.departmentName = '';
  void loadDashboard();
}

onMounted(() => {
  void loadDashboard();
});
</script>

<template>
  <Page :show-header="false" :title="pageTitle">
    <div class="flex flex-col gap-4">
      <DashboardSectionCard title="筛选条件">
        <ElForm inline label-width="90px">
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
          <ElFormItem>
            <ElButton :loading="loading" type="primary" @click="loadDashboard">
              刷新
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
          </ElFormItem>
        </ElForm>
        <p v-if="pageError" class="mt-2 text-sm text-destructive">
          {{ pageError }}
        </p>
      </DashboardSectionCard>

      <ElSkeleton v-if="loading" :rows="8" animated />

      <template v-else-if="dashboard">
        <DashboardSectionCard title="核心概览">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="card in summaryCards"
              :key="`summary-${card.indicatorCode}`"
              class="min-h-28 rounded border border-border bg-card p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="text-sm text-muted-foreground">
                  {{
                    localizeIndicatorName(
                      card.indicatorCode,
                      card.indicatorName,
                    )
                  }}
                </div>
                <ElTag :type="metricStatusType(card.metricStatus)" size="small">
                  {{ metricStatusLabel(card.metricStatus) }}
                </ElTag>
              </div>
              <div class="mt-3 text-2xl font-semibold text-foreground">
                {{ formatMetric(card) }}
              </div>
            </div>
          </div>
        </DashboardSectionCard>

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <DashboardSectionCard title="质控指标">
            <div
              class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
              data-testid="dashboard-quality-grid"
            >
              <div
                v-for="card in qualityCards"
                :key="`quality-${card.indicatorCode}`"
                class="min-h-28 rounded border border-border bg-card/80 p-3 lg:min-h-32 lg:p-4"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="text-sm font-medium leading-5 text-foreground">
                    {{
                      localizeIndicatorName(
                        card.indicatorCode,
                        card.indicatorName,
                      )
                    }}
                  </div>
                  <ElTag
                    :type="metricStatusType(card.metricStatus)"
                    size="small"
                  >
                    {{ metricStatusLabel(card.metricStatus) }}
                  </ElTag>
                </div>
                <div
                  class="mt-2 text-xl font-semibold leading-none lg:text-2xl"
                >
                  {{ formatMetric(card) }}
                </div>
              </div>
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title="运营指标">
            <div
              class="grid grid-cols-1 gap-3 md:grid-cols-2"
              data-testid="dashboard-operation-grid"
            >
              <div
                v-for="card in operationCards"
                :key="`operation-${card.indicatorCode}`"
                class="min-h-28 rounded border border-border bg-card/80 p-3 lg:min-h-32 lg:p-4"
              >
                <div class="text-sm leading-5 text-muted-foreground">
                  {{
                    localizeIndicatorName(
                      card.indicatorCode,
                      card.indicatorName,
                    )
                  }}
                </div>
                <div
                  class="mt-2 text-xl font-semibold leading-none lg:text-2xl"
                >
                  {{ formatMetric(card) }}
                </div>
              </div>
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title="工作量指标">
            <div
              class="grid grid-cols-1 gap-3 md:grid-cols-2"
              data-testid="dashboard-workload-grid"
            >
              <div
                v-for="card in workloadCards"
                :key="`workload-${card.indicatorCode}`"
                class="min-h-28 rounded border border-border bg-card/80 p-3 lg:min-h-32 lg:p-4"
              >
                <div class="text-sm leading-5 text-muted-foreground">
                  {{
                    localizeIndicatorName(
                      card.indicatorCode,
                      card.indicatorName,
                    )
                  }}
                </div>
                <div
                  class="mt-2 text-xl font-semibold leading-none lg:text-2xl"
                >
                  {{ formatMetric(card) }}
                </div>
              </div>
            </div>
          </DashboardSectionCard>
        </div>
      </template>

      <DashboardSectionCard v-else title="统计仪表盘">
        <ElEmpty description="暂无统计仪表盘数据" />
      </DashboardSectionCard>
    </div>
  </Page>
</template>
