<script setup lang="ts">
import type { ReagentFormState } from '../utils/reagent-ledger';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import {
  REAGENT_TEMPLATE_STATUS_OPTIONS,
  REAGENT_TYPE_OPTIONS,
} from '../constants';

const props = defineProps<{
  isEditingReagent: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit'): void;
}>();

const dialogVisible = defineModel<boolean>({ required: true });
const reagentForm = defineModel<ReagentFormState>('reagentForm', {
  required: true,
});
</script>

<template>
  <ElDialog v-model="dialogVisible" title="试剂模板维护" width="860px">
    <ElForm class="grid grid-cols-1 gap-x-4 md:grid-cols-2" label-width="120px">
      <ElFormItem label="试剂编码" required>
        <ElInput
          v-model="reagentForm.reagentCode"
          :disabled="props.isEditingReagent"
        />
      </ElFormItem>
      <ElFormItem label="试剂名称" required>
        <ElInput v-model="reagentForm.reagentName" />
      </ElFormItem>
      <ElFormItem label="医嘱字典项">
        <ElInput
          v-model="reagentForm.orderDictItemId"
          placeholder="如 ODI_IHC_CK"
        />
      </ElFormItem>
      <ElFormItem label="试剂类型">
        <ElSelect v-model="reagentForm.reagentType" clearable>
          <ElOption
            v-for="option in REAGENT_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="试剂用途">
        <ElInput v-model="reagentForm.reagentUsage" />
      </ElFormItem>
      <ElFormItem label="克隆号">
        <ElInput v-model="reagentForm.cloneNo" />
      </ElFormItem>
      <ElFormItem label="规格">
        <ElInput v-model="reagentForm.specification" />
      </ElFormItem>
      <ElFormItem label="单位">
        <ElInput v-model="reagentForm.unit" />
      </ElFormItem>
      <ElFormItem label="厂家">
        <ElInput v-model="reagentForm.manufacturer" />
      </ElFormItem>
      <ElFormItem label="推荐稀释度">
        <ElInput v-model="reagentForm.recommendedDilution" />
      </ElFormItem>
      <ElFormItem label="应用稀释度">
        <ElInput v-model="reagentForm.applicationDilution" />
      </ElFormItem>
      <ElFormItem label="初始有效期">
        <ElInputNumber v-model="reagentForm.validityDays" :min="0" />
      </ElFormItem>
      <ElFormItem label="库存阈值">
        <ElInputNumber v-model="reagentForm.defaultStockThreshold" :min="0" />
      </ElFormItem>
      <ElFormItem label="订购提醒阈值">
        <ElInputNumber
          v-model="reagentForm.defaultLowStockThreshold"
          :min="0"
        />
      </ElFormItem>
      <ElFormItem label="近效期天数">
        <ElInputNumber v-model="reagentForm.defaultNearExpiryDays" :min="0" />
      </ElFormItem>
      <ElFormItem label="可染色例数">
        <ElInputNumber v-model="reagentForm.stainCapacity" :min="0" />
      </ElFormItem>
      <ElFormItem label="染色阈值">
        <ElInputNumber v-model="reagentForm.stainThreshold" :min="0" />
      </ElFormItem>
      <ElFormItem label="模板状态">
        <ElSelect v-model="reagentForm.templateStatus">
          <ElOption
            v-for="option in REAGENT_TEMPLATE_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="启用">
        <ElSwitch v-model="reagentForm.enabled" />
      </ElFormItem>
      <ElFormItem class="md:col-span-2" label="备注">
        <ElInput v-model="reagentForm.remarks" type="textarea" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton
        :loading="props.submitting"
        type="primary"
        @click="emit('submit')"
      >
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
