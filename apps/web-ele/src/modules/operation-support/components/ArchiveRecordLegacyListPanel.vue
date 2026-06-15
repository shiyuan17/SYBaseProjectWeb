<script setup lang="ts">
import type {
  ArchiveObjectType,
  ArchiveRecordView,
} from '../types/operation-support';

import { computed } from 'vue';

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

import {
  formatArchiveStorageStatus,
  formatMaterialLoanStatus,
  formatNullable,
} from '../utils/format';

type ArchiveRecordFiltersState = {
  keyword: string;
  page: number;
  size: number;
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
  objectType: ArchiveObjectType;
  page: number;
  recordError: string;
  records: ArchiveRecordView[];
  selectable?: boolean;
  size: number;
  total: number;
}>();

const emit = defineEmits<{
  (event: 'pageChange', page: number): void;
  (event: 'query'): void;
  (event: 'selectionChange', records: ArchiveRecordView[]): void;
  (event: 'sizeChange', size: number): void;
}>();

const archiveObjectFilters = defineModel<ArchiveRecordFiltersState>(
  'archiveObjectFilters',
  {
    required: true,
  },
);

function queryRecords() {
  emit('query');
}

const showSelection = computed(() => props.selectable !== false);
</script>

<template>
  <section
    class="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-4 shadow-sm"
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
          v-model="archiveObjectFilters.keyword"
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
        <slot name="extra"></slot>
      </ElFormItem>
    </ElForm>

    <div class="mt-4 flex min-h-0 flex-1 flex-col">
      <ElTable
        v-loading="loading"
        border
        class="flex-1"
        :data="records"
        height="100%"
        row-key="objectId"
        @selection-change="
          (rows: ArchiveRecordView[]) => emit('selectionChange', rows)
        "
      >
        <ElTableColumn v-if="showSelection" type="selection" width="34" />
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
        <ElTableColumn
          v-if="objectType === 'SLIDE'"
          label="子号"
          min-width="90"
        >
          <template #default="{ row }">
            {{ formatNullable(row.objectCode || row.objectId) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="objectType === 'SPECIMEN'"
          label="标本编号"
          min-width="120"
        >
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
    </div>

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
  </section>
</template>
