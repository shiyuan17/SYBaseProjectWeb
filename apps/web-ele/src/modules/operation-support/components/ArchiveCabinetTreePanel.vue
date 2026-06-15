<script setup lang="ts">
import type { ArchiveCabinetView } from '../types/operation-support';
import type { PositionWorkbenchRow } from '../utils/archive-workbench';

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
import { formatArchiveCabinetType, formatNullable } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type CabinetTreeNodeType = 'cabinet' | 'range' | 'root' | 'type';

type CabinetTreeNode = {
  cabinet?: ArchiveCabinetView;
  cabinetType?: string;
  capacity?: number;
  children?: CabinetTreeNode[];
  code: string;
  id: string;
  level: string;
  nodeType: CabinetTreeNodeType;
  path?: string;
  remainingCapacity?: number;
  remarks?: null | string;
};

const props = defineProps<{
  cabinets: ArchiveCabinetView[];
  canCreateCabinet: boolean;
  canDeleteCabinet: boolean;
  canQueryCabinets: boolean;
  canUpdateCabinet: boolean;
  loading: boolean;
  positionRows: PositionWorkbenchRow[];
}>();

const emit = defineEmits<{
  (event: 'deleteCabinet', cabinet: ArchiveCabinetView): void;
  (event: 'loadCabinets'): void;
  (event: 'loadPositions'): void;
  (event: 'openBatchCreateCabinetDialog'): void;
  (event: 'openCreateCabinetDialog'): void;
  (event: 'openEditCabinetDialog', cabinet: ArchiveCabinetView): void;
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

const positionRowsByCabinetId = computed(() => {
  const groups = new Map<string, PositionWorkbenchRow[]>();
  for (const row of props.positionRows) {
    const rows = groups.get(row.cabinetId) ?? [];
    rows.push(row);
    groups.set(row.cabinetId, rows);
  }
  return groups;
});

const filteredCabinets = computed(() =>
  props.cabinets.filter(
    (cabinet) =>
      !selectedCabinetType.value ||
      cabinet.cabinetType === selectedCabinetType.value,
  ),
);

const treeRows = computed<CabinetTreeNode[]>(() => {
  const typeNodes: CabinetTreeNode[] = [];

  for (const option of ARCHIVE_CABINET_TYPE_OPTIONS) {
    const cabinets = filteredCabinets.value.filter(
      (cabinet) => cabinet.cabinetType === option.value,
    );
    if (cabinets.length === 0) {
      continue;
    }
    const children = cabinets.map((cabinet) => createCabinetNode(cabinet));
    const capacity = children.reduce(
      (sum, node) => sum + (node.capacity ?? 0),
      0,
    );
    const remainingCapacity = children.reduce(
      (sum, node) => sum + (node.remainingCapacity ?? 0),
      0,
    );
    typeNodes.push({
      cabinetType: option.value,
      capacity,
      children,
      code: getCabinetTypeTreeLabel(option.label),
      id: `type-${option.value}`,
      level: '区域',
      nodeType: 'type',
      path: '-',
      remainingCapacity,
      remarks: '-',
    });
  }

  return [
    {
      capacity: typeNodes.reduce((sum, node) => sum + (node.capacity ?? 0), 0),
      children: typeNodes,
      code: 'ROOT',
      id: 'ROOT',
      level: '-',
      nodeType: 'root',
      path: '-',
      remainingCapacity: typeNodes.reduce(
        (sum, node) => sum + (node.remainingCapacity ?? 0),
        0,
      ),
      remarks: '-',
    },
  ];
});

function getCabinetTypeTreeLabel(label: string) {
  return label === '标准柜' ? label : label.replace(/柜$/, '');
}

function createCabinetNode(cabinet: ArchiveCabinetView): CabinetTreeNode {
  const rows = positionRowsByCabinetId.value.get(cabinet.id) ?? [];
  const remainingCapacity = rows.filter(
    (row) => row.positionStatus === 'AVAILABLE',
  ).length;

  return {
    cabinet,
    cabinetType: cabinet.cabinetType,
    capacity: cabinet.capacity,
    children: createRangeNodes(cabinet, rows),
    code: cabinet.cabinetCode,
    id: `cabinet-${cabinet.id}`,
    level: '柜子',
    nodeType: 'cabinet',
    path: formatNullable(cabinet.locationDescription),
    remainingCapacity,
    remarks: cabinet.remarks ?? '-',
  };
}

function createRangeNodes(
  cabinet: ArchiveCabinetView,
  rows: PositionWorkbenchRow[],
) {
  return Array.from({ length: cabinet.layerCount }, (_, index) => {
    const layerNo = index + 1;
    const startSlot = index * cabinet.slotCountPerLayer + 1;
    const endSlot = startSlot + cabinet.slotCountPerLayer - 1;
    const layerRows = rows.filter((row) => row.layerNo === layerNo);
    return {
      cabinetType: cabinet.cabinetType,
      capacity: cabinet.slotCountPerLayer,
      code: `${startSlot}-${endSlot}`,
      id: `range-${cabinet.id}-${layerNo}`,
      level: '抽屉',
      nodeType: 'range',
      path: `${formatArchiveCabinetType(cabinet.cabinetType)}，${cabinet.cabinetName}`,
      remainingCapacity: layerRows.filter(
        (row) => row.positionStatus === 'AVAILABLE',
      ).length,
      remarks: '-',
    } satisfies CabinetTreeNode;
  });
}

function refreshAll() {
  emit('loadCabinets');
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
        <ElSelect v-model="selectedCabinetType" class="w-[180px]">
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
          {{ row.level }}
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
          <template v-if="row.nodeType === 'cabinet' && row.cabinet">
            <ElButton
              :disabled="!canUpdateCabinet"
              link
              size="small"
              type="primary"
              @click="emit('openEditCabinetDialog', row.cabinet)"
            >
              修改
            </ElButton>
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
          <span v-else>-</span>
        </template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
