<script setup lang="ts">
import type { MaterialLoanView } from '../types/operation-support';

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

import { formatMaterialLoanStatus, formatNullable } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type LoanFiltersState = {
  keyword: string;
  materialType: string;
};

const props = defineProps<{
  canQueryLoans: boolean;
  getLoanStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  loanError: string;
  materialType?: 'EMBEDDING_BOX' | 'SLIDE';
  pendingLoans: MaterialLoanView[];
}>();

const emit = defineEmits<{
  (event: 'loadLoans'): void;
}>();

const loanFilters = defineModel<LoanFiltersState>('loanFilters', {
  required: true,
});

const visibleLoans = computed(() =>
  props.materialType
    ? props.pendingLoans.filter(
        (loan) => loan.materialType === props.materialType,
      )
    : props.pendingLoans,
);

function queryLoans() {
  loanFilters.value.materialType = props.materialType ?? '';
  emit('loadLoans');
}
</script>

<template>
  <OperationSectionCard
    hide-header
    description="按现有借阅待归还契约展示列表；截图中暂未返回的旧系统字段以 - 占位。"
  >
    <ElAlert
      v-if="!canQueryLoans"
      :closable="false"
      class="mb-3"
      title="当前账号缺少借阅查询权限，列表仅展示可用的本地状态。"
      type="warning"
    />

    <ElAlert
      v-if="loanError"
      :closable="false"
      class="mb-4"
      :title="loanError"
      show-icon
      type="error"
    />

    <ElForm class="mb-4" inline label-width="88px">
      <ElFormItem label="关键字">
        <ElInput
          v-model="loanFilters.keyword"
          clearable
          placeholder="病理号/姓名/ID/住院号"
          style="width: 240px"
          @keyup.enter="queryLoans"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton :disabled="!canQueryLoans" @click="queryLoans">
          刷新
        </ElButton>
        <ElButton
          :disabled="!canQueryLoans"
          :loading="loading"
          type="primary"
          @click="queryLoans"
        >
          查询
        </ElButton>
      </ElFormItem>
    </ElForm>

    <ElTable
      v-loading="loading"
      border
      class="mt-4"
      :data="visibleLoans"
      height="420"
      row-key="loanId"
    >
      <ElTableColumn type="selection" width="34" />
      <ElTableColumn label="序" type="index" width="42" />
      <ElTableColumn label="借阅病理号" min-width="260">
        <template #default="{ row }">
          {{ formatNullable(row.pathologyNo || row.objectCode) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人姓名" min-width="100">
        <template #default="{ row }">
          {{ formatNullable(row.patientName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="病人ID" min-width="100" prop="caseId" />
      <ElTableColumn label="住院号" min-width="90">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="门诊号" min-width="90">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="性别" min-width="70">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="患者身份证" min-width="130">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="借阅状态" min-width="100">
        <template #default="{ row }">
          <ElTag :type="getLoanStatusTagType(row.loanStatus)">
            {{ formatMaterialLoanStatus(row.loanStatus) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="符合对比" min-width="90">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="借记时间" min-width="150">
        <template #default="{ row }">
          {{ formatNullable(row.borrowedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借记操作人" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.approvedByName || row.borrowedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="最迟归还时间" min-width="150">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="实际归还时间" min-width="150">
        <template #default="{ row }">
          {{ formatNullable(row.returnedAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="归还操作人" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.returnedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借片人姓名" min-width="110">
        <template #default="{ row }">
          {{ formatNullable(row.borrowedByName) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="借片人身份证" min-width="130">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="借片人电话" min-width="120">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
      <ElTableColumn label="蜡块使用情况" min-width="180">
        <template #default>{{ formatNullable() }}</template>
      </ElTableColumn>
    </ElTable>
  </OperationSectionCard>
</template>
