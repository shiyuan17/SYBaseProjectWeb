<script setup lang="ts">
import type { PendingDiagnosticTaskItem } from '../types/doctor-workflow';

import { ElEmpty, ElTag } from 'element-plus';

import {
  formatDiagnosticTaskStatus,
  formatDiagnosticTaskType,
  formatNullable,
} from '../utils/format';
import {
  getDiagnosisTaskStatusTagType,
  getDiagnosisTaskTypeTagType,
} from '../utils/workbench-view';

defineProps<{
  items: PendingDiagnosticTaskItem[];
  loading: boolean;
  selectedTaskId: string;
}>();

const emit = defineEmits<{
  select: [task: PendingDiagnosticTaskItem];
}>();
</script>

<template>
  <section
    class="flex min-h-0 flex-col rounded-lg border border-border bg-card shadow-sm"
  >
    <header
      class="flex items-center justify-between border-b border-border px-3 py-2"
    >
      <div>
        <h3 class="text-sm font-semibold text-foreground">诊断队列</h3>
        <p class="mt-1 text-xs text-muted-foreground">
          当前筛选条件下的待处理任务，点击即可切换右侧病例。
        </p>
      </div>
    </header>

    <div
      v-loading="loading"
      class="min-h-0 flex-1 overflow-auto"
      data-testid="diagnosis-workbench-queue"
    >
      <div
        class="grid min-w-[620px] grid-cols-[118px_80px_86px_104px_112px_112px] gap-0 border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground"
      >
        <div>病理号</div>
        <div>患者</div>
        <div>任务类型</div>
        <div>任务状态</div>
        <div>责任医生</div>
        <div>初诊医生</div>
      </div>

      <template v-if="items.length > 0">
        <button
          v-for="item in items"
          :key="item.id"
          :data-testid="`diagnosis-workbench-queue-row-${item.id}`"
          class="grid min-w-[620px] grid-cols-[118px_80px_86px_104px_112px_112px] items-center gap-0 border-b border-border/70 px-3 py-2 text-left transition hover:bg-primary/5"
          :class="
            item.id === selectedTaskId
              ? 'bg-primary/10 shadow-[inset_3px_0_0_0_var(--el-color-primary)]'
              : 'bg-card'
          "
          type="button"
          @click="emit('select', item)"
        >
          <div class="truncate text-xs font-semibold text-foreground">
            {{ formatNullable(item.pathologyNo) }}
          </div>
          <div class="truncate text-xs text-foreground">
            {{ formatNullable(item.patientName) }}
          </div>
          <div class="text-xs">
            <ElTag
              :type="getDiagnosisTaskTypeTagType(item.taskType)"
              effect="plain"
              size="small"
            >
              {{ formatDiagnosticTaskType(item.taskType) }}
            </ElTag>
          </div>
          <div class="text-xs">
            <ElTag
              :type="getDiagnosisTaskStatusTagType(item.taskStatus)"
              size="small"
            >
              {{ formatDiagnosticTaskStatus(item.taskStatus) }}
            </ElTag>
          </div>
          <div class="truncate text-xs text-foreground">
            {{ formatNullable(item.diagnosisDoctorName) }}
          </div>
          <div class="truncate text-xs text-foreground">
            {{ formatNullable(item.primaryDoctorName) }}
          </div>
        </button>
      </template>

      <div
        v-else
        class="flex min-h-[240px] items-center justify-center px-6 py-8"
      >
        <ElEmpty description="当前筛选条件下暂无诊断任务" />
      </div>
    </div>
  </section>
</template>
