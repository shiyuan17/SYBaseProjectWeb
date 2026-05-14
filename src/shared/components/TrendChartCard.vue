<template>
  <BasePageSection
    :title="title"
    :description="description"
  >
    <div
      ref="chartElement"
      class="h-72 w-full"
    />
  </BasePageSection>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import BasePageSection from './BasePageSection.vue'

interface TrendPoint {
  label: string
  value: number
}

const props = defineProps<{
  title: string
  description: string
  points: TrendPoint[]
}>()

const chartElement = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

function renderChart() {
  if (!chartElement.value) {
    return
  }

  if (!chartInstance) {
    chartInstance = echarts.init(chartElement.value)
  }

  chartInstance.setOption({
    color: ['#0f766e'],
    grid: {
      left: 18,
      right: 18,
      top: 24,
      bottom: 18,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: props.points.map((item) => item.label),
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#cbd5e1'
        }
      }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      }
    },
    series: [
      {
        data: props.points.map((item) => item.value),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: 'rgba(15, 118, 110, 0.12)'
        }
      }
    ]
  })
}

onMounted(() => {
  renderChart()

  if (window.ResizeObserver && chartElement.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize()
    })

    resizeObserver.observe(chartElement.value)
  }
})

watch(
  () => props.points,
  () => {
    renderChart()
  },
  {
    deep: true
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

