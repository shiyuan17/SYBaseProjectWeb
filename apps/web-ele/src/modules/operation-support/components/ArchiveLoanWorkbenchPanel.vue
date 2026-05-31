<script setup lang="ts">
import type { MaterialLoanView } from '../types/operation-support';
import type { LoanFormState } from '../utils/archive-forms';

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
  canCreateLoan: boolean;
  canQueryLoans: boolean;
  canReturnLoan: boolean;
  getLoanStatusTagType: (
    status?: null | string,
  ) => 'danger' | 'info' | 'primary' | 'success' | 'warning';
  loading: boolean;
  loanError: string;
  pendingLoans: MaterialLoanView[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'loadLoans'): void;
  (event: 'openReturnDialog', row: MaterialLoanView): void;
  (event: 'submitLoan'): void;
}>();

const loanFilters = defineModel<LoanFiltersState>('loanFilters', {
  required: true,
});
const loanForm = defineModel<LoanFormState>('loanForm', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    title="借出与待归还"
    description="对蜡块、玻片执行借出，并处理待归还列表。"
  >
    <ElAlert
      v-if="loanError"
      :closable="false"
      class="mb-4"
      :title="loanError"
      show-icon
      type="error"
    />

    <ElForm class="mb-4" inline label-width="88px">
      <ElFormItem label="材料类型">
        <ElSelect v-model="loanForm.materialType" style="width: 160px">
          <ElOption
            v-for="option in MATERIAL_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="材料 ID" required>
        <ElInput
          v-model="loanForm.materialId"
          placeholder="请输入材料 ID"
          style="width: 220px"
        />
      </ElFormItem>
      <ElFormItem label="借阅人" required>
        <ElInput
          v-model="loanForm.borrowedByName"
          placeholder="请输入借阅人姓名"
          style="width: 180px"
        />
      </ElFormItem>
      <ElFormItem label="用途">
        <ElInput
          v-model="loanForm.borrowPurpose"
          placeholder="可选，填写借阅用途"
          style="width: 220px"
        />
      </ElFormItem>
      <ElFormItem label="操作人" required>
        <ElInput v-model="loanForm.operatorName" style="width: 180px" />
      </ElFormItem>
      <ElFormItem>
        <ElButton
          :disabled="!canCreateLoan"
          :loading="submitting"
          type="primary"
          @click="emit('submitLoan')"
        >
          提交借出
        </ElButton>
      </ElFormItem>
    </ElForm>

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
