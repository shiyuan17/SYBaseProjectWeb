<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { ElAlert } from 'element-plus';

import ApplicationRegistrationWorkbenchPanel from '../components/ApplicationRegistrationWorkbenchPanel.vue';
import SpecimenManagementDetailDrawer from '../components/SpecimenManagementDetailDrawer.vue';
import SpecimenManagementResultDialog from '../components/SpecimenManagementResultDialog.vue';
import SpecimenManagementRetryDialog from '../components/SpecimenManagementRetryDialog.vue';
import SpecimenManagementVerifyDialog from '../components/SpecimenManagementVerifyDialog.vue';
import SpecimenRegisterDialog from '../components/SpecimenRegisterDialog.vue';
import { useSpecimenManagementPage } from '../composables/useSpecimenManagementPage';

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
    registrationApplicationId?: string;
    registrationTriggerKey?: number;
  }>(),
  {
    embedded: false,
    registrationApplicationId: '',
    registrationTriggerKey: 0,
  },
);

const page = useSpecimenManagementPage(props);
const retryForm = page.retryForm;
const verifyForm = page.verifyForm;

const {
  canManageSpecimens,
  currentRetryResult,
  detailApplicationDetail,
  detailDrawerVisible,
  detailLatestRegisterResult,
  detailLoading,
  detailRow,
  goToTracking,
  handleRegisterSuccess,
  handleWorkbenchReprintApplicationForm,
  handleWorkbenchSaved,
  latestRegisterApplicationId,
  latestRegisterResult,
  openRetryDialogFromLatestResult,
  pageError,
  registerDialogApplicationId,
  registerDialogVisible,
  resultDialogVisible,
  retryContext,
  retryDialogVisible,
  retrySelectionCount,
  retrySourceLabel,
  retrySubmitting,
  submitRetry,
  submitVerify,
  verifyAction,
  verifyDialogVisible,
  verifySubmitting,
  verifyTargetRow,
  workbenchLookupKeyword,
  workbenchLookupQueryType,
  workbenchLookupTriggerKey,
  workflowReferenceOptions,
} = page;
</script>

<template>
  <Page :show-header="false" :title="embedded ? undefined : '申请与登记'">
    <div class="flex flex-col gap-4">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        type="error"
        show-icon
      />

      <template v-if="canManageSpecimens">
        <ApplicationRegistrationWorkbenchPanel
          full-height
          :lookup-keyword="workbenchLookupKeyword"
          :lookup-query-type="workbenchLookupQueryType"
          :lookup-trigger-key="workbenchLookupTriggerKey"
          @reprint-application-form="handleWorkbenchReprintApplicationForm"
          @save-workbench="handleWorkbenchSaved"
        />
      </template>
    </div>

    <SpecimenRegisterDialog
      v-model="registerDialogVisible"
      :application-id="registerDialogApplicationId"
      @registered="handleRegisterSuccess"
    />

    <SpecimenManagementDetailDrawer
      v-model="detailDrawerVisible"
      :application-detail="detailApplicationDetail"
      :latest-register-result="detailLatestRegisterResult"
      :loading="detailLoading"
      :row="detailRow"
      @go-to-tracking="goToTracking"
    />

    <SpecimenManagementResultDialog
      v-model="resultDialogVisible"
      :application-id="latestRegisterApplicationId"
      :result="latestRegisterResult"
      @retry-latest-result="openRetryDialogFromLatestResult"
    />

    <SpecimenManagementRetryDialog
      v-model="retryDialogVisible"
      v-model:form="retryForm"
      :batch-no="retryContext.batchNo"
      :current-retry-result="currentRetryResult"
      :retry-selection-count="retrySelectionCount"
      :retry-source-label="retrySourceLabel"
      :submitting="retrySubmitting"
      @submit-retry="submitRetry"
    />

    <SpecimenManagementVerifyDialog
      v-model="verifyDialogVisible"
      v-model:form="verifyForm"
      :action="verifyAction"
      :submitting="verifySubmitting"
      :target-row="verifyTargetRow"
      :workflow-reference-options="workflowReferenceOptions"
      @submit-verify="submitVerify"
    />
  </Page>
</template>
