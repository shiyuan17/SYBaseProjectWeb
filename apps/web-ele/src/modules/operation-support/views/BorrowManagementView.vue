<script setup lang="ts">
import { ref, watch } from 'vue';

import { Fallback, Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import ArchiveLoanAbnormalDialog from '../components/ArchiveLoanAbnormalDialog.vue';
import ArchiveLoanBorrowDialog from '../components/ArchiveLoanBorrowDialog.vue';
import ArchiveLoanMaterialListPanel from '../components/ArchiveLoanMaterialListPanel.vue';
import ArchiveLoanPendingPanel from '../components/ArchiveLoanPendingPanel.vue';
import ArchivePositionWorkbenchPanel from '../components/ArchivePositionWorkbenchPanel.vue';
import ArchiveReturnDialog from '../components/ArchiveReturnDialog.vue';
import EmbeddingBoxBorrowDialog from '../components/EmbeddingBoxBorrowDialog.vue';
import WhiteSlideBorrowDialog from '../components/WhiteSlideBorrowDialog.vue';
import WhiteSlideBorrowListPanel from '../components/WhiteSlideBorrowListPanel.vue';
import WhiteSlideReturnDialog from '../components/WhiteSlideReturnDialog.vue';
import { useBorrowManagementPage } from '../composables/useBorrowManagementPage';

const {
  cabinetWorkspace,
  capabilities,
  display,
  loanWorkspace,
  pageState,
  whiteSlideWorkspace,
} = useBorrowManagementPage();

const activeBorrowTab = ref('EMBEDDING_BOX');
const borrowMaterialTabs = new Set(['EMBEDDING_BOX', 'SLIDE']);

watch(
  activeBorrowTab,
  (materialType) => {
    if (borrowMaterialTabs.has(materialType)) {
      loanWorkspace.setActiveMaterialType(
        materialType as 'EMBEDDING_BOX' | 'SLIDE',
      );
      void loanWorkspace.loadMaterialObjects();
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
    <div
      class="borrow-management-page flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <ElTabs
        v-model="activeBorrowTab"
        class="operation-support-tabs borrow-management-tabs flex min-h-0 flex-1 flex-col"
      >
        <ElTabPane label="蜡块借记" name="EMBEDDING_BOX">
          <div class="borrow-management-tab-panel flex min-h-0 flex-1 flex-col">
            <ArchiveLoanMaterialListPanel
              v-model:material-object-filters="
                loanWorkspace.materialObjectFilters
              "
              :can-create-loan="capabilities.canCreateLoan"
              :can-query-records="capabilities.canQueryRecords"
              :can-register-loan-abnormal="capabilities.canRegisterLoanAbnormal"
              :can-return-loan="capabilities.canReturnLoan"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="loanWorkspace.archiveObjectLoading"
              :page="loanWorkspace.materialObjectFilters.page"
              :record-error="loanWorkspace.archiveObjectError"
              :records="loanWorkspace.materialObjectPage.items"
              :selected-records="loanWorkspace.selectedMaterialRecords"
              :size="loanWorkspace.materialObjectFilters.size"
              :total="loanWorkspace.materialObjectPage.total"
              @borrow="loanWorkspace.openBorrowDialog('EMBEDDING_BOX')"
              @page-change="loanWorkspace.setMaterialObjectPage"
              @query="loanWorkspace.queryMaterialObjects"
              @register-abnormal="loanWorkspace.openAbnormalDialog"
              @return="loanWorkspace.openSelectedReturnDialog"
              @selection-change="loanWorkspace.setSelectedMaterialRecords"
              @size-change="loanWorkspace.setMaterialObjectSize"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="玻片借记" name="SLIDE">
          <div class="borrow-management-tab-panel flex min-h-0 flex-1 flex-col">
            <ArchiveLoanMaterialListPanel
              v-model:material-object-filters="
                loanWorkspace.materialObjectFilters
              "
              :can-create-loan="capabilities.canCreateLoan"
              :can-query-records="capabilities.canQueryRecords"
              :can-register-loan-abnormal="capabilities.canRegisterLoanAbnormal"
              :can-return-loan="capabilities.canReturnLoan"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="loanWorkspace.archiveObjectLoading"
              :page="loanWorkspace.materialObjectFilters.page"
              :record-error="loanWorkspace.archiveObjectError"
              :records="loanWorkspace.materialObjectPage.items"
              :selected-records="loanWorkspace.selectedMaterialRecords"
              :size="loanWorkspace.materialObjectFilters.size"
              :total="loanWorkspace.materialObjectPage.total"
              @borrow="loanWorkspace.openBorrowDialog"
              @page-change="loanWorkspace.setMaterialObjectPage"
              @query="loanWorkspace.queryMaterialObjects"
              @register-abnormal="loanWorkspace.openAbnormalDialog"
              @return="loanWorkspace.openSelectedReturnDialog"
              @selection-change="loanWorkspace.setSelectedMaterialRecords"
              @size-change="loanWorkspace.setMaterialObjectSize"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="白片借记" name="WHITE_SLIDE">
          <div class="borrow-management-tab-panel flex min-h-0 flex-1 flex-col">
            <WhiteSlideBorrowListPanel
              v-model:filters="whiteSlideWorkspace.filters"
              :can-create="capabilities.canCreateWhiteSlideLoan"
              :can-query="capabilities.canQueryWhiteSlideLoans"
              :can-return="capabilities.canReturnWhiteSlideLoan"
              :loading="whiteSlideWorkspace.loading"
              :loans="whiteSlideWorkspace.loans"
              :selected-loan-id="whiteSlideWorkspace.selectedLoan?.id ?? null"
              @borrow="whiteSlideWorkspace.openBorrowDialog"
              @print="whiteSlideWorkspace.printLoan"
              @query="whiteSlideWorkspace.query"
              @return="whiteSlideWorkspace.openReturnDialog"
              @select="whiteSlideWorkspace.selectLoan"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="待归还/归还" name="PENDING">
          <div
            class="borrow-management-tab-panel flex min-h-0 flex-1 flex-col gap-4"
          >
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
      :material-summary="loanWorkspace.selectedMaterialSummary"
      :returning-loan="loanWorkspace.returningLoan"
      :selected-count="loanWorkspace.returningLoans.length"
      :selected-position-label="cabinetWorkspace.selectedPositionLabel"
      :selected-return-position-description="
        loanWorkspace.selectedReturnPositionDescription
      "
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitReturn"
    />

    <EmbeddingBoxBorrowDialog
      v-if="loanWorkspace.borrowDialogMode === 'EMBEDDING_BOX'"
      v-model="loanWorkspace.borrowDialogVisible"
      v-model:loan-form="loanWorkspace.loanForm"
      :selected-count="loanWorkspace.selectedMaterialRecords.length"
      :selected-records="loanWorkspace.selectedMaterialRecords"
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitLoan"
    />

    <ArchiveLoanBorrowDialog
      v-else
      v-model="loanWorkspace.borrowDialogVisible"
      v-model:loan-form="loanWorkspace.loanForm"
      :material-summary="loanWorkspace.selectedMaterialSummary"
      :selected-count="loanWorkspace.selectedMaterialRecords.length"
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitLoan"
    />

    <ArchiveLoanAbnormalDialog
      v-model="loanWorkspace.abnormalDialogVisible"
      v-model:abnormal-form="loanWorkspace.abnormalForm"
      :material-summary="loanWorkspace.selectedMaterialSummary"
      :selected-count="loanWorkspace.selectedMaterialRecords.length"
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitAbnormalRecord"
    />

    <WhiteSlideBorrowDialog
      v-model="whiteSlideWorkspace.borrowDialogVisible"
      v-model:form="whiteSlideWorkspace.borrowForm"
      :calculated-amount="whiteSlideWorkspace.calculatedAmount"
      :stocks="whiteSlideWorkspace.stocks"
      :submitting="pageState.submitting"
      @print="whiteSlideWorkspace.printDraftLoan"
      @submit="whiteSlideWorkspace.submitBorrow"
    />

    <WhiteSlideReturnDialog
      v-model="whiteSlideWorkspace.returnDialogVisible"
      v-model:form="whiteSlideWorkspace.returnForm"
      :loan="whiteSlideWorkspace.selectedLoan"
      :submitting="pageState.submitting"
      @submit="whiteSlideWorkspace.submitReturn"
    />
  </Page>
</template>

<style scoped>
:deep(.borrow-management-tabs > .el-tabs__content) {
  flex: 1;
  min-height: 0;
}

:deep(.borrow-management-tabs > .el-tabs__content > .el-tab-pane) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.borrow-management-page {
  height: calc(100vh - 112px);
}
</style>
