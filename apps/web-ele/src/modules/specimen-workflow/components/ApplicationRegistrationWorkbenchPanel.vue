<script setup lang="ts">
import type { ApplicationRegistrationWorkbenchRecord } from '../types/application-registration-workbench';

import { computed, watch } from 'vue';

import { ElAlert, ElEmpty } from 'element-plus';

import { useApplicationRegistrationWorkbench } from '../composables/useApplicationRegistrationWorkbench';
import ApplicationRegistrationDictionaryPanel from './ApplicationRegistrationDictionaryPanel.vue';
import ApplicationRegistrationPackageDialog from './ApplicationRegistrationPackageDialog.vue';
import ApplicationRegistrationPatientPanel from './ApplicationRegistrationPatientPanel.vue';
import ApplicationRegistrationSpecimenTable from './ApplicationRegistrationSpecimenTable.vue';
import ApplicationRegistrationWorkbenchToolbar from './ApplicationRegistrationWorkbenchToolbar.vue';

const props = withDefaults(
  defineProps<{
    fullHeight?: boolean;
    lookupKeyword?: string;
    lookupQueryType?: 'APPLICATION_NO' | 'AUTO' | 'INPATIENT_NO' | 'PATIENT_NAME';
    lookupTriggerKey?: number;
  }>(),
  {
    fullHeight: false,
    lookupKeyword: '',
    lookupQueryType: 'INPATIENT_NO',
    lookupTriggerKey: 0,
  },
);

const emit = defineEmits<{
  'reprint-application-form': [
    payload: {
      applicationId: string;
      record: ApplicationRegistrationWorkbenchRecord;
    },
  ];
  'save-workbench': [payload: { recordApplicationId: string }];
}>();

const {
  buildingOptions,
  canRenderWorkbench,
  commonSpecimenOptions,
  currentRecord,
  dictionaryGroups,
  dictionaryKeyword,
  emptyDescription,
  handleAddManualSpecimen,
  handleAppendPackageItems,
  handleAppendSpecimen,
  handleBuildingChange,
  handleCreatePackage,
  handleOpenPackageDialog,
  handleRecordChange,
  handleRoomChange,
  handleSave,
  handleSearch,
  handleSearchTypeChange,
  loading,
  packageDialogVisible,
  pageError,
  roomOptions,
  saveDisabled,
  saving,
  searchKeyword,
  searchType,
  selectedBuilding,
  selectedBuildingId,
  selectedRoom,
  selectedRoomId,
  specimenEntryOptions,
  specimenItems,
  specimenPackageOptions,
} = useApplicationRegistrationWorkbench({
  initialKeyword: props.lookupKeyword,
  initialQueryType: props.lookupQueryType,
  initialTriggerKey: props.lookupTriggerKey,
});

const panelClasses = computed(() =>
  props.fullHeight
    ? 'flex h-[calc(100vh-136px)] min-h-0 flex-col gap-3 overflow-hidden'
    : 'flex flex-col gap-3',
);

watch(
  () => [props.lookupKeyword, props.lookupQueryType, props.lookupTriggerKey] as const,
  ([keyword, queryType]) => {
    const normalizedQueryType =
      queryType === 'AUTO' || !queryType ? 'INPATIENT_NO' : queryType;
    handleSearchTypeChange(normalizedQueryType);
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      return;
    }
    void handleSearch(normalizedKeyword, queryType ?? 'AUTO');
  },
  { immediate: true },
);

async function submitWorkbenchSave() {
  const result = await handleSave();
  if (!result || !currentRecord.value?.applicationId) {
    return;
  }
  emit('save-workbench', {
    recordApplicationId: currentRecord.value.applicationId,
  });
}

function emitReprintApplicationForm(applicationId: string) {
  if (!applicationId || !currentRecord.value) {
    return;
  }
  emit('reprint-application-form', {
    applicationId,
    record: currentRecord.value,
  });
}
</script>

<template>
  <div :class="panelClasses">
    <ElAlert
      v-if="pageError"
      :closable="false"
      :title="pageError"
      show-icon
      type="error"
    />

    <div>
      <ApplicationRegistrationWorkbenchToolbar
        :building-id="selectedBuildingId"
        :building-options="buildingOptions"
        :frozen-reminder="currentRecord?.patientInfo.frozenReminder ?? false"
        :patient-verified="currentRecord?.patientInfo.patientVerified ?? false"
        :registration-status="currentRecord?.patientInfo.registrationStatus ?? '待登记'"
        :room-id="selectedRoomId"
        :room-options="roomOptions"
        :save-disabled="saveDisabled"
        :saving="saving"
        :search-keyword="searchKeyword"
        :search-type="searchType"
        @save="submitWorkbenchSave"
        @search="handleSearch"
        @update:building-id="handleBuildingChange"
        @update:room-id="handleRoomChange"
        @update:search-keyword="searchKeyword = $event"
        @update:search-type="handleSearchTypeChange"
      />
    </div>

    <template v-if="canRenderWorkbench">
      <div
        class="grid min-h-0 flex-1 gap-3 xl:items-start xl:grid-cols-[minmax(360px,1fr)_minmax(0,2fr)]"
      >
        <div class="min-h-0 xl:sticky xl:top-0 xl:self-start xl:h-[calc(100vh-220px)] xl:overflow-hidden">
          <ApplicationRegistrationPatientPanel
            :building-label="selectedBuilding?.buildingName ?? ''"
            :record="currentRecord"
            :room-label="selectedRoom?.roomName ?? ''"
            class="h-full"
            @reprint-application-form="emitReprintApplicationForm"
            @update:record="handleRecordChange"
          />
        </div>

        <div class="flex min-h-0 flex-col gap-3 xl:h-[calc(100vh-220px)] xl:overflow-y-auto xl:pr-1">
          <ApplicationRegistrationSpecimenTable
            :common-specimen-options="commonSpecimenOptions"
            :items="specimenItems"
            :print-context="
              currentRecord
                ? {
                    applyDept: currentRecord.patientInfo.applyDept ?? '',
                    gender: currentRecord.patientInfo.gender ?? '',
                    idNo: currentRecord.patientInfo.idNo ?? '',
                    patientName: currentRecord.patientInfo.patientName ?? '',
                    roomLabel: selectedRoom?.roomName ?? '',
                    surgeryTime: currentRecord.surgeryInfo.fixationTime ?? '',
                  }
                : null
            "
            :room-label="selectedRoom?.roomName ?? ''"
            :specimen-entry-options="specimenEntryOptions"
            @add-manual="handleAddManualSpecimen"
            @append="handleAppendSpecimen"
            @select-package="handleOpenPackageDialog"
            @update:items="specimenItems = $event"
          />

          <ApplicationRegistrationDictionaryPanel
            :dictionary-keyword="dictionaryKeyword"
            :groups="dictionaryGroups"
            class="min-h-0 xl:flex-1 xl:overflow-hidden"
            @append="handleAppendSpecimen"
            @update:dictionary-keyword="dictionaryKeyword = $event"
          />
        </div>
      </div>

    </template>

    <div
      v-else
      class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-14 shadow-sm"
    >
      <ElEmpty :description="loading ? '正在查询工作台数据...' : emptyDescription" />
    </div>

    <ApplicationRegistrationPackageDialog
      v-model="packageDialogVisible"
      :package-options="specimenPackageOptions"
      :preferred-dept="currentRecord?.patientInfo.applyDept ?? ''"
      @confirm="handleAppendPackageItems"
      @create-package="handleCreatePackage"
    />
  </div>
</template>
