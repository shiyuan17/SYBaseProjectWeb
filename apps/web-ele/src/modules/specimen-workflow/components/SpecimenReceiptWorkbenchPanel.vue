<script setup lang="ts">
import type {
  ReceiptFilters,
  TransportReceiptGroup,
} from '../utils/specimen-receipt';

import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElPagination,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

import SpecimenReceiptGroupTable from './SpecimenReceiptGroupTable.vue';
import WorkflowSectionCard from './WorkflowSectionCard.vue';

defineProps<{
  abnormalBatchCount: number;
  groups: TransportReceiptGroup[];
  loading: boolean;
  orphanPendingCount: number;
  total: number;
  totalReminderCount: number;
}>();

const emit = defineEmits<{
  (
    event: 'departmentChange',
    department: null | { id: string; name: string },
  ): void;
  (event: 'openDirectReceive'): void;
  (event: 'pageChange', page: number): void;
  (event: 'prepare', group: TransportReceiptGroup): void;
  (event: 'reprint', group: TransportReceiptGroup): void;
  (event: 'reset'): void;
  (event: 'search'): void;
  (event: 'sizeChange', size: number): void;
}>();

const filters = defineModel<ReceiptFilters>('filters', {
  required: true,
});
</script>

<template>
  <WorkflowSectionCard
    title="待接收转运单"
    description="待接收列表按后端标本分页返回，在前端按 transportOrderId 聚合成接收工作台，并显式展示异常批次、提醒计数和未接收数量。"
  >
    <template #extra>
      <ElButton type="primary" @click="emit('openDirectReceive')">
        条码直收
      </ElButton>
    </template>

    <div class="mb-4 grid gap-3 md:grid-cols-3">
      <div class="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div class="text-sm text-muted-foreground">待接收批次</div>
        <div class="mt-2 text-2xl font-semibold text-foreground">
          {{ groups.length }}
        </div>
      </div>
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div class="text-sm text-muted-foreground">异常批次</div>
        <div class="mt-2 text-2xl font-semibold text-amber-600">
          {{ abnormalBatchCount }}
        </div>
      </div>
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
        <div class="text-sm text-muted-foreground">提醒计数</div>
        <div class="mt-2 text-2xl font-semibold text-red-600">
          {{ totalReminderCount }}
        </div>
      </div>
    </div>

    <ElForm inline label-width="88px">
      <ElFormItem label="申请单号">
        <ElInput
          v-model="filters.applicationId"
          clearable
          placeholder="请输入申请单号"
          style="width: 220px"
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
      <ElFormItem label="追踪日期">
        <ElDatePicker
          v-model="filters.dateRange"
          end-placeholder="结束日期"
          range-separator="至"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD"
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="emit('search')">查询</ElButton>
        <ElButton @click="emit('reset')">重置</ElButton>
      </ElFormItem>
    </ElForm>

    <ElAlert
      v-if="orphanPendingCount > 0"
      class="mb-4"
      :closable="false"
      :title="`当前有 ${orphanPendingCount} 条待接收标本尚未关联转运单，请优先回到转运交接站核对。`"
      type="warning"
      show-icon
    />

    <SpecimenReceiptGroupTable
      :groups="groups"
      :loading="loading"
      @prepare="emit('prepare', $event)"
      @reprint="emit('reprint', $event)"
    />

    <div class="mt-4 flex justify-end">
      <ElPagination
        :current-page="filters.page"
        :page-size="filters.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
        @current-change="emit('pageChange', $event)"
        @size-change="emit('sizeChange', $event)"
      />
    </div>
  </WorkflowSectionCard>
</template>
