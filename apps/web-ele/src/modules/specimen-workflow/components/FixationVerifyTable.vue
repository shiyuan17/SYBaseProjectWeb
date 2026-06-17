<script setup lang="ts">
import type { RemovalDisplayRow } from '../utils/specimen-removal-display';

import { ElTable, ElTableColumn, ElTag } from 'element-plus';

import { formatDateTime, formatNullable } from '../utils/format';
import {
  resolveRemovalWorkflowRowTone,
  resolveSpecimenWorkflowRowClassName,
} from '../utils/specimen-workflow-row-tone';

import '../styles/specimen-workflow-row-tone.css';

defineProps<{
  actionLoading: boolean;
  canConfirmRemoval: (row: RemovalDisplayRow) => boolean;
  formatRemovalStatus: (row: RemovalDisplayRow) => string;
  items: RemovalDisplayRow[];
  loading: boolean;
  page: number;
  size: number;
}>();

const emit = defineEmits<{
  selectionChange: [rows: RemovalDisplayRow[]];
}>();

function resolveRowClassName({ row }: { row: RemovalDisplayRow }) {
  return resolveSpecimenWorkflowRowClassName(
    resolveRemovalWorkflowRowTone(row),
  );
}
</script>

<template>
  <ElTable
    v-loading="loading"
    :data="items"
    :row-class-name="resolveRowClassName"
    row-key="specimenId"
    border
    max-height="520"
    @selection-change="
      emit('selectionChange', $event as unknown as RemovalDisplayRow[])
    "
  >
    <ElTableColumn
      :selectable="canConfirmRemoval"
      reserve-selection
      type="selection"
      width="56"
    />
    <ElTableColumn label="序号" width="72">
      <template #default="{ $index }">
        {{ (page - 1) * size + $index + 1 }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="申请单" min-width="150" prop="applicationNo" />
    <ElTableColumn label="标本编号" min-width="140" prop="specimenNo" />
    <ElTableColumn label="姓名" min-width="120">
      <template #default="{ row }">
        {{ formatNullable(row.patientName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="住院号" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.inpatientNo) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="病区" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.wardName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="性别" min-width="90">
      <template #default="{ row }">
        {{ formatNullable(row.patientGender) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="手术间" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.surgeryName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本名称" min-width="180">
      <template #default="{ row }">
        {{ formatNullable(row.specimenName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本状态" min-width="120">
      <template #default="{ row }">
        <ElTag :type="row.specimenRemovalAt ? 'success' : 'danger'">
          {{ formatRemovalStatus(row) }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="类型" min-width="100">
      <template #default="{ row }">
        {{ formatNullable(row.specimenType) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="离体时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.specimenRemovalAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="离体操作人" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.specimenRemovalOperatorName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="添加时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.registeredAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="添加人" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.registeredByName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="病人ID" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.patientIdLabel) }}
      </template>
    </ElTableColumn>
  </ElTable>
</template>
