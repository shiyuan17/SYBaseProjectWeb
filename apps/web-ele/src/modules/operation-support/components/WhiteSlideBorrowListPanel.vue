<script setup lang="ts">
import type { WhiteSlideLoanView } from '../types/operation-support';

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

import { formatMaterialLoanStatus, formatNullable } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  canCreate: boolean;
  canQuery: boolean;
  canReturn: boolean;
  loading: boolean;
  loans: WhiteSlideLoanView[];
  selectedLoanId: null | string;
}>();

const emit = defineEmits<{
  (event: 'borrow'): void;
  (event: 'print', row: WhiteSlideLoanView): void;
  (event: 'query'): void;
  (event: 'return', row: WhiteSlideLoanView): void;
  (event: 'select', row: undefined | WhiteSlideLoanView): void;
}>();

const filters = defineModel<{
  keyword: string;
  loanStatus: string;
  stockStatus: string;
}>('filters', {
  required: true,
});

function getLoanStatusTagType(status?: null | string) {
  if (status === 'BORROWED') {
    return 'warning';
  }
  if (status === 'RETURNED') {
    return 'success';
  }
  return 'info';
}
</script>

<template>
  <OperationSectionCard hide-header>
    <ElAlert
      v-if="!canQuery"
      :closable="false"
      class="mb-3"
      title="当前账号缺少白片借记查询权限。"
      type="warning"
    />

    <ElForm class="mb-4" inline label-width="92px">
      <ElFormItem label="关键字">
        <ElInput
          v-model="filters.keyword"
          clearable
          placeholder="检查号/蜡块号/患者/用途/借片人"
          style="width: 280px"
          @keyup.enter="emit('query')"
        />
      </ElFormItem>
      <ElFormItem label="借阅状态">
        <ElSelect v-model="filters.loanStatus" style="width: 140px">
          <ElOption label="借出中" value="BORROWED" />
          <ElOption label="已归还" value="RETURNED" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton :disabled="!canQuery" @click="emit('query')">刷新</ElButton>
        <ElButton
          :disabled="!canQuery"
          :loading="loading"
          type="primary"
          @click="emit('query')"
        >
          查询
        </ElButton>
        <ElButton :disabled="!canCreate" type="primary" @click="emit('borrow')">
          借白片
        </ElButton>
      </ElFormItem>
    </ElForm>

    <ElTable
      v-loading="loading"
      border
      :data="loans"
      height="460"
      highlight-current-row
      row-key="id"
      @current-change="(row?: WhiteSlideLoanView) => emit('select', row)"
    >
      <ElTableColumn label="序" type="index" width="48" />
      <ElTableColumn label="检查号" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.pathologyNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="蜡块号" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.embeddingBoxNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="患者姓名" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="切白片数量" min-width="100" prop="quantity" />
      <ElTableColumn label="切片厚度" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.sliceThickness) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="切片原因(用途)" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.slicePurpose) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借片人姓名" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.borrowerName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借片人单位" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.borrowerUnit) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借片人电话" min-width="120">
        <template #default="{ row }">
          {{ formatNullable(row.borrowerPhone) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借片人身份证" min-width="150">
        <template #default="{ row }">
          {{ formatNullable(row.borrowerIdentityNo) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作人" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.operatorName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作时间" min-width="160">
        <template #default="{ row }">
          {{ formatNullable(row.loanedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="蜡块使用情况" min-width="140">
        <template #default="{ row }">
          {{ formatNullable(row.waxBlockUsage) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借阅状态" min-width="100">
        <template #default="{ row }">
          <ElTag :type="getLoanStatusTagType(row.loanStatus)">
            {{ formatMaterialLoanStatus(row.loanStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn fixed="right" label="操作" min-width="180">
        <template #default="{ row }">
          <div class="flex gap-2">
            <ElButton link type="primary" @click="emit('print', row)">
              打印借阅单
            </ElButton>
            <ElButton
              v-if="row.loanStatus === 'BORROWED'"
              link
              :disabled="!canReturn"
              type="warning"
              @click="emit('return', row)"
            >
              归还
            </ElButton>
          </div>
        </template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
