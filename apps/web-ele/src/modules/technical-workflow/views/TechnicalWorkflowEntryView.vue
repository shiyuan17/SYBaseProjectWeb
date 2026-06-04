<script setup lang="ts">
import type { PendingTechnicalTaskItem } from '../types/technical-workflow';

import { useRouter } from 'vue-router';

import { Fallback, Page } from '@vben/common-ui';

import TechnicalWorkflowGuideSection from '../components/TechnicalWorkflowGuideSection.vue';
import TechnicalWorkflowHeroSection from '../components/TechnicalWorkflowHeroSection.vue';
import TechnicalWorkflowWorkspaceSection from '../components/TechnicalWorkflowWorkspaceSection.vue';
import { useTechnicalWorkflowEntry } from '../composables/useTechnicalWorkflowEntry';
import { useTechnicalWorkflowNavigation } from '../utils/navigation';
import {
  workflowMapCards,
  workflowOverviewCards,
  workflowSteps,
} from '../utils/workflow-entry-content';

const router = useRouter();
const navigation = useTechnicalWorkflowNavigation(router);
const badgeClass =
  'rounded-full border border-white/15 bg-white/10 px-3 py-1.5';

const {
  abnormalItems,
  canAccessAnyM3,
  canAccessFrozen,
  canAccessReceipt,
  canAccessRework,
  canAccessSpecimenRegistration,
  canAccessTracking,
  canAccessWorkflowEntry,
  currentWorkingBucket,
  frozenReminder,
  loading,
  pendingSpecimenRegistrationCount,
  regularBuckets,
  riskCards,
  workflowLead,
} = useTechnicalWorkflowEntry();

function goToCurrentWorkflow() {
  if (
    pendingSpecimenRegistrationCount.value > 0 &&
    canAccessSpecimenRegistration.value
  ) {
    return navigation.goToSpecimenRegistration();
  }
  if (!currentWorkingBucket.value) {
    return navigation.goToTasks();
  }

  return navigation.goToPath(currentWorkingBucket.value.path, {
    mode: currentWorkingBucket.value.inProgress > 0 ? 'queue' : 'exception',
  });
}

function goToTaskPool() {
  return navigation.goToTasks({ mode: 'queue' });
}

function goToSpecimenRegistration() {
  return navigation.goToSpecimenRegistration();
}

function goToAbnormalTask(task: PendingTechnicalTaskItem) {
  if (task.taskType === 'REWORK') {
    return navigation.goToRework({
      caseId: task.caseId,
      mode: 'exception',
      pathologyNo: task.pathologyNo ?? undefined,
    });
  }

  return navigation.goToTask(task, 'exception');
}

function goToTrackingDetail(task?: PendingTechnicalTaskItem) {
  if (!task) {
    return navigation.goToTracking();
  }

  return navigation.goToTracking({
    caseId: task.caseId,
    objectId: task.objectId ?? undefined,
    objectType: task.objectType ?? undefined,
    pathologyNo: task.pathologyNo ?? undefined,
    tab: 'abnormal',
    taskId: task.id,
  });
}

function goToReworkEntry() {
  return navigation.goToRework({ mode: 'exception' });
}
</script>

<template>
  <div
    v-if="!canAccessWorkflowEntry"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>
  <Page
    v-else
    title="制片生产入口"
    description="围绕常规制片主链、冰冻工作台和异常闭环组织入口，让 M3 从任务调度到返工追踪保持连续。"
  >
    <div class="flex flex-col gap-4">
      <TechnicalWorkflowHeroSection
        :badge-class="badgeClass"
        :risk-cards="riskCards"
      />

      <TechnicalWorkflowGuideSection
        :current-working-bucket="currentWorkingBucket"
        :overview-cards="workflowOverviewCards"
        :workflow-lead="workflowLead"
        :workflow-map-cards="workflowMapCards"
        :workflow-steps="workflowSteps"
        @go-to-current-workflow="goToCurrentWorkflow"
        @go-to-path="navigation.goToPath"
        @go-to-task-pool="goToTaskPool"
      />

      <TechnicalWorkflowWorkspaceSection
        :abnormal-items="abnormalItems"
        :can-access-any-m3="canAccessAnyM3"
        :can-access-frozen="canAccessFrozen"
        :can-access-receipt="canAccessReceipt"
        :can-access-rework="canAccessRework"
        :can-access-specimen-registration="canAccessSpecimenRegistration"
        :can-access-tracking="canAccessTracking"
        :current-working-bucket="currentWorkingBucket"
        :frozen-reminder="frozenReminder"
        :loading="loading"
        :pending-specimen-registration-count="pendingSpecimenRegistrationCount"
        :regular-buckets="regularBuckets"
        @go-to-current-workflow="goToCurrentWorkflow"
        @go-to-frozen="navigation.goToFrozen"
        @go-to-path="navigation.goToPath"
        @go-to-rework="goToReworkEntry"
        @go-to-specimen-registration="goToSpecimenRegistration"
        @go-to-task="goToAbnormalTask"
        @go-to-task-pool="goToTaskPool"
        @go-to-tracking="goToTrackingDetail"
      />
    </div>
  </Page>
</template>
