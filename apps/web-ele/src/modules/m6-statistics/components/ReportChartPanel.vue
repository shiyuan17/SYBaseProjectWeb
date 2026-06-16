<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { ReportChartOption } from '../utils/report-workbench';

import { ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElEmpty } from 'element-plus';

const props = defineProps<{
  emptyText: string;
  loading: boolean;
  option: null | ReportChartOption;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

watch(
  () => [props.loading, props.option] as const,
  ([loading, option]) => {
    if (!loading && option) {
      void renderEcharts(option);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="option" class="rounded border border-border bg-card p-3">
    <EchartsUI ref="chartRef" height="300px" />
  </div>
  <ElEmpty v-else :description="emptyText" />
</template>
