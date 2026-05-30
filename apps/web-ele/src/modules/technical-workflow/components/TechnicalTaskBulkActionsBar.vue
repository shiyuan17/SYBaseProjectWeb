<script setup lang="ts">
import type {
  TechnicalTaskBoardViewMode,
  TechnicalTaskSelectOption,
} from '../types/technical-workflow';

import { ElButton, ElOption, ElSelect } from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  bulkLoading?: boolean;
  priorityOptions: ReadonlyArray<TechnicalTaskSelectOption>;
  selectedCount: number;
}>();

defineEmits<{
  bulkClaim: [];
  bulkPriorityUpdate: [];
  bulkRelease: [];
}>();

const bulkPriority = defineModel<string>('bulkPriority', {
  required: true,
});

const viewMode = defineModel<TechnicalTaskBoardViewMode>('viewMode', {
  required: true,
});

const selectedCountClass = 'text-sm text-muted-foreground';
</script>

<template>
  <WorkflowSectionCard
    title="调度操作"
    description="支持病例聚合视图、任务平铺视图和批量调度动作。"
  >
    <div class="flex flex-wrap items-center gap-3">
      <ElButton
        :plain="viewMode !== 'task'"
        type="primary"
        @click="viewMode = 'task'"
      >
        调度视图
      </ElButton>
      <ElButton
        :plain="viewMode !== 'case'"
        type="primary"
        @click="viewMode = 'case'"
      >
        连续处理视图
      </ElButton>
      <ElButton :loading="bulkLoading" @click="$emit('bulkClaim')">
        批量认领
      </ElButton>
      <ElButton :loading="bulkLoading" @click="$emit('bulkRelease')">
        批量释放
      </ElButton>
      <ElSelect v-model="bulkPriority" style="width: 140px">
        <ElOption
          v-for="option in priorityOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElButton :loading="bulkLoading" @click="$emit('bulkPriorityUpdate')">
        批量调优先级
      </ElButton>
      <span :class="selectedCountClass">已选 {{ selectedCount }} 条</span>
    </div>
  </WorkflowSectionCard>
</template>
