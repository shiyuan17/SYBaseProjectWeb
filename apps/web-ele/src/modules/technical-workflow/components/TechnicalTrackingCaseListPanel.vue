<script setup lang="ts">
import type {
  TechnicalTrackingCaseListItem,
  TechnicalTrackingCaseListPage,
} from '../types/technical-workflow';

import { computed } from 'vue';

import { ElButton, ElEmpty, ElPagination, ElTag } from 'element-plus';

import {
  formatCaseStatus,
  formatDateTime,
  formatNullable,
  formatPatientIdDisplay,
} from '../utils/format';

const props = defineProps<{
  emptyText?: string;
  items: TechnicalTrackingCaseListPage['items'];
  loading?: boolean;
  page: number;
  selectedCaseId: string;
  size: number;
  total: number;
}>();

const emit = defineEmits<{
  search: [];
  select: [row: TechnicalTrackingCaseListItem];
  'update:page': [value: number];
  'update:size': [value: number];
}>();

const currentPage = computed({
  get: () => props.page,
  set: (value: number) => emit('update:page', value),
});

const currentSize = computed({
  get: () => props.size,
  set: (value: number) => emit('update:size', value),
});

const resolvedEmptyText = computed(
  () => props.emptyText || '请选择工作日期后查询命中病例',
);
</script>

<template>
  <section
    class="flex min-h-[680px] flex-col rounded-2xl border border-border bg-card shadow-sm"
  >
    <div class="border-b border-border px-4 py-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-foreground">病例结果</h3>
          <p class="mt-1 text-xs text-muted-foreground">
            日期查询命中多个病例时，可先在左侧选择，再查看右侧技术追踪详情。
          </p>
        </div>
        <ElButton :loading="loading" type="primary" @click="emit('search')">
          刷新
        </ElButton>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div
        v-if="loading"
        class="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
      >
        正在查询命中病例...
      </div>
      <div
        v-else-if="items.length === 0"
        class="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
      >
        <ElEmpty :description="resolvedEmptyText" />
      </div>
      <button
        v-for="item in items"
        :key="item.caseId"
        :data-testid="`tracking-case-row-${item.caseId}`"
        :class="[
          item.caseId === selectedCaseId
            ? 'border-sky-500 bg-primary/10 shadow-sm'
            : 'border-border bg-accent hover:border-border hover:bg-card',
        ]"
        class="mb-3 w-full rounded-2xl border px-4 py-4 text-left transition"
        type="button"
        @click="emit('select', item)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <div class="min-w-0 text-sm font-semibold text-foreground">
                {{ formatNullable(item.pathologyNo) }}
              </div>
              <ElTag effect="plain" size="small">
                {{ formatCaseStatus(item.caseStatus) }}
              </ElTag>
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ formatNullable(item.patientName) }}
            </div>
            <div
              class="mt-2 grid gap-x-3 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2"
            >
              <span>
                病人ID：{{
                  formatPatientIdDisplay(item.patientIdDisplay, null)
                }}
              </span>
              <span>申请单号：{{ formatNullable(item.applicationNo) }}</span>
              <span>送检类型：{{ formatNullable(item.applicationType) }}</span>
              <span>最近活动：{{ formatDateTime(item.latestActivityAt) }}</span>
              <span class="sm:col-span-2">
                送检科室：{{ formatNullable(item.submittingDepartmentName) }}
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>

    <div class="border-t border-border px-3 py-3">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="currentSize"
        :background="true"
        :page-sizes="[20, 50, 100]"
        :pager-count="5"
        :small="true"
        :total="total"
        layout="sizes, prev, pager, next"
      />
    </div>
  </section>
</template>
