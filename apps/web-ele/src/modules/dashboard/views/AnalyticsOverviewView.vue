<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { usePreferences } from '@vben/preferences';

import { ElButton, ElEmpty, ElSkeleton } from 'element-plus';

import DashboardChartPanel from '../components/DashboardChartPanel.vue';
import DashboardHeroMetricCard from '../components/DashboardHeroMetricCard.vue';
import DashboardOperationSignalList from '../components/DashboardOperationSignalList.vue';
import DashboardRiskDistributionGrid from '../components/DashboardRiskDistributionGrid.vue';
import DashboardSectionCard from '../components/DashboardSectionCard.vue';
import { useAnalyticsOverviewDashboard } from '../composables/useAnalyticsOverviewDashboard';
import {
  buildQualityChartOption,
  buildRiskDistributionChartOption,
  buildWorkloadChartOption,
} from '../utils/dashboard-chart-options';
import { getDashboardChartTheme } from '../utils/dashboard-theme';

const router = useRouter();
const { isDark } = usePreferences();
const {
  currentMonthLabel,
  dateRangeLabel,
  hasContent,
  loading,
  loadPage,
  pageError,
  visualSummary,
} = useAnalyticsOverviewDashboard();

const chartTheme = computed(() => getDashboardChartTheme(isDark.value));

const qualityChartOption = computed(() =>
  buildQualityChartOption(
    visualSummary.value.qualityChartData,
    chartTheme.value,
  ),
);

const workloadChartOption = computed(() =>
  buildWorkloadChartOption(
    visualSummary.value.workloadChartData,
    chartTheme.value,
  ),
);

const riskChartOption = computed(() =>
  buildRiskDistributionChartOption(
    visualSummary.value.riskDistribution,
    chartTheme.value,
  ),
);

async function navigateTo(route?: string, query?: Record<string, string>) {
  if (!route) {
    return;
  }
  await router.push({
    path: route,
    query,
  });
}
</script>

<template>
  <Page
    title="分析页"
    description="汇总病理全流程的核心指标、运营信号与风险数据。"
  >
    <div class="flex flex-col gap-6">
      <section
        class="dashboard-hero relative overflow-hidden rounded-[32px] border border-border bg-card px-6 py-6 text-foreground shadow-sm"
      >
        <div
          class="dashboard-hero__backdrop pointer-events-none absolute inset-0"
        ></div>
        <div class="relative flex flex-col gap-6">
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          >
            <div class="max-w-3xl">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
              >
                <span>{{ currentMonthLabel }}</span>
                <span class="text-[var(--el-border-color)]">•</span>
                <span>{{ dateRangeLabel }}</span>
              </div>
              <h2
                class="mt-4 text-3xl font-semibold tracking-tight text-foreground"
              >
                分析页总览驾驶舱
              </h2>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                展示核心 KPI、质控指标、工作量结构和风险分布。
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <ElButton
                class="!border-border !bg-background/85 !text-foreground hover:!border-primary/40 hover:!bg-primary/5"
                plain
                @click="navigateTo('/m6/statistics')"
              >
                进入正式统计分析
              </ElButton>
              <ElButton v-if="pageError" type="danger" @click="loadPage">
                重新加载
              </ElButton>
            </div>
          </div>

          <div
            v-if="pageError"
            class="rounded-3xl border border-danger/30 bg-danger/8 px-5 py-4 text-sm text-danger"
          >
            {{ pageError }}
          </div>

          <ElSkeleton v-else-if="loading" :rows="8" animated />

          <div
            v-else-if="visualSummary.heroMetrics.length > 0"
            class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <DashboardHeroMetricCard
              v-for="metric in visualSummary.heroMetrics"
              :key="metric.id"
              :eyebrow="currentMonthLabel"
              :metric="metric"
              action-label="查看来源"
              @open="navigateTo(metric.route, metric.query)"
            />
          </div>

          <ElEmpty v-else description="暂无核心指标数据" />
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <DashboardSectionCard
          title="质控达成"
          description="展示百分比类质控指标。"
          card-class="dashboard-surface border-0"
          body-class="px-5 pb-5 pt-2"
        >
          <DashboardChartPanel
            :error="pageError"
            :loading="loading"
            :option="qualityChartOption"
            empty-description="暂无质控百分比指标"
            height="280px"
            @retry="loadPage"
          />
        </DashboardSectionCard>

        <DashboardSectionCard
          title="工作量结构"
          description="展示当前工作量分布。"
          card-class="dashboard-surface border-0"
          body-class="px-5 pb-5 pt-2"
        >
          <DashboardChartPanel
            :error="pageError"
            :loading="loading"
            :option="workloadChartOption"
            empty-description="暂无工作量结构数据"
            height="280px"
            @retry="loadPage"
          />
        </DashboardSectionCard>

        <DashboardSectionCard
          title="运营信号"
          description="展示当前病例、收费和预警信号。"
          card-class="dashboard-surface border-0"
          body-class="px-5 pb-5 pt-2"
        >
          <DashboardOperationSignalList
            :loading="loading"
            :signals="visualSummary.operationSignals"
          />
        </DashboardSectionCard>

        <DashboardSectionCard
          title="风险分布"
          description="按风险来源汇总技术、运营与通知压力。"
          card-class="dashboard-surface border-0"
          body-class="px-5 pb-5 pt-2"
        >
          <DashboardChartPanel
            :error="pageError"
            :loading="loading"
            :option="riskChartOption"
            empty-description="暂无风险分布数据"
            height="280px"
            @retry="loadPage"
          />
        </DashboardSectionCard>
      </section>

      <DashboardSectionCard
        title="风险联动处理"
        description="展示风险分布中的重点项。"
        card-class="dashboard-surface border-0"
        body-class="px-5 pb-5 pt-2"
      >
        <DashboardRiskDistributionGrid
          :has-error="Boolean(pageError)"
          :items="visualSummary.riskDistribution"
          :loading="loading"
          @open="navigateTo($event.route, $event.query)"
        />
      </DashboardSectionCard>

      <div
        v-if="!loading && !hasContent && !pageError"
        class="rounded-[24px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
      >
        当前账号暂无可展示的分析数据
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.dashboard-surface.el-card) {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-bg-color) 96%, transparent),
      color-mix(in srgb, var(--el-fill-color-light) 55%, transparent)
    ),
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 28%
    );
  border: 1px solid var(--el-border-color);
  box-shadow: 0 18px 36px -28px
    color-mix(in srgb, var(--el-text-color-primary) 22%, transparent);
}

:deep(.dashboard-surface .el-card__header) {
  padding: 18px 20px 14px;
  border-bottom: 1px solid
    color-mix(in srgb, var(--el-border-color) 88%, transparent);
}

.dashboard-hero__backdrop {
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 16%, transparent),
      transparent 34%
    ),
    radial-gradient(
      circle at top right,
      color-mix(in srgb, var(--el-color-success) 14%, transparent),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-bg-color) 92%, transparent),
      color-mix(in srgb, var(--el-fill-color-light) 78%, transparent)
    );
}
</style>
