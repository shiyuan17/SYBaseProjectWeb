<script setup lang="ts">
import type { TechnicalOperatorFormValue } from '../types/technical-workflow';

import { ElFormItem, ElInput } from 'element-plus';

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
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <ElFormItem label="操作人" required>
      <ElInput
        :model-value="props.form.operatorName"
        disabled
        placeholder="当前登录人"
      />
    </ElFormItem>
    <ElFormItem label="终端编码">
      <ElInput
        v-model="props.form.terminalCode"
        :placeholder="terminalPlaceholder"
      />
    </ElFormItem>
    <ElFormItem label="备注">
      <ElInput v-model="props.form.remarks" :placeholder="remarksPlaceholder" />
    </ElFormItem>
  </div>
</template>
