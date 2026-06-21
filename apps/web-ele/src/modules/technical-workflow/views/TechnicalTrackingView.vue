<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { ElAlert } from 'element-plus';

import TechnicalTrackingCaseListPanel from '../components/TechnicalTrackingCaseListPanel.vue';
import TechnicalTrackingDetailsSection from '../components/TechnicalTrackingDetailsSection.vue';
import TechnicalTrackingQueryPanel from '../components/TechnicalTrackingQueryPanel.vue';
import TechnicalTrackingSummaryTables from '../components/TechnicalTrackingSummaryTables.vue';
import { useTechnicalTracking } from '../composables/useTechnicalTracking';

const {
  activeTab,
  caseId,
  caseList,
  context,
  detailEmptyText,
  filteredQcEvaluations,
  filteredReworks,
  filteredTasks,
  handleCaseListPageChange,
  handleCaseListSizeChange,
  handleCaseSelect,
  handleNodeClick,
  handleReset,
  loadTracking,
  loading,
  listLoading,
  pageError,
  selectedCaseId,
  selectedNode,
  selectedNodeId,
  trackingResult,
  treeData,
  dateRange,
  workflowTimelineSteps,
} = useTechnicalTracking();
</script>

<template>
  <Page :show-header="false">
    <div class="flex flex-col gap-4">
      <TechnicalTrackingQueryPanel
        :case-id="caseId"
        :date-range="dateRange"
        :loading="loading"
        @query="loadTracking"
        @reset="handleReset"
        @update:case-id="caseId = $event"
        @update:date-range="dateRange = $event"
      />

      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
      />

      <div class="grid gap-4 xl:grid-cols-[380px_1fr]">
        <TechnicalTrackingCaseListPanel
          :items="caseList.items"
          :loading="listLoading"
          :page="caseList.page"
          :selected-case-id="selectedCaseId"
          :size="caseList.size"
          :total="caseList.total"
          @search="loadTracking"
          @select="handleCaseSelect"
          @update:page="handleCaseListPageChange"
          @update:size="handleCaseListSizeChange"
        />

        <div class="flex flex-col gap-4">
          <template v-if="trackingResult && context">
            <TechnicalTrackingDetailsSection
              v-model:active-tab="activeTab"
              :context="context"
              :filtered-qc-evaluations="filteredQcEvaluations"
              :filtered-reworks="filteredReworks"
              :filtered-tasks="filteredTasks"
              :selected-node="selectedNode"
              :selected-node-id="selectedNodeId"
              :tracking-result="trackingResult"
              :tree-data="treeData"
              :workflow-timeline-steps="workflowTimelineSteps"
              @node-click="handleNodeClick"
            />

            <TechnicalTrackingSummaryTables :tracking-result="trackingResult" />
          </template>
          <div
            v-else
            class="flex min-h-[680px] items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center text-sm text-muted-foreground"
          >
            {{ detailEmptyText }}
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
