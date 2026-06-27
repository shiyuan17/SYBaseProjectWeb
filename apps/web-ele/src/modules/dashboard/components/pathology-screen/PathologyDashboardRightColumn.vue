<script setup lang="ts">
import type { PathologyScreenDashboardResponse } from '../../types/pathology-screen';

import {
  buildPathologyRatioClass,
  buildPathologyStatusClass,
  displayPathologyMetricValue,
} from '../../utils/pathology-dashboard-presentation';

const props = defineProps<{
  dashboard: PathologyScreenDashboardResponse;
}>();
</script>

<template>
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
            v-for="row in props.dashboard.diagnosisWorkloadRows.items"
            :key="row.label"
            class="workload-table__row"
          >
            <span>{{ row.label }}</span>
            <span>{{ displayPathologyMetricValue(row.januaryCount) }}</span>
            <span>{{ displayPathologyMetricValue(row.februaryCount) }}</span>
            <span :class="buildPathologyRatioClass(row.momRate)">
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
          v-for="item in props.dashboard.overallComplianceRates.items"
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
            <div class="rate-list__fill rate-list__fill--right"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
