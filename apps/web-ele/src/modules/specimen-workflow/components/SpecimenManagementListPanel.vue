<script setup lang="ts">
import type { SpecimenManagementListItem } from '../types/specimen-workflow';
import type {
  AbnormalFilterValue,
  QuickFilterKey,
} from '../utils/specimen-management';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import SpecimenManagementTable from './SpecimenManagementTable.vue';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

type SpecimenManagementFiltersState = {
  abnormalFlag: AbnormalFilterValue;
  dateRange: string[];
  departmentId: string;
  keyword: string;
  labelPrintStatus: string;
  page: number;
  size: number;
  specimenStatus: string;
};

defineProps<{
  abnormalFilterOptions: ReadonlyArray<{ label: string; value: string }>;
  canVerifyFixation: boolean;
  items: SpecimenManagementListItem[];
  labelPrintStatusOptions: ReadonlyArray<{ label: string; value: string }>;
  listLoading: boolean;
  quickFilterOptions: ReadonlyArray<{ key: QuickFilterKey; label: string }>;
  selectedRowsCount: number;
  specimenStatusOptions: ReadonlyArray<{ label: string; value: string }>;
  total: number;
}>();

const emit = defineEmits<{
  (
    event: 'departmentChange',
    department: null | { id: string; name: string },
  ): void;
  (event: 'bulkRetry'): void;
  (event: 'detail', row: SpecimenManagementListItem): void;
  (event: 'goToTracking', row: SpecimenManagementListItem): void;
  (event: 'pageChange', page: number): void;
  (event: 'quickFilterChange', nextQuickFilter: QuickFilterKey): void;
  (event: 'reset'): void;
  (event: 'rowRetry', row: SpecimenManagementListItem): void;
  (event: 'search'): void;
  (event: 'selectionChange', rows: SpecimenManagementListItem[]): void;
  (event: 'sizeChange', size: number): void;
  (
    event: 'verify',
    row: SpecimenManagementListItem,
    action: 'complete' | 'start',
  ): void;
}>();

const quickFilter = defineModel<QuickFilterKey>('quickFilter', {
  required: true,
});
const filters = defineModel<SpecimenManagementFiltersState>('filters', {
  required: true,
});
</script>

<template>
  <WorkflowSectionCard
    title="标本列表"
    description="快捷筛选与高级筛选共同驱动当前工作台列表。"
  >
    <template #extra>
      <div class="flex flex-wrap gap-2">
        <ElButton
          v-for="option in quickFilterOptions"
          :key="option.key"
          :type="quickFilter === option.key ? 'primary' : 'default'"
          plain
          @click="emit('quickFilterChange', option.key)"
        >
          {{ option.label }}
        </ElButton>
      </div>
    </template>

    <ElForm label-width="88px">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ElFormItem label="关键字">
          <ElInput
            v-model="filters.keyword"
            clearable
            placeholder="申请单号 / 标本号 / 条码 / 患者"
            @keyup.enter="emit('search')"
          />
        </ElFormItem>
        <ElFormItem label="送检科室">
          <DepartmentSelect
            v-model="filters.departmentId"
            placeholder="请选择送检科室"
            @change="emit('departmentChange', $event)"
          />
        </ElFormItem>
        <ElFormItem label="标签状态">
          <ElSelect
            v-model="filters.labelPrintStatus"
            clearable
            style="width: 100%"
          >
            <ElOption
              v-for="option in labelPrintStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="标本状态">
          <ElSelect
            v-model="filters.specimenStatus"
            clearable
            style="width: 100%"
          >
            <ElOption
              v-for="option in specimenStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="异常标记">
          <ElSelect
            v-model="filters.abnormalFlag"
            clearable
            style="width: 100%"
          >
            <ElOption
              v-for="option in abnormalFilterOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto]">
        <ElFormItem label="登记日期">
          <ElDatePicker
            v-model="filters.dateRange"
            end-placeholder="结束日期"
            range-separator="至"
            start-placeholder="开始日期"
            style="width: 100%"
            type="daterange"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem class="xl:justify-self-end">
          <div class="flex flex-wrap gap-2">
            <ElButton type="primary" @click="emit('search')">查询</ElButton>
            <ElButton @click="emit('reset')">重置</ElButton>
            <ElButton
              :disabled="selectedRowsCount === 0"
              plain
              @click="emit('bulkRetry')"
            >
              批量补打
            </ElButton>
          </div>
        </ElFormItem>
      </div>
    </ElForm>

    <SpecimenManagementTable
      :can-verify-fixation="canVerifyFixation"
      :items="items"
      :list-loading="listLoading"
      @detail="emit('detail', $event)"
      @go-to-tracking="emit('goToTracking', $event)"
      @row-retry="emit('rowRetry', $event)"
      @selection-change="emit('selectionChange', $event)"
      @verify="(row, action) => emit('verify', row, action)"
    />

    <div class="flex justify-end pt-4">
      <ElPagination
        :current-page="filters.page"
        :page-size="filters.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="emit('pageChange', $event)"
        @size-change="emit('sizeChange', $event)"
      />
    </div>
  </WorkflowSectionCard>
</template>
