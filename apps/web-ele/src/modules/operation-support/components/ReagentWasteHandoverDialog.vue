<script setup lang="ts">
import type { MedicalWasteReagentHandoverRequest } from '../types/operation-support';

import { computed } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';

const props = defineProps<{
  form: MedicalWasteReagentHandoverRequest;
  modelValue: boolean;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  'update:form': [value: MedicalWasteReagentHandoverRequest];
  'update:modelValue': [value: boolean];
}>();

function updateForm(patch: Partial<MedicalWasteReagentHandoverRequest>) {
  emit('update:form', {
    ...props.form,
    ...patch,
  });
}

const handedOverByNameModel = computed({
  get: () => props.form.handedOverByName,
  set: (value: string) => updateForm({ handedOverByName: value }),
});

const handedOverAtModel = computed({
  get: () => props.form.handedOverAt,
  set: (value: string) => updateForm({ handedOverAt: value }),
});

const handoverRemarksModel = computed({
  get: () => props.form.handoverRemarks ?? '',
  set: (value: string) => updateForm({ handoverRemarks: value }),
});
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    destroy-on-close
    title="废物交接"
    width="560px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElForm label-width="90px">
      <ElFormItem label="交接人" required>
        <ElInput v-model="handedOverByNameModel" placeholder="请输入交接人" />
      </ElFormItem>
      <ElFormItem label="交接时间" required>
        <ElDatePicker
          v-model="handedOverAtModel"
          class="w-full"
          placeholder="请选择交接时间"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </ElFormItem>
      <ElFormItem label="交接备注">
        <ElInput
          v-model="handoverRemarksModel"
          maxlength="200"
          placeholder="可选"
          :rows="3"
          type="textarea"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton :loading="submitting" type="primary" @click="emit('submit')">
          保存
        </ElButton>
        <ElButton @click="emit('update:modelValue', false)">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
