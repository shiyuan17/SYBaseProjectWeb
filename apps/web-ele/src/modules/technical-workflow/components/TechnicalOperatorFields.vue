<script setup lang="ts">
/* eslint-disable vue/no-mutating-props -- This field adapter writes to a caller-owned reactive operator form shared by workstation dialogs. */
import type { TechnicalOperatorFormValue } from '../types/technical-workflow';

import { ElFormItem, ElInput } from 'element-plus';

import SystemUserSelect from '#/modules/system-management/components/SystemUserSelect.vue';

const props = withDefaults(
  defineProps<{
    form: TechnicalOperatorFormValue;
    remarksPlaceholder?: string;
    terminalPlaceholder?: string;
  }>(),
  {
    remarksPlaceholder: '必要时补充说明',
    terminalPlaceholder: '请输入终端编码',
  },
);

function handleOperatorChange(user: null | { id: string; name: string }) {
  props.form.operatorUserId = user?.id ?? '';
  props.form.operatorName = user?.name ?? '';
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <ElFormItem label="操作人" required>
      <SystemUserSelect
        v-model="form.operatorUserId"
        :selected-label="form.operatorName"
        placeholder="请选择操作人"
        @change="handleOperatorChange"
      />
    </ElFormItem>
    <ElFormItem label="终端编码">
      <ElInput v-model="form.terminalCode" :placeholder="terminalPlaceholder" />
    </ElFormItem>
    <ElFormItem label="备注">
      <ElInput v-model="form.remarks" :placeholder="remarksPlaceholder" />
    </ElFormItem>
  </div>
</template>
