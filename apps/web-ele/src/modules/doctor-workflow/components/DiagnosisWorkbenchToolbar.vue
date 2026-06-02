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
  <section class="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
    <div class="flex flex-col gap-3">
      <div
        class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
      >
        <div>
          <h2 class="text-base font-semibold text-foreground">
            诊断病例队列
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            贴近旧工作站的高密度视图，只展示当前接口能稳定支撑的诊断队列字段。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-md border border-border bg-background px-3 py-2"
          >
            <div class="text-xs text-muted-foreground">{{ card.label }}</div>
            <div class="mt-1 text-lg font-semibold text-foreground">
              {{ card.value }}
            </div>
          </article>
        </div>
      </div>

      <ElForm
        class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_180px_180px_auto]"
        label-position="top"
      >
        <ElFormItem class="mb-0" label="病理号">
          <ElInput
            v-model="keywordModel"
            clearable
            placeholder="输入病理号筛选当前诊断队列"
            @keyup.enter="emit('search')"
          />
        </ElFormItem>

        <ElFormItem class="mb-0" label="任务类型">
          <ElSelect v-model="taskTypeModel" clearable placeholder="全部类型">
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
            <ElButton :loading="loading" type="primary" @click="emit('search')">
              查询
            </ElButton>
            <ElButton @click="emit('reset')">重置</ElButton>
            <ElButton :loading="loading" text type="primary" @click="emit('refresh')">
              刷新
            </ElButton>
          </div>
        </ElFormItem>
      </ElForm>
    </div>
  </section>
</template>
