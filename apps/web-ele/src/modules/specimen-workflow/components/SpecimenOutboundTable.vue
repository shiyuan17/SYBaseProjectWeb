<script setup lang="ts">
import type { SpecimenOutboundListItem } from '../types/specimen-workflow';

import { ElTable, ElTableColumn, ElTag } from 'element-plus';

import {
  formatDateTime,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';

defineProps<{
  items: SpecimenOutboundListItem[];
  loading: boolean;
  page: number;
  size: number;
}>();

function resolveSpecimenStatusTagType(status?: null | string) {
  switch (status) {
    case 'IN_TRANSIT': {
      return 'success';
    }
    case 'CHECKED_IN': {
      return 'warning';
    }
    case 'RECEIVED': {
      return 'primary';
    }
    default: {
      return 'info';
    }
  }
}
</script>

<template>
  <ElTable v-loading="loading" :data="items" border row-key="specimenId">
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
        <ElTag :type="resolveSpecimenStatusTagType(row.specimenStatus)">
          {{ formatSpecimenStatus(row.specimenStatus) }}
        </ElTag>
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
        {{ formatNullable(row.patientId) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="出库时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.outboundAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="出库人" min-width="140">
      <template #default="{ row }">
        {{ formatNullable(row.outboundUserName) }}
      </template>
    </ElTableColumn>
  </ElTable>
</template>
