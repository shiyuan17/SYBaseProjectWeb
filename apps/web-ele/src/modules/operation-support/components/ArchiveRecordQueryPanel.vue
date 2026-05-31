<script setup lang="ts">
import type { ArchiveRecordView } from '../types/operation-support';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { ARCHIVE_OBJECT_TYPE_OPTIONS } from '../constants';
import {
  formatArchiveObjectType,
  formatArchiveStorageStatus,
  formatMaterialLoanStatus,
  formatNullable,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type ArchiveRecordFiltersState = {
  caseId: string;
  keyword: string;
  objectType: string;
};

defineProps<{
  canQueryRecords: boolean;
  getArchiveStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  getLoanStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  recordError: string;
  records: ArchiveRecordView[];
}>();

const emit = defineEmits<{
  (event: 'loadRecords'): void;
}>();

const recordFilters = defineModel<ArchiveRecordFiltersState>('recordFilters', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    title="归档记录查询"
    description="按病例、对象类型或关键字查询归档结果，并核对医生工作台回流状态。"
  >
    <template v-if="!canQueryRecords">
      <ElAlert
        :closable="false"
        title="当前账号缺少归档记录查询权限。"
        type="warning"
      />
    </template>

    <template v-else>
      <ElAlert
        v-if="recordError"
        :closable="false"
        class="mb-4"
        :title="recordError"
        show-icon
        type="error"
      />

      <ElForm inline label-width="88px">
        <ElFormItem label="关键字">
          <ElInput
            v-model="recordFilters.keyword"
            clearable
            placeholder="病理号 / 对象编号"
            style="width: 220px"
            @keyup.enter="emit('loadRecords')"
          />
        </ElFormItem>
        <ElFormItem label="对象类型">
          <ElSelect
            v-model="recordFilters.objectType"
            clearable
            style="width: 160px"
          >
            <ElOption
              v-for="option in ARCHIVE_OBJECT_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="病例 ID">
          <ElInput
            v-model="recordFilters.caseId"
            clearable
            placeholder="请输入病例 ID"
            style="width: 220px"
            @keyup.enter="emit('loadRecords')"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton
            :loading="loading"
            type="primary"
            @click="emit('loadRecords')"
          >
            查询归档记录
          </ElButton>
        </ElFormItem>
      </ElForm>

      <ElTable v-loading="loading" :data="records" border>
        <ElTableColumn label="病例 ID" min-width="140" prop="caseId" />
        <ElTableColumn label="病理号" min-width="140">
          <template #default="{ row }">
            {{ formatNullable(row.pathologyNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="申请单号" min-width="140">
          <template #default="{ row }">
            {{ formatNullable(row.applicationNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="患者" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.patientName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="对象类型" min-width="120">
          <template #default="{ row }">
            {{ formatArchiveObjectType(row.objectType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="对象编号" min-width="160">
          <template #default="{ row }">
            {{ formatNullable(row.objectCode || row.objectId) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="归档状态" min-width="120">
          <template #default="{ row }">
            <ElTag :type="getArchiveStatusTagType(row.archiveStatus)">
              {{ formatArchiveStorageStatus(row.archiveStatus) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="归档位置" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.archiveLocation) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="借阅状态" min-width="120">
          <template #default="{ row }">
            <ElTag
              v-if="row.loanStatus"
              :type="getLoanStatusTagType(row.loanStatus)"
            >
              {{ formatMaterialLoanStatus(row.loanStatus) }}
            </ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="归档时间" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.archivedAt) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="归档人" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.storedByName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="借阅人" min-width="120">
          <template #default="{ row }">
            {{ formatNullable(row.borrowedByName) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="借出时间" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.borrowedAt) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
