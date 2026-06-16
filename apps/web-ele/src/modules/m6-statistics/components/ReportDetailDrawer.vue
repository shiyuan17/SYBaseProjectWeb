<script setup lang="ts">
import type { StatReportDetailResult } from '../types/m6-statistics';
import type { DisplayStatReportRow } from '../utils/report-workbench';

import {
  ElButton,
  ElDrawer,
  ElEmpty,
  ElPagination,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  buildDetailSummaryItems,
  detailStatusLabel,
  detailStatusTagType,
  metricStatusLabel,
  metricStatusTagType,
} from '../utils/report-workbench';

defineProps<{
  activeDetailIndicator: DisplayStatReportRow | null;
  detailDrawerVisible: boolean;
  detailExportLoading: boolean;
  detailLoading: boolean;
  detailPagination: { page: number; size: number };
  detailResult: null | StatReportDetailResult;
}>();

const emit = defineEmits<{
  close: [];
  export: [];
  pageChange: [page: number];
  sizeChange: [size: number];
}>();
</script>

<template>
  <ElDrawer
    :model-value="detailDrawerVisible"
    :title="`指标明细 - ${activeDetailIndicator?.displayIndicatorName ?? activeDetailIndicator?.indicatorName ?? ''}`"
    size="780px"
    @update:model-value="(value) => !value && emit('close')"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-medium">
            {{
              activeDetailIndicator?.displayIndicatorName ??
              activeDetailIndicator?.indicatorName
            }}
          </div>
        </div>
        <ElButton :loading="detailExportLoading" @click="emit('export')">
          导出明细 CSV
        </ElButton>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <div
          v-for="item in buildDetailSummaryItems(detailResult)"
          :key="item.label"
          class="rounded border border-border bg-card px-4 py-3"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-muted-foreground">
              {{ item.label }}
            </span>
            <ElTag :type="metricStatusTagType(item.status)">
              {{ metricStatusLabel(item.status) }}
            </ElTag>
          </div>
          <div class="mt-3 text-2xl font-semibold">{{ item.count }}</div>
        </div>
      </div>

      <ElSkeleton v-if="detailLoading" :rows="5" animated />
      <template v-else>
        <ElTable
          v-if="detailResult?.items.length"
          :data="detailResult.items"
          border
        >
          <ElTableColumn label="病理号" min-width="160" prop="pathologyNo" />
          <ElTableColumn
            label="申请单号"
            min-width="160"
            prop="applicationNo"
          />
          <ElTableColumn label="标本号" min-width="140" prop="specimenNo" />
          <ElTableColumn label="发生时间" min-width="180" prop="occurredAt" />
          <ElTableColumn label="结论" min-width="120">
            <template #default="{ row }">
              <ElTag :type="detailStatusTagType(row.detailStatus)">
                {{ detailStatusLabel(row.detailStatus) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="原因/说明"
            min-width="240"
            prop="reason"
            show-overflow-tooltip
          />
          <template #empty></template>
        </ElTable>
        <ElEmpty v-else description="当前筛选条件下暂无明细记录" />
        <div class="flex justify-end">
          <ElPagination
            :current-page="detailPagination.page"
            :page-size="detailPagination.size"
            :page-sizes="[10, 20, 50]"
            :total="detailResult?.total ?? 0"
            layout="total, sizes, prev, pager, next"
            @update:current-page="emit('pageChange', $event)"
            @update:page-size="emit('sizeChange', $event)"
          />
        </div>
      </template>
    </div>
  </ElDrawer>
</template>
