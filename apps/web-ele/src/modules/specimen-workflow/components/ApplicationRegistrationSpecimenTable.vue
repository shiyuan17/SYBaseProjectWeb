<script setup lang="ts">
import type {
  SpecimenDictionaryEntryOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

import { computed, ref } from 'vue';

import {
  ElAutocomplete,
  ElButton,
  ElEmpty,
  ElInputNumber,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  buildSearchKeywords,
  matchesSearchKeyword,
} from '../utils/specimen-dictionary-search';
import { formatSpecimenStatus } from '../utils/format';
import {
  buildSpecimenBatchPrintDocument,
  buildSpecimenPrintDocument,
} from '../utils/specimen-print';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

type SpecimenSiteOption = {
  partName: string;
  searchKeywords: string[];
};

const props = defineProps<{
  commonSpecimenOptions: SpecimenDictionaryEntryOption[];
  items: WorkbenchSpecimenItem[];
  printContext: WorkbenchSpecimenPrintContext | null;
  roomLabel: string;
  specimenEntryOptions: SpecimenDictionaryEntryOption[];
}>();

const emit = defineEmits<{
  'add-manual': [];
  append: [payload: { specimenName: string; specimenSite: string }];
  'select-package': [];
  'update:items': [items: WorkbenchSpecimenItem[]];
}>();

const specimenSiteOptions = computed<SpecimenSiteOption[]>(() => {
  const siteMap = new Map<string, SpecimenSiteOption>();

  props.specimenEntryOptions.forEach((option) => {
    if (!siteMap.has(option.partName)) {
      siteMap.set(option.partName, {
        partName: option.partName,
        searchKeywords: buildSearchKeywords([option.systemName, option.partName]),
      });
    }
  });

  return [...siteMap.values()];
});

const selectedItemIds = ref<string[]>([]);

function getStatusTagType(status: string) {
  switch (status.trim()) {
    case 'CHECKED_IN':
    case 'FIXED':
    case 'FIXING':
    case 'IN_TRANSIT':
    case 'RECEIVED':
    case 'REGISTERED':
    case 'VERIFIED':
    case 'VERIFYING':
      return 'primary';
    case 'REJECTED':
    case 'RETURNED':
      return 'warning';
    case '标本确认':
      return 'success';
    case '离体':
      return 'warning';
    case '新增':
      return 'info';
    default:
      return 'primary';
  }
}

function updateItem(
  itemId: string,
  key: keyof WorkbenchSpecimenItem,
  value: number | string,
) {
  emit(
    'update:items',
    props.items.map((item) =>
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
  payload: Partial<Pick<WorkbenchSpecimenItem, 'specimenName' | 'specimenSite'>>,
) {
  emit(
    'update:items',
    props.items.map((item) =>
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
  emit(
    'update:items',
    props.items.filter((item) => item.id !== itemId),
  );
}

function filterSpecimenEntryOptions(keyword: string) {
  if (!keyword.trim()) {
    return props.specimenEntryOptions;
  }

  return props.specimenEntryOptions.filter((option) =>
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
    props.specimenEntryOptions.find(
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
    specimenSiteOptions.value.find((option) => option.partName === normalizedValue) ??
    null
  );
}

function handleSpecimenNameInput(itemId: string, value: number | string) {
  updateItem(itemId, 'specimenName', String(value));
}

function handleSpecimenNameSelect(
  itemId: string,
  option: SpecimenDictionaryEntryOption,
) {
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

function handleSpecimenSiteSelect(itemId: string, option: SpecimenSiteOption) {
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

function appendCommonSpecimen(option: SpecimenDictionaryEntryOption) {
  emit('append', {
    specimenName: option.specimenName,
    specimenSite: option.partName,
  });
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
  if (!props.printContext) {
    ElMessage.warning('当前缺少标签打印所需的患者上下文信息');
    return;
  }
  if (!item.specimenNo) {
    ElMessage.warning('请先保存登记后再打印标本标签');
    return;
  }

  try {
    const printDocument = buildSpecimenPrintDocument({
      context: props.printContext,
      item,
    });
    openPrintWindow(printDocument);
  } catch (error) {
    console.error(error);
    ElMessage.error('标签打印内容生成失败，请稍后重试');
  }
}

function handleSelectionChange(rows: WorkbenchSpecimenItem[]) {
  selectedItemIds.value = rows.map((item) => item.id);
}

function handleBatchPrint() {
  if (!props.printContext) {
    ElMessage.warning('当前缺少标签打印所需的患者上下文信息');
    return;
  }

  const selectedItems = props.items.filter((item) => selectedItemIds.value.includes(item.id));
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
      context: props.printContext,
      items: selectedItems,
    });
    openPrintWindow(printDocument);
  } catch (error) {
    console.error(error);
    ElMessage.error('批量打印内容生成失败，请稍后重试');
  }
}

function normalizeSpecimenEntryOption(option: Record<string, unknown>) {
  return option as unknown as SpecimenDictionaryEntryOption;
}

function normalizeSpecimenSiteOption(option: Record<string, unknown>) {
  return option as unknown as SpecimenSiteOption;
}
</script>

<template>
  <WorkflowSectionCard title="标本信息">
    <template #extra>
      <div class="flex gap-2">
        <ElButton disabled size="small">修改手术间</ElButton>
        <ElButton size="small" @click="emit('select-package')">选择套餐</ElButton>
        <ElButton :disabled="selectedItemIds.length === 0" size="small" @click="handleBatchPrint">
          批量打印标本
        </ElButton>
        <ElButton size="small" type="primary" @click="emit('add-manual')">
          添加标本
        </ElButton>
      </div>
    </template>

    <div class="flex flex-col">
      <div class="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>当前手术室：{{ roomLabel || '-' }}</span>
      </div>

      <div>
        <ElTable
          :data="props.items"
          :max-height="props.items.length > 0 ? 280 : undefined"
          border
          row-key="id"
          size="small"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn type="selection" width="48" />
          <ElTableColumn align="center" label="#" width="52">
            <template #default="{ $index }">
              {{ $index + 1 }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="流水号" min-width="120">
            <template #default="{ row }">
              <span class="text-muted-foreground">{{ row.specimenNo || '保存后生成' }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="标本名称" min-width="260">
            <template #default="{ row }">
              <ElAutocomplete
                :fetch-suggestions="querySpecimenEntryOptions"
                :model-value="row.specimenName"
                :trigger-on-focus="true"
                class="w-full"
                placeholder="支持中文或拼音首字母"
                value-key="specimenName"
                @blur="handleSpecimenNameBlur(row.id, row.specimenName)"
                @select="
                  handleSpecimenNameSelect(
                    row.id,
                    normalizeSpecimenEntryOption($event),
                  )
                "
                @update:model-value="handleSpecimenNameInput(row.id, $event)"
              >
                <template #default="{ item }">
                  <div class="flex items-center justify-between gap-3">
                    <span class="truncate">{{ item.specimenName }}</span>
                    <span class="shrink-0 text-xs text-muted-foreground">
                      {{ item.partName }}
                    </span>
                  </div>
                </template>
              </ElAutocomplete>
            </template>
          </ElTableColumn>
          <ElTableColumn label="部位" min-width="160">
            <template #default="{ row }">
              <ElAutocomplete
                :fetch-suggestions="querySpecimenSiteOptions"
                :model-value="row.specimenSite"
                :trigger-on-focus="true"
                class="w-full"
                placeholder="支持中文或拼音首字母"
                value-key="partName"
                @blur="handleSpecimenSiteBlur(row.id, row.specimenSite)"
                @select="
                  handleSpecimenSiteSelect(
                    row.id,
                    normalizeSpecimenSiteOption($event),
                  )
                "
                @update:model-value="handleSpecimenSiteInput(row.id, $event)"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="数量" min-width="96">
            <template #default="{ row }">
              <ElInputNumber
                :min="1"
                :model-value="row.quantity"
                size="small"
                style="width: 100%"
                @update:model-value="updateItem(row.id, 'quantity', $event ?? 1)"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" min-width="112">
            <template #default="{ row }">
              <ElTag
                :type="getStatusTagType(row.status)"
                effect="light"
                round
                size="small"
              >
                {{ formatSpecimenStatus(row.status) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn fixed="right" label="操作" width="132">
            <template #default="{ row }">
              <div class="flex items-center gap-2">
                <ElButton
                  :disabled="!row.specimenNo"
                  link
                  size="small"
                  type="primary"
                  @click="printSpecimen(row)"
                >
                  打印
                </ElButton>
                <ElButton link size="small" type="danger" @click="removeItem(row.id)">
                  删除
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <div v-if="props.items.length === 0" class="py-5">
        <ElEmpty description="暂无标本，请从下方字典、常用标本或套餐中快速追加" />
      </div>

      <div
        v-if="props.commonSpecimenOptions.length > 0"
        class="mt-2 rounded-lg border border-border/70 bg-muted/10 px-2.5 py-2"
      >
        <div class="mb-1.5 flex items-center justify-between gap-3">
          <div class="text-xs font-semibold text-foreground">常用标本</div>
          <div class="text-[11px] text-muted-foreground">
            支持快捷追加，也可在上方按中文或拼音首字母检索
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in props.commonSpecimenOptions"
            :key="`${option.partId}-${option.specimenName}`"
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs leading-5 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            type="button"
            @click="appendCommonSpecimen(option)"
          >
            <span>{{ option.specimenName }}</span>
            <span class="text-[11px] text-emerald-600/80">{{ option.partName }}</span>
          </button>
        </div>
      </div>
    </div>
  </WorkflowSectionCard>
</template>
