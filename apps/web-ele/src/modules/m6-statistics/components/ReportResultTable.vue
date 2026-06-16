<script setup lang="ts">
import type {
  DisplayStatReportRow,
  WorkbenchTab,
} from '../utils/report-workbench';

import {
  ElButton,
  ElEmpty,
  ElSegmented,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  metricStatusLabel,
  metricStatusTagType,
  qualityGroupOptions,
} from '../utils/report-workbench';

defineProps<{
  activeTab: WorkbenchTab;
  detailEnabled: boolean;
  qualityGroup: 'medical' | 'professional';
  rows: DisplayStatReportRow[];
}>();

const emit = defineEmits<{
  openDetails: [row: DisplayStatReportRow];
  'update:qualityGroup': [value: 'medical' | 'professional'];
}>();
</script>

<template>
  <div v-if="activeTab === 'quality'" class="mb-3">
    <ElSegmented
      :model-value="qualityGroup"
      :options="qualityGroupOptions"
      @update:model-value="
        emit('update:qualityGroup', $event as 'medical' | 'professional')
      "
    />
  </div>
  <ElTable v-if="rows.length > 0" :data="rows" border>
    <ElTableColumn label="指标编码" min-width="190" prop="indicatorCode" />
    <ElTableColumn label="指标名称" min-width="240" prop="displayIndicatorName" />
    <ElTableColumn label="结果" min-width="140" prop="metricValue" />
    <ElTableColumn label="状态" min-width="120">
      <template #default="{ row }">
        <ElTag :type="metricStatusTagType(row.metricStatus)">
          {{ metricStatusLabel(row.metricStatus) }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn
      label="数据来源与口径"
      min-width="280"
      prop="displaySourceNote"
      show-overflow-tooltip
    />
    <ElTableColumn v-if="detailEnabled" fixed="right" label="操作" width="120">
      <template #default="{ row }">
        <ElButton
          v-if="row.metricStatus !== 'UNAVAILABLE'"
          link
          type="primary"
          @click="emit('openDetails', row)"
        >
          查看明细
        </ElButton>
        <span v-else class="text-xs text-muted-foreground">暂无明细</span>
      </template>
    </ElTableColumn>
  </ElTable>
  <ElEmpty v-else description="当前筛选条件下暂无统计结果" />
</template>
