<script setup lang="ts">
import type {
  TechnicalTaskPoolFilters,
  TechnicalTaskSelectOption,
} from '../types/technical-workflow';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  priorityOptions: ReadonlyArray<TechnicalTaskSelectOption>;
  statusOptions: ReadonlyArray<TechnicalTaskSelectOption>;
  taskTypeOptions: ReadonlyArray<TechnicalTaskSelectOption>;
}>();

const emit = defineEmits<{
  reset: [];
  search: [];
}>();

const filterState = defineModel<TechnicalTaskPoolFilters>('filterState', {
  required: true,
});
</script>

<template>
  <WorkflowSectionCard
    title="任务筛选"
    description="按任务类型、优先级、节点和分派状态查看生产任务。"
  >
    <ElForm inline label-width="96px">
      <ElFormItem label="任务类型">
        <ElSelect
          v-model="filterState.taskType"
          clearable
          placeholder="全部"
          style="width: 160px"
        >
          <ElOption
            v-for="option in taskTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="优先级">
        <ElSelect
          v-model="filterState.priority"
          clearable
          placeholder="全部"
          style="width: 140px"
        >
          <ElOption
            v-for="option in priorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="任务状态">
        <ElSelect
          v-model="filterState.taskStatus"
          clearable
          placeholder="全部"
          style="width: 150px"
        >
          <ElOption
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="当前节点">
        <ElSelect
          v-model="filterState.currentNode"
          clearable
          placeholder="全部"
          style="width: 160px"
        >
          <ElOption
            v-for="option in taskTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="分派状态">
        <ElSelect
          v-model="filterState.assignmentStatus"
          clearable
          placeholder="全部"
          style="width: 150px"
        >
          <ElOption label="未分派" value="UNASSIGNED" />
          <ElOption label="已分派" value="ASSIGNED" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="责任人">
        <ElInput
          v-model="filterState.assignedToUserId"
          clearable
          placeholder="责任人ID"
          style="width: 160px"
          @keyup.enter="emit('search')"
        />
      </ElFormItem>
      <ElFormItem label="申请单号">
        <ElInput
          v-model="filterState.applicationNo"
          clearable
          placeholder="申请单号"
          style="width: 180px"
          @keyup.enter="emit('search')"
        />
      </ElFormItem>
      <ElFormItem label="病理号">
        <ElInput
          v-model="filterState.pathologyNo"
          clearable
          placeholder="病理号"
          style="width: 180px"
          @keyup.enter="emit('search')"
        />
      </ElFormItem>
      <ElFormItem label="接收时间">
        <ElDatePicker
          v-model="filterState.createdRange"
          end-placeholder="结束"
          range-separator="至"
          start-placeholder="开始"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
        />
      </ElFormItem>
      <ElFormItem label="仅超时">
        <ElSwitch v-model="filterState.timedOutOnly" />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="emit('search')">查询</ElButton>
        <ElButton @click="emit('reset')">重置</ElButton>
      </ElFormItem>
    </ElForm>
  </WorkflowSectionCard>
</template>
