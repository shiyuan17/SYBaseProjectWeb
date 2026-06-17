<script setup lang="ts">
import { computed } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';

import { BRAND_LOGO_SOURCE, BRAND_NAME } from '#/preferences-branding';

import { pathologyScreenStaticSummary } from '../api/pathology-screen-static';
import { useDashboardFullContent } from '../composables/useDashboardFullContent';

const { restoreLayout } = useDashboardFullContent();

const screenData = pathologyScreenStaticSummary;
const router = useRouter();
const workspaceRouteLocation = { name: 'Workspace' } as const;

onBeforeRouteLeave(() => {
  restoreLayout();
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

function ratioClass(ratioTone: 'down' | 'neutral' | 'up') {
  if (ratioTone === 'up') {
    return 'text-[#63f3c2]';
  }
  if (ratioTone === 'down') {
    return 'text-[#ff6f84]';
  }
  return 'text-[#91a9cc]';
}

function gaugeStyle(value: number) {
  return {
    background: `conic-gradient(#6bf3ff 0deg ${Math.max(
      12,
      Math.min(360, value * 3.6),
    )}deg, rgba(107, 243, 255, 0.12) ${Math.max(
      12,
      Math.min(360, value * 3.6),
    )}deg 360deg)`,
  };
}

function stageNodeStyle(node: { x: number; y: number }) {
  const centeredX = 500 + (node.x - 500) * 0.82;
  const centeredY = 26 + node.y * 0.86;

  return {
    left: `${(centeredX / 1000) * 100}%`,
    top: `${(centeredY / 350) * 100}%`,
  };
}

function returnToWorkspace() {
  restoreLayout();
  void router.push(workspaceRouteLocation);
}
</script>

<template>
  <div class="pathology-screen">
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

      <section class="pathology-screen__content">
        <div class="pathology-screen__column pathology-screen__column--left">
          <section class="screen-panel screen-panel--chart">
            <div class="screen-panel__header">
              <span class="screen-panel__spark"></span>
              <h2>签发报告修改率</h2>
            </div>
            <div class="chart-legend">
              <span
                v-for="legend in screenData.topLeftLegend"
                :key="legend"
                class="chart-legend__item"
              >
                <span class="chart-legend__swatch"></span>
                {{ legend }}
              </span>
            </div>
            <div class="bar-card-grid" data-testid="pathology-top-left-chart">
              <div
                v-for="bar in screenData.topLeftBars"
                :key="bar.label"
                class="bar-card-grid__item"
              >
                <div class="bar-card-grid__bars">
                  <div class="bar-card-grid__track">
                    <div
                      class="bar-card-grid__bar bar-card-grid__bar--blue"
                    ></div>
                    <span>{{ bar.darkValue }}</span>
                  </div>
                  <div class="bar-card-grid__track">
                    <div
                      class="bar-card-grid__bar bar-card-grid__bar--teal"
                    ></div>
                    <span>{{ bar.lightValue }}</span>
                  </div>
                  <div class="bar-card-grid__track">
                    <div
                      class="bar-card-grid__bar bar-card-grid__bar--soft"
                    ></div>
                    <span>{{ bar.tealValue }}</span>
                  </div>
                </div>
                <p class="bar-card-grid__label">{{ bar.label }}</p>
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
                v-for="item in screenData.topLeftRateItems"
                :key="item.label"
                class="rate-list__item"
              >
                <div class="rate-list__row">
                  <span class="rate-list__dot"></span>
                  <span class="rate-list__label">{{ item.label }}</span>
                  <span class="rate-list__value">{{ item.value }}</span>
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
            <div class="chart-legend">
              <span class="chart-legend__item"><span class="chart-legend__swatch"></span>规范化固定率</span>
              <span class="chart-legend__item"><span
                  class="chart-legend__swatch chart-legend__swatch--teal"
                ></span>HE染色切片优良率</span>
              <span class="chart-legend__item"><span
                  class="chart-legend__swatch chart-legend__swatch--soft"
                ></span>免疫组化</span>
            </div>
            <div class="bar-card-grid bar-card-grid--compact">
              <div
                v-for="bar in screenData.bottomLeftBars"
                :key="bar.label"
                class="bar-card-grid__item"
              >
                <div class="bar-card-grid__bars">
                  <div class="bar-card-grid__track">
                    <div
                      class="bar-card-grid__bar bar-card-grid__bar--blue"
                    ></div>
                    <span>{{ bar.darkValue }}</span>
                  </div>
                  <div class="bar-card-grid__track">
                    <div
                      class="bar-card-grid__bar bar-card-grid__bar--teal"
                    ></div>
                    <span>{{ bar.lightValue }}</span>
                  </div>
                  <div class="bar-card-grid__track">
                    <div
                      class="bar-card-grid__bar bar-card-grid__bar--soft"
                    ></div>
                    <span>{{ bar.tealValue }}</span>
                  </div>
                </div>
                <p class="bar-card-grid__label">{{ bar.label }}</p>
              </div>
            </div>
          </section>
        </div>

        <div class="pathology-screen__column pathology-screen__column--center">
          <section class="metric-stack" data-testid="pathology-metric-cards">
            <article
              v-for="metric in screenData.centerMetrics"
              :key="metric.label"
              class="metric-stack__card"
            >
              <div class="metric-stack__label">{{ metric.label }}</div>
              <div class="metric-stack__value">{{ metric.value }}</div>
            </article>
          </section>

          <section class="center-stage" data-testid="pathology-center-stage">
            <div
              v-for="node in screenData.centerStageNodes"
              :key="node.label"
              class="center-stage__node"
              :style="stageNodeStyle(node)"
            >
              <div class="center-stage__bubble">{{ node.value }}</div>
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
                <span>结构化报告类型</span>
                <strong>{{ screenData.reportTypesSummary.totalKinds }} 种</strong>
              </div>
              <div class="report-summary__meta">
                <span>结构化报告工作量</span>
                <strong>{{
                  screenData.reportTypesSummary.totalWorkload
                }}</strong>
              </div>
            </div>
            <div class="report-summary__button">结构化报告实例</div>
            <div class="report-grid report-grid--dense">
              <div
                v-for="item in screenData.reportTypes"
                :key="item.label"
                class="report-grid__cell"
              >
                <span class="report-grid__label">{{ item.label }}</span>
                <strong class="report-grid__value">{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <div class="pathology-screen__bottom-center">
            <section class="screen-panel screen-panel--staff">
              <div class="screen-panel__header">
                <span class="screen-panel__spark"></span>
                <h2>病理工作人员统计情况</h2>
              </div>
              <div class="staff-metrics">
                <div
                  v-for="metric in screenData.staffMetrics"
                  :key="metric.label"
                  class="staff-metrics__item"
                >
                  <span class="staff-metrics__label">{{ metric.label }}</span>
                  <strong class="staff-metrics__value">
                    {{ metric.value }}
                    <span>{{ metric.accentValue }}</span>
                  </strong>
                </div>
              </div>
              <div class="gauge-row">
                <div
                  v-for="gauge in screenData.staffGauges"
                  :key="gauge.year"
                  class="gauge-row__item"
                >
                  <div class="gauge-row__ring" :style="gaugeStyle(gauge.value)">
                    <div class="gauge-row__inner">
                      <strong>{{ gauge.value }}</strong>
                      <span>%</span>
                    </div>
                  </div>
                  <div class="gauge-row__label">{{ gauge.year }}</div>
                </div>
              </div>
            </section>

            <section class="screen-panel screen-panel--trend">
              <div class="screen-panel__header">
                <span class="screen-panel__spark"></span>
                <h2>近三年报告及时/诊断符合率</h2>
              </div>
              <div class="chart-legend chart-legend--tight">
                <span
                  v-for="legend in screenData.bottomRightLegend"
                  :key="legend"
                  class="chart-legend__item"
                >
                  <span class="chart-legend__swatch"></span>
                  {{ legend }}
                </span>
              </div>
              <div class="bar-card-grid bar-card-grid--compact">
                <div
                  v-for="bar in screenData.bottomRightBars"
                  :key="bar.label"
                  class="bar-card-grid__item"
                >
                  <div class="bar-card-grid__bars">
                    <div class="bar-card-grid__track">
                      <div
                        class="bar-card-grid__bar bar-card-grid__bar--lavender"
                      ></div>
                      <span>{{ bar.darkValue }}</span>
                    </div>
                    <div class="bar-card-grid__track">
                      <div
                        class="bar-card-grid__bar bar-card-grid__bar--violet"
                      ></div>
                      <span>{{ bar.lightValue }}</span>
                    </div>
                    <div class="bar-card-grid__track">
                      <div
                        class="bar-card-grid__bar bar-card-grid__bar--soft"
                      ></div>
                      <span>{{ bar.tealValue }}</span>
                    </div>
                  </div>
                  <p class="bar-card-grid__label">{{ bar.label }}</p>
                </div>
              </div>
            </section>
          </div>
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
                <div class="workload-table__marquee">
                  <div class="workload-table__group">
                    <div
                      v-for="row in screenData.rightTableRows"
                      :key="row.label"
                      class="workload-table__row"
                    >
                      <span>{{ row.label }}</span>
                      <span>{{ row.january }}</span>
                      <span>{{ row.february }}</span>
                      <span :class="ratioClass(row.ratioTone)">{{
                        row.ratio
                      }}</span>
                    </div>
                  </div>
                  <div aria-hidden="true" class="workload-table__group">
                    <div
                      v-for="row in screenData.rightTableRows"
                      :key="`${row.label}-loop`"
                      class="workload-table__row"
                    >
                      <span>{{ row.label }}</span>
                      <span>{{ row.january }}</span>
                      <span>{{ row.february }}</span>
                      <span :class="ratioClass(row.ratioTone)">{{
                        row.ratio
                      }}</span>
                    </div>
                  </div>
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
                v-for="item in screenData.topRightRateItems"
                :key="item.label"
                class="rate-list__item"
              >
                <div class="rate-list__row">
                  <span class="rate-list__dot"></span>
                  <span class="rate-list__label">{{ item.label }}</span>
                  <span class="rate-list__value">{{ item.value }}</span>
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
  background: linear-gradient(
    180deg,
    rgb(7 34 61 / 88%),
    rgb(4 23 44 / 90%)
  );
  border: 1px solid rgb(109 190 255 / 32%);
  box-shadow: inset 0 0 20px rgb(86 180 255 / 16%);
}

.pathology-screen__brand-mark img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.pathology-screen__brand-copy {
  display: flex;
  flex-direction: column;
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
  min-height: 0;
  overflow: visible;
}

.pathology-screen__column--left .screen-panel--chart {
  min-height: 282px;
}

.pathology-screen__column--left .screen-panel:not(.screen-panel--chart) {
  min-height: 333px;
}

.pathology-screen__column--center .metric-stack {
  flex: 0 0 auto;
}

.pathology-screen__column--center .center-stage {
  min-height: 420px;
}

.pathology-screen__column--center .screen-panel--report {
  min-height: 318px;
}

.pathology-screen__column--center .pathology-screen__bottom-center {
  min-height: 286px;
}

.pathology-screen__column--right .screen-panel--table {
  min-height: 392px;
}

.pathology-screen__column--right .screen-panel--bottom {
  min-height: 389px;
}

.screen-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgb(7 28 49 / 92%),
    rgb(4 18 34 / 88%)
  );
  border: 1px solid rgb(80 142 196 / 16%);
  box-shadow:
    inset 0 0 24px rgb(65 127 186 / 12%),
    0 0 18px rgb(5 35 66 / 22%);
}

.screen-panel > :not(.screen-panel__header) {
  flex: 0 0 auto;
}

.screen-panel--table {
  overflow: hidden;
}

.screen-panel--table > .workload-table {
  flex: 1 1 auto;
}

.screen-panel--bottom {
  flex: initial;
}

.screen-panel--report {
  min-height: 318px;
}

.screen-panel--chart,
.screen-panel--staff,
.screen-panel--table,
.screen-panel--trend {
  min-height: 260px;
}

.screen-panel__header {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
  padding: 8px 14px;
  margin-bottom: 10px;
  background: linear-gradient(
    90deg,
    rgb(54 93 141 / 80%),
    rgb(20 50 85 / 20%)
  );
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

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #9fc3eb;
}

.chart-legend--tight {
  gap: 10px;
}

.chart-legend__item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.chart-legend__swatch {
  width: 14px;
  height: 8px;
  background: linear-gradient(90deg, #2f8bff, #6bd0ff);
}

.chart-legend__swatch--teal {
  background: linear-gradient(90deg, #2fd7ff, #65ffe5);
}

.chart-legend__swatch--soft {
  background: linear-gradient(90deg, #6a86ff, #a6bcff);
}

.bar-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-height: 0;
}

.bar-card-grid--compact {
  gap: 8px;
}

.bar-card-grid__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
}

.bar-card-grid__bars {
  display: grid;
  grid-template-columns: repeat(3, minmax(24px, 1fr));
  gap: 8px;
  align-items: end;
  min-height: 120px;
}

.bar-card-grid--compact .bar-card-grid__bars {
  min-height: 104px;
}

.bar-card-grid__track {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.bar-card-grid__bar {
  width: 16px;
  border-radius: 999px 999px 4px 4px;
  box-shadow: 0 0 16px rgb(55 177 255 / 28%);
}

.bar-card-grid__bar--blue {
  height: 88px;
  background: linear-gradient(180deg, #5eb8ff, #0e72de);
}

.bar-card-grid__bar--teal {
  height: 38px;
  background: linear-gradient(180deg, #6efcff, #26afb1);
}

.bar-card-grid__bar--soft {
  height: 104px;
  background: linear-gradient(180deg, #9bb0ff, #4c77e5);
}

.bar-card-grid__bar--lavender {
  height: 92px;
  background: linear-gradient(180deg, #b4c1ff, #7487ff);
}

.bar-card-grid__bar--violet {
  height: 86px;
  background: linear-gradient(180deg, #d0bbff, #8f7bfa);
}

.bar-card-grid__track span,
.bar-card-grid__label {
  font-size: 12px;
  line-height: 1.25;
  color: #d3ebff;
  text-align: center;
}

.bar-card-grid__track span {
  width: 100%;
  min-height: 16px;
  font-family: 'Geist Mono', monospace;
  font-size: 11px;
  white-space: nowrap;
}

.bar-card-grid__label {
  font-size: 13px;
  color: #f3fbff;
}

.metric-stack {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.metric-stack__card {
  padding: 10px;
  background: linear-gradient(
    180deg,
    rgb(10 43 74 / 90%),
    rgb(5 27 47 / 90%)
  );
  border: 1px solid rgb(100 181 255 / 20%);
  animation: dashboard-card-enter 0.7s ease both;
}

.metric-stack__card:nth-child(2) {
  animation-delay: 0.08s;
}

.metric-stack__card:nth-child(3) {
  animation-delay: 0.16s;
}

.metric-stack__label {
  padding: 7px 9px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #f2fbff;
  background: linear-gradient(
    90deg,
    rgb(92 143 219 / 76%),
    rgb(41 77 127 / 32%)
  );
}

.metric-stack__value {
  font-family: 'Geist Mono', monospace;
  font-size: 30px;
  color: #f8fdff;
  text-align: center;
  letter-spacing: 0.04em;
}

.center-stage {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 42%,
      rgb(63 175 255 / 20%),
      transparent 34%
    ),
    radial-gradient(
      ellipse at 50% 80%,
      rgb(88 113 206 / 18%),
      transparent 42%
    ),
    linear-gradient(180deg, rgb(5 23 42 / 50%), rgb(4 16 30 / 32%));
  border: 1px solid rgb(72 131 189 / 15%);
}

.center-stage__node {
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  transform: translate(-50%, -50%);
  animation: center-node-float 5.8s ease-in-out infinite;
}

.center-stage__node:nth-child(2) {
  animation-delay: 0.4s;
}

.center-stage__node:nth-child(3) {
  animation-delay: 0.8s;
}

.center-stage__node:nth-child(4) {
  animation-delay: 1.2s;
}

.center-stage__bubble {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
  font-family: 'Geist Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  background: radial-gradient(
    circle at 30% 30%,
    rgb(125 202 255 / 30%),
    rgb(11 65 120 / 92%)
  );
  border: 2px solid rgb(120 196 255 / 72%);
  border-radius: 999px;
  box-shadow: 0 0 24px rgb(54 154 255 / 34%);
}

.center-stage__node-label {
  font-size: 13px;
  color: #b8daf9;
}

.center-stage__orbit,
.center-stage__ring {
  position: absolute;
  top: 40%;
  left: 50%;
  z-index: 2;
  border: 2px solid rgb(57 176 255 / 55%);
  border-radius: 999px;
  transform: translate(-50%, -50%);
}

.center-stage__orbit--one {
  width: 330px;
  height: 200px;
}

.center-stage__orbit--two {
  width: 204px;
  height: 326px;
}

.center-stage__ring {
  width: 156px;
  height: 156px;
  border-color: rgb(180 224 255 / 76%);
  box-shadow: 0 0 22px rgb(83 191 255 / 26%);
}

.center-stage__core {
  position: absolute;
  top: 40%;
  left: 50%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 102px;
  height: 102px;
  background: radial-gradient(circle, #fff 0%, #ecf7ff 55%, #77bfff 100%);
  border-radius: 999px;
  box-shadow: 0 0 22px rgb(124 215 255 / 35%);
  transform: translate(-50%, -50%);
}

.center-stage__core-mark {
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
  color: #11589f;
}

.center-stage__base {
  position: absolute;
  bottom: 22px;
  left: 50%;
  z-index: 1;
  width: min(660px, 78%);
  height: 188px;
  transform: translateX(-50%);
}

.center-stage__plate {
  position: absolute;
  left: 50%;
  background: linear-gradient(
    180deg,
    rgb(113 129 194 / 82%),
    rgb(58 73 122 / 75%)
  );
  border: 1px solid rgb(165 187 255 / 28%);
  box-shadow: 0 0 24px rgb(35 97 171 / 18%);
  clip-path: polygon(50% 0, 100% 28%, 50% 100%, 0 28%);
  transform: translateX(-50%);
}

.center-stage__plate--top {
  bottom: 82px;
  width: 70%;
  height: 112px;
}

.center-stage__plate--middle {
  bottom: 42px;
  width: 84%;
  height: 116px;
}

.center-stage__plate--bottom {
  bottom: 0;
  width: 100%;
  height: 122px;
}

.center-stage__caption {
  position: absolute;
  bottom: 98px;
  left: 50%;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  transform: translateX(-50%);
}

.report-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.report-summary__meta {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  font-size: 12px;
  color: #b4d5f3;
  border-bottom: 1px solid rgb(91 158 221 / 18%);
}

.report-summary__meta strong {
  font-size: 17px;
  color: #59dbff;
}

.report-summary__button {
  padding: 8px 10px;
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #f5fbff;
  text-align: center;
  background: linear-gradient(
    180deg,
    rgb(12 38 68 / 84%),
    rgb(7 24 45 / 86%)
  );
  border: 1px solid rgb(96 185 255 / 28%);
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.report-grid--dense {
  align-items: stretch;
}

.report-grid__cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: space-between;
  min-height: 48px;
  padding: 6px 8px;
  overflow: hidden;
  background: rgb(8 30 53 / 78%);
  border: 1px solid rgb(77 134 193 / 20%);
}

.report-grid__label {
  font-size: 12px;
  line-height: 1.25;
  color: #bfd8f2;
  overflow-wrap: anywhere;
}

.report-grid__value {
  font-family: 'Geist Mono', monospace;
  font-size: 14px;
  color: #fff;
}

.staff-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.staff-metrics__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.staff-metrics__label {
  font-size: 12px;
  color: #cae1f8;
}

.staff-metrics__value {
  font-size: 20px;
  color: #ff7a8a;
}

.staff-metrics__value span {
  margin-left: 6px;
  font-size: 14px;
  color: #cae1f8;
}

.gauge-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-height: 106px;
}

.gauge-row__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.gauge-row__ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  padding: 8px;
  border-radius: 999px;
  box-shadow: 0 0 18px rgb(70 227 255 / 18%);
}

.gauge-row__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  background: #071826;
  border-radius: 999px;
}

.gauge-row__inner strong {
  font-family: 'Geist Mono', monospace;
  font-size: 18px;
}

.gauge-row__label {
  font-size: 13px;
  color: #9ec7ee;
}

.workload-table {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.workload-table__head,
.workload-table__row {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr 0.8fr;
  gap: 10px;
  align-items: center;
}

.workload-table__head {
  padding: 0 8px 8px;
  font-size: 12px;
  color: #9cc5eb;
  border-bottom: 1px solid rgb(85 142 196 / 18%);
}

.workload-table__row {
  min-height: 34px;
  padding: 6px 8px;
  font-size: 13px;
  color: #f3faff;
  background: rgb(12 34 58 / 62%);
}

.workload-table__row:nth-child(odd) {
  background: rgb(14 42 70 / 75%);
}

.workload-table__body {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 312px;
  overflow: hidden;
}

.workload-table__marquee {
  display: flex;
  flex-direction: column;
  animation: workload-scroll 22s linear infinite;
  will-change: transform;
}

.workload-table__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 6px;
}

.rate-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-height: 0;
  overflow: visible;
}

.rate-list__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rate-list__row {
  display: grid;
  grid-template-columns: 16px 1fr auto;
  gap: 10px;
  align-items: center;
}

.rate-list__dot {
  width: 10px;
  height: 10px;
  border: 1px solid rgb(111 214 255 / 76%);
  border-radius: 999px;
  box-shadow: 0 0 12px rgb(66 196 255 / 26%);
}

.rate-list__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #d5ebff;
  white-space: nowrap;
}

.rate-list__value {
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  color: #f5fbff;
  white-space: nowrap;
}

.rate-list__line {
  height: 2px;
  overflow: hidden;
  background: rgb(72 140 202 / 25%);
}

.rate-list__fill {
  width: 96%;
  height: 100%;
  background: linear-gradient(90deg, #1f8cff, #98f8ff);
}

.rate-list__fill--right {
  width: 98%;
}

.pathology-screen__bottom-center {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  overflow: visible;
}

@keyframes workload-scroll {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(-50%);
  }
}

@keyframes dashboard-card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes center-node-float {
  0%,
  100% {
    transform: translate(-50%, -50%);
  }

  50% {
    transform: translate(-50%, calc(-50% - 6px));
  }
}

@media (max-width: 1680px) {
  .pathology-screen__canvas {
    padding: 12px 14px 16px;
  }

  .pathology-screen__content {
    grid-template-columns: 24% 52% 24%;
  }

  .screen-panel {
    padding: 10px;
  }

  .metric-stack__value {
    font-size: 28px;
  }

  .center-stage {
    min-height: 320px;
  }
}

@media (max-width: 1440px) {
  .pathology-screen__header {
    grid-template-columns: 1fr;
  }

  .pathology-screen__title-panel,
  .pathology-screen__header-note {
    justify-content: flex-start;
  }

  .pathology-screen__content {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .pathology-screen__canvas {
    height: auto;
    min-height: 100vh;
    overflow: hidden auto;
  }

  .pathology-screen__column {
    height: auto;
    overflow: visible;
  }

  .pathology-screen__bottom-center {
    grid-template-columns: 1fr;
  }

  .report-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .metric-stack,
  .report-summary,
  .staff-metrics,
  .gauge-row,
  .pathology-screen__bottom-center,
  .bar-card-grid,
  .report-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pathology-screen__title {
    font-size: 30px;
  }

  .pathology-screen__title-plate {
    min-width: 100%;
  }

  .bar-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .pathology-screen__canvas {
    padding: 12px 12px 20px;
  }

  .metric-stack,
  .report-summary,
  .staff-metrics,
  .gauge-row,
  .bar-card-grid,
  .report-grid,
  .pathology-screen__bottom-center {
    grid-template-columns: 1fr;
  }

  .workload-table__head,
  .workload-table__row {
    grid-template-columns: 1.2fr 0.7fr 0.7fr 0.8fr;
    font-size: 12px;
  }

  .center-stage {
    min-height: 420px;
  }

  .center-stage__node {
    transform: translate(-50%, -50%) scale(0.88);
    animation: none;
  }

  .center-stage__base {
    width: 86%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .metric-stack__card,
  .center-stage__node,
  .workload-table__marquee {
    animation: none;
  }
}
</style>
