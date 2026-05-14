<template>
  <div class="space-y-6">
    <BasePageHeader
      description="用一页轻量仪表盘验证后台布局、会话状态、图表容器与样式基线是否全部连通。"
      eyebrow="Dashboard"
      title="项目脚手架概览"
    />

    <div class="grid gap-4 xl:grid-cols-3">
      <BasePageSection
        description="这组卡片刻意覆盖登录壳、路由守卫、Mock、测试和共享样式入口。"
        title="当前能力"
      >
        <div class="grid gap-4 md:grid-cols-3">
          <StatusPanel
            description="会话与权限信息由 Pinia 统一管理，并做白名单持久化。"
            state="success"
            title="Session Ready"
          />
          <StatusPanel
            description="本地开发和测试都共享 MSW handler，示例接口可以离线运行。"
            state="success"
            title="Mock Enabled"
          />
          <StatusPanel
            description="图表组件已接入 resize、dispose 和统一视觉 token。"
            state="success"
            title="Chart Mounted"
          />
        </div>
      </BasePageSection>
    </div>

    <TrendChartCard
      :points="trendPoints"
      description="示例折线图用于验证 ECharts 在脚手架中的初始化、重绘和切页销毁行为。"
      title="近七日示例活跃趋势"
    />
  </div>
</template>

<script setup lang="ts">
import BasePageHeader from '@/shared/components/BasePageHeader.vue'
import BasePageSection from '@/shared/components/BasePageSection.vue'
import StatusPanel from '@/shared/components/StatusPanel.vue'
import TrendChartCard from '@/shared/components/TrendChartCard.vue'

const trendPoints = [
  { label: 'Mon', value: 28 },
  { label: 'Tue', value: 34 },
  { label: 'Wed', value: 31 },
  { label: 'Thu', value: 43 },
  { label: 'Fri', value: 47 },
  { label: 'Sat', value: 39 },
  { label: 'Sun', value: 51 }
]
</script>

