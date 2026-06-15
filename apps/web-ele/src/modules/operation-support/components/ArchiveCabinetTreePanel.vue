<script setup lang="ts">
import type {
  ArchiveCabinetNodeView,
  ArchiveCabinetView,
} from '../types/operation-support';

import { computed, ref } from 'vue';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { ARCHIVE_CABINET_TYPE_OPTIONS } from '../constants';
import {
  formatArchiveCabinetNodeType,
  formatArchiveCabinetType,
  formatNullable,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type CabinetTreeNode = {
  cabinet?: ArchiveCabinetView;
  cabinetType?: string;
  capacity?: number;
  children?: CabinetTreeNode[];
  code: string;
  id: string;
  node?: ArchiveCabinetNodeView;
  nodeType: 'AREA' | 'CABINET' | 'DRAWER' | 'ROOT';
  path?: string;
  remainingCapacity?: number;
  remarks?: null | string;
};

const props = defineProps<{
  cabinetNodes: ArchiveCabinetNodeView[];
  cabinets: ArchiveCabinetView[];
  canCreateCabinet: boolean;
  canDeleteCabinet: boolean;
  canQueryCabinets: boolean;
  canUpdateCabinet: boolean;
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: 'deleteCabinet', cabinet: ArchiveCabinetView): void;
  (event: 'loadCabinets'): void;
  (event: 'loadCabinetNodes'): void;
  (event: 'loadPositions'): void;
  (event: 'openBatchCreateCabinetDialog'): void;
  (event: 'openCreateCabinetDialog'): void;
  (event: 'openEditCabinetDialog', cabinet: ArchiveCabinetView): void;
  (event: 'openEditCabinetNodeDialog', node: ArchiveCabinetNodeView): void;
  (event: 'toggleCabinetStatus', cabinet: ArchiveCabinetView): void;
}>();

const selectedCabinetType = ref('');
const expandAll = ref(true);
const tableRenderKey = ref(0);

const quickTypeOptions = computed(() => [
  { label: '不限类型', value: '' },
  ...ARCHIVE_CABINET_TYPE_OPTIONS.map((option) => ({
    label: getCabinetTypeTreeLabel(option.label),
    value: option.value,
  })),
]);

const filteredNodes = computed(() =>
  props.cabinetNodes.filter(
    (node) =>
      !selectedCabinetType.value ||
      node.cabinetType === selectedCabinetType.value,
  ),
);

const treeRows = computed<CabinetTreeNode[]>(() => {
  const nodesByParentId = new Map<string, ArchiveCabinetNodeView[]>();
  for (const node of filteredNodes.value) {
    const parentKey = node.parentId || 'ROOT';
    const siblings = nodesByParentId.get(parentKey) ?? [];
    siblings.push(node);
    nodesByParentId.set(parentKey, siblings);
  }

  const children: CabinetTreeNode[] = buildNodeRows(nodesByParentId, 'ROOT');

  return [
    {
      capacity: children.reduce<number>(
        (sum: number, node: CabinetTreeNode) => sum + (node.capacity ?? 0),
        0,
      ),
      children,
      code: 'ROOT',
      id: 'ROOT',
      nodeType: 'ROOT',
      path: '-',
      remainingCapacity: children.reduce<number>(
        (sum: number, node: CabinetTreeNode) =>
          sum + (node.remainingCapacity ?? 0),
        0,
      ),
      remarks: '-',
    },
  ];
});

function getCabinetTypeTreeLabel(label: string) {
  return label === '标准柜' ? label : label.replace(/柜$/, '');
}

function buildNodeRows(
  nodesByParentId: Map<string, ArchiveCabinetNodeView[]>,
  parentId: string,
): CabinetTreeNode[] {
  return (nodesByParentId.get(parentId) ?? [])
    .toSorted((left, right) => left.nodeCode.localeCompare(right.nodeCode))
    .map((node) => {
      const cabinet =
        node.cabinetId && node.nodeType === 'CABINET'
          ? props.cabinets.find((item) => item.id === node.cabinetId)
          : undefined;
      return {
        cabinet,
        cabinetType: node.cabinetType ?? undefined,
        capacity: node.capacity,
        children: buildNodeRows(nodesByParentId, node.id),
        code: node.nodeCode,
        id: node.id,
        node,
        nodeType: node.nodeType,
        path: node.pathLocation ?? '-',
        remainingCapacity: node.remainingCapacity,
        remarks: node.remarks ?? '-',
      } satisfies CabinetTreeNode;
    });
}

function refreshAll() {
  emit('loadCabinets');
  emit('loadCabinetNodes');
  emit('loadPositions');
}

function toggleExpandAll() {
  expandAll.value = !expandAll.value;
  tableRenderKey.value += 1;
}
</script>

<template>
  <OperationSectionCard title="归档柜列表">
    <ElAlert
      v-if="!canQueryCabinets"
      :closable="false"
      class="mb-3"
      title="当前账号缺少归档柜查询权限，无法查看归档柜与柜位列表。"
      type="warning"
    />

    <ElForm class="mb-4" inline label-width="88px">
      <ElFormItem>
        <ElButton @click="refreshAll">刷新</ElButton>
      </ElFormItem>
      <ElFormItem>
        <ElButton @click="toggleExpandAll">展开/折叠</ElButton>
      </ElFormItem>
      <ElFormItem label="快速检索">
        <ElSelect
          v-model="selectedCabinetType"
          class="w-[220px] min-w-[220px] flex-none"
        >
          <ElOption
            v-for="option in quickTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton
          :disabled="!canCreateCabinet"
          type="primary"
          @click="emit('openCreateCabinetDialog')"
        >
          新增
        </ElButton>
      </ElFormItem>
      <ElFormItem>
        <ElButton
          :disabled="!canCreateCabinet"
          @click="emit('openBatchCreateCabinetDialog')"
        >
          批量添加
        </ElButton>
      </ElFormItem>
    </ElForm>

    <ElTable
      v-if="canQueryCabinets"
      :key="tableRenderKey"
      v-loading="loading"
      border
      class="mt-4"
      :data="treeRows"
      :default-expand-all="expandAll"
      row-key="id"
      :tree-props="{ children: 'children' }"
    >
      <ElTableColumn label="编号" min-width="260">
        <template #default="{ row }">
          {{ row.code }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="柜子类型" min-width="120">
        <template #default="{ row }">
          {{
            row.cabinetType ? formatArchiveCabinetType(row.cabinetType) : '-'
          }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="路径" min-width="220">
        <template #default="{ row }">
          {{ formatNullable(row.path) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="层级" min-width="100">
        <template #default="{ row }">
          {{ formatArchiveCabinetNodeType(row.nodeType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="总容量" min-width="110">
        <template #default="{ row }">
          {{ row.capacity ?? '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="剩余容量" min-width="110">
        <template #default="{ row }">
          {{ row.remainingCapacity ?? '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="180">
        <template #default="{ row }">
          {{ formatNullable(row.remarks) }}
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" min-width="190">
        <template #default="{ row }">
          <template v-if="row.nodeType !== 'ROOT' && row.node">
            <ElButton
              :disabled="!canUpdateCabinet"
              link
              size="small"
              type="primary"
              @click="emit('openEditCabinetNodeDialog', row.node)"
            >
              修改
            </ElButton>
          </template>
          <template v-if="row.nodeType === 'CABINET' && row.cabinet">
            <ElButton
              :disabled="!canDeleteCabinet"
              link
              size="small"
              type="danger"
              @click="emit('deleteCabinet', row.cabinet)"
            >
              删除
            </ElButton>
            <ElButton
              :disabled="!canUpdateCabinet"
              link
              size="small"
              type="primary"
              @click="emit('toggleCabinetStatus', row.cabinet)"
            >
              {{ row.cabinet.cabinetStatus === 'DISABLED' ? '启用' : '停用' }}
            </ElButton>
          </template>
          <span v-if="row.nodeType === 'ROOT'">-</span>
        </template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
