<script setup lang="ts">
import { reactive, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
} from 'element-plus';

const props = defineProps<{
  requireQuantity?: boolean;
  submitting: boolean;
  title: string;
}>();

const emit = defineEmits<{
  (event: 'submit', payload: { quantity?: number; remarks?: string }): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const form = reactive({
  quantity: undefined as number | undefined,
  remarks: '',
});

watch(dialogVisible, (visible) => {
  if (visible) {
    form.quantity = undefined;
    form.remarks = '';
  }
});
</script>

<template>
  <ElDialog v-model="dialogVisible" :title="props.title" width="420px">
    <ElForm label-width="88px">
      <ElFormItem v-if="props.requireQuantity" label="数量" required>
        <ElInputNumber v-model="form.quantity" :min="0" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="form.remarks" type="textarea" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton
        :loading="props.submitting"
        type="primary"
        @click="
          emit('submit', {
            quantity: form.quantity,
            remarks: form.remarks.trim() || undefined,
          })
        "
      >
        确认
      </ElButton>
    </template>
  </ElDialog>
</template>
