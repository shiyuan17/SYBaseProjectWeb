<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { ReportChartOption } from '../utils/report-workbench';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElEmpty } from 'element-plus';

const props = defineProps<{
  emptyText: string;
  loading: boolean;
  option: null | ReportChartOption;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const chartError = ref('');
const renderToken = ref(0);

const hasOption = computed(() => props.option !== null);
const shouldShowChart = computed(
  () => hasOption.value && !props.loading && !chartError.value,
);

async function renderChart(option: ReportChartOption, token: number) {
  for (let index = 0; index < 3; index += 1) {
    await nextTick();
    if (chartRef.value) {
      break;
    }
  }
  if (token !== renderToken.value || !chartRef.value) {
    chartError.value = '图表暂时无法渲染，请稍后重试';
    return;
  }
  try {
    const chartInstance = await renderEcharts(option);
    if (token !== renderToken.value) {
      return;
    }
    chartError.value = chartInstance
      ? ''
      : '图表暂时无法渲染，请稍后重试';
  } catch {
    if (token === renderToken.value) {
      chartError.value = '图表暂时无法渲染，请稍后重试';
    }
  }
}

watch(
  () => [props.loading, props.option] as const,
  ([loading, option]) => {
    renderToken.value += 1;
    chartError.value = '';
    if (!loading && option) {
      const token = renderToken.value;
      void renderChart(option, token);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="shouldShowChart" class="rounded border border-border bg-card p-3">
    <EchartsUI ref="chartRef" height="300px" />
  </div>
  <ElEmpty
    v-else
    :description="chartError || emptyText"
  />
</template>
