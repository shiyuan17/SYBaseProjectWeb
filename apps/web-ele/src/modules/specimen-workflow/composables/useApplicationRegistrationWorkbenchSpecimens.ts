import type { Ref } from 'vue';

import type {
  ApplicationRegistrationWorkbenchRecord,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageItem,
  SpecimenPackageOption,
  WorkbenchSpecimenItem,
} from '../types/application-registration-workbench';

import { computed, onMounted, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  getSpecimenDictionary,
  listSpecimenPackageOptions,
} from '../api/application-registration-workbench-service';
import { getWorkflowPageErrorMessage } from '../utils/error';

function cloneSpecimenItems(items: WorkbenchSpecimenItem[]) {
  return items.map((item) => ({ ...item }));
}

function buildSpecimenDictionaryEntryKey(
  partName: string,
  specimenName: string,
) {
  return `${partName.trim().toLowerCase()}\u0000${specimenName.trim().toLowerCase()}`;
}

function buildSpecimenPartKey(partName: string) {
  return partName.trim().toLowerCase();
}

function dedupeCommonSpecimenOptionsByPart(
  options: SpecimenDictionaryEntryOption[],
) {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = buildSpecimenPartKey(option.partName);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function filterCommonSpecimensFromDictionaryGroups(
  groups: SpecimenDictionaryGroup[],
  commonOptions: SpecimenDictionaryEntryOption[],
) {
  if (commonOptions.length === 0) {
    return groups;
  }

  const commonEntryKeys = new Set(
    commonOptions.map((option) =>
      buildSpecimenDictionaryEntryKey(option.partName, option.specimenName),
    ),
  );

  return groups
    .map((group) => ({
      ...group,
      subParts: group.subParts
        .map((part) => ({
          ...part,
          specimens: part.specimens.filter(
            (specimenName) =>
              !commonEntryKeys.has(
                buildSpecimenDictionaryEntryKey(part.partName, specimenName),
              ),
          ),
        }))
        .filter((part) => part.specimens.length > 0),
    }))
    .filter((group) => group.subParts.length > 0);
}

function splitCommonSpecimenOptions(options: SpecimenDictionaryEntryOption[]) {
  const midpoint = Math.ceil(options.length / 2);
  return {
    departmentCommonSpecimenOptions: options.slice(0, midpoint),
    doctorCommonSpecimenOptions: options.slice(midpoint),
  };
}

export function useApplicationRegistrationWorkbenchSpecimens(options: {
  currentRecord: Ref<ApplicationRegistrationWorkbenchRecord | null>;
  pageError: Ref<string>;
}) {
  let dictionaryRequestSequence = 0;
  const dictionaryKeyword = ref('');
  const activeSystemId = ref('');
  const activePartId = ref('');
  const dictionaryGroups = ref<SpecimenDictionaryGroup[]>([]);
  const commonSpecimenOptions = ref<SpecimenDictionaryEntryOption[]>([]);
  const specimenEntryOptions = ref<SpecimenDictionaryEntryOption[]>([]);
  const specimenPackageOptions = ref<SpecimenPackageOption[]>([]);
  const specimenItems = ref<WorkbenchSpecimenItem[]>([]);
  const packageDialogVisible = ref(false);
  const departmentCommonSpecimenOptions = computed(
    () =>
      splitCommonSpecimenOptions(commonSpecimenOptions.value)
        .departmentCommonSpecimenOptions,
  );
  const doctorCommonSpecimenOptions = computed(
    () =>
      splitCommonSpecimenOptions(commonSpecimenOptions.value)
        .doctorCommonSpecimenOptions,
  );

  function replaceSpecimenItems(items: WorkbenchSpecimenItem[]) {
    specimenItems.value = cloneSpecimenItems(items);
  }

  function clearSpecimenItems() {
    specimenItems.value = [];
  }

  function syncDictionarySelection(groups = dictionaryGroups.value) {
    const [firstSystem] = groups;
    if (!firstSystem) {
      activeSystemId.value = '';
      activePartId.value = '';
      return;
    }

    const selectedSystem =
      groups.find((group) => group.systemId === activeSystemId.value) ??
      firstSystem;
    activeSystemId.value = selectedSystem.systemId;

    const [firstPart] = selectedSystem.subParts;
    if (!firstPart) {
      activePartId.value = '';
      return;
    }

    const selectedPart =
      selectedSystem.subParts.find(
        (part) => part.partId === activePartId.value,
      ) ?? firstPart;
    activePartId.value = selectedPart.partId;
  }

  function createSpecimenItem(
    payload: Pick<
      SpecimenPackageItem,
      'quantity' | 'specimenName' | 'specimenSite' | 'status'
    >,
    source: string,
  ): WorkbenchSpecimenItem {
    return {
      id: `${source}-${specimenItems.value.length + 1}`,
      quantity: payload.quantity,
      specimenName: payload.specimenName,
      specimenNo: '',
      specimenSite: payload.specimenSite,
      status: payload.status,
    };
  }

  async function refreshDictionaryGroups() {
    const requestSequence = ++dictionaryRequestSequence;
    const dictionary = await getSpecimenDictionary(dictionaryKeyword.value);
    if (requestSequence !== dictionaryRequestSequence) {
      return;
    }

    specimenEntryOptions.value = dictionary.entryOptions;
    commonSpecimenOptions.value = dedupeCommonSpecimenOptionsByPart(
      dictionary.commonOptions,
    );
    dictionaryGroups.value = filterCommonSpecimensFromDictionaryGroups(
      dictionary.groups,
      [
        ...departmentCommonSpecimenOptions.value,
        ...doctorCommonSpecimenOptions.value,
      ],
    );
    syncDictionarySelection(dictionaryGroups.value);
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

  function handleAppendSpecimen(payload: {
    specimenName: string;
    specimenSite: string;
  }) {
    if (!options.currentRecord.value) {
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
    if (!options.currentRecord.value) {
      ElMessage.warning('请先查询申请单后再选择套餐');
      return;
    }

    packageDialogVisible.value = true;
  }

  function handleAppendPackageItems(selectedPackage: SpecimenPackageOption) {
    if (!options.currentRecord.value) {
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
    specimenPackageOptions.value = [
      createdPackage,
      ...specimenPackageOptions.value,
    ];
  }

  function handleSelectDictionarySystem(systemId: string) {
    const selectedSystem = dictionaryGroups.value.find(
      (group) => group.systemId === systemId,
    );
    if (!selectedSystem) {
      return;
    }

    activeSystemId.value = selectedSystem.systemId;
    activePartId.value = selectedSystem.subParts[0]?.partId ?? '';
  }

  function handleSelectDictionaryPart(partId: string) {
    activePartId.value = partId;
  }

  onMounted(async () => {
    try {
      specimenPackageOptions.value = await listSpecimenPackageOptions();
      await refreshDictionaryGroups();
    } catch (error) {
      options.pageError.value = getWorkflowPageErrorMessage(error);
    }
  });

  watch(dictionaryKeyword, () => {
    void refreshDictionaryGroups();
  });

  return {
    clearSpecimenItems,
    activePartId,
    activeSystemId,
    departmentCommonSpecimenOptions,
    dictionaryGroups,
    dictionaryKeyword,
    doctorCommonSpecimenOptions,
    handleAddManualSpecimen,
    handleAppendPackageItems,
    handleAppendSpecimen,
    handleCreatePackage,
    handleOpenPackageDialog,
    handleSelectDictionaryPart,
    handleSelectDictionarySystem,
    packageDialogVisible,
    replaceSpecimenItems,
    specimenEntryOptions,
    specimenItems,
    specimenPackageOptions,
  };
}
