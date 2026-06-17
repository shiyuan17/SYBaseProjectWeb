<script setup lang="ts">
import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';

import {
  createDatePickerPanelDefaultValue,
  createDateRangePickerShortcuts,
  disableFutureDate,
} from '../utils/date-range';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  caseId: string;
  dateRange: string[];
  loading: boolean;
}>();

const emit = defineEmits<{
  query: [];
  reset: [];
  'update:caseId': [value: string];
  'update:dateRange': [value: string[]];
}>();

const dateRangeShortcuts = createDateRangePickerShortcuts();
</script>

<template>
  <WorkflowSectionCard
    title="病例查询"
    description="支持按病例ID、病理号或对象ID查询对象树追踪视图。"
  >
    <ElForm class="technical-tracking-query-form" inline label-width="132px">
      <ElFormItem
        class="technical-tracking-query-form__field"
        label="病例/病理/对象"
        required
      >
        <ElInput
          :model-value="caseId"
          clearable
          placeholder="请输入病例ID、病理号或对象ID"
          style="width: 320px"
          @keyup.enter="emit('query')"
          @update:model-value="emit('update:caseId', $event)"
        />
      </ElFormItem>
      <ElFormItem class="technical-tracking-query-form__field" label="工作日期">
        <ElDatePicker
          :default-value="createDatePickerPanelDefaultValue()"
          :disabled-date="disableFutureDate"
          :model-value="dateRange"
          :shortcuts="dateRangeShortcuts"
          end-placeholder="结束日期"
          range-separator="至"
          start-placeholder="开始日期"
          style="width: 260px"
          type="daterange"
          unlink-panels
          value-format="YYYY-MM-DD"
          @update:model-value="emit('update:dateRange', $event || [])"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton :loading="loading" type="primary" @click="emit('query')">
          查询
        </ElButton>
        <ElButton @click="emit('reset')">重置</ElButton>
      </ElFormItem>
    </ElForm>
  </WorkflowSectionCard>
</template>

<style scoped>
.technical-tracking-query-form :deep(.el-form-item__label) {
  white-space: nowrap;
}

.technical-tracking-query-form__field {
  margin-right: 20px;
}
</style>
