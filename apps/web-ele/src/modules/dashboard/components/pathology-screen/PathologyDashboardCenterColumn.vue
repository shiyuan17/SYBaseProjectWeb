<script setup lang="ts">
import type { PathologyScreenDashboardResponse } from '../../types/pathology-screen';

import {
  buildPathologyDashboardStageNodes,
  buildPathologyDashboardSummaryCards,
  buildPathologyStatusClass,
  displayPathologyMetricValue,
} from '../../utils/pathology-dashboard-presentation';

const props = defineProps<{
  dashboard: PathologyScreenDashboardResponse;
}>();
</script>

<template>
  <div class="pathology-screen__column pathology-screen__column--center">
    <section class="metric-stack" data-testid="pathology-metric-cards">
      <article
        v-for="metric in buildPathologyDashboardSummaryCards(props.dashboard)"
        :key="metric.label"
        class="metric-stack__card"
      >
        <div class="metric-stack__label">{{ metric.label }}</div>
        <div
          class="metric-stack__value"
          :class="[buildPathologyStatusClass(metric.status)]"
        >
          {{ displayPathologyMetricValue(metric.value) }}
        </div>
      </article>
    </section>

    <section
      class="center-stage center-stage--workload"
      data-testid="pathology-center-stage"
    >
      <div
        class="center-stage__workload-grid"
        data-testid="pathology-workload-grid"
      >
        <article
          v-for="node in buildPathologyDashboardStageNodes(props.dashboard)"
          :key="node.label"
          class="center-stage__workload-card"
        >
          <span class="center-stage__workload-label">{{ node.label }}</span>
          <strong
            class="center-stage__workload-value"
            :class="[buildPathologyStatusClass(node.status)]"
          >
            {{ displayPathologyMetricValue(node.value) }}
          </strong>
        </article>
      </div>
      <div class="center-stage__base">
        <div class="center-stage__plate center-stage__plate--top"></div>
        <div class="center-stage__plate center-stage__plate--middle"></div>
        <div class="center-stage__plate center-stage__plate--bottom"></div>
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
            props.dashboard.structuredReportSummary.templateTypeCount.label
          }}</span>
          <strong
            :class="
              buildPathologyStatusClass(
                props.dashboard.structuredReportSummary.templateTypeCount
                  .status,
              )
            "
          >
            {{
              displayPathologyMetricValue(
                props.dashboard.structuredReportSummary.templateTypeCount.value,
              )
            }}
          </strong>
        </div>
        <div class="report-summary__meta">
          <span>{{
            props.dashboard.structuredReportSummary.reportCount.label
          }}</span>
          <strong
            :class="
              buildPathologyStatusClass(
                props.dashboard.structuredReportSummary.reportCount.status,
              )
            "
          >
            {{
              displayPathologyMetricValue(
                props.dashboard.structuredReportSummary.reportCount.value,
              )
            }}
          </strong>
        </div>
      </div>
      <div class="report-summary__button">结构化报告实例</div>
      <div class="report-grid report-grid--dense">
        <div
          v-for="item in props.dashboard.structuredReportSummary.topTemplates"
          :key="item.label"
          class="report-grid__cell"
        >
          <span class="report-grid__label">{{ item.label }}</span>
          <strong
            class="report-grid__value"
            :class="[buildPathologyStatusClass(item.status)]"
          >
            {{ displayPathologyMetricValue(item.value) }}
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
          v-for="row in props.dashboard.threeYearReportQualityRates.items"
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
              <strong :class="buildPathologyStatusClass(metric.status)">
                {{ displayPathologyMetricValue(metric.value) }}
              </strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
