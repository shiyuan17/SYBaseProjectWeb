import type { Ref } from 'vue';

import type {
  ApplicationRegistrationWorkbenchRecord,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageItem,
  SpecimenPackageOption,
  WorkbenchSpecimenItem,
} from '../types/application-registration-workbench';

import { onMounted, ref, watch } from 'vue';

import { ElMessage } from 'element-plus';

import {
  listCommonSpecimenOptions,
  listSpecimenDictionaryEntryOptions,
  listSpecimenDictionaryGroups,
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

export function useApplicationRegistrationWorkbenchSpecimens(options: {
  currentRecord: Ref<ApplicationRegistrationWorkbenchRecord | null>;
  pageError: Ref<string>;
}) {
  const dictionaryKeyword = ref('');
  const dictionaryGroups = ref<SpecimenDictionaryGroup[]>([]);
  const specimenEntryOptions = ref<SpecimenDictionaryEntryOption[]>([]);
  const commonSpecimenOptions = ref<SpecimenDictionaryEntryOption[]>([]);
  const specimenPackageOptions = ref<SpecimenPackageOption[]>([]);
  const specimenItems = ref<WorkbenchSpecimenItem[]>([]);
  const packageDialogVisible = ref(false);

  function replaceSpecimenItems(items: WorkbenchSpecimenItem[]) {
    specimenItems.value = cloneSpecimenItems(items);
  }

  function clearSpecimenItems() {
    specimenItems.value = [];
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
    const groups = await listSpecimenDictionaryGroups(dictionaryKeyword.value);
    dictionaryGroups.value = filterCommonSpecimensFromDictionaryGroups(
      groups,
      commonSpecimenOptions.value,
    );
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

  onMounted(async () => {
    try {
      specimenEntryOptions.value = await listSpecimenDictionaryEntryOptions();
      commonSpecimenOptions.value = dedupeCommonSpecimenOptionsByPart(
        await listCommonSpecimenOptions(),
      );
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
  };
}
