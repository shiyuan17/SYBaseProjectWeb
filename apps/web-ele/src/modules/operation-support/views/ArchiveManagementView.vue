<script setup lang="ts">
import type { ArchiveObjectType } from '../types/operation-support';

import { ref, watch } from 'vue';

import { Fallback, Page } from '@vben/common-ui';

import { ElButton, ElTabPane, ElTabs } from 'element-plus';

import ArchiveCabinetDialog from '../components/ArchiveCabinetDialog.vue';
import ArchiveCabinetTreePanel from '../components/ArchiveCabinetTreePanel.vue';
import ArchivePositionWorkbenchPanel from '../components/ArchivePositionWorkbenchPanel.vue';
import ArchiveRecordLegacyListPanel from '../components/ArchiveRecordLegacyListPanel.vue';
import ArchiveSubmissionDialog from '../components/ArchiveSubmissionDialog.vue';
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

const activeArchiveTab = ref<'CABINET' | ArchiveObjectType>('APPLICATION_FORM');
const archiveObjectTabs = new Set<ArchiveObjectType>([
  'APPLICATION_FORM',
  'EMBEDDING_BOX',
  'SLIDE',
  'SPECIMEN',
]);

const archiveObjectTabTitles = {
  APPLICATION_FORM: '申请单归档列表',
  EMBEDDING_BOX: '蜡块归档列表',
  SLIDE: '玻片归档列表',
  SPECIMEN: '标本归档列表',
} as const;

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
    <div class="flex flex-col gap-4">
      <ElTabs v-model="activeArchiveTab" class="operation-support-tabs">
        <ElTabPane label="申请单归档" name="APPLICATION_FORM">
          <div class="flex flex-col gap-4">
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
              :size="recordWorkspace.objectLists.APPLICATION_FORM.filters.size"
              :title="archiveObjectTabTitles.APPLICATION_FORM"
              :total="recordWorkspace.objectLists.APPLICATION_FORM.total"
              @page-change="
                (page) =>
                  recordWorkspace.setArchiveObjectPage('APPLICATION_FORM', page)
              "
              @query="recordWorkspace.queryArchiveObjects('APPLICATION_FORM')"
              @size-change="
                (size) =>
                  recordWorkspace.setArchiveObjectSize('APPLICATION_FORM', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="!capabilities.canArchiveApplicationForm"
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
          <div class="flex flex-col gap-4">
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
              :size="recordWorkspace.objectLists.EMBEDDING_BOX.filters.size"
              :title="archiveObjectTabTitles.EMBEDDING_BOX"
              :total="recordWorkspace.objectLists.EMBEDDING_BOX.total"
              @page-change="
                (page) =>
                  recordWorkspace.setArchiveObjectPage('EMBEDDING_BOX', page)
              "
              @query="recordWorkspace.queryArchiveObjects('EMBEDDING_BOX')"
              @size-change="
                (size) =>
                  recordWorkspace.setArchiveObjectSize('EMBEDDING_BOX', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="!capabilities.canArchiveEmbeddingBox"
                  type="primary"
                  @click="archiveWorkspace.openArchiveDialog('EMBEDDING_BOX')"
                >
                  归档操作
                </ElButton>
              </template>
            </ArchiveRecordLegacyListPanel>
          </div>
        </ElTabPane>

        <ElTabPane label="玻片归档" name="SLIDE">
          <div class="flex flex-col gap-4">
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
              :size="recordWorkspace.objectLists.SLIDE.filters.size"
              :title="archiveObjectTabTitles.SLIDE"
              :total="recordWorkspace.objectLists.SLIDE.total"
              @page-change="
                (page) => recordWorkspace.setArchiveObjectPage('SLIDE', page)
              "
              @query="recordWorkspace.queryArchiveObjects('SLIDE')"
              @size-change="
                (size) => recordWorkspace.setArchiveObjectSize('SLIDE', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="!capabilities.canArchiveSlide"
                  type="primary"
                  @click="archiveWorkspace.openArchiveDialog('SLIDE')"
                >
                  归档操作
                </ElButton>
              </template>
            </ArchiveRecordLegacyListPanel>
          </div>
        </ElTabPane>

        <ElTabPane label="标本归档" name="SPECIMEN">
          <div class="flex flex-col gap-4">
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
              :size="recordWorkspace.objectLists.SPECIMEN.filters.size"
              :title="archiveObjectTabTitles.SPECIMEN"
              :total="recordWorkspace.objectLists.SPECIMEN.total"
              @page-change="
                (page) => recordWorkspace.setArchiveObjectPage('SPECIMEN', page)
              "
              @query="recordWorkspace.queryArchiveObjects('SPECIMEN')"
              @size-change="
                (size) => recordWorkspace.setArchiveObjectSize('SPECIMEN', size)
              "
            >
              <template #extra>
                <ElButton
                  :disabled="!capabilities.canArchiveSpecimen"
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
  </Page>
</template>
