<script setup lang="ts">
import type { PathologyScreenDashboardResponse } from '../../types/pathology-screen';

import { computed } from 'vue';

import {
  buildPathologyStatusClass,
  displayPathologyMetricValue,
} from '../../utils/pathology-dashboard-presentation';

const props = defineProps<{
  dashboard: PathologyScreenDashboardResponse;
}>();

const REVISION_SCROLL_THRESHOLD = 6;

const shouldAutoScrollRevisionTrend = computed(
  () =>
    props.dashboard.reportRevisionRateTrend.items.length >
    REVISION_SCROLL_THRESHOLD,
);

const renderedRevisionTrendItems = computed(() =>
  shouldAutoScrollRevisionTrend.value
    ? [
        ...props.dashboard.reportRevisionRateTrend.items,
        ...props.dashboard.reportRevisionRateTrend.items,
      ]
    : props.dashboard.reportRevisionRateTrend.items,
);
</script>

<template>
  <div class="pathology-screen__column pathology-screen__column--left">
    <section class="screen-panel screen-panel--chart">
      <div class="screen-panel__header">
        <span class="screen-panel__spark"></span>
        <h2>签发报告修改率</h2>
      </div>
      <div
        class="line-list"
        :class="{
          'line-list--scrolling': shouldAutoScrollRevisionTrend,
        }"
        data-testid="pathology-top-left-chart"
      >
        <div
          class="line-list__viewport"
          data-testid="pathology-top-left-scroll"
        >
          <div class="line-list__rail">
            <div
              v-for="(item, index) in renderedRevisionTrendItems"
              :key="`${item.label}-${index}`"
              class="line-list__item"
              data-testid="pathology-top-left-item"
            >
              <div class="line-list__meta">
                <span>{{ item.label }}</span>
                <span :class="buildPathologyStatusClass(item.status)">
                  {{ displayPathologyMetricValue(item.value) }}
                </span>
              </div>
              <div class="line-list__track">
                <div class="line-list__fill"></div>
              </div>
            </div>
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
          v-for="item in props.dashboard.technicalQualificationRates.items"
          :key="item.label"
          class="rate-list__item"
        >
          <div class="rate-list__row">
            <span class="rate-list__dot"></span>
            <span class="rate-list__label">{{ item.label }}</span>
            <span :class="buildPathologyStatusClass(item.status)">
              {{ displayPathologyMetricValue(item.value) }}
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
          v-for="row in props.dashboard.threeYearTechnicalRates.items"
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
