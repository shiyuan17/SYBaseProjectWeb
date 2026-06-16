<script setup lang="ts">
import type { CreateMedicalWasteReagentBagRequest } from '../types/operation-support';

import { computed } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { MEDICAL_WASTE_REAGENT_TYPE_OPTIONS } from '../utils/medical-waste';

const props = defineProps<{
  form: CreateMedicalWasteReagentBagRequest;
  modelValue: boolean;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  'update:form': [value: CreateMedicalWasteReagentBagRequest];
  'update:modelValue': [value: boolean];
}>();

function updateForm(patch: Partial<CreateMedicalWasteReagentBagRequest>) {
  emit('update:form', {
    ...props.form,
    ...patch,
  });
}

const bagNameModel = computed({
  get: () => props.form.bagName,
  set: (value: string) => updateForm({ bagName: value }),
});

const wasteTypeModel = computed({
  get: () => props.form.wasteType,
  set: (value: string) => updateForm({ wasteType: value }),
});

const weightKgModel = computed({
  get: () => props.form.weightKg ?? '',
  set: (value: string) => updateForm({ weightKg: value }),
});

const volumeMlModel = computed({
  get: () => props.form.volumeMl ?? '',
  set: (value: string) => updateForm({ volumeMl: value }),
});

const sourceModel = computed({
  get: () => props.form.source ?? '',
  set: (value: string) => updateForm({ source: value }),
});

const remarksModel = computed({
  get: () => props.form.remarks ?? '',
  set: (value: string) => updateForm({ remarks: value }),
});
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    destroy-on-close
    title="打印标签"
    width="620px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElForm label-width="90px">
      <ElFormItem label="名称" required>
        <ElInput v-model="bagNameModel" placeholder="请输入名称" />
      </ElFormItem>
      <ElFormItem label="种类" required>
        <ElSelect v-model="wasteTypeModel" placeholder="请选择种类">
          <ElOption
            v-for="item in MEDICAL_WASTE_REAGENT_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="重量(KG)">
        <ElInput v-model="weightKgModel" placeholder="请输入重量" />
      </ElFormItem>
      <ElFormItem label="容量(ML)">
        <ElInput v-model="volumeMlModel" placeholder="请输入容量" />
      </ElFormItem>
      <ElFormItem label="来源">
        <ElInput v-model="sourceModel" placeholder="请输入来源" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="remarksModel"
          maxlength="200"
          placeholder="请输入备注"
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
        <ElButton @click="emit('update:modelValue', false)">退出</ElButton>
      </div>
    </template>
  </ElDialog>
</template>
