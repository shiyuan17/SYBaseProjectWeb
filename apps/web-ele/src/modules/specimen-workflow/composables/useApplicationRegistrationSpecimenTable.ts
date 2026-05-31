import type { TagProps } from 'element-plus';

import type { Ref } from 'vue';

import type {
  SpecimenDictionaryEntryOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

import { computed, ref } from 'vue';

import { ElMessage } from 'element-plus';

import {
  buildSearchKeywords,
  matchesSearchKeyword,
} from '../utils/specimen-dictionary-search';
import {
  buildSpecimenBatchPrintDocument,
  buildSpecimenPrintDocument,
} from '../utils/specimen-print';

type SpecimenSiteOption = {
  partName: string;
  searchKeywords: string[];
};

const STATUS_TAG_TYPE_MAP: Record<
  string,
  Exclude<TagProps['type'], undefined>
> = {
  CHECKED_IN: 'primary',
  FIXED: 'primary',
  FIXING: 'primary',
  IN_TRANSIT: 'primary',
  RECEIVED: 'primary',
  REGISTERED: 'primary',
  REJECTED: 'warning',
  RETURNED: 'warning',
  VERIFIED: 'primary',
  VERIFYING: 'primary',
  新增: 'info',
  标本确认: 'success',
  离体: 'warning',
};

export function useApplicationRegistrationSpecimenTable(options: {
  items: Ref<WorkbenchSpecimenItem[]>;
  printContext: Ref<null | WorkbenchSpecimenPrintContext>;
  specimenEntryOptions: Ref<SpecimenDictionaryEntryOption[]>;
  updateItems: (items: WorkbenchSpecimenItem[]) => void;
}) {
  const selectedItemIds = ref<string[]>([]);

  const specimenSiteOptions = computed<SpecimenSiteOption[]>(() => {
    const siteMap = new Map<string, SpecimenSiteOption>();

    options.specimenEntryOptions.value.forEach((option) => {
      if (!siteMap.has(option.partName)) {
        siteMap.set(option.partName, {
          partName: option.partName,
          searchKeywords: buildSearchKeywords([
            option.systemName,
            option.partName,
          ]),
        });
      }
    });

    return [...siteMap.values()];
  });

  function getStatusTagType(
    status: string,
  ): Exclude<TagProps['type'], undefined> {
    return STATUS_TAG_TYPE_MAP[status.trim()] ?? 'primary';
  }

  function updateItem(
    itemId: string,
    key: keyof WorkbenchSpecimenItem,
    value: number | string,
  ) {
    options.updateItems(
      options.items.value.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [key]: value,
            }
          : item,
      ),
    );
  }

  function updateSpecimenItem(
    itemId: string,
    payload: Partial<
      Pick<WorkbenchSpecimenItem, 'specimenName' | 'specimenSite'>
    >,
  ) {
    options.updateItems(
      options.items.value.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...payload,
            }
          : item,
      ),
    );
  }

  function removeItem(itemId: string) {
    options.updateItems(
      options.items.value.filter((item) => item.id !== itemId),
    );
    selectedItemIds.value = selectedItemIds.value.filter(
      (selectedId) => selectedId !== itemId,
    );
  }

  function filterSpecimenEntryOptions(keyword: string) {
    if (!keyword.trim()) {
      return options.specimenEntryOptions.value;
    }

    return options.specimenEntryOptions.value.filter((option) =>
      matchesSearchKeyword(keyword, option.searchKeywords),
    );
  }

  function filterSpecimenSiteOptions(keyword: string) {
    if (!keyword.trim()) {
      return specimenSiteOptions.value;
    }

    return specimenSiteOptions.value.filter((option) =>
      matchesSearchKeyword(keyword, option.searchKeywords),
    );
  }

  function querySpecimenEntryOptions(
    keyword: string,
    callback: (items: SpecimenDictionaryEntryOption[]) => void,
  ) {
    callback(filterSpecimenEntryOptions(keyword));
  }

  function querySpecimenSiteOptions(
    keyword: string,
    callback: (items: SpecimenSiteOption[]) => void,
  ) {
    callback(filterSpecimenSiteOptions(keyword));
  }

  function findMatchedSpecimenEntry(value: string) {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return null;
    }

    return (
      options.specimenEntryOptions.value.find(
        (option) => option.specimenName === normalizedValue,
      ) ?? null
    );
  }

  function findMatchedSpecimenSite(value: string) {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return null;
    }

    return (
      specimenSiteOptions.value.find(
        (option) => option.partName === normalizedValue,
      ) ?? null
    );
  }

  function handleSpecimenNameInput(itemId: string, value: number | string) {
    updateItem(itemId, 'specimenName', String(value));
  }

  function isSpecimenDictionaryEntryOption(
    option: unknown,
  ): option is SpecimenDictionaryEntryOption {
    return (
      typeof option === 'object' &&
      option !== null &&
      'partName' in option &&
      typeof (option as { partName?: unknown }).partName === 'string' &&
      'specimenName' in option &&
      typeof (option as { specimenName?: unknown }).specimenName === 'string'
    );
  }

  function isSpecimenSiteOption(option: unknown): option is SpecimenSiteOption {
    return (
      typeof option === 'object' &&
      option !== null &&
      'partName' in option &&
      typeof (option as { partName?: unknown }).partName === 'string'
    );
  }

  function handleSpecimenNameSelect(itemId: string, option: unknown) {
    if (!isSpecimenDictionaryEntryOption(option)) {
      return;
    }

    updateSpecimenItem(itemId, {
      specimenName: option.specimenName,
      specimenSite: option.partName,
    });
  }

  function handleSpecimenNameBlur(itemId: string, value: string) {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      updateSpecimenItem(itemId, {
        specimenName: '',
      });
      return;
    }

    const matchedOption = findMatchedSpecimenEntry(normalizedValue);
    if (matchedOption) {
      updateSpecimenItem(itemId, {
        specimenName: matchedOption.specimenName,
        specimenSite: matchedOption.partName,
      });
      return;
    }

    updateSpecimenItem(itemId, {
      specimenName: normalizedValue,
    });
  }

  function handleSpecimenSiteInput(itemId: string, value: number | string) {
    updateItem(itemId, 'specimenSite', String(value));
  }

  function handleSpecimenSiteSelect(itemId: string, option: unknown) {
    if (!isSpecimenSiteOption(option)) {
      return;
    }

    updateSpecimenItem(itemId, {
      specimenSite: option.partName,
    });
  }

  function handleSpecimenSiteBlur(itemId: string, value: string) {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      updateSpecimenItem(itemId, {
        specimenSite: '',
      });
      return;
    }

    const matchedOption = findMatchedSpecimenSite(normalizedValue);
    updateSpecimenItem(itemId, {
      specimenSite: matchedOption?.partName ?? normalizedValue,
    });
  }

  function handleSelectionChange(rows: WorkbenchSpecimenItem[]) {
    selectedItemIds.value = rows.map((item) => item.id);
  }

  function openPrintWindow(documentHtml: string) {
    const printWindow = window.open('', '_blank', 'width=960,height=760');
    if (!printWindow) {
      ElMessage.warning('打印窗口被浏览器拦截，请允许弹窗后重试');
      return null;
    }

    printWindow.document.open();
    printWindow.document.write(documentHtml);
    printWindow.document.close();
    return printWindow;
  }

  async function printSpecimen(item: WorkbenchSpecimenItem) {
    if (!options.printContext.value) {
      ElMessage.warning('当前缺少标签打印所需的患者上下文信息');
      return;
    }
    if (!item.specimenNo) {
      ElMessage.warning('请先保存登记后再打印标本标签');
      return;
    }

    try {
      const printDocument = buildSpecimenPrintDocument({
        context: options.printContext.value,
        item,
      });
      openPrintWindow(printDocument);
    } catch (error) {
      console.error(error);
      ElMessage.error('标签打印内容生成失败，请稍后重试');
    }
  }

  function handleBatchPrint() {
    if (!options.printContext.value) {
      ElMessage.warning('当前缺少标签打印所需的患者上下文信息');
      return;
    }

    const selectedItems = options.items.value.filter((item) =>
      selectedItemIds.value.includes(item.id),
    );
    if (selectedItems.length === 0) {
      ElMessage.warning('请先勾选需要打印的标本');
      return;
    }
    if (selectedItems.some((item) => !item.specimenNo)) {
      ElMessage.warning('请先保存登记后再批量打印标本标签');
      return;
    }

    try {
      const printDocument = buildSpecimenBatchPrintDocument({
        context: options.printContext.value,
        items: selectedItems,
      });
      openPrintWindow(printDocument);
    } catch (error) {
      console.error(error);
      ElMessage.error('批量打印内容生成失败，请稍后重试');
    }
  }

  return {
    getStatusTagType,
    handleBatchPrint,
    handleSelectionChange,
    handleSpecimenNameBlur,
    handleSpecimenNameInput,
    handleSpecimenNameSelect,
    handleSpecimenSiteBlur,
    handleSpecimenSiteInput,
    handleSpecimenSiteSelect,
    printSpecimen,
    querySpecimenEntryOptions,
    querySpecimenSiteOptions,
    removeItem,
    selectedItemIds,
    updateItem,
  };
}
