<script setup lang="ts">
import type { PendingTechnicalSpecimenRegistrationItem } from '../../types/technical-workflow';

import { computed } from 'vue';

import { ElButton, ElInput, ElPagination } from 'element-plus';

const props = defineProps<{
  items: PendingTechnicalSpecimenRegistrationItem[];
  keyword: string;
  loading?: boolean;
  page: number;
  receivedFrom: string;
  receivedTo: string;
  selectedCaseId: string;
  size: number;
  total: number;
}>();

const emit = defineEmits<{
  search: [];
  select: [row: PendingTechnicalSpecimenRegistrationItem];
  'update:keyword': [value: string];
  'update:page': [value: number];
  'update:receivedFrom': [value: string];
  'update:receivedTo': [value: string];
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
</script>

<template>
  <section class="flex min-h-[760px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 px-4 py-4">
      <div class="text-base font-semibold text-slate-900">接收列表</div>
      <p class="mt-1 text-xs text-slate-500">
        按接收日期和关键字筛选，选择病例后刷新中间登记工作区。
      </p>
      <div class="mt-4 grid gap-2">
        <div class="grid gap-2 md:grid-cols-2">
          <label class="text-xs text-slate-500">
            <span class="mb-1 block">接收开始日期</span>
            <input
              :value="receivedFrom"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="date"
              @input="emit('update:receivedFrom', ($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="text-xs text-slate-500">
            <span class="mb-1 block">接收结束日期</span>
            <input
              :value="receivedTo"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              type="date"
              @input="emit('update:receivedTo', ($event.target as HTMLInputElement).value)"
            />
          </label>
        </div>
        <div class="flex gap-2">
          <ElInput
            :model-value="keyword"
            clearable
            placeholder="病理号 / 患者 / 病人ID / 住院号"
            @keyup.enter="emit('search')"
            @update:model-value="emit('update:keyword', $event)"
          />
          <ElButton type="primary" @click="emit('search')">查询</ElButton>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div
        v-if="loading"
        class="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500"
      >
        正在加载待登记病例...
      </div>
      <div v-else-if="items.length === 0" class="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        暂无待登记病例
      </div>
      <button
        v-for="item in items"
        :key="item.caseId"
        :data-testid="`specimen-row-${item.caseId}`"
        :class="[
          'mb-3 w-full rounded-2xl border px-4 py-4 text-left transition',
          item.caseId === selectedCaseId
            ? 'border-sky-500 bg-sky-50 shadow-sm'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
        ]"
        type="button"
        @click="emit('select', item)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-semibold text-slate-900">
              {{ item.pathologyNo || '-' }}
            </div>
            <div class="mt-1 text-xs text-slate-500">
              {{ item.patientName || '-' }} / {{ item.patientId || '-' }}
            </div>
          </div>
          <span class="rounded-full bg-white px-2 py-1 text-[11px] text-slate-500">
            {{ item.registrationStatus || '-' }}
          </span>
        </div>
        <div class="mt-3 grid gap-1 text-xs text-slate-500">
          <div>住院号：{{ item.inpatientNo || '-' }}</div>
          <div>送检类型：{{ item.applicationType || '-' }}</div>
          <div>申请科室：{{ item.submittingDepartmentName || '-' }}</div>
          <div>检查项目：{{ item.checkItem || '-' }}</div>
          <div>接收时间：{{ item.receivedAt || '-' }}</div>
        </div>
      </button>
    </div>

    <div class="border-t border-slate-200 px-3 py-3">
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
