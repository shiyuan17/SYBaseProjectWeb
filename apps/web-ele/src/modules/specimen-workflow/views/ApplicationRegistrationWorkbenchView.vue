<script setup lang="ts">
import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  OperatingRoomOption,
  SaveApplicationRegistrationWorkbenchRequest,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageItem,
  SpecimenPackageOption,
  WorkbenchSpecimenPrintContext,
  WorkbenchSpecimenItem,
} from '../types/application-registration-workbench';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { ElAlert, ElEmpty, ElMessage } from 'element-plus';

import {
  listCommonSpecimenOptions,
  listOperatingBuildingOptions,
  listOperatingRoomOptions,
  listSpecimenDictionaryEntryOptions,
  listSpecimenDictionaryGroups,
  listSpecimenPackageOptions,
} from '../api/application-registration-workbench-mock';
import {
  lookupApplicationRegistrationWorkbenchRecord,
  saveApplicationRegistrationWorkbench,
} from '../api/application-registration-workbench-service';
import ApplicationRegistrationDictionaryPanel from '../components/ApplicationRegistrationDictionaryPanel.vue';
import ApplicationRegistrationPackageDialog from '../components/ApplicationRegistrationPackageDialog.vue';
import ApplicationRegistrationPatientPanel from '../components/ApplicationRegistrationPatientPanel.vue';
import ApplicationRegistrationSpecimenTable from '../components/ApplicationRegistrationSpecimenTable.vue';
import ApplicationRegistrationWorkbenchToolbar from '../components/ApplicationRegistrationWorkbenchToolbar.vue';
import { getWorkflowPageErrorMessage } from '../utils/error';

const loading = ref(false);
const saving = ref(false);
const pageError = ref('');
const emptyDescription = ref('请输入申请单编号 / 申请单号 / 住院号查询');
const searchKeyword = ref('');
const dictionaryKeyword = ref('');
const currentRecord = ref<ApplicationRegistrationWorkbenchRecord | null>(null);
const buildingOptions = ref<OperatingBuildingOption[]>([]);
const roomOptions = ref<OperatingRoomOption[]>([]);
const dictionaryGroups = ref<SpecimenDictionaryGroup[]>([]);
const specimenEntryOptions = ref<SpecimenDictionaryEntryOption[]>([]);
const commonSpecimenOptions = ref<SpecimenDictionaryEntryOption[]>([]);
const specimenPackageOptions = ref<SpecimenPackageOption[]>([]);
const selectedBuildingId = ref('');
const selectedRoomId = ref('');
const specimenItems = ref<WorkbenchSpecimenItem[]>([]);
const packageDialogVisible = ref(false);
const specimenSequenceSeed = ref(22500);

const selectedBuilding = computed(
  () =>
    buildingOptions.value.find(
      (building) => building.buildingId === selectedBuildingId.value,
    ) ?? null,
);

const selectedRoom = computed(
  () => roomOptions.value.find((room) => room.roomId === selectedRoomId.value) ?? null,
);

const canRenderWorkbench = computed(() => currentRecord.value !== null);

const saveDisabled = computed(
  () =>
    loading.value ||
    saving.value ||
    !currentRecord.value ||
    specimenItems.value.length === 0,
);

const specimenPrintContext = computed<null | WorkbenchSpecimenPrintContext>(() => {
  if (!currentRecord.value) {
    return null;
  }

  return {
    applyDept: currentRecord.value.patientInfo.applyDept ?? '',
    gender: currentRecord.value.patientInfo.gender ?? '',
    idNo: currentRecord.value.patientInfo.idNo ?? '',
    patientName: currentRecord.value.patientInfo.patientName ?? '',
    roomLabel: selectedRoom.value?.roomName ?? '',
    surgeryTime: currentRecord.value.surgeryInfo.fixationTime ?? '',
  };
});

function cloneSpecimenItems(items: WorkbenchSpecimenItem[]) {
  return items.map((item) => ({ ...item }));
}

function resetSpecimenSequence(items: WorkbenchSpecimenItem[]) {
  const maxSequence = items.reduce((currentMax, item) => {
    const numericValue = Number(item.specimenNo);
    return Number.isFinite(numericValue)
      ? Math.max(currentMax, numericValue)
      : currentMax;
  }, 22500);

  specimenSequenceSeed.value = maxSequence;
}

function nextSpecimenNo() {
  specimenSequenceSeed.value += 1;
  return String(specimenSequenceSeed.value).padStart(5, '0');
}

function createSpecimenItem(
  payload: Pick<
    SpecimenPackageItem,
    'quantity' | 'specimenName' | 'specimenSite' | 'status'
  >,
  source: string,
): WorkbenchSpecimenItem {
  const specimenNo = nextSpecimenNo();

  return {
    id: `${source}-${specimenNo}-${specimenItems.value.length + 1}`,
    quantity: payload.quantity,
    specimenName: payload.specimenName,
    specimenNo,
    specimenSite: payload.specimenSite,
    status: payload.status,
  };
}

function clearWorkbenchState(description = '请输入申请单编号 / 申请单号 / 住院号查询') {
  currentRecord.value = null;
  specimenItems.value = [];
  selectedBuildingId.value = '';
  selectedRoomId.value = '';
  roomOptions.value = [];
  emptyDescription.value = description;
}

function syncWorkbenchRecord(record: ApplicationRegistrationWorkbenchRecord) {
  currentRecord.value = {
    ...record,
    contagiousSpecimen: { ...record.contagiousSpecimen },
    gynecologyInfo: {
      ...record.gynecologyInfo,
      specialConditions: { ...record.gynecologyInfo.specialConditions },
    },
    patientInfo: { ...record.patientInfo },
    specimenItems: cloneSpecimenItems(record.specimenItems),
    surgeryInfo: { ...record.surgeryInfo },
  };
  specimenItems.value = cloneSpecimenItems(record.specimenItems);
  resetSpecimenSequence(record.specimenItems);
  selectedBuildingId.value = record.surgeryInfo.buildingId ?? '';
  selectedRoomId.value = record.surgeryInfo.roomId ?? '';
}

function updateCurrentRecord(
  updater: (record: ApplicationRegistrationWorkbenchRecord) => ApplicationRegistrationWorkbenchRecord,
) {
  if (!currentRecord.value) {
    return;
  }

  currentRecord.value = updater(currentRecord.value);
}

async function refreshDictionaryGroups() {
  dictionaryGroups.value = await listSpecimenDictionaryGroups(dictionaryKeyword.value);
}

async function refreshRoomOptions(buildingId: string, preferredRoomId = '') {
  roomOptions.value = await listOperatingRoomOptions(buildingId);
  selectedRoomId.value =
    roomOptions.value.find((room) => room.roomId === preferredRoomId)?.roomId ??
    roomOptions.value[0]?.roomId ??
    '';
}

async function loadWorkbench(keyword: string) {
  const record = await lookupApplicationRegistrationWorkbenchRecord({
    keyword,
  });

  if (!record) {
    clearWorkbenchState('未找到对应申请单编号 / 申请单号 / 住院号');
    return null;
  }

  syncWorkbenchRecord(record);
  await refreshRoomOptions(
    record.surgeryInfo.buildingId ?? '',
    record.surgeryInfo.roomId ?? '',
  );
  updateCurrentRecord((current) => ({
    ...current,
    surgeryInfo: {
      ...current.surgeryInfo,
      buildingId: selectedBuildingId.value,
      roomId: selectedRoomId.value,
    },
  }));
  return record;
}

async function handleSearch() {
  const normalizedKeyword = searchKeyword.value.trim();
  if (!normalizedKeyword) {
    pageError.value = '';
    clearWorkbenchState();
    return;
  }

  loading.value = true;
  pageError.value = '';
  try {
    await loadWorkbench(normalizedKeyword);
  } catch (error) {
    clearWorkbenchState();
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function handleBuildingChange(value: string) {
  selectedBuildingId.value = value;
  await refreshRoomOptions(value);
  updateCurrentRecord((record) => ({
    ...record,
    surgeryInfo: {
      ...record.surgeryInfo,
      buildingId: value,
      roomId: selectedRoomId.value,
    },
  }));
}

function handleRoomChange(value: string) {
  selectedRoomId.value = value;
  updateCurrentRecord((record) => ({
    ...record,
    surgeryInfo: {
      ...record.surgeryInfo,
      roomId: value,
    },
  }));
}

function createManualSpecimenItem(): WorkbenchSpecimenItem {
  return createSpecimenItem(
    {
      quantity: 1,
      specimenName: '',
      specimenSite: '',
      status: '新增',
    },
    'manual',
  );
}

function handleAddManualSpecimen() {
  specimenItems.value = [...specimenItems.value, createManualSpecimenItem()];
}

function handleAppendSpecimen(payload: { specimenName: string; specimenSite: string }) {
  if (!currentRecord.value) {
    ElMessage.warning('请先查询申请单后再追加标本');
    return;
  }

  specimenItems.value = [
    ...specimenItems.value,
    createSpecimenItem(
      {
        quantity: 1,
        specimenName: payload.specimenName,
        specimenSite: payload.specimenSite,
        status: '新增',
      },
      'dict',
    ),
  ];
}

function handleOpenPackageDialog() {
  if (!currentRecord.value) {
    ElMessage.warning('请先查询申请单后再选择套餐');
    return;
  }

  packageDialogVisible.value = true;
}

function handleAppendPackageItems(selectedPackage: SpecimenPackageOption) {
  if (!currentRecord.value) {
    ElMessage.warning('请先查询申请单后再选择套餐');
    return;
  }

  specimenItems.value = [
    ...specimenItems.value,
    ...selectedPackage.items.map((item, index) =>
      createSpecimenItem(
        {
          quantity: item.quantity,
          specimenName: item.specimenName,
          specimenSite: item.specimenSite,
          status: item.status,
        },
        `${selectedPackage.packageId}-${index + 1}`,
      ),
    ),
  ];
}

function handleCreatePackage(createdPackage: SpecimenPackageOption) {
  specimenPackageOptions.value = [createdPackage, ...specimenPackageOptions.value];
}

function handleRecordChange(updatedRecord: ApplicationRegistrationWorkbenchRecord) {
  currentRecord.value = updatedRecord;
}

function buildSavePayload(): null | SaveApplicationRegistrationWorkbenchRequest {
  if (!currentRecord.value) {
    return null;
  }

  const invalidItem = specimenItems.value.find(
    (item) => !item.specimenName.trim() || !item.specimenSite.trim(),
  );
  if (invalidItem) {
    ElMessage.warning('请先补全所有标本的名称和部位后再保存');
    return null;
  }

  return {
    contagiousSpecimen: { ...currentRecord.value.contagiousSpecimen },
    gynecologyInfo: {
      ...currentRecord.value.gynecologyInfo,
      specialConditions: {
        ...currentRecord.value.gynecologyInfo.specialConditions,
      },
    },
    patientInfo: {
      ...currentRecord.value.patientInfo,
    },
    specimenItems: specimenItems.value.map((item) => ({
      quantity: item.quantity,
      specimenName: item.specimenName.trim(),
      specimenNo: item.specimenNo,
      specimenSite: item.specimenSite.trim(),
      status: item.status,
    })),
    surgeryInfo: {
      ...currentRecord.value.surgeryInfo,
      buildingId: selectedBuildingId.value,
      roomId: selectedRoomId.value,
    },
  };
}

async function handleSave() {
  if (!currentRecord.value) {
    return;
  }

  const payload = buildSavePayload();
  if (!payload) {
    return;
  }

  saving.value = true;
  pageError.value = '';
  try {
    const savedRecord = await saveApplicationRegistrationWorkbench(
      currentRecord.value.applicationId,
      payload,
    );

    const refreshKeyword =
      savedRecord.patientInfo.applicationNo ||
      savedRecord.patientInfo.inpatientNo ||
      searchKeyword.value.trim();

    searchKeyword.value = refreshKeyword;
    await loadWorkbench(refreshKeyword);
    ElMessage.success('保存并确认登记成功');
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  } finally {
    saving.value = false;
  }
}

watch(dictionaryKeyword, () => {
  void refreshDictionaryGroups();
});

onMounted(async () => {
  try {
    buildingOptions.value = await listOperatingBuildingOptions();
    specimenEntryOptions.value = await listSpecimenDictionaryEntryOptions();
    commonSpecimenOptions.value = await listCommonSpecimenOptions();
    specimenPackageOptions.value = await listSpecimenPackageOptions();
    await refreshDictionaryGroups();
  } catch (error) {
    pageError.value = getWorkflowPageErrorMessage(error);
  }
});
</script>

<template>
  <Page>
    <div class="flex h-[calc(100vh-150px)] min-h-[720px] flex-col gap-3 overflow-hidden">
      <ElAlert
        v-if="pageError"
        :closable="false"
        :title="pageError"
        show-icon
        type="error"
      />

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
        @save="handleSave"
        @search="handleSearch"
        @update:building-id="handleBuildingChange"
        @update:room-id="handleRoomChange"
        @update:search-keyword="searchKeyword = $event"
      />

      <template v-if="canRenderWorkbench">
        <div class="grid min-h-0 flex-1 gap-3 xl:grid-cols-[620px_minmax(0,1fr)] 2xl:grid-cols-[680px_minmax(0,1fr)]">
          <ApplicationRegistrationPatientPanel
            :building-label="selectedBuilding?.buildingName ?? ''"
            :record="currentRecord"
            :room-label="selectedRoom?.roomName ?? ''"
            @update:record="handleRecordChange"
          />

          <div class="flex min-h-0 flex-col gap-3">
            <ApplicationRegistrationSpecimenTable
              :common-specimen-options="commonSpecimenOptions"
              :items="specimenItems"
              :print-context="specimenPrintContext"
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
  </Page>
</template>
