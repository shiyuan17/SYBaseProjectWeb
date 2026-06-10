<script setup lang="ts">
import type { MaterialLoanView } from '../types/operation-support';

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

import { MATERIAL_TYPE_OPTIONS } from '../constants';
import {
  formatMaterialLoanStatus,
  formatMaterialType,
  formatNullable,
} from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

type LoanFiltersState = {
  keyword: string;
  materialType: string;
};

defineProps<{
  canQueryLoans: boolean;
  canReturnLoan: boolean;
  getLoanStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  loanError: string;
  pendingLoans: MaterialLoanView[];
}>();

const emit = defineEmits<{
  (event: 'loadLoans'): void;
  (event: 'openReturnDialog', row: MaterialLoanView): void;
}>();

const loanFilters = defineModel<LoanFiltersState>('loanFilters', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    title="待归还与归还"
    description="查询当前借出中材料，并从列表中发起归还。"
  >
    <ElAlert
      v-if="loanError"
      :closable="false"
      class="mb-4"
      :title="loanError"
      show-icon
      type="error"
    />

    <ElAlert
      v-if="!canQueryLoans"
      :closable="false"
      class="mb-4"
      title="当前账号缺少待归还列表查询权限。"
      type="warning"
    />

    <template v-else>
      <ElForm inline label-width="88px">
        <ElFormItem label="材料类型">
          <ElSelect
            v-model="loanFilters.materialType"
            clearable
            style="width: 160px"
          >
            <ElOption
              v-for="option in MATERIAL_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="关键字">
          <ElInput
            v-model="loanFilters.keyword"
            clearable
            placeholder="病理号 / 对象编号"
            style="width: 220px"
            @keyup.enter="emit('loadLoans')"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton
            :loading="loading"
            type="primary"
            @click="emit('loadLoans')"
          >
            查询待归还
          </ElButton>
        </ElFormItem>
      </ElForm>

      <ElTable v-loading="loading" :data="pendingLoans" border class="mt-4">
        <ElTableColumn label="借阅单号" min-width="160" prop="loanId" />
        <ElTableColumn label="病例 ID" min-width="140" prop="caseId" />
        <ElTableColumn label="病理号" min-width="140">
          <template #default="{ row }">
            {{ formatNullable(row.pathologyNo) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="材料类型" min-width="120">
          <template #default="{ row }">
            {{ formatMaterialType(row.materialType) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="对象编号" min-width="160">
          <template #default="{ row }">
            {{ formatNullable(row.objectCode || row.materialId) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="借阅状态" min-width="120">
          <template #default="{ row }">
            <ElTag :type="getLoanStatusTagType(row.loanStatus)">
              {{ formatMaterialLoanStatus(row.loanStatus) }}
            </ElTag>
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
        <ElTableColumn label="借阅用途" min-width="180">
          <template #default="{ row }">
            {{ formatNullable(row.borrowPurpose) }}
          </template>
        </ElTableColumn>
        <ElTableColumn fixed="right" label="操作" min-width="110">
          <template #default="{ row }">
            <ElButton
              :disabled="!canReturnLoan"
              link
              type="primary"
              @click="emit('openReturnDialog', row)"
            >
              归还
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
  </OperationSectionCard>
</template>
