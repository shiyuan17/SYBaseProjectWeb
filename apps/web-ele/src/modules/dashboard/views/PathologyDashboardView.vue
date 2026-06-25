<script setup lang="ts">
import type {
  PathologyScreenDashboardResponse,
  PathologyScreenMetricCard,
  PathologyScreenMetricItem,
  PathologyScreenStatus,
  PathologyScreenThreeYearRow,
  PathologyScreenWorkloadRow,
} from '../types/pathology-screen';

import { computed, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';

import { Fallback } from '@vben/common-ui';

import { BRAND_LOGO_SOURCE, BRAND_NAME } from '#/preferences-branding';

import { queryPathologyScreenDashboard } from '../api/pathology-screen-service';
import { useDashboardFullContent } from '../composables/useDashboardFullContent';

const { restoreLayout } = useDashboardFullContent();

const router = useRouter();
const workspaceRouteLocation = { name: 'Workspace' } as const;

const loading = ref(true);
const forbidden = ref(false);
const loadError = ref('');
const dashboard = ref<null | PathologyScreenDashboardResponse>(null);

onBeforeRouteLeave(() => {
  restoreLayout();
});

onMounted(async () => {
  try {
    dashboard.value = await queryPathologyScreenDashboard();
  } catch (error: any) {
    if (error?.response?.status === 403) {
      forbidden.value = true;
    } else {
      loadError.value = error?.message ?? '病理大屏数据加载失败';
    }
  } finally {
    loading.value = false;
  }
});

const summaryTitleParts = computed(() => {
  const parts = BRAND_NAME.split('病理');
  if (parts.length < 2) {
    return {
      prefix: BRAND_NAME,
      suffix: '数据驾驶舱',
    };
  }
  return {
    prefix: `${parts[0]}病理`,
    suffix: `${parts.slice(1).join('病理')}数据驾驶舱`,
  };
});

const summaryCards = computed<PathologyScreenMetricCard[]>(() => {
  if (!dashboard.value) {
    return [];
  }
  return [
    dashboard.value.summaryCards.annualCaseTotal,
    dashboard.value.summaryCards.lastMonthCaseTotal,
    dashboard.value.summaryCards.lastMonthReportTimelinessRate,
  ];
});

const stageNodes = computed(() => {
  const values = dashboard.value?.lastMonthWorkload.items ?? [];
  const positions = [
    { x: 212, y: 212 },
    { x: 430, y: 142 },
    { x: 620, y: 142 },
    { x: 798, y: 212 },
  ];
  return values.map((item, index) => ({
    ...item,
    x: positions[index]?.x ?? 500,
    y: positions[index]?.y ?? 212,
  }));
});

const partialNotes = computed(() => {
  if (!dashboard.value) {
    return [];
  }
  const notes = new Map<string, string>();
  const collectMetric = (
    metric: PathologyScreenMetricCard | PathologyScreenMetricItem,
  ) => {
    if (metric.status === 'PARTIAL' || metric.status === 'UNAVAILABLE') {
      notes.set(
        metric.label,
        metric.sourceNote ?? `${metric.label} 当前仅提供部分数据。`,
      );
    }
  };
  const collectSection = <
    T extends {
      items: any[];
      sourceNote: null | string;
      status: PathologyScreenStatus;
    },
  >(
    title: string,
    section: T,
  ) => {
    if (section.status === 'PARTIAL' || section.status === 'UNAVAILABLE') {
      notes.set(title, section.sourceNote ?? `${title} 当前仅提供部分数据。`);
    }
    for (const item of section.items) {
      if (item && typeof item === 'object' && 'status' in item) {
        collectMetric(item as PathologyScreenMetricItem);
      }
      if (
        item &&
        typeof item === 'object' &&
        'metrics' in item &&
        Array.isArray(item.metrics)
      ) {
        for (const metric of item.metrics) {
          collectMetric(metric);
        }
      }
    }
  };

  collectMetric(dashboard.value.summaryCards.lastMonthReportTimelinessRate);
  collectSection('签发报告修改率', dashboard.value.reportRevisionRateTrend);
  collectSection(
    '技术组指标合格率',
    dashboard.value.technicalQualificationRates,
  );
  collectSection('诊断工作量统计', dashboard.value.diagnosisWorkloadRows);
  collectSection(
    '近三年各技术指标合格率',
    dashboard.value.threeYearTechnicalRates,
  );
  collectSection('上月工作量', dashboard.value.lastMonthWorkload);
  collectSection(
    '近三年报告及时/诊断符合率',
    dashboard.value.threeYearReportQualityRates,
  );
  collectSection('报告及时诊断符合率', dashboard.value.overallComplianceRates);
  if (
    dashboard.value.structuredReportSummary.status === 'PARTIAL' ||
    dashboard.value.structuredReportSummary.status === 'UNAVAILABLE'
  ) {
    notes.set(
      '结构化报告展示',
      dashboard.value.structuredReportSummary.sourceNote ??
        '结构化报告统计当前仅提供部分数据。',
    );
  }
  return [...notes.entries()].map(([label, note]) => `${label}：${note}`);
});

const hasPartialBanner = computed(() => partialNotes.value.length > 0);

const topTemplates = computed(
  () => dashboard.value?.structuredReportSummary.topTemplates ?? [],
);
const technicalRates = computed(
  () => dashboard.value?.technicalQualificationRates.items ?? [],
);
const revisionTrend = computed(
  () => dashboard.value?.reportRevisionRateTrend.items ?? [],
);
const workloadRows = computed<PathologyScreenWorkloadRow[]>(
  () => dashboard.value?.diagnosisWorkloadRows.items ?? [],
);
const overallRates = computed(
  () => dashboard.value?.overallComplianceRates.items ?? [],
);
const threeYearTechnical = computed<PathologyScreenThreeYearRow[]>(
  () => dashboard.value?.threeYearTechnicalRates.items ?? [],
);
const threeYearQuality = computed<PathologyScreenThreeYearRow[]>(
  () => dashboard.value?.threeYearReportQualityRates.items ?? [],
);

function ratioClass(value: string) {
  if (value.startsWith('-')) {
    return 'text-[#91a9cc]';
  }
  if (value.startsWith('-') || value.startsWith('↓')) {
    return 'text-[#ff6f84]';
  }
  return 'text-[#63f3c2]';
}

function stageNodeStyle(node: { x: number; y: number }) {
  const centeredX = 500 + (node.x - 500) * 0.82;
  const centeredY = 26 + node.y * 0.86;

  return {
    left: `${(centeredX / 1000) * 100}%`,
    top: `${(centeredY / 350) * 100}%`,
  };
}

function statusClass(status: PathologyScreenStatus) {
  if (status === 'PARTIAL') {
    return 'screen-status screen-status--partial';
  }
  if (status === 'UNAVAILABLE') {
    return 'screen-status screen-status--unavailable';
  }
  return 'screen-status';
}

function displayMetricValue(value: string) {
  return value?.trim() ? value : '--';
}

function returnToWorkspace() {
  restoreLayout();
  void router.push(workspaceRouteLocation);
}
</script>

<template>
  <div v-if="loading" class="pathology-loading" data-testid="pathology-loading">
    <div class="pathology-loading__card">
      <h2>病理大屏数据加载中</h2>
      <p>正在汇总病例、报告、技术质控与工作量指标。</p>
    </div>
  </div>

  <div v-else-if="forbidden" class="pathology-fallback">
    <Fallback status="403" />
  </div>

  <div
    v-else-if="loadError"
    class="pathology-fallback pathology-fallback--error"
  >
    <div class="pathology-loading__card">
      <h2>病理大屏加载失败</h2>
      <p>{{ loadError }}</p>
    </div>
  </div>

  <div v-else-if="dashboard" class="pathology-screen">
    <div class="pathology-screen__grid"></div>
    <div class="pathology-screen__glow pathology-screen__glow--left"></div>
    <div class="pathology-screen__glow pathology-screen__glow--right"></div>

    <main class="pathology-screen__canvas">
      <header
        class="pathology-screen__header"
        data-testid="pathology-screen-header"
      >
        <div class="pathology-screen__brand">
          <div class="pathology-screen__brand-mark">
            <img :src="BRAND_LOGO_SOURCE" :alt="BRAND_NAME" />
          </div>
          <div class="pathology-screen__brand-copy">
            <p class="pathology-screen__brand-name">{{ BRAND_NAME }}</p>
          </div>
        </div>

        <div class="pathology-screen__title-panel">
          <div class="pathology-screen__title-plate">
            <div class="pathology-screen__title-line"></div>
            <h1 class="pathology-screen__title">
              <span>{{ summaryTitleParts.prefix }}</span>
              <span class="pathology-screen__title-accent">
                {{ summaryTitleParts.suffix }}
              </span>
            </h1>
            <div class="pathology-screen__title-line"></div>
          </div>
        </div>

        <div class="pathology-screen__header-note">
          <button
            aria-label="返回主控制界面"
            class="pathology-screen__header-link"
            type="button"
            @click="returnToWorkspace"
          >
            退出
          </button>
        </div>
      </header>

      <section
        v-if="hasPartialBanner"
        class="pathology-warning"
        data-testid="pathology-partial-banner"
      >
        <strong>部分指标暂未完全就绪</strong>
        <p>{{ partialNotes.join('；') }}</p>
      </section>

      <section class="pathology-screen__content">
        <div class="pathology-screen__column pathology-screen__column--left">
          <section class="screen-panel screen-panel--chart">
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>签发报告修改率</h2>
            </div>
            <div class="line-list" data-testid="pathology-top-left-chart">
              <div
                v-for="item in revisionTrend"
                :key="item.label"
                class="line-list__item"
              >
                <div class="line-list__meta">
                  <span>{{ item.label }}</span>
                  <span :class="statusClass(item.status)">
                    {{ displayMetricValue(item.value) }}
                  </span>
                </div>
                <div class="line-list__track">
                  <div class="line-list__fill"></div>
                </div>
              </div>
            </div>
          </section>

          <section class="screen-panel">
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>技术组指标合格率</h2>
            </div>
            <div class="rate-list">
              <div
                v-for="item in technicalRates"
                :key="item.label"
                class="rate-list__item"
              >
                <div class="rate-list__row">
                  <span class="rate-list__dot"></span>
                  <span class="rate-list__label">{{ item.label }}</span>
                  <span :class="statusClass(item.status)">
                    {{ displayMetricValue(item.value) }}
                  </span>
                </div>
                <div class="rate-list__line">
                  <div class="rate-list__fill"></div>
                </div>
              </div>
            </div>
          </section>

          <section class="screen-panel screen-panel--bottom">
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>近三年各技术指标合格率</h2>
            </div>
            <div class="year-grid">
              <article
                v-for="row in threeYearTechnical"
                :key="row.year"
                class="year-grid__item"
              >
                <h3>{{ row.year }}</h3>
                <div class="year-grid__metrics">
                  <div
                    v-for="metric in row.metrics"
                    :key="metric.label"
                    class="year-grid__metric"
                  >
                    <span>{{ metric.label }}</span>
                    <strong :class="statusClass(metric.status)">
                      {{ displayMetricValue(metric.value) }}
                    </strong>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="pathology-screen__column pathology-screen__column--center">
          <section class="metric-stack" data-testid="pathology-metric-cards">
            <article
              v-for="metric in summaryCards"
              :key="metric.label"
              class="metric-stack__card"
            >
              <div class="metric-stack__label">{{ metric.label }}</div>
              <div
                class="metric-stack__value"
                :class="[statusClass(metric.status)]"
              >
                {{ displayMetricValue(metric.value) }}
              </div>
            </article>
          </section>

          <section class="center-stage" data-testid="pathology-center-stage">
            <div
              v-for="node in stageNodes"
              :key="node.label"
              class="center-stage__node"
              :style="stageNodeStyle(node)"
            >
              <div
                class="center-stage__bubble"
                :class="[statusClass(node.status)]"
              >
                {{ displayMetricValue(node.value) }}
              </div>
              <div class="center-stage__node-label">{{ node.label }}</div>
            </div>

            <div class="center-stage__orbit center-stage__orbit--one"></div>
            <div class="center-stage__orbit center-stage__orbit--two"></div>
            <div class="center-stage__ring"></div>
            <div class="center-stage__core">
              <div class="center-stage__core-mark">+</div>
            </div>

            <div class="center-stage__base">
              <div class="center-stage__plate center-stage__plate--top"></div>
              <div
                class="center-stage__plate center-stage__plate--middle"
              ></div>
              <div
                class="center-stage__plate center-stage__plate--bottom"
              ></div>
              <div class="center-stage__caption">上月工作量</div>
            </div>
          </section>

          <section
            class="screen-panel screen-panel--report"
            data-testid="pathology-report-panel"
          >
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>结构化报告展示</h2>
            </div>
            <div class="report-summary">
              <div class="report-summary__meta">
                <span>{{
                  dashboard.structuredReportSummary.templateTypeCount.label
                }}</span>
                <strong
                  :class="
                    statusClass(
                      dashboard.structuredReportSummary.templateTypeCount
                        .status,
                    )
                  "
                >
                  {{
                    displayMetricValue(
                      dashboard.structuredReportSummary.templateTypeCount.value,
                    )
                  }}
                </strong>
              </div>
              <div class="report-summary__meta">
                <span>{{
                  dashboard.structuredReportSummary.reportCount.label
                }}</span>
                <strong
                  :class="
                    statusClass(
                      dashboard.structuredReportSummary.reportCount.status,
                    )
                  "
                >
                  {{
                    displayMetricValue(
                      dashboard.structuredReportSummary.reportCount.value,
                    )
                  }}
                </strong>
              </div>
            </div>
            <div class="report-summary__button">结构化报告实例</div>
            <div class="report-grid report-grid--dense">
              <div
                v-for="item in topTemplates"
                :key="item.label"
                class="report-grid__cell"
              >
                <span class="report-grid__label">{{ item.label }}</span>
                <strong
                  class="report-grid__value"
                  :class="[statusClass(item.status)]"
                >
                  {{ displayMetricValue(item.value) }}
                </strong>
              </div>
            </div>
          </section>

          <section class="screen-panel screen-panel--trend">
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>近三年报告及时/诊断符合率</h2>
            </div>
            <div class="year-grid year-grid--wide">
              <article
                v-for="row in threeYearQuality"
                :key="row.year"
                class="year-grid__item"
              >
                <h3>{{ row.year }}</h3>
                <div class="year-grid__metrics">
                  <div
                    v-for="metric in row.metrics"
                    :key="metric.label"
                    class="year-grid__metric"
                  >
                    <span>{{ metric.label }}</span>
                    <strong :class="statusClass(metric.status)">
                      {{ displayMetricValue(metric.value) }}
                    </strong>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div class="pathology-screen__column pathology-screen__column--right">
          <section class="screen-panel screen-panel--table">
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>诊断工作量统计</h2>
            </div>
            <div class="workload-table" data-testid="pathology-right-table">
              <div class="workload-table__head">
                <span>统计科目</span>
                <span>1月总数</span>
                <span>2月总数</span>
                <span>环比率</span>
              </div>
              <div class="workload-table__body">
                <div
                  v-for="row in workloadRows"
                  :key="row.label"
                  class="workload-table__row"
                >
                  <span>{{ row.label }}</span>
                  <span>{{ displayMetricValue(row.januaryCount) }}</span>
                  <span>{{ displayMetricValue(row.februaryCount) }}</span>
                  <span :class="ratioClass(row.momRate)">
                    {{ row.momRate || '--' }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            class="screen-panel screen-panel--bottom"
            data-testid="pathology-right-rate-panel"
          >
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>报告及时诊断符合率</h2>
            </div>
            <div class="rate-list">
              <div
                v-for="item in overallRates"
                :key="item.label"
                class="rate-list__item"
              >
                <div class="rate-list__row">
                  <span class="rate-list__dot"></span>
                  <span class="rate-list__label">{{ item.label }}</span>
                  <span :class="statusClass(item.status)">
                    {{ displayMetricValue(item.value) }}
                  </span>
                </div>
                <div class="rate-list__line">
                  <div class="rate-list__fill rate-list__fill--right"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.pathology-loading,
.pathology-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  color: #eaf6ff;
  background:
    radial-gradient(
      circle at top center,
      rgb(48 122 255 / 20%),
      transparent 28%
    ),
    linear-gradient(180deg, #031226 0%, #041321 46%, #03111e 100%);
}

.pathology-loading__card {
  max-width: 560px;
  padding: 32px;
  text-align: center;
  background: linear-gradient(180deg, rgb(7 28 49 / 92%), rgb(4 18 34 / 88%));
  border: 1px solid rgb(80 142 196 / 16%);
  box-shadow:
    inset 0 0 24px rgb(65 127 186 / 12%),
    0 0 18px rgb(5 35 66 / 22%);
}

.pathology-loading__card h2 {
  font-size: 24px;
  font-weight: 700;
  color: #f7fcff;
}

.pathology-loading__card p {
  margin-top: 12px;
  font-size: 14px;
  color: #8ec7ea;
}

.pathology-screen {
  position: relative;
  min-height: 100vh;
  overflow: hidden auto;
  color: #eaf6ff;
  background:
    radial-gradient(
      circle at top center,
      rgb(48 122 255 / 20%),
      transparent 28%
    ),
    linear-gradient(180deg, #031226 0%, #041321 46%, #03111e 100%);
}

.pathology-screen__grid,
.pathology-screen__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pathology-screen__grid {
  background-image:
    linear-gradient(rgb(38 103 179 / 8%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(38 103 179 / 8%) 1px, transparent 1px);
  background-position: center;
  background-size: 42px 42px;
  opacity: 0.9;
}

.pathology-screen__glow--left {
  background: radial-gradient(
    circle at 14% 24%,
    rgb(24 155 255 / 20%),
    transparent 28%
  );
}

.pathology-screen__glow--right {
  background: radial-gradient(
    circle at 87% 30%,
    rgb(24 255 233 / 15%),
    transparent 26%
  );
}

.pathology-screen__canvas {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  padding: 14px 18px 18px;
  overflow: hidden visible;
}

.pathology-screen__header {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr) minmax(0, 180px);
  gap: 14px;
  align-items: center;
  min-height: 76px;
}

.pathology-screen__brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pathology-screen__brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(180deg, rgb(7 34 61 / 88%), rgb(4 23 44 / 90%));
  border: 1px solid rgb(109 190 255 / 32%);
  box-shadow: inset 0 0 20px rgb(86 180 255 / 16%);
}

.pathology-screen__brand-mark img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.pathology-screen__brand-name {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
}

.pathology-screen__title-panel {
  display: flex;
  justify-content: center;
}

.pathology-screen__title-plate {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  min-width: 520px;
  padding: 6px 34px 10px;
  background:
    linear-gradient(180deg, rgb(14 37 65 / 96%), rgb(7 28 50 / 88%)),
    linear-gradient(90deg, rgb(50 120 255 / 24%), transparent);
  border: 1px solid rgb(132 194 255 / 28%);
  box-shadow:
    inset 0 0 32px rgb(64 158 255 / 18%),
    0 0 32px rgb(11 92 175 / 14%);
  clip-path: polygon(6% 0, 94% 0, 100% 22%, 94% 100%, 6% 100%, 0 22%);
}

.pathology-screen__title-line {
  width: 82%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(112 213 255 / 90%),
    transparent
  );
}

.pathology-screen__title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  color: #f8fdff;
  letter-spacing: 0.06em;
}

.pathology-screen__title-accent {
  color: #b6efff;
  text-shadow: 0 0 16px rgb(89 212 255 / 40%);
}

.pathology-screen__header-note {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 14px;
  color: #8ec7ea;
}

.pathology-screen__header-link {
  padding: 0;
  font: inherit;
  color: #74dcff;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.pathology-screen__header-link:hover,
.pathology-screen__header-link:focus-visible {
  color: #b7f2ff;
  text-shadow: 0 0 10px rgb(116 220 255 / 45%);
  outline: none;
}

.pathology-warning {
  padding: 12px 16px;
  margin-top: 14px;
  color: #ffeab3;
  background: linear-gradient(90deg, rgb(123 77 10 / 78%), rgb(90 58 13 / 30%));
  border: 1px solid rgb(255 194 84 / 36%);
}

.pathology-warning strong {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.pathology-warning p {
  font-size: 12px;
  line-height: 1.6;
}

.pathology-screen__content {
  display: grid;
  grid-template-columns: minmax(340px, 26%) minmax(720px, 48%) minmax(
      340px,
      26%
    );
  gap: 14px;
  align-items: start;
  min-height: calc(100vh - 108px);
  margin-top: 14px;
  overflow: visible;
}

.pathology-screen__column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.screen-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  background: linear-gradient(180deg, rgb(7 28 49 / 92%), rgb(4 18 34 / 88%));
  border: 1px solid rgb(80 142 196 / 16%);
  box-shadow:
    inset 0 0 24px rgb(65 127 186 / 12%),
    0 0 18px rgb(5 35 66 / 22%);
}

.screen-panel__header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 14px;
  margin-bottom: 10px;
  background: linear-gradient(90deg, rgb(54 93 141 / 80%), rgb(20 50 85 / 20%));
  clip-path: polygon(0 0, 98% 0, 93% 100%, 0 100%, 3% 50%);
}

.screen-panel__header h2 {
  font-size: 16px;
  font-weight: 700;
  color: #f7fcff;
  letter-spacing: 0.04em;
}

.screen-panel__spark {
  width: 10px;
  height: 10px;
  background: rgb(173 233 255 / 24%);
  border: 1px solid rgb(214 248 255 / 70%);
  box-shadow: 0 0 10px rgb(115 220 255 / 45%);
  transform: rotate(45deg);
}

.metric-stack {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-stack__card {
  padding: 18px 16px;
  text-align: center;
  background: linear-gradient(180deg, rgb(7 34 61 / 88%), rgb(4 23 44 / 90%));
  border: 1px solid rgb(109 190 255 / 24%);
}

.metric-stack__label {
  font-size: 14px;
  color: #8ec7ea;
}

.metric-stack__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 700;
  color: #f7fcff;
}

.center-stage {
  position: relative;
  min-height: 420px;
  overflow: hidden;
}

.center-stage__node {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  transform: translate(-50%, -50%);
}

.center-stage__bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  min-height: 108px;
  padding: 12px;
  font-size: 26px;
  font-weight: 700;
  color: #f7fcff;
  background: radial-gradient(
    circle at 30% 30%,
    rgb(63 157 255 / 35%),
    rgb(4 25 45 / 95%)
  );
  border: 1px solid rgb(109 190 255 / 24%);
  border-radius: 999px;
  box-shadow: 0 0 24px rgb(18 93 164 / 30%);
}

.center-stage__node-label {
  font-size: 14px;
  color: #8ec7ea;
}

.center-stage__orbit,
.center-stage__ring {
  position: absolute;
  inset: 50% auto auto 50%;
  border: 1px solid rgb(109 190 255 / 18%);
  border-radius: 999px;
  transform: translate(-50%, -50%);
}

.center-stage__orbit--one {
  width: 420px;
  height: 220px;
}

.center-stage__orbit--two {
  width: 560px;
  height: 280px;
}

.center-stage__ring {
  width: 180px;
  height: 180px;
}

.center-stage__core {
  position: absolute;
  inset: 50% auto auto 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: radial-gradient(
    circle,
    rgb(76 175 255 / 36%),
    rgb(3 18 34 / 96%)
  );
  border-radius: 999px;
  transform: translate(-50%, -50%);
}

.center-stage__core-mark {
  font-size: 40px;
  font-weight: 700;
  color: #c4f6ff;
}

.center-stage__base {
  position: absolute;
  inset: auto 50% 14px auto;
  width: 320px;
  transform: translateX(50%);
}

.center-stage__plate {
  height: 12px;
  margin-top: 6px;
  background: linear-gradient(
    90deg,
    rgb(44 94 156 / 18%),
    rgb(60 163 255 / 42%),
    rgb(44 94 156 / 18%)
  );
  clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%);
}

.center-stage__caption {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 700;
  color: #f7fcff;
  text-align: center;
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.report-summary__meta {
  padding: 14px;
  background: linear-gradient(180deg, rgb(7 34 61 / 72%), rgb(4 23 44 / 78%));
  border: 1px solid rgb(109 190 255 / 20%);
}

.report-summary__meta span {
  display: block;
  font-size: 13px;
  color: #8ec7ea;
}

.report-summary__meta strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: #f7fcff;
}

.report-summary__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  padding: 8px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #b7f2ff;
  border: 1px solid rgb(109 190 255 / 24%);
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.report-grid__cell {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgb(8 29 50 / 46%);
  border: 1px solid rgb(109 190 255 / 12%);
}

.report-grid__label {
  font-size: 13px;
  color: #9fc3eb;
}

.report-grid__value {
  font-size: 15px;
  font-weight: 700;
  color: #f7fcff;
}

.line-list {
  display: grid;
  gap: 10px;
}

.line-list__item {
  padding: 10px 12px;
  background: rgb(8 29 50 / 46%);
  border: 1px solid rgb(109 190 255 / 12%);
}

.line-list__meta,
.rate-list__row,
.workload-table__row,
.workload-table__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.line-list__track,
.rate-list__line {
  height: 8px;
  margin-top: 10px;
  background: rgb(101 164 220 / 10%);
}

.line-list__fill,
.rate-list__fill {
  width: 78%;
  height: 100%;
  background: linear-gradient(90deg, #2f8bff, #63f3c2);
}

.rate-list {
  display: grid;
  gap: 10px;
}

.rate-list__item {
  padding: 10px 12px;
  background: rgb(8 29 50 / 46%);
  border: 1px solid rgb(109 190 255 / 12%);
}

.rate-list__dot {
  width: 8px;
  height: 8px;
  background: #63f3c2;
  border-radius: 999px;
}

.rate-list__row {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.rate-list__label {
  font-size: 13px;
  color: #9fc3eb;
}

.year-grid {
  display: grid;
  gap: 10px;
}

.year-grid--wide {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.year-grid__item {
  padding: 12px;
  background: rgb(8 29 50 / 46%);
  border: 1px solid rgb(109 190 255 / 12%);
}

.year-grid__item h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #f7fcff;
}

.year-grid__metrics {
  display: grid;
  gap: 8px;
}

.year-grid__metric {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  font-size: 13px;
  color: #9fc3eb;
}

.year-grid__metric strong {
  color: #f7fcff;
}

.workload-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.workload-table__head {
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  padding: 10px 12px;
  font-size: 13px;
  color: #8ec7ea;
  background: rgb(8 29 50 / 46%);
}

.workload-table__body {
  display: grid;
  gap: 8px;
}

.workload-table__row {
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  padding: 10px 12px;
  font-size: 13px;
  color: #f7fcff;
  background: rgb(8 29 50 / 46%);
  border: 1px solid rgb(109 190 255 / 12%);
}

.screen-status {
  color: #f7fcff;
}

.screen-status--partial {
  color: #ffd36e;
}

.screen-status--unavailable {
  color: #91a9cc;
}

@media (max-width: 1440px) {
  .pathology-screen__content {
    grid-template-columns: 1fr;
  }

  .metric-stack {
    grid-template-columns: 1fr;
  }

  .report-summary,
  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>
