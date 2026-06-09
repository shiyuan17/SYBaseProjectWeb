<script setup lang="ts">
import type { GrossingEmbeddingBoxTableRow } from '../composables/useGrossingWorkbench';

import type { WorkflowReferenceOption } from '#/modules/system-management/types/workflow-reference';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTooltip,
} from 'element-plus';

import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

defineProps<{
  canAddEmbeddingBox: boolean;
  embeddingBoxRows: GrossingEmbeddingBoxTableRow[];
  embeddingRemarkOptions: WorkflowReferenceOption[];
  selectedSpecimenKey: string;
  specimenOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  addEmbeddingBoxes: [count: number];
  removeEmbeddingBox: [boxIndex: number, specimenIndex: number];
  'update:selectedSpecimenKey': [value: string];
}>();

const statusOptions = [
  { label: '待确认', value: 'PENDING' },
  { label: '已确认', value: 'CONFIRMED' },
] as const;

function handleRemoveEmbeddingBox(row: GrossingEmbeddingBoxTableRow) {
  emit('removeEmbeddingBox', row.boxIndex, row.specimenIndex);
}

function handleSelectedSpecimenKeyChange(value: number | string) {
  emit('update:selectedSpecimenKey', String(value));
}

function formatEmbeddingBoxNo(embeddingBoxNo: string) {
  const normalizedValue = embeddingBoxNo.trim();
  if (!normalizedValue) {
    return '-';
  }
  const suffixMatch = normalizedValue.match(/([A-Za-z]+\d+)$/);
  return suffixMatch?.[1]?.toUpperCase() ?? normalizedValue;
}
</script>

<template>
  <section class="mb-3 rounded-md border border-border">
    <header
      class="flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2"
    >
      <div class="inline-flex flex-nowrap items-center gap-2">
        <span class="shrink-0 text-sm font-semibold text-foreground">
          标本名称
        </span>
        <ElSelect
          :model-value="selectedSpecimenKey"
          aria-label="标本名称"
          class="w-72 min-w-[288px] flex-none"
          popper-class="grossing-specimen-select-popper"
          @update:model-value="handleSelectedSpecimenKeyChange"
        >
          <ElOption
            v-for="option in specimenOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </div>
      <div class="inline-flex items-center gap-1">
        <ElTooltip content="添加 1 个包埋盒" placement="top">
          <span class="inline-flex">
            <ElButton
              :disabled="!canAddEmbeddingBox"
              size="small"
              @click="emit('addEmbeddingBoxes', 1)"
            >
              +1
            </ElButton>
          </span>
        </ElTooltip>
        <ElTooltip content="添加 2 个包埋盒" placement="top">
          <span class="inline-flex">
            <ElButton
              :disabled="!canAddEmbeddingBox"
              size="small"
              @click="emit('addEmbeddingBoxes', 2)"
            >
              +2
            </ElButton>
          </span>
        </ElTooltip>
        <ElTooltip content="添加 5 个包埋盒" placement="top">
          <span class="inline-flex">
            <ElButton
              :disabled="!canAddEmbeddingBox"
              size="small"
              @click="emit('addEmbeddingBoxes', 5)"
            >
              +5
            </ElButton>
          </span>
        </ElTooltip>
      </div>
    </header>

    <div v-if="canAddEmbeddingBox" class="overflow-x-auto">
      <ElTable
        v-if="embeddingBoxRows.length > 0"
        :data="embeddingBoxRows"
        size="small"
        table-layout="fixed"
      >
        <ElTableColumn label="序号" width="64">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="标本名称" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.specimenName || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="盒名称" min-width="120">
          <template #default="{ row }">
            <ElInput
              v-model="row.box.boxName"
              placeholder="盒名称"
              size="small"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="盒号" min-width="72" width="80">
          <template #default="{ row }">
            <span
              class="text-sm font-medium text-foreground"
              :title="row.box.embeddingBoxNo || '-'"
            >
              {{ formatEmbeddingBoxNo(row.box.embeddingBoxNo) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="132">
          <template #default="{ row }">
            <ElSelect
              v-model="row.box.status"
              class="w-full"
              popper-class="grossing-status-select-popper"
              size="small"
            >
              <ElOption
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="包埋备注" min-width="240">
          <template #default="{ row }">
            <ReferenceOptionSelect
              v-model="row.box.embeddingRemarks"
              :options="embeddingRemarkOptions"
              placeholder="请选择或输入包埋备注"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" width="80">
          <template #default="{ row }">
            <ElButton
              link
              size="small"
              type="danger"
              @click="handleRemoveEmbeddingBox(row)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="当前标本暂无包埋盒" />
    </div>

    <ElEmpty v-else description="当前没有可编辑标本" />
  </section>
</template>

<style scoped>
:global(.grossing-specimen-select-popper) {
  min-width: 288px;
}

:global(.grossing-specimen-select-popper .el-select-dropdown__item) {
  height: auto;
  min-height: 36px;
  padding-top: 8px;
  padding-bottom: 8px;
  font-size: 14px;
  line-height: 20px;
  white-space: normal;
}

:global(.grossing-status-select-popper) {
  min-width: 132px;
}

:global(.grossing-status-select-popper .el-select-dropdown__item) {
  font-size: 14px;
}
</style>
