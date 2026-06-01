<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, onMounted, ref, watch } from 'vue';

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

const hasOption = computed(() => Boolean(props.option));

async function renderChart() {
  if (!props.option || props.loading) {
    return;
  }
  await renderEcharts(props.option);
}

watch(
  () => props.option,
  () => {
    void renderChart();
  },
  { deep: true },
);

watch(
  () => props.loading,
  (loading) => {
    if (!loading) {
      void renderChart();
    }
  },
);

onMounted(() => {
  void renderChart();
});
</script>

<template>
  <div class="relative min-h-[220px]">
    <ElSkeleton v-if="loading" :rows="6" animated />

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
