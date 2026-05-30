<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElButton, ElEmpty, ElSkeleton } from 'element-plus';

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

const emit = defineEmits<{
  retry: [];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const hasOption = computed(() => Boolean(props.option));

async function renderChart() {
  if (!props.option || props.loading || props.error) {
    return;
  }
  await renderEcharts(props.option);
}

function handleRetry() {
  emit('retry');
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

watch(
  () => props.error,
  (error) => {
    if (!error) {
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
    <div
      v-if="error"
      class="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/35 bg-danger/5 px-6 py-8 text-center"
    >
      <p class="max-w-[28rem] text-sm text-danger">{{ error }}</p>
      <ElButton type="danger" plain @click="handleRetry">重试</ElButton>
    </div>

    <ElSkeleton v-else-if="loading" :rows="6" animated />

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
