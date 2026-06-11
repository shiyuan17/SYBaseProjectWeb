<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Fallback, Page } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import ArchiveCabinetDialog from '../components/ArchiveCabinetDialog.vue';
import ArchiveCabinetTreePanel from '../components/ArchiveCabinetTreePanel.vue';
import ArchivePositionWorkbenchPanel from '../components/ArchivePositionWorkbenchPanel.vue';
import ArchiveRecordLegacyListPanel from '../components/ArchiveRecordLegacyListPanel.vue';
import ArchiveSubmissionPanel from '../components/ArchiveSubmissionPanel.vue';
import BatchArchiveCabinetDialog from '../components/BatchArchiveCabinetDialog.vue';
import { useArchiveManagementPage } from '../composables/useArchiveManagementPage';

const {
  archiveWorkspace,
  cabinetWorkspace,
  capabilities,
  display,
  pageState,
  recordWorkspace,
} = useArchiveManagementPage();

const activeArchiveTab = ref('APPLICATION_FORM');
const archiveObjectTabs = new Set<string>([
  'APPLICATION_FORM',
  'EMBEDDING_BOX',
  'SLIDE',
]);

const archiveObjectTabTitles = {
  APPLICATION_FORM: '申请单归档列表',
  EMBEDDING_BOX: '蜡块归档列表',
  SLIDE: '玻片归档列表',
} as const;

const archiveRecordRows = computed(() => recordWorkspace.records);

watch(
  activeArchiveTab,
  (objectType) => {
    if (archiveObjectTabs.has(objectType)) {
      archiveWorkspace.archiveForm.objectType = objectType;
      recordWorkspace.recordFilters.objectType = objectType;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="!capabilities.canViewArchivePage"
    class="flex min-h-[360px] items-center justify-center"
  >
    <Fallback status="403" />
  </div>

  <Page v-else :show-header="false">
    <div class="flex flex-col gap-4">
      <ElTabs v-model="activeArchiveTab" class="operation-support-tabs">
        <ElTabPane label="申请单归档" name="APPLICATION_FORM">
          <div class="flex flex-col gap-4">
            <ArchiveRecordLegacyListPanel
              v-model:record-filters="recordWorkspace.recordFilters"
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.loading"
              object-type="APPLICATION_FORM"
              :record-error="recordWorkspace.recordError"
              :records="archiveRecordRows"
              :title="archiveObjectTabTitles.APPLICATION_FORM"
              @load-records="recordWorkspace.loadRecords"
            />
            <ArchiveSubmissionPanel
              v-model:archive-form="archiveWorkspace.archiveForm"
              :archive-permission-warning="
                archiveWorkspace.archivePermissionWarning
              "
              :archive-submit-button-text="
                archiveWorkspace.archiveSubmitButtonText
              "
              :can-submit-archive="archiveWorkspace.canSubmitArchive"
              fixed-object-type="APPLICATION_FORM"
              :selected-position-label="cabinetWorkspace.selectedPositionLabel"
              :submitting="pageState.submitting"
              @submit-archive="archiveWorkspace.submitArchive"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="蜡块归档" name="EMBEDDING_BOX">
          <div class="flex flex-col gap-4">
            <ArchiveRecordLegacyListPanel
              v-model:record-filters="recordWorkspace.recordFilters"
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.loading"
              object-type="EMBEDDING_BOX"
              :record-error="recordWorkspace.recordError"
              :records="archiveRecordRows"
              :title="archiveObjectTabTitles.EMBEDDING_BOX"
              @load-records="recordWorkspace.loadRecords"
            />
            <ArchiveSubmissionPanel
              v-model:archive-form="archiveWorkspace.archiveForm"
              :archive-permission-warning="
                archiveWorkspace.archivePermissionWarning
              "
              :archive-submit-button-text="
                archiveWorkspace.archiveSubmitButtonText
              "
              :can-submit-archive="archiveWorkspace.canSubmitArchive"
              fixed-object-type="EMBEDDING_BOX"
              :selected-position-label="cabinetWorkspace.selectedPositionLabel"
              :submitting="pageState.submitting"
              @submit-archive="archiveWorkspace.submitArchive"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="玻片归档" name="SLIDE">
          <div class="flex flex-col gap-4">
            <ArchiveRecordLegacyListPanel
              v-model:record-filters="recordWorkspace.recordFilters"
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.loading"
              object-type="SLIDE"
              :record-error="recordWorkspace.recordError"
              :records="archiveRecordRows"
              :title="archiveObjectTabTitles.SLIDE"
              @load-records="recordWorkspace.loadRecords"
            />
            <ArchiveSubmissionPanel
              v-model:archive-form="archiveWorkspace.archiveForm"
              :archive-permission-warning="
                archiveWorkspace.archivePermissionWarning
              "
              :archive-submit-button-text="
                archiveWorkspace.archiveSubmitButtonText
              "
              :can-submit-archive="archiveWorkspace.canSubmitArchive"
              fixed-object-type="SLIDE"
              :selected-position-label="cabinetWorkspace.selectedPositionLabel"
              :submitting="pageState.submitting"
              @submit-archive="archiveWorkspace.submitArchive"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="归档柜列表" name="CABINET">
          <div class="flex flex-col gap-4">
            <ArchiveCabinetTreePanel
              :cabinets="cabinetWorkspace.cabinets"
              :can-create-cabinet="capabilities.canCreateCabinet"
              :can-delete-cabinet="capabilities.canDeleteCabinet"
              :can-query-cabinets="capabilities.canQueryCabinets"
              :can-update-cabinet="capabilities.canUpdateCabinet"
              :loading="cabinetWorkspace.loading.cabinets"
              :position-rows="cabinetWorkspace.positionRows"
              @delete-cabinet="cabinetWorkspace.deleteCabinet"
              @load-cabinets="cabinetWorkspace.loadCabinets"
              @load-positions="cabinetWorkspace.loadPositions"
              @open-batch-create-cabinet-dialog="
                cabinetWorkspace.openBatchCreateCabinetDialog
              "
              @open-create-cabinet-dialog="
                cabinetWorkspace.openCreateCabinetDialog
              "
              @open-edit-cabinet-dialog="cabinetWorkspace.openEditCabinetDialog"
              @toggle-cabinet-status="cabinetWorkspace.toggleCabinetStatus"
            />

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
              @clear-selected-position="cabinetWorkspace.clearSelectedPosition"
              @load-positions="cabinetWorkspace.loadPositions"
              @select-position="cabinetWorkspace.selectPosition"
            />
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <ArchiveCabinetDialog
      v-model="cabinetWorkspace.cabinetDialogVisible"
      v-model:cabinet-form="cabinetWorkspace.cabinetForm"
      :cabinet-capacity-preview="cabinetWorkspace.cabinetCapacityPreview"
      :cabinet-dialog-mode="cabinetWorkspace.cabinetDialogMode"
      :cabinet-position-rule-preview="
        cabinetWorkspace.cabinetPositionRulePreview
      "
      :is-editing-cabinet="cabinetWorkspace.isEditingCabinet"
      :submitting="pageState.submitting"
      @submit="cabinetWorkspace.submitCabinet"
    />
    <BatchArchiveCabinetDialog
      v-model="cabinetWorkspace.batchCabinetDialogVisible"
      v-model:batch-cabinet-form="cabinetWorkspace.batchCabinetForm"
      :submitting="pageState.submitting"
      @submit="cabinetWorkspace.submitBatchCabinets"
    />
  </Page>
</template>
