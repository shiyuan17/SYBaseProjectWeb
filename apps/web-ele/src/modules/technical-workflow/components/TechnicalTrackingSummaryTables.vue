<script setup lang="ts">
import type { TechnicalTrackingView } from '../types/technical-workflow';

import { ElTable, ElTableColumn } from 'element-plus';

import {
  formatNullable,
  formatQualityStatus,
  formatSlideStatus,
  formatSpecimenStatus,
} from '../utils/format';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  trackingResult: TechnicalTrackingView;
}>();
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-3">
    <WorkflowSectionCard
      title="标本摘要"
      description="展示对象层级中的标本信息。"
    >
      <ElTable :data="trackingResult.specimens" border>
        <ElTableColumn label="标本号" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.specimenNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="标本名称" min-width="160">
          <template #default="{ row }">
            {{ formatNullable(row.specimenName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="120">
          <template #default="{ row }">
            {{ formatSpecimenStatus(row.specimenStatus) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="包埋与切片"
      description="展示包埋盒提示和玻片状态。"
    >
      <ElTable :data="trackingResult.embeddingBoxes" border>
        <ElTableColumn label="包埋盒号" min-width="140">
          <template #default="{ row }">
            {{ formatNullable(row.embeddingBoxNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="切片提示" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.sliceNotice) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="玻片数量" min-width="100" prop="slideCount" />
      </ElTable>
    </WorkflowSectionCard>

    <WorkflowSectionCard
      title="玻片状态"
      description="展示切片、染色和质控状态。"
    >
      <ElTable :data="trackingResult.slides" border>
        <ElTableColumn label="玻片号" min-width="140">
          <template #default="{ row }">
            {{ formatNullable(row.slideNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="玻片状态" min-width="120">
          <template #default="{ row }">
            {{ formatSlideStatus(row.slideStatus) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="质控状态" min-width="120">
          <template #default="{ row }">
            {{ formatQualityStatus(row.qualityStatus) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </WorkflowSectionCard>
  </div>
</template>
