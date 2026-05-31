<script setup lang="ts">
import type { SpecimenRemovalItem } from '../types/specimen-workflow';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { formatDateTime, formatNullable } from '../utils/format';

defineProps<{
  actionLoading: boolean;
  canConfirmRemoval: (row: SpecimenRemovalItem) => boolean;
  formatRemovalStatus: (row: SpecimenRemovalItem) => string;
  items: SpecimenRemovalItem[];
  loading: boolean;
  page: number;
  size: number;
}>();

const emit = defineEmits<{
  confirmRemoval: [row: SpecimenRemovalItem];
}>();
</script>

<template>
  <ElTable v-loading="loading" :data="items" border>
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
    <ElTableColumn fixed="right" label="操作" min-width="120">
      <template #default="{ row }">
        <div class="flex min-h-8 items-center">
          <ElButton
            v-if="canConfirmRemoval(row)"
            :loading="actionLoading"
            link
            type="primary"
            @click="emit('confirmRemoval', row)"
          >
            离体确认
          </ElButton>
          <span v-else class="text-muted-foreground">-</span>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
