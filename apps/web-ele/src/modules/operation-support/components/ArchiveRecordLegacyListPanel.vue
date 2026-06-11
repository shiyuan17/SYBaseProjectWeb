<script setup lang="ts">
import type { ArchiveRecordView } from '../types/operation-support';

import { computed } from 'vue';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
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

const props = defineProps<{
  canQueryRecords: boolean;
  getArchiveStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  getLoanStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  objectType: 'APPLICATION_FORM' | 'EMBEDDING_BOX' | 'SLIDE';
  recordError: string;
  records: ArchiveRecordView[];
  title: string;
}>();

const emit = defineEmits<{
  (event: 'loadRecords'): void;
}>();

const recordFilters = defineModel<ArchiveRecordFiltersState>('recordFilters', {
  required: true,
});

const visibleRecords = computed(() =>
  props.records.filter((record) => record.objectType === props.objectType),
);

function queryRecords() {
  recordFilters.value.objectType = props.objectType;
  emit('loadRecords');
}
</script>

<template>
  <OperationSectionCard
    :title="title"
    description="按现有归档记录契约展示列表；截图中暂未返回的旧系统字段以 - 占位。"
  >
    <ElAlert
      v-if="!canQueryRecords"
      :closable="false"
      class="mb-3"
      title="当前账号缺少归档记录查询权限，列表仅展示可用的本地状态。"
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
          v-model="recordFilters.keyword"
          clearable
          placeholder="病理号 / 病人姓名 / 病人ID"
          style="width: 240px"
          @keyup.enter="queryRecords"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton :disabled="!canQueryRecords" @click="queryRecords">
          刷新
        </ElButton>
        <ElButton
          :disabled="!canQueryRecords"
          :loading="loading"
          type="primary"
          @click="queryRecords"
        >
          查询
        </ElButton>
      </ElFormItem>
    </ElForm>

    <ElTable
      v-loading="loading"
      border
      class="mt-4"
      :data="visibleRecords"
      height="520"
      row-key="objectId"
    >
      <ElTableColumn type="selection" width="34" />
      <ElTableColumn label="序" type="index" width="42" />
      <ElTableColumn label="病理号" min-width="120" prop="pathologyNo" />
      <ElTableColumn label="病人姓名" min-width="110" prop="patientName" />
      <ElTableColumn label="病人ID" min-width="120" prop="caseId" />
      <ElTableColumn
        v-if="objectType === 'APPLICATION_FORM'"
        label="申请医生"
        min-width="100"
      >
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'APPLICATION_FORM'"
        label="申请时间"
        min-width="170"
      >
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX'"
        label="子号"
        min-width="80"
      >
        <template #default="{ row }">
          {{ formatNullable(row.objectCode || row.objectId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX'"
        label="当前状态"
        min-width="110"
      >
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX'"
        label="取材人"
        min-width="120"
      >
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'EMBEDDING_BOX'"
        label="包埋人"
        min-width="150"
      >
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn v-if="objectType === 'SLIDE'" label="子号" min-width="90">
        <template #default="{ row }">
          {{ formatNullable(row.objectCode || row.objectId) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        v-if="objectType === 'SLIDE'"
        label="切片人"
        min-width="160"
      >
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="归档状态" min-width="110">
        <template #default="{ row }">
          <ElTag :type="getArchiveStatusTagType(row.archiveStatus)">
            {{ formatArchiveStorageStatus(row.archiveStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="归档柜" min-width="90">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="归档路径" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.archiveLocation) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="归档人" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.storedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="归档时间" min-width="170">
        <template #default="{ row }">
          {{ formatNullable(row.archivedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="图像路径" min-width="140">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="图像名" min-width="120">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="图像服务器名" min-width="150">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="借阅状态" min-width="110">
        <template #default="{ row }">
          <ElTag
            v-if="row.loanStatus"
            :type="getLoanStatusTagType(row.loanStatus)"
          >
            {{ formatMaterialLoanStatus(row.loanStatus) }}
          </ElTag>
          <span v-else>{{ formatNullable() }}</span>
        </template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
