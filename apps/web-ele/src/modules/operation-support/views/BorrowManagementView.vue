<script setup lang="ts">
import { ref, watch } from 'vue';

import { Fallback, Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import ArchiveLoanCreatePanel from '../components/ArchiveLoanCreatePanel.vue';
import ArchiveLoanLegacyListPanel from '../components/ArchiveLoanLegacyListPanel.vue';
import ArchiveLoanPendingPanel from '../components/ArchiveLoanPendingPanel.vue';
import ArchivePositionWorkbenchPanel from '../components/ArchivePositionWorkbenchPanel.vue';
import ArchiveReturnDialog from '../components/ArchiveReturnDialog.vue';
import { useBorrowManagementPage } from '../composables/useBorrowManagementPage';

const { cabinetWorkspace, capabilities, display, loanWorkspace, pageState } =
  useBorrowManagementPage();

const activeBorrowTab = ref('EMBEDDING_BOX');
const borrowMaterialTabs = new Set(['EMBEDDING_BOX', 'SLIDE']);

watch(
  activeBorrowTab,
  (materialType) => {
    if (borrowMaterialTabs.has(materialType)) {
      loanWorkspace.loanForm.materialType = materialType;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="!capabilities.canViewBorrowPage"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>

  <Page v-else :show-header="false">
    <div class="flex flex-col gap-4">
      <ElTabs v-model="activeBorrowTab" class="operation-support-tabs">
        <ElTabPane label="蜡块借记" name="EMBEDDING_BOX">
          <div class="flex flex-col gap-4">
            <ArchiveLoanLegacyListPanel
              v-model:loan-filters="loanWorkspace.loanFilters"
              :can-query-loans="capabilities.canQueryLoans"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="loanWorkspace.loading"
              :loan-error="loanWorkspace.loanError"
              material-type="EMBEDDING_BOX"
              :pending-loans="loanWorkspace.pendingLoans"
              @load-loans="loanWorkspace.loadLoans"
            />
            <ArchiveLoanCreatePanel
              v-model:loan-form="loanWorkspace.loanForm"
              :can-create-loan="capabilities.canCreateLoan"
              fixed-material-type="EMBEDDING_BOX"
              hide-header
              :submitting="pageState.submitting"
              @submit-loan="loanWorkspace.submitLoan"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="玻片借记" name="SLIDE">
          <div class="flex flex-col gap-4">
            <ArchiveLoanLegacyListPanel
              v-model:loan-filters="loanWorkspace.loanFilters"
              :can-query-loans="capabilities.canQueryLoans"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="loanWorkspace.loading"
              :loan-error="loanWorkspace.loanError"
              material-type="SLIDE"
              :pending-loans="loanWorkspace.pendingLoans"
              @load-loans="loanWorkspace.loadLoans"
            />
            <ArchiveLoanCreatePanel
              v-model:loan-form="loanWorkspace.loanForm"
              :can-create-loan="capabilities.canCreateLoan"
              fixed-material-type="SLIDE"
              hide-header
              :submitting="pageState.submitting"
              @submit-loan="loanWorkspace.submitLoan"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="待归还/归还" name="PENDING">
          <div class="flex flex-col gap-4">
            <ArchivePositionWorkbenchPanel
              v-model:cabinet-id="cabinetWorkspace.positionFilters.cabinetId"
              v-model:cabinet-type="
                cabinetWorkspace.positionFilters.cabinetType
              "
              :cabinets="cabinetWorkspace.cabinets"
              :can-query-cabinets="capabilities.canQueryCabinets"
              :get-position-status-tag-type="display.getPositionStatusTagType"
              :loading="cabinetWorkspace.loading.positions"
              :position-error="cabinetWorkspace.positionError"
              :position-rows="cabinetWorkspace.positionRows"
              :position-summary="cabinetWorkspace.positionSummary"
              :selected-position="cabinetWorkspace.selectedPosition"
              :selected-position-code="cabinetWorkspace.selectedPositionCode"
              :selected-position-label="cabinetWorkspace.selectedPositionLabel"
              hide-header
              @clear-selected-position="cabinetWorkspace.clearSelectedPosition"
              @load-positions="cabinetWorkspace.loadPositions"
              @select-position="cabinetWorkspace.selectPosition"
            />

            <ArchiveLoanPendingPanel
              v-model:loan-filters="loanWorkspace.loanFilters"
              :can-query-loans="capabilities.canQueryLoans"
              :can-return-loan="capabilities.canReturnLoan"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="loanWorkspace.loading"
              :loan-error="loanWorkspace.loanError"
              :pending-loans="loanWorkspace.pendingLoans"
              hide-header
              @load-loans="loanWorkspace.loadLoans"
              @open-return-dialog="loanWorkspace.openReturnDialog"
            />
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <ArchiveReturnDialog
      v-model="loanWorkspace.returnDialogVisible"
      v-model:return-form="loanWorkspace.returnForm"
      :returning-loan="loanWorkspace.returningLoan"
      :selected-position-label="cabinetWorkspace.selectedPositionLabel"
      :selected-return-position-description="
        loanWorkspace.selectedReturnPositionDescription
      "
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitReturn"
    />
  </Page>
</template>
