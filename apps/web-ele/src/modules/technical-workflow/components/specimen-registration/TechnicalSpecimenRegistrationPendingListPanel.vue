<script setup lang="ts">
import type { PendingTechnicalSpecimenRegistrationItem } from '../../types/technical-workflow';

import { computed, ref } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElOption,
  ElPagination,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';

import {
  formatPendingPathologyNo,
  formatSpecimenRegistrationStatus,
} from '../../utils/format';

type TechnicalSpecimenRegistrationListTab = 'received' | 'registered';

const props = defineProps<{
  activeTab: TechnicalSpecimenRegistrationListTab;
  applicationType: string;
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
  'update:activeTab': [value: TechnicalSpecimenRegistrationListTab];
  'update:applicationType': [value: string];
  'update:keyword': [value: string];
  'update:page': [value: number];
  'update:receivedFrom': [value: string];
  'update:receivedTo': [value: string];
  'update:size': [value: number];
}>();

const SENDING_UNIT_OPTIONS = [
  '南海人民医院凯普送检中心',
  '南方医院',
  '南方医院肾病中心',
  '南方诊断中心',
  '南方医院增城分院',
] as const;

const PATIENT_SOURCE_FILTER_OPTIONS = [
  { label: '全部', value: 'ALL' },
  { label: '门诊', value: 'OUTPATIENT' },
  { label: '住院', value: 'INPATIENT' },
  { label: '体检', value: 'CHECKUP' },
] as const;

const PERIOD_FILTER_OPTIONS = [
  { label: '周', value: 'WEEK' },
  { label: '月', value: 'MONTH' },
  { label: '季', value: 'QUARTER' },
  { label: '年', value: 'YEAR' },
] as const;

const currentPage = computed({
  get: () => props.page,
  set: (value: number) => emit('update:page', value),
});

const currentSize = computed({
  get: () => props.size,
  set: (value: number) => emit('update:size', value),
});

const currentApplicationType = computed({
  get: () => props.applicationType,
  set: (value: string) => emit('update:applicationType', value),
});

const currentListTab = computed({
  get: () => props.activeTab,
  set: (value: TechnicalSpecimenRegistrationListTab) =>
    emit('update:activeTab', value),
});

const isRegisteredTab = computed(() => currentListTab.value === 'registered');

const loadingText = computed(() =>
  isRegisteredTab.value ? '正在加载已登记病例...' : '正在加载待登记病例...',
);

const emptyText = computed(() =>
  isRegisteredTab.value ? '暂无已登记病例' : '暂无待登记病例',
);

const receivedDateRange = computed({
  get(): string[] {
    return props.receivedFrom || props.receivedTo
      ? [props.receivedFrom, props.receivedTo]
      : [];
  },
  set(value: string[]) {
    emit('update:receivedFrom', value[0] ?? '');
    emit('update:receivedTo', value[1] ?? '');
  },
});

const displaySendingUnit = ref<(typeof SENDING_UNIT_OPTIONS)[number]>(
  SENDING_UNIT_OPTIONS[0],
);
const displayPatientSourceFilter =
  ref<(typeof PATIENT_SOURCE_FILTER_OPTIONS)[number]['value']>('ALL');
const displayPeriodFilter =
  ref<(typeof PERIOD_FILTER_OPTIONS)[number]['value']>('MONTH');
</script>

<template>
  <section
    class="flex min-h-[760px] flex-col rounded-2xl border border-border bg-card shadow-sm"
  >
    <div class="border-b border-border px-4 py-4">
      <ElTabs v-model="currentListTab" :stretch="true" class="mb-1">
        <ElTabPane
          data-testid="registration-list-tab-received"
          label="接收列表"
          name="received"
        />
        <ElTabPane
          data-testid="registration-list-tab-registered"
          label="已登记列表"
          name="registered"
        />
      </ElTabs>
      <div class="mt-4 grid gap-2">
        <label class="text-xs text-muted-foreground">
          <span class="mb-1 block">接收日期</span>
          <ElDatePicker
            v-model="receivedDateRange"
            end-placeholder="结束日期"
            range-separator="至"
            start-placeholder="开始日期"
            style="width: 100%"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
        </label>
        <label class="text-xs text-muted-foreground">
          <span class="mb-1 block">送检单位</span>
          <ElSelect
            v-model="displaySendingUnit"
            data-testid="sending-unit-display-filter"
            style="width: 100%"
          >
            <ElOption
              v-for="item in SENDING_UNIT_OPTIONS"
              :key="item"
              :label="item"
              :value="item"
            />
          </ElSelect>
        </label>
        <div class="grid gap-2 text-xs text-muted-foreground">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <ElRadioGroup
              v-model="displayPatientSourceFilter"
              data-testid="patient-source-display-filter"
              class="flex flex-wrap gap-x-2 gap-y-1"
            >
              <ElRadio
                v-for="item in PATIENT_SOURCE_FILTER_OPTIONS"
                :key="item.value"
                :label="item.value"
              >
                {{ item.label }}
              </ElRadio>
            </ElRadioGroup>
            <ElSelect
              v-model="displayPeriodFilter"
              data-testid="period-display-filter"
              style="width: 64px"
            >
              <ElOption
                v-for="item in PERIOD_FILTER_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </div>
        </div>
        <label class="text-xs text-muted-foreground">
          <span class="mb-1 block">送检类型</span>
          <ElSelect
            v-model="currentApplicationType"
            clearable
            data-testid="application-type-filter"
            placeholder="全部送检类型"
            style="width: 100%"
          >
            <ElOption label="全部送检类型" value="" />
            <ElOption
              v-for="item in APPLICATION_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </label>
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
        class="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
      >
        {{ loadingText }}
      </div>
      <div
        v-else-if="items.length === 0"
        class="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
      >
        {{ emptyText }}
      </div>
      <button
        v-for="item in items"
        :key="item.caseId"
        :data-testid="`specimen-row-${item.caseId}`"
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
          <div>
            <div class="text-sm font-semibold text-foreground">
              {{ formatPendingPathologyNo(item.pathologyNo) }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ item.patientName || '-' }}
            </div>
          </div>
          <span
            class="rounded-full bg-card px-2 py-1 text-[11px] text-muted-foreground"
          >
            {{ formatSpecimenRegistrationStatus(item.registrationStatus) }}
          </span>
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
