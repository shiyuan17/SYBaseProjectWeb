<script setup lang="ts">
import type { DisplayStatReportRow } from '../utils/report-workbench';

import { ElTag } from 'element-plus';

import {
  metricStatusLabel,
  metricStatusTagType,
} from '../utils/report-workbench';

defineProps<{
  rows: DisplayStatReportRow[];
}>();
</script>

<template>
  <div v-if="rows.length > 0" class="grid gap-3 md:grid-cols-4">
    <div
      v-for="row in rows"
      :key="row.indicatorCode"
      class="rounded border border-border bg-card px-4 py-3"
    >
      <div class="flex items-start justify-between gap-3">
        <span class="text-sm text-muted-foreground">
          {{ row.indicatorName }}
        </span>
        <ElTag :type="metricStatusTagType(row.metricStatus)">
          {{ metricStatusLabel(row.metricStatus) }}
        </ElTag>
      </div>
      <div class="mt-3 text-2xl font-semibold">
        {{ row.metricValueText }}
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        {{ row.sourceNote || '统计来源未标注' }}
      </div>
    </div>
  </div>
</template>
