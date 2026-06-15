<script setup lang="ts">
import type { ArchiveObjectType } from '../types/operation-support';

import { computed, ref, unref, watch } from 'vue';

import { Fallback, Page } from '@vben/common-ui';

import { ElButton, ElTabPane, ElTabs } from 'element-plus';

import ApplicationFormArchiveDialog from '../components/ApplicationFormArchiveDialog.vue';
import ArchiveCabinetDialog from '../components/ArchiveCabinetDialog.vue';
import ArchiveCabinetTreePanel from '../components/ArchiveCabinetTreePanel.vue';
import ArchiveLoanBorrowDialog from '../components/ArchiveLoanBorrowDialog.vue';
import ArchiveRecordLegacyListPanel from '../components/ArchiveRecordLegacyListPanel.vue';
import ArchiveSubmissionDialog from '../components/ArchiveSubmissionDialog.vue';
import BatchArchiveCabinetDialog from '../components/BatchArchiveCabinetDialog.vue';
import PhysicalArchiveDialog from '../components/PhysicalArchiveDialog.vue';
import { useArchiveManagementPage } from '../composables/useArchiveManagementPage';

const {
  archiveWorkspace,
  cabinetWorkspace,
  capabilities,
  display,
  loanWorkspace,
  pageState,
  recordWorkspace,
} = useArchiveManagementPage();

const activeArchiveTab = ref<'CABINET' | ArchiveObjectType>('APPLICATION_FORM');
const archiveObjectTabs = new Set<ArchiveObjectType>([
  'APPLICATION_FORM',
  'EMBEDDING_BOX',
  'SLIDE',
  'SPECIMEN',
]);
const activePhysicalArchiveObjectType = computed<ArchiveObjectType>(() =>
  unref(recordWorkspace.activeObjectType),
);
const selectedPhysicalArchiveRecords = computed(
  () =>
    recordWorkspace.selectedRecordsByType[
      activePhysicalArchiveObjectType.value
    ],
);

function isArchiveObjectType(
  objectType: 'CABINET' | ArchiveObjectType,
): objectType is ArchiveObjectType {
  return archiveObjectTabs.has(objectType as ArchiveObjectType);
}

watch(
  activeArchiveTab,
  (objectType) => {
    if (isArchiveObjectType(objectType)) {
      archiveWorkspace.archiveForm.objectType = objectType;
      void recordWorkspace.setActiveArchiveObjectType(objectType, {
        loadIfNeeded: true,
      });
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
    <div
      class="archive-management-page flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <ElTabs
        v-model="activeArchiveTab"
        class="operation-support-tabs archive-management-tabs flex min-h-0 flex-1 flex-col"
      >
        <ElTabPane label="申请单归档" name="APPLICATION_FORM">
          <div
            class="archive-management-tab-panel flex min-h-0 flex-1 flex-col"
          >
            <ArchiveRecordLegacyListPanel
              v-model:archive-object-filters="
                recordWorkspace.objectLists.APPLICATION_FORM.filters
              "
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.objectLists.APPLICATION_FORM.loading"
              object-type="APPLICATION_FORM"
              :page="recordWorkspace.objectLists.APPLICATION_FORM.filters.page"
              :record-error="recordWorkspace.objectLists.APPLICATION_FORM.error"
              :records="recordWorkspace.objectLists.APPLICATION_FORM.items"
              selectable
              :size="recordWorkspace.objectLists.APPLICATION_FORM.filters.size"
              :total="recordWorkspace.objectLists.APPLICATION_FORM.total"
              @page-change="
                (page) =>
                  recordWorkspace.setArchiveObjectPage('APPLICATION_FORM', page)
              "
              @query="recordWorkspace.queryArchiveObjects('APPLICATION_FORM')"
              @selection-change="
                recordWorkspace.setSelectedApplicationFormRecords
              "
              @size-change="
                (size) =>
                  recordWorkspace.setArchiveObjectSize('APPLICATION_FORM', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="
                    !capabilities.canArchiveApplicationForm ||
                    recordWorkspace.selectedApplicationFormRecords.length === 0
                  "
                  type="primary"
                  @click="
                    archiveWorkspace.openArchiveDialog('APPLICATION_FORM')
                  "
                >
                  归档操作
                </ElButton>
              </template>
            </ArchiveRecordLegacyListPanel>
          </div>
        </ElTabPane>

        <ElTabPane label="蜡块归档" name="EMBEDDING_BOX">
          <div
            class="archive-management-tab-panel flex min-h-0 flex-1 flex-col"
          >
            <ArchiveRecordLegacyListPanel
              v-model:archive-object-filters="
                recordWorkspace.objectLists.EMBEDDING_BOX.filters
              "
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.objectLists.EMBEDDING_BOX.loading"
              object-type="EMBEDDING_BOX"
              :page="recordWorkspace.objectLists.EMBEDDING_BOX.filters.page"
              :record-error="recordWorkspace.objectLists.EMBEDDING_BOX.error"
              :records="recordWorkspace.objectLists.EMBEDDING_BOX.items"
              selectable
              :size="recordWorkspace.objectLists.EMBEDDING_BOX.filters.size"
              :total="recordWorkspace.objectLists.EMBEDDING_BOX.total"
              @page-change="
                (page) =>
                  recordWorkspace.setArchiveObjectPage('EMBEDDING_BOX', page)
              "
              @query="recordWorkspace.queryArchiveObjects('EMBEDDING_BOX')"
              @selection-change="
                (records) =>
                  recordWorkspace.setSelectedArchiveObjectRecords(
                    'EMBEDDING_BOX',
                    records,
                  )
              "
              @size-change="
                (size) =>
                  recordWorkspace.setArchiveObjectSize('EMBEDDING_BOX', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="
                    !capabilities.canArchiveEmbeddingBox ||
                    recordWorkspace.selectedEmbeddingBoxRecords.length === 0
                  "
                  type="primary"
                  @click="archiveWorkspace.openArchiveDialog('EMBEDDING_BOX')"
                >
                  归档操作
                </ElButton>
                <ElButton
                  :disabled="
                    !capabilities.canCreateLoan ||
                    recordWorkspace.selectedEmbeddingBoxRecords.length === 0
                  "
                  @click="
                    loanWorkspace.openBorrowDialogForRecords(
                      'EMBEDDING_BOX',
                      recordWorkspace.selectedEmbeddingBoxRecords,
                    )
                  "
                >
                  借记
                </ElButton>
              </template>
            </ArchiveRecordLegacyListPanel>
          </div>
        </ElTabPane>

        <ElTabPane label="玻片归档" name="SLIDE">
          <div
            class="archive-management-tab-panel flex min-h-0 flex-1 flex-col"
          >
            <ArchiveRecordLegacyListPanel
              v-model:archive-object-filters="
                recordWorkspace.objectLists.SLIDE.filters
              "
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.objectLists.SLIDE.loading"
              object-type="SLIDE"
              :page="recordWorkspace.objectLists.SLIDE.filters.page"
              :record-error="recordWorkspace.objectLists.SLIDE.error"
              :records="recordWorkspace.objectLists.SLIDE.items"
              selectable
              :size="recordWorkspace.objectLists.SLIDE.filters.size"
              :total="recordWorkspace.objectLists.SLIDE.total"
              @page-change="
                (page) => recordWorkspace.setArchiveObjectPage('SLIDE', page)
              "
              @query="recordWorkspace.queryArchiveObjects('SLIDE')"
              @selection-change="
                (records) =>
                  recordWorkspace.setSelectedArchiveObjectRecords(
                    'SLIDE',
                    records,
                  )
              "
              @size-change="
                (size) => recordWorkspace.setArchiveObjectSize('SLIDE', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="
                    !capabilities.canArchiveSlide ||
                    recordWorkspace.selectedSlideRecords.length === 0
                  "
                  type="primary"
                  @click="archiveWorkspace.openArchiveDialog('SLIDE')"
                >
                  归档操作
                </ElButton>
                <ElButton
                  :disabled="
                    !capabilities.canCreateLoan ||
                    recordWorkspace.selectedSlideRecords.length === 0
                  "
                  @click="
                    loanWorkspace.openBorrowDialogForRecords(
                      'SLIDE',
                      recordWorkspace.selectedSlideRecords,
                    )
                  "
                >
                  借记
                </ElButton>
              </template>
            </ArchiveRecordLegacyListPanel>
          </div>
        </ElTabPane>

        <ElTabPane label="标本归档" name="SPECIMEN">
          <div
            class="archive-management-tab-panel flex min-h-0 flex-1 flex-col"
          >
            <ArchiveRecordLegacyListPanel
              v-model:archive-object-filters="
                recordWorkspace.objectLists.SPECIMEN.filters
              "
              :can-query-records="capabilities.canQueryRecords"
              :get-archive-status-tag-type="display.getArchiveStatusTagType"
              :get-loan-status-tag-type="display.getLoanStatusTagType"
              :loading="recordWorkspace.objectLists.SPECIMEN.loading"
              object-type="SPECIMEN"
              :page="recordWorkspace.objectLists.SPECIMEN.filters.page"
              :record-error="recordWorkspace.objectLists.SPECIMEN.error"
              :records="recordWorkspace.objectLists.SPECIMEN.items"
              selectable
              :size="recordWorkspace.objectLists.SPECIMEN.filters.size"
              :total="recordWorkspace.objectLists.SPECIMEN.total"
              @page-change="
                (page) => recordWorkspace.setArchiveObjectPage('SPECIMEN', page)
              "
              @query="recordWorkspace.queryArchiveObjects('SPECIMEN')"
              @selection-change="
                (records) =>
                  recordWorkspace.setSelectedArchiveObjectRecords(
                    'SPECIMEN',
                    records,
                  )
              "
              @size-change="
                (size) => recordWorkspace.setArchiveObjectSize('SPECIMEN', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="
                    !capabilities.canArchiveSpecimen ||
                    recordWorkspace.selectedSpecimenRecords.length === 0
                  "
                  type="primary"
                  @click="archiveWorkspace.openArchiveDialog('SPECIMEN')"
                >
                  归档操作
                </ElButton>
              </template>
            </ArchiveRecordLegacyListPanel>
          </div>
        </ElTabPane>

        <ElTabPane label="归档柜列表" name="CABINET">
          <div
            class="archive-management-tab-panel flex min-h-0 flex-1 flex-col"
          >
            <ArchiveCabinetTreePanel
              :cabinet-nodes="cabinetWorkspace.cabinetNodes"
              :cabinets="cabinetWorkspace.cabinets"
              :can-create-cabinet="capabilities.canCreateCabinet"
              :can-delete-cabinet="capabilities.canDeleteCabinet"
              :can-query-cabinets="capabilities.canQueryCabinets"
              :can-update-cabinet="capabilities.canUpdateCabinet"
              :loading="
                cabinetWorkspace.loading.cabinets ||
                cabinetWorkspace.loading.cabinetNodes
              "
              @delete-cabinet="cabinetWorkspace.deleteCabinet"
              @load-cabinets="cabinetWorkspace.loadCabinets"
              @load-cabinet-nodes="cabinetWorkspace.loadCabinetNodes"
              @load-positions="cabinetWorkspace.loadPositions"
              @open-batch-create-cabinet-dialog="
                cabinetWorkspace.openBatchCreateCabinetDialog
              "
              @open-create-cabinet-dialog="
                cabinetWorkspace.openCreateCabinetDialog
              "
              @open-edit-cabinet-dialog="cabinetWorkspace.openEditCabinetDialog"
              @open-edit-cabinet-node-dialog="
                cabinetWorkspace.openEditCabinetNodeDialog
              "
              @toggle-cabinet-status="cabinetWorkspace.toggleCabinetStatus"
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
      :cabinet-nodes="cabinetWorkspace.cabinetNodes"
      :is-editing-cabinet="cabinetWorkspace.isEditingCabinet"
      :submitting="pageState.submitting"
      @submit="cabinetWorkspace.submitCabinet"
    />
    <BatchArchiveCabinetDialog
      v-model="cabinetWorkspace.batchCabinetDialogVisible"
      v-model:batch-cabinet-form="cabinetWorkspace.batchCabinetForm"
      :cabinet-nodes="cabinetWorkspace.cabinetNodes"
      :submitting="pageState.submitting"
      @submit="cabinetWorkspace.submitBatchCabinets"
    />
    <ArchiveSubmissionDialog
      v-model="archiveWorkspace.archiveDialogVisible"
      v-model:archive-form="archiveWorkspace.archiveForm"
      :archive-permission-warning="archiveWorkspace.archivePermissionWarning"
      :archive-submit-button-text="archiveWorkspace.archiveSubmitButtonText"
      :can-submit-archive="archiveWorkspace.canSubmitArchive"
      :selected-position-label="cabinetWorkspace.selectedPositionLabel"
      :submitting="pageState.submitting"
      @submit-archive="archiveWorkspace.submitArchive"
    />
    <ApplicationFormArchiveDialog
      v-model="archiveWorkspace.applicationFormDialogVisible"
      v-model:remarks="archiveWorkspace.archiveForm.remarks"
      :archive-permission-warning="archiveWorkspace.archivePermissionWarning"
      :get-archive-status-tag-type="display.getArchiveStatusTagType"
      :selected-position-label="cabinetWorkspace.selectedPositionLabel"
      :selected-records="recordWorkspace.selectedApplicationFormRecords"
      :submitting="pageState.submitting"
      @submit-archive="archiveWorkspace.submitArchive"
    />
    <PhysicalArchiveDialog
      v-model="archiveWorkspace.physicalArchiveDialogVisible"
      v-model:archive-form="archiveWorkspace.archiveForm"
      :archive-permission-warning="archiveWorkspace.archivePermissionWarning"
      :cabinets="cabinetWorkspace.cabinets"
      :get-archive-status-tag-type="display.getArchiveStatusTagType"
      :object-type="activePhysicalArchiveObjectType"
      :selected-records="selectedPhysicalArchiveRecords"
      :submitting="pageState.submitting"
      @submit-archive="archiveWorkspace.submitArchive"
    />
    <ArchiveLoanBorrowDialog
      v-model="loanWorkspace.borrowDialogVisible"
      v-model:loan-form="loanWorkspace.loanForm"
      :material-summary="loanWorkspace.selectedMaterialSummary"
      :selected-count="loanWorkspace.selectedMaterialRecords.length"
      :submitting="pageState.submitting"
      @submit="loanWorkspace.submitLoan"
    />
  </Page>
</template>

<style scoped>
:deep(.archive-management-tabs > .el-tabs__content) {
  flex: 1;
  min-height: 0;
}

:deep(.archive-management-tabs > .el-tabs__content > .el-tab-pane) {
  height: 100%;
  min-height: 0;
}

.archive-management-page {
  height: calc(100vh - 112px);
}
</style>
