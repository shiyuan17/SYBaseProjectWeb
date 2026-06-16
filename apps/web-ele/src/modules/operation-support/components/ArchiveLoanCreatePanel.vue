<script setup lang="ts">
import type { LoanFormState } from '../utils/archive-forms';

import {
  ElAlert,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { MATERIAL_TYPE_OPTIONS } from '../constants';
import { formatMaterialType } from '../utils/format';
import OperationSectionCard from './OperationSectionCard.vue';

defineProps<{
  canCreateLoan: boolean;
  fixedMaterialType?: string;
  hideHeader?: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submitLoan'): void;
}>();

const loanForm = defineModel<LoanFormState>('loanForm', {
  required: true,
});
</script>

<template>
  <OperationSectionCard
    :title="`${formatMaterialType(fixedMaterialType || loanForm.materialType)}借出登记`"
    description="登记材料借出信息，后端会基于已归档材料记录校验材料是否可借出。"
    :hide-header="hideHeader"
  >
    <ElAlert
      v-if="!canCreateLoan"
      :closable="false"
      class="mb-4"
      title="当前账号缺少借出权限。"
      type="warning"
    />

    <ElForm inline label-width="88px">
      <ElFormItem v-if="!fixedMaterialType" label="材料类型">
        <ElSelect v-model="loanForm.materialType" style="width: 160px">
          <ElOption
            v-for="option in MATERIAL_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-else label="材料类型">
        <span>{{ formatMaterialType(fixedMaterialType) }}</span>
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
  </OperationSectionCard>
</template>
