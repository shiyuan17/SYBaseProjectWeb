<script setup lang="ts">
import type { ArchiveRecordView } from '../types/operation-support';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { formatArchiveStorageStatus, formatNullable } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type MaterialObjectFiltersState = {
  keyword: string;
  page: number;
  size: number;
};

defineProps<{
  canCreateLoan: boolean;
  canQueryRecords: boolean;
  canRegisterLoanAbnormal: boolean;
  canReturnLoan: boolean;
  getArchiveStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  getLoanStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  page: number;
  recordError: string;
  records: ArchiveRecordView[];
  selectedRecords: ArchiveRecordView[];
  size: number;
  total: number;
}>();

const emit = defineEmits<{
  (event: 'borrow'): void;
  (event: 'pageChange', page: number): void;
  (event: 'query'): void;
  (event: 'registerAbnormal'): void;
  (event: 'return'): void;
  (event: 'selectionChange', records: ArchiveRecordView[]): void;
  (event: 'sizeChange', size: number): void;
}>();

const materialObjectFilters = defineModel<MaterialObjectFiltersState>(
  'materialObjectFilters',
  {
    required: true,
  },
);

function formatBorrowStatus(value?: null | string) {
  if (value === 'BORROWED') {
    return '借已';
  }
  if (value === 'RETURNED') {
    return '归还';
  }
  return '未借';
}
</script>

<template>
  <OperationSectionCard hide-header>
    <ElAlert
      v-if="!canQueryRecords"
      :closable="false"
      class="mb-3"
      title="当前账号缺少归档对象查询权限，无法查询可借记材料。"
      type="warning"
    />

    <ElAlert
      v-if="recordError"
      :closable="false"
      class="mb-4"
      :title="recordError"
      show-icon
      type="error"
    />

    <ElForm class="mb-4" inline label-width="88px">
      <ElFormItem label="关键字">
        <ElInput
          v-model="materialObjectFilters.keyword"
          clearable
          placeholder="病理号/姓名/ID/住院号"
          style="width: 240px"
          @keyup.enter="emit('query')"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton :disabled="!canQueryRecords" @click="emit('query')">
          刷新
        </ElButton>
        <ElButton
          :disabled="!canQueryRecords"
          :loading="loading"
          type="primary"
          @click="emit('query')"
        >
          查询
        </ElButton>
        <ElButton
          :disabled="!canCreateLoan"
          type="primary"
          @click="emit('borrow')"
        >
          借记
        </ElButton>
        <ElButton :disabled="!canReturnLoan" @click="emit('return')">
          归还
        </ElButton>
        <ElButton
          :disabled="!canRegisterLoanAbnormal"
          type="warning"
          @click="emit('registerAbnormal')"
        >
          异常登记
        </ElButton>
      </ElFormItem>
    </ElForm>

    <div class="text-xs text-[var(--el-text-color-secondary)]">
      已选 {{ selectedRecords.length }} 条
    </div>

    <ElTable
      v-loading="loading"
      border
      class="mt-4"
      :data="records"
      height="420"
      row-key="objectId"
      @selection-change="
        (rows: ArchiveRecordView[]) => emit('selectionChange', rows)
      "
    >
      <ElTableColumn type="selection" width="46" />
      <ElTableColumn label="序" type="index" width="42" />
      <ElTableColumn label="借阅病理号" min-width="150">
        <template #default="{ row }">
          {{ formatNullable(row.pathologyNo || row.objectCode) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人姓名" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人ID" min-width="120" prop="caseId" />
      <ElTableColumn label="材料号" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.objectCode || row.objectId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="归档状态" min-width="110">
        <template #default="{ row }">
          <ElTag :type="getArchiveStatusTagType(row.archiveStatus)">
            {{ formatArchiveStorageStatus(row.archiveStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="借阅状态" min-width="100">
        <template #default="{ row }">
          <ElTag :type="getLoanStatusTagType(row.loanStatus)">
            {{ formatBorrowStatus(row.loanStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="借记时间" min-width="170">
        <template #default="{ row }">
          {{ formatNullable(row.borrowedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借阅人" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.borrowedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="归档路径" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.archiveLocation) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="mt-4 flex justify-end">
      <ElPagination
        :current-page="page"
        :disabled="!canQueryRecords || loading"
        layout="total, sizes, prev, pager, next, jumper"
        :page-size="size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        @current-change="(nextPage: number) => emit('pageChange', nextPage)"
        @size-change="(nextSize: number) => emit('sizeChange', nextSize)"
      />
    </div>
  </OperationSectionCard>
</template>
