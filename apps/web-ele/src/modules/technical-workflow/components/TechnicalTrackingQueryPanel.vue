<script setup lang="ts">
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  caseId: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  query: [];
  reset: [];
  'update:caseId': [value: string];
}>();
</script>

<template>
  <WorkflowSectionCard
    title="病例查询"
    description="支持按病例ID、病理号或对象ID查询对象树追踪视图。"
  >
    <ElForm class="technical-tracking-query-form" inline label-width="132px">
      <ElFormItem class="technical-tracking-query-form__field" label="病例/病理/对象" required>
        <ElInput
          :model-value="caseId"
          clearable
          placeholder="请输入病例ID、病理号或对象ID"
          style="width: 320px"
          @keyup.enter="emit('query')"
          @update:model-value="emit('update:caseId', $event)"
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
