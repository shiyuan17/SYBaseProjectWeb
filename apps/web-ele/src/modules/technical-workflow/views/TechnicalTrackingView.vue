<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { ElAlert } from 'element-plus';

import TechnicalTrackingDetailsSection from '../components/TechnicalTrackingDetailsSection.vue';
import TechnicalTrackingQueryPanel from '../components/TechnicalTrackingQueryPanel.vue';
import TechnicalTrackingSummaryTables from '../components/TechnicalTrackingSummaryTables.vue';
import { useTechnicalTracking } from '../composables/useTechnicalTracking';

const {
  activeTab,
  caseId,
  context,
  filteredQcEvaluations,
  filteredReworks,
  filteredTasks,
  handleNodeClick,
  handleReset,
  loadTracking,
  loading,
  pageError,
  selectedNode,
  selectedNodeId,
  trackingResult,
  treeData,
  workflowTimelineSteps,
} = useTechnicalTracking();
</script>

<template>
  <Page
    title="技术追踪"
    description="按病例维度查看对象树、流程时间线、任务返工与质控异常。"
  >
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <TechnicalTrackingQueryPanel
        :case-id="caseId"
        :loading="loading"
        @query="loadTracking"
        @reset="handleReset"
        @update:case-id="caseId = $event"
      />

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
    </div>
  </Page>
</template>
