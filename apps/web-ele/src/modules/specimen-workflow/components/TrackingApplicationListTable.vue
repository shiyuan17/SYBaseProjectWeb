<script setup lang="ts">
import type { ApplicationListItem } from '../types/specimen-workflow';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import {
  formatApplicationFormStatus,
  formatApplicationType,
  formatCurrentNode,
  formatDate,
  formatDateTime,
  formatNullable,
} from '../utils/format';

defineProps<{
  items: ApplicationListItem[];
  loading: boolean;
}>();

const emit = defineEmits<{
  detail: [applicationId: string];
}>();
</script>

<template>
  <ElTable v-loading="loading" :data="items" border>
    <ElTableColumn label="申请单编号" min-width="220" prop="id" />
    <ElTableColumn label="申请单号" min-width="160" prop="applicationNo" />
    <ElTableColumn label="患者信息" min-width="180">
      <template #default="{ row }">
        {{ formatNullable(row.patientName) }} /
        {{ formatNullable(row.patientGender) }} /
        {{ formatNullable(row.patientAge) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="送检科室" min-width="160">
      <template #default="{ row }">
        {{ formatNullable(row.submittingDepartmentName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="申请类型" min-width="120">
      <template #default="{ row }">
        {{ formatApplicationType(row.applicationType) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="表单状态" min-width="120">
      <template #default="{ row }">
        {{ formatApplicationFormStatus(row.applicationFormStatus) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="当前节点" min-width="120">
      <template #default="{ row }">
        {{ formatCurrentNode(row.currentNode) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="申请人" min-width="120">
      <template #default="{ row }">
        {{ formatNullable(row.submittingDoctorName) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="申请日期" min-width="120">
      <template #default="{ row }">
        {{ formatDate(row.applicationDate) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="更新时间" min-width="180">
      <template #default="{ row }">
        {{ formatDateTime(row.updatedAt) }}
      </template>
    </ElTableColumn>
    <ElTableColumn label="异常标记" min-width="110">
      <template #default="{ row }">
        <ElTag :type="row.abnormalFlag ? 'danger' : 'success'">
          {{ row.abnormalFlag ? '有异常' : '正常' }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn fixed="right" label="操作" min-width="120">
      <template #default="{ row }">
        <ElButton link type="primary" @click="emit('detail', row.id)">
          详情
        </ElButton>
      </template>
    </ElTableColumn>
  </ElTable>
</template>
