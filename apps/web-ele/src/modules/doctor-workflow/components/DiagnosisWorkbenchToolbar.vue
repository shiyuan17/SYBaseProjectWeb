<script setup lang="ts">
import type { DiagnosisWorkbenchQueueStats } from '../utils/workbench-view';

import { computed } from 'vue';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  DIAGNOSTIC_TASK_STATUS_OPTIONS,
  DIAGNOSTIC_TASK_TYPE_OPTIONS,
} from '../constants';

const props = defineProps<{
  keyword: string;
  loading: boolean;
  stats: DiagnosisWorkbenchQueueStats;
  taskStatus: string;
  taskType: string;
}>();

const emit = defineEmits<{
  refresh: [];
  reset: [];
  search: [];
  'update:keyword': [value: string];
  'update:task-status': [value: string];
  'update:task-type': [value: string];
}>();

const keywordModel = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
});

const taskStatusModel = computed({
  get: () => props.taskStatus,
  set: (value: string) => emit('update:task-status', value),
});

const taskTypeModel = computed({
  get: () => props.taskType,
  set: (value: string) => emit('update:task-type', value),
});

const summaryCards = computed(() => [
  {
    label: '当前页任务',
    value: props.stats.currentPageCount,
  },
  {
    label: '已接单',
    value: props.stats.acceptedCount,
  },
  {
    label: '诊断中',
    value: props.stats.inProgressCount,
  },
  {
    label: '已完成',
    value: props.stats.completedCount,
  },
]);
</script>

<template>
  <section class="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
    <div
      class="flex flex-col gap-2 2xl:flex-row 2xl:items-center 2xl:justify-between"
    >
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div>
          <h2 class="text-sm font-semibold text-foreground">诊断病例队列</h2>
          <p class="mt-0.5 text-xs text-muted-foreground">
            以病理号、类型和状态快速定位当前诊断任务。
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <span
            v-for="card in summaryCards"
            :key="card.label"
            class="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
          >
            {{ card.label }}
            <strong class="text-sm text-foreground">{{ card.value }}</strong>
          </span>
        </div>
      </div>

      <ElForm
        class="grid gap-2 md:grid-cols-2 xl:grid-cols-[220px_150px_150px_auto]"
        label-position="top"
      >
        <ElFormItem class="mb-0" label="病理号">
          <ElInput
            v-model="keywordModel"
            clearable
            placeholder="病理号"
            size="small"
            @keyup.enter="emit('search')"
          />
        </ElFormItem>

        <ElFormItem class="mb-0" label="任务类型">
          <ElSelect
            v-model="taskTypeModel"
            clearable
            placeholder="全部类型"
            size="small"
          >
            <ElOption
              v-for="option in DIAGNOSTIC_TASK_TYPE_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem class="mb-0" label="任务状态">
          <ElSelect
            v-model="taskStatusModel"
            clearable
            placeholder="全部状态"
            size="small"
          >
            <ElOption
              v-for="option in DIAGNOSTIC_TASK_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem class="mb-0" label="操作">
          <div class="flex flex-wrap gap-2">
            <ElButton
              :loading="loading"
              size="small"
              type="primary"
              @click="emit('search')"
            >
              查询
            </ElButton>
            <ElButton size="small" @click="emit('reset')">重置</ElButton>
            <ElButton
              :loading="loading"
              size="small"
              text
              type="primary"
              @click="emit('refresh')"
            >
              刷新
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </div>
  </section>
</template>
