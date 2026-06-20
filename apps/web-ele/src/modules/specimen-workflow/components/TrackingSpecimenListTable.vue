<script setup lang="ts">
import type { SpecimenManagementListItem } from '../types/specimen-workflow';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import CopyableIdentifier from '../../../components/CopyableIdentifier.vue';
import {
  formatDateTime,
  formatNullable,
  formatSpecimenStatus,
} from '../utils/format';
import { specimenTagType } from '../utils/tracking-specimen-list';

defineProps<{
  items: SpecimenManagementListItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  detail: [row: SpecimenManagementListItem];
}>();
</script>

<template>
  <ElTable v-loading="loading" :data="items" border>
    <ElTableColumn label="标本编号" min-width="150">
      <template #default="{ row }">
        <CopyableIdentifier kind="specimenNo" :value="row.specimenNo" />
      </template>
    </ElTableColumn>
    <ElTableColumn label="条码" min-width="180" prop="barcode" />
    <ElTableColumn label="关联申请单" min-width="160">
      <template #default="{ row }">
        <CopyableIdentifier kind="applicationNo" :value="row.applicationNo" />
      </template>
    </ElTableColumn>
    <ElTableColumn label="患者姓名" min-width="120">
      <template #default="{ row }">
        {{ formatNullable(row.patientName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="送检科室" min-width="160">
      <template #default="{ row }">
        {{ formatNullable(row.submittingDepartmentName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="登记时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.registeredAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="标本状态" min-width="150">
      <template #default="{ row }">
        <ElTag :type="specimenTagType(row)">
          {{ formatSpecimenStatus(row.specimenStatus) }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="异常标记" min-width="110">
      <template #default="{ row }">
        <ElTag :type="row.abnormalFlag ? 'danger' : 'success'">
          {{ row.abnormalFlag ? '异常' : '正常' }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn fixed="right" label="操作" min-width="120">
      <template #default="{ row }">
        <ElButton link type="primary" @click="emit('detail', row)">
          详情
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
