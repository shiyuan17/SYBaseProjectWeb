<script setup lang="ts">
import type {
  SpecimenDictionaryEntryOption,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

import { computed } from 'vue';

import {
  ElAutocomplete,
  ElButton,
  ElEmpty,
  ElInputNumber,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { useApplicationRegistrationSpecimenTable } from '../composables/useApplicationRegistrationSpecimenTable';
import { formatSpecimenStatus } from '../utils/format';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

const props = defineProps<{
  commonSpecimenOptions: SpecimenDictionaryEntryOption[];
  items: WorkbenchSpecimenItem[];
  printContext: null | WorkbenchSpecimenPrintContext;
  roomLabel: string;
  specimenEntryOptions: SpecimenDictionaryEntryOption[];
}>();

const emit = defineEmits<{
  addManual: [];
  append: [payload: { specimenName: string; specimenSite: string }];
  selectPackage: [];
  'update:items': [items: WorkbenchSpecimenItem[]];
}>();

const {
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
} = useApplicationRegistrationSpecimenTable({
  items: computed(() => props.items),
  printContext: computed(() => props.printContext),
  specimenEntryOptions: computed(() => props.specimenEntryOptions),
  updateItems: (items) => emit('update:items', items),
});

function appendCommonSpecimen(option: SpecimenDictionaryEntryOption) {
  emit('append', {
    specimenName: option.specimenName,
    specimenSite: option.partName,
  });
}
</script>

<template>
  <WorkflowSectionCard title="标本信息">
    <template #extra>
      <div class="flex gap-2">
        <ElButton disabled size="small">修改手术间</ElButton>
        <ElButton size="small" @click="emit('selectPackage')">
          选择套餐
        </ElButton>
        <ElButton
          :disabled="selectedItemIds.length === 0"
          size="small"
          @click="handleBatchPrint"
        >
          批量打印标本
        </ElButton>
        <ElButton size="small" type="primary" @click="emit('addManual')">
          添加标本
        </ElButton>
      </div>
    </template>

    <div class="flex flex-col">
      <div
        class="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
      >
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
              <span class="text-muted-foreground">{{
                row.specimenNo || '保存后生成'
              }}</span>
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
                @select="handleSpecimenNameSelect(row.id, $event)"
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
                @select="handleSpecimenSiteSelect(row.id, $event)"
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
                @update:model-value="
                  updateItem(row.id, 'quantity', $event ?? 1)
                "
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
                <ElButton
                  link
                  size="small"
                  type="danger"
                  @click="removeItem(row.id)"
                >
                  删除
                </ElButton>
              </div>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <div v-if="props.items.length === 0" class="py-5">
        <ElEmpty
          description="暂无标本，请从下方字典、常用标本或套餐中快速追加"
        />
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
            <span class="text-[11px] text-emerald-600/80">{{
              option.partName
            }}</span>
          </button>
        </div>
      </div>
    </div>
  </WorkflowSectionCard>
</template>
