<script setup lang="ts">
import type { GrossingSpecimenItemRequest } from '../types/technical-workflow';

import type { WorkflowReferenceOption } from '#/modules/system-management/types/workflow-reference';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from 'element-plus';

import ReferenceOptionSelect from '#/modules/system-management/components/ReferenceOptionSelect.vue';

defineProps<{
  embeddingRemarkOptions: WorkflowReferenceOption[];
  specimen: GrossingSpecimenItemRequest | null;
}>();

const emit = defineEmits<{
  addEmbeddingBoxes: [count: number];
  removeEmbeddingBox: [index: number];
}>();

const statusOptions = [
  { label: '待确认', value: 'PENDING' },
  { label: '已确认', value: 'CONFIRMED' },
] as const;

function formatEmbeddingBoxStatus(status: null | string | undefined) {
  return status === 'CONFIRMED' ? '已确认' : '待确认';
}

function getEmbeddingBoxStatusTagType(status: null | string | undefined) {
  return status === 'CONFIRMED' ? 'success' : 'warning';
}

async function handleRemoveEmbeddingBox(index: number) {
  await ElMessageBox.confirm('确认删除该包埋盒吗？', '删除包埋盒', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  });
  emit('removeEmbeddingBox', index);
}
</script>

<template>
  <section class="mb-3 rounded-md border border-border">
    <header
      class="flex min-h-9 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2"
    >
      <span class="text-xs font-semibold text-foreground">包埋盒</span>
      <div class="inline-flex items-center gap-1">
        <ElTooltip content="添加 1 个包埋盒" placement="top">
          <span class="inline-flex">
            <ElButton
              :disabled="!specimen"
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
              :disabled="!specimen"
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
              :disabled="!specimen"
              size="small"
              @click="emit('addEmbeddingBoxes', 5)"
            >
              +5
            </ElButton>
          </span>
        </ElTooltip>
      </div>
    </header>

    <div v-if="specimen" class="overflow-x-auto">
      <ElTable
        v-if="specimen.embeddingBoxes?.length"
        :data="specimen.embeddingBoxes"
        size="small"
        table-layout="fixed"
      >
        <ElTableColumn label="序号" width="64">
          <template #default="{ row, $index }">
            {{ row.sequenceNo || $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="盒名称" min-width="120">
          <template #default="{ row }">
            <ElInput v-model="row.boxName" placeholder="盒名称" size="small" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="盒号" min-width="110">
          <template #default="{ row }">
            <ElInput
              v-model="row.embeddingBoxNo"
              placeholder="A1"
              size="small"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" min-width="110">
          <template #default="{ row }">
            <ElSelect v-model="row.status" size="small">
              <ElOption
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </template>
        </ElTableColumn>
        <ElTableColumn label="包埋备注" min-width="160">
          <template #default="{ row }">
            <ReferenceOptionSelect
              v-model="row.embeddingRemarks"
              :options="embeddingRemarkOptions"
              placeholder="请选择或输入包埋备注"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="80">
          <template #default="{ $index }">
            <ElButton
              link
              size="small"
              type="danger"
              @click="void handleRemoveEmbeddingBox($index)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="当前标本暂无包埋盒" />
    </div>

    <ElEmpty v-else description="当前没有可编辑标本" />

    <footer
      v-if="specimen?.embeddingBoxes?.length"
      class="flex flex-wrap gap-1 border-t border-border px-3 py-2 text-xs text-muted-foreground"
    >
      <ElTag
        v-for="box in specimen.embeddingBoxes"
        :key="`${box.sequenceNo}-${box.embeddingBoxNo}`"
        :type="getEmbeddingBoxStatusTagType(box.status)"
        effect="plain"
        size="small"
      >
        {{ box.embeddingBoxNo || '未填盒号' }} /
        {{ formatEmbeddingBoxStatus(box.status) }}
      </ElTag>
    </footer>
  </section>
</template>
