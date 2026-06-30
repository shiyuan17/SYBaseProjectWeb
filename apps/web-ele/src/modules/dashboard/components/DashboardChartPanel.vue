<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElEmpty, ElSkeleton } from 'element-plus';

type ChartOption = Parameters<
  ReturnType<typeof useEcharts>['renderEcharts']
>[0];

const props = withDefaults(
  defineProps<{
    emptyDescription?: string;
    error?: string;
    height?: string;
    loading?: boolean;
    option?: ChartOption | null;
  }>(),
  {
    emptyDescription: '暂无图表数据',
    error: '',
    height: '300px',
    loading: false,
    option: null,
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const chartError = ref('');
const renderToken = ref(0);

const hasOption = computed(() => Boolean(props.option));
const visibleError = computed(() => props.error || chartError.value);

async function renderChart(token: number) {
  if (!props.option || props.loading || props.error) {
    return;
  }
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
    const chartInstance = await renderEcharts(props.option);
    if (token === renderToken.value) {
      chartError.value = chartInstance ? '' : '图表暂时无法渲染，请稍后重试';
    }
  } catch {
    if (token === renderToken.value) {
      chartError.value = '图表暂时无法渲染，请稍后重试';
    }
  }
}

function scheduleRenderChart() {
  renderToken.value += 1;
  chartError.value = '';
  const token = renderToken.value;
  void renderChart(token);
}

watch(
  () => props.option,
  () => {
    scheduleRenderChart();
  },
  { deep: true },
);

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      scheduleRenderChart();
    }
  },
);

onMounted(() => {
  scheduleRenderChart();
});
</script>

<template>
  <div class="relative min-h-[220px]" :aria-busy="loading ? 'true' : undefined">
    <ElSkeleton v-if="loading" :rows="6" animated />

    <div
      v-else-if="visibleError"
      class="rounded border border-dashed border-border/80 bg-card/70 px-4 py-6"
      role="status"
    >
      <ElEmpty :description="visibleError" />
    </div>

    <div
      v-else-if="hasOption"
      class="rounded-3xl border border-border bg-card/80 p-3 shadow-sm"
    >
      <EchartsUI ref="chartRef" :height="height" />
    </div>

    <div
      v-else
      class="rounded-3xl border border-dashed border-border/80 bg-card/70 px-4 py-6"
    >
      <ElEmpty :description="emptyDescription" />
    </div>
  </div>
</template>
