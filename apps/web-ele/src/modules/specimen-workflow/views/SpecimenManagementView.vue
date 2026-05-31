<script setup lang="ts">
import { Page } from '@vben/common-ui';

import { ElAlert } from 'element-plus';

import ApplicationRegistrationWorkbenchPanel from '../components/ApplicationRegistrationWorkbenchPanel.vue';
import SpecimenManagementDetailDrawer from '../components/SpecimenManagementDetailDrawer.vue';
import SpecimenManagementListPanel from '../components/SpecimenManagementListPanel.vue';
import SpecimenManagementOverviewPanel from '../components/SpecimenManagementOverviewPanel.vue';
import SpecimenManagementResultDialog from '../components/SpecimenManagementResultDialog.vue';
import SpecimenManagementRetryDialog from '../components/SpecimenManagementRetryDialog.vue';
import SpecimenManagementVerifyDialog from '../components/SpecimenManagementVerifyDialog.vue';
import SpecimenRegisterDialog from '../components/SpecimenRegisterDialog.vue';
import WorkflowSectionCard from '../components/WorkflowSectionCard.vue';
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

const filters = page.filters;
const retryForm = page.retryForm;
const verifyForm = page.verifyForm;

const {
  abnormalFilterOptions,
  canManageSpecimens,
  canVerifyFixation,
  currentRetryResult,
  detailApplicationDetail,
  detailDrawerVisible,
  detailLatestRegisterResult,
  detailLoading,
  detailRow,
  goToTracking,
  handleBulkRetry,
  handleDepartmentChange,
  handlePageChange,
  handleQuickFilterChange,
  handleRegisterSuccess,
  handleReset,
  handleRowRetry,
  handleSearch,
  handleSelectionChange,
  handleSizeChange,
  handleWorkbenchReprintApplicationForm,
  handleWorkbenchSaved,
  items,
  labelPrintStatusOptions,
  latestRegisterApplicationId,
  latestRegisterResult,
  listLoading,
  openDetailDrawer,
  openRetryDialogFromLatestResult,
  openVerifyDialog,
  pageError,
  quickFilter,
  quickFilterOptions,
  registerDialogApplicationId,
  registerDialogVisible,
  resultDialogVisible,
  retryContext,
  retryDialogVisible,
  retrySelectionCount,
  retrySourceLabel,
  retrySubmitting,
  selectedRows,
  specimenStatusOptions,
  submitRetry,
  submitVerify,
  summary,
  total,
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
  <Page :title="embedded ? undefined : '申请与登记'">
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

        <WorkflowSectionCard
          title="工作台概览"
          description="围绕登记、贴签、核验和异常处理组织当前工作台。"
        >
          <SpecimenManagementOverviewPanel :summary="summary" />
        </WorkflowSectionCard>

        <SpecimenManagementListPanel
          v-model:filters="filters"
          v-model:quick-filter="quickFilter"
          :abnormal-filter-options="abnormalFilterOptions"
          :can-verify-fixation="canVerifyFixation"
          :items="items"
          :label-print-status-options="labelPrintStatusOptions"
          :list-loading="listLoading"
          :quick-filter-options="quickFilterOptions"
          :selected-rows-count="selectedRows.length"
          :specimen-status-options="specimenStatusOptions"
          :total="total"
          @bulk-retry="handleBulkRetry"
          @department-change="handleDepartmentChange"
          @detail="openDetailDrawer"
          @go-to-tracking="goToTracking"
          @page-change="handlePageChange"
          @quick-filter-change="handleQuickFilterChange"
          @reset="handleReset"
          @row-retry="handleRowRetry"
          @search="handleSearch"
          @selection-change="handleSelectionChange"
          @size-change="handleSizeChange"
          @verify="openVerifyDialog"
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
