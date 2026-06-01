<script setup lang="ts">
import { Page } from '@vben/common-ui';


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
  selectedNode,
  selectedNodeId,
  trackingResult,
  treeData,
  workflowTimelineSteps,
} = useTechnicalTracking();
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">

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
