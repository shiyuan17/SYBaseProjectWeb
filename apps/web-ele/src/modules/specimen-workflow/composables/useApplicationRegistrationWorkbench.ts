import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  OperatingRoomOption,
  SaveApplicationRegistrationWorkbenchRequest,
  WorkbenchLookupType,
} from '../types/application-registration-workbench';
import type { LatestSpecimenRegistrationResult } from '../types/specimen-workflow';

import { computed, onMounted, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  listOperatingBuildingOptions,
  listOperatingRoomOptions,
  lookupApplicationRegistrationWorkbenchRecord,
  saveApplicationRegistrationWorkbench,
} from '../api/application-registration-workbench-service';
import { getLatestRegistrationResult } from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';
import { useApplicationRegistrationWorkbenchSpecimens } from './useApplicationRegistrationWorkbenchSpecimens';

type UseApplicationRegistrationWorkbenchOptions = {
  initialKeyword?: string;
  initialQueryType?: WorkbenchLookupType;
  initialTriggerKey?: number;
};

function normalizeVisibleLookupType(
  type?: WorkbenchLookupType,
): WorkbenchLookupType {
  if (!type || type === 'AUTO') {
    return 'APPLICATION_NO';
  }
  return type;
}

function cloneRecord(
  record: ApplicationRegistrationWorkbenchRecord,
): ApplicationRegistrationWorkbenchRecord {
  return {
    ...record,
    contagiousSpecimen: { ...record.contagiousSpecimen },
    gynecologyInfo: {
      ...record.gynecologyInfo,
      specialConditions: { ...record.gynecologyInfo.specialConditions },
    },
    patientInfo: { ...record.patientInfo },
    specimenItems: record.specimenItems.map((item) => ({ ...item })),
    surgeryInfo: { ...record.surgeryInfo },
  };
}

function getLookupEmptyDescription(type: WorkbenchLookupType) {
  if (type === 'APPLICATION_NO') {
    return '请输入申请单号查询';
  }
  if (type === 'PATIENT_NAME') {
    return '请输入姓名查询';
  }
  return '请输入住院号查询';
}

function getLookupNotFoundDescription(type: WorkbenchLookupType) {
  if (type === 'APPLICATION_NO') {
    return '未找到对应申请单号的工作台记录';
  }
  if (type === 'PATIENT_NAME') {
    return '未找到对应姓名的工作台记录';
  }
  return '未找到对应住院号的工作台记录';
}

export function useApplicationRegistrationWorkbench(
  options: UseApplicationRegistrationWorkbenchOptions = {},
) {
  const loading = ref(false);
  const saving = ref(false);
  const loadingLatestRegistration = ref(false);
  const pageError = ref('');
  const searchType = ref<WorkbenchLookupType>(
    normalizeVisibleLookupType(options.initialQueryType),
  );
  const emptyDescription = ref(getLookupEmptyDescription(searchType.value));
  const searchKeyword = ref(options.initialKeyword?.trim() ?? '');
  const currentRecord = ref<ApplicationRegistrationWorkbenchRecord | null>(
    null,
  );
  const buildingOptions = ref<OperatingBuildingOption[]>([]);
  const roomOptions = ref<OperatingRoomOption[]>([]);
  const selectedBuildingId = ref('');
  const selectedRoomId = ref('');
  const latestRegistrationResult = ref<LatestSpecimenRegistrationResult | null>(
    null,
  );

  const {
    clearSpecimenItems,
    commonSpecimenOptions,
    dictionaryGroups,
    dictionaryKeyword,
    handleAddManualSpecimen,
    handleAppendPackageItems,
    handleAppendSpecimen,
    handleCreatePackage,
    handleOpenPackageDialog,
    packageDialogVisible,
    replaceSpecimenItems,
    specimenEntryOptions,
    specimenItems,
    specimenPackageOptions,
  } = useApplicationRegistrationWorkbenchSpecimens({
    currentRecord,
    pageError,
  });

  const selectedBuilding = computed(
    () =>
      buildingOptions.value.find(
        (building) => building.buildingId === selectedBuildingId.value,
      ) ?? null,
  );

  const selectedRoom = computed(
    () =>
      roomOptions.value.find((room) => room.roomId === selectedRoomId.value) ??
      null,
  );

  const canRenderWorkbench = computed(() => currentRecord.value !== null);

  const saveDisabled = computed(
    () =>
      loading.value ||
      saving.value ||
      !currentRecord.value ||
      specimenItems.value.length === 0,
  );

  function clearWorkbenchState(
    description = getLookupEmptyDescription(searchType.value),
  ) {
    currentRecord.value = null;
    clearSpecimenItems();
    selectedBuildingId.value = '';
    selectedRoomId.value = '';
    roomOptions.value = [];
    latestRegistrationResult.value = null;
    emptyDescription.value = description;
  }

  function syncWorkbenchRecord(record: ApplicationRegistrationWorkbenchRecord) {
    currentRecord.value = cloneRecord(record);
    replaceSpecimenItems(record.specimenItems);
    selectedBuildingId.value = record.surgeryInfo.buildingId ?? '';
    selectedRoomId.value = record.surgeryInfo.roomId ?? '';
  }

  function updateCurrentRecord(
    updater: (
      record: ApplicationRegistrationWorkbenchRecord,
    ) => ApplicationRegistrationWorkbenchRecord,
  ) {
    if (!currentRecord.value) {
      return;
    }

    currentRecord.value = updater(currentRecord.value);
  }

  async function refreshRoomOptions(buildingId: string, preferredRoomId = '') {
    roomOptions.value = await listOperatingRoomOptions(buildingId);
    selectedRoomId.value =
      roomOptions.value.find((room) => room.roomId === preferredRoomId)
        ?.roomId ??
      roomOptions.value[0]?.roomId ??
      '';
  }

  async function loadLatestRegistration(applicationId: string) {
    loadingLatestRegistration.value = true;
    try {
      latestRegistrationResult.value =
        await getLatestRegistrationResult(applicationId);
    } catch (error) {
      latestRegistrationResult.value = null;
      pageError.value = getWorkflowPageErrorMessage(error);
    } finally {
      loadingLatestRegistration.value = false;
    }
  }

  async function loadWorkbench(
    keyword: string,
    queryTypeOverride?: WorkbenchLookupType,
  ) {
    const lookupType = queryTypeOverride ?? searchType.value;
    const record = await lookupApplicationRegistrationWorkbenchRecord({
      keyword,
      queryType: lookupType,
    });

    if (!record) {
      clearWorkbenchState(getLookupNotFoundDescription(searchType.value));
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
    await loadLatestRegistration(record.applicationId);
    return record;
  }

  async function handleSearch(
    keywordOverride?: string,
    queryTypeOverride?: WorkbenchLookupType,
  ) {
    const normalizedKeyword = (keywordOverride ?? searchKeyword.value).trim();
    searchKeyword.value = normalizedKeyword;
    if (!normalizedKeyword) {
      pageError.value = '';
      clearWorkbenchState();
      return null;
    }

    loading.value = true;
    pageError.value = '';
    try {
      return await loadWorkbench(normalizedKeyword, queryTypeOverride);
    } catch (error) {
      clearWorkbenchState();
      pageError.value = getWorkflowPageErrorMessage(error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function handleSearchTypeChange(value: WorkbenchLookupType) {
    const normalizedType = normalizeVisibleLookupType(value);
    if (searchType.value === normalizedType) {
      return;
    }
    searchType.value = normalizedType;
    pageError.value = '';
    clearWorkbenchState(getLookupEmptyDescription(normalizedType));
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

  function handleRecordChange(
    updatedRecord: ApplicationRegistrationWorkbenchRecord,
  ) {
    currentRecord.value = cloneRecord(updatedRecord);
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
      return null;
    }

    const payload = buildSavePayload();
    if (!payload) {
      return null;
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

      if (savedRecord.patientInfo.applicationNo) {
        searchType.value = 'APPLICATION_NO';
      } else if (savedRecord.patientInfo.inpatientNo) {
        searchType.value = 'INPATIENT_NO';
      }
      searchKeyword.value = refreshKeyword;
      await loadWorkbench(refreshKeyword);
      ElMessage.success('保存并确认登记成功');
      return {
        latestRegistrationResult: latestRegistrationResult.value,
        record: currentRecord.value,
      };
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
      return null;
    } finally {
      saving.value = false;
    }
  }

  onMounted(async () => {
    try {
      buildingOptions.value = await listOperatingBuildingOptions();
    } catch (error) {
      pageError.value = getWorkflowPageErrorMessage(error);
    }
  });

  return {
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
    latestRegistrationResult,
    loading,
    loadingLatestRegistration,
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
  };
}
