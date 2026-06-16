<script setup lang="ts">
import type {
  DiagnosisWorkbenchQueueQuickFilter,
  DiagnosisWorkbenchQueueStats,
} from '../utils/workbench-view';

import { computed } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { DIAGNOSTIC_TASK_TYPE_OPTIONS } from '../constants';
import { buildDiagnosisWorkbenchQuickFilterOptions } from '../utils/workbench-view';

const props = defineProps<{
  activeQuickFilter: DiagnosisWorkbenchQueueQuickFilter;
  assignedRange: string[];
  keyword: string;
  loading: boolean;
  stats: DiagnosisWorkbenchQueueStats;
  taskType: string;
}>();

const emit = defineEmits<{
  quickFilter: [value: DiagnosisWorkbenchQueueQuickFilter];
  refresh: [];
  reset: [];
  search: [];
  'update:assigned-range': [value: string[]];
  'update:keyword': [value: string];
  'update:task-type': [value: string];
}>();

const keywordModel = computed({
  get: () => props.keyword,
  set: (value: string) => emit('update:keyword', value),
});

const assignedRangeModel = computed({
  get: () => props.assignedRange,
  set: (value: string[]) => emit('update:assigned-range', value ?? []),
});

const taskTypeModel = computed({
  get: () => props.taskType,
  set: (value: string) => emit('update:task-type', value),
});

const quickFilterOptions = computed(() =>
  buildDiagnosisWorkbenchQuickFilterOptions(props.stats),
);

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
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 class="text-sm font-semibold text-foreground">诊断病例队列</h2>
          <span
            v-for="card in summaryCards"
            :key="card.label"
            class="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-xs text-muted-foreground"
          >
            {{ card.label }}
            <strong class="text-sm text-foreground">{{ card.value }}</strong>
          </span>
        </div>
      </div>

      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <ElDatePicker
            v-model="assignedRangeModel"
            end-placeholder="结束日期"
            class="diagnosis-workbench-toolbar__date"
            range-separator="至"
            size="small"
            start-placeholder="开始日期"
            type="daterange"
            value-format="YYYY-MM-DD"
          />

          <ElInput
            v-model="keywordModel"
            class="diagnosis-workbench-toolbar__filter-control"
            clearable
            placeholder="病理号"
            size="small"
            @keyup.enter="emit('search')"
          />

          <ElSelect
            v-model="taskTypeModel"
            class="diagnosis-workbench-toolbar__filter-control"
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

          <ElButton
            :loading="loading"
            size="small"
            type="primary"
            @click="emit('search')"
          >
            查询
          </ElButton>
        </div>

        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <ElButton
            v-for="option in quickFilterOptions"
            :key="option.key"
            :plain="activeQuickFilter !== option.key"
            size="small"
            :type="activeQuickFilter === option.key ? 'primary' : undefined"
            @click="emit('quickFilter', option.key)"
          >
            {{ option.label }}({{ option.count }})
          </ElButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.diagnosis-workbench-toolbar__date {
  width: 220px;
  min-width: 220px;
  max-width: 220px;
}

:deep(.diagnosis-workbench-toolbar__date.el-date-editor) {
  width: 220px;
  min-width: 220px;
  max-width: 220px;
}

:deep(.diagnosis-workbench-toolbar__date.el-date-editor.el-input__wrapper) {
  width: 220px;
  min-width: 220px;
  max-width: 220px;
}

.diagnosis-workbench-toolbar__date:deep(.el-range-input) {
  min-width: 0;
}

.diagnosis-workbench-toolbar__filter-control {
  width: 170px;
  min-width: 170px;
  max-width: 170px;
}
</style>
