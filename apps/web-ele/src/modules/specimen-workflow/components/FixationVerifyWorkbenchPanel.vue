<script setup lang="ts">
import type { SpecimenRemovalSummary } from '../types/specimen-workflow';

import { ref } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';

import DepartmentSelect from '#/modules/system-management/components/DepartmentSelect.vue';

type QuickConfirmIdentifierType = 'BARCODE' | 'SPECIMEN_NO';

type QuickInputRef = InstanceType<typeof ElInput> & {
  input?: HTMLInputElement | null;
};

type FixationVerifyFiltersState = {
  applicationNo: string;
  dateRange: string[];
  departmentId: string;
  page: number;
  size: number;
};

defineProps<{
  quickActionLoading: {
    barcode: boolean;
    specimenNo: boolean;
  };
  summary: SpecimenRemovalSummary;
}>();

const emit = defineEmits<{
  (
    event: 'departmentChange',
    department: null | { id: string; name: string },
  ): void;
  (event: 'quickConfirm', identifierType: QuickConfirmIdentifierType): void;
  (event: 'reset'): void;
  (event: 'search'): void;
}>();

const barcodeQuickInput = defineModel<string>('barcodeQuickInput', {
  required: true,
});
const specimenNoQuickInput = defineModel<string>('specimenNoQuickInput', {
  required: true,
});
const filters = defineModel<FixationVerifyFiltersState>('filters', {
  required: true,
});

const barcodeQuickInputContainerRef = ref<HTMLDivElement | null>(null);
const specimenNoQuickInputContainerRef = ref<HTMLDivElement | null>(null);
const barcodeQuickInputRef = ref<null | QuickInputRef>(null);
const specimenNoQuickInputRef = ref<null | QuickInputRef>(null);

function focusQuickInput(identifierType: QuickConfirmIdentifierType) {
  const inputRef =
    identifierType === 'BARCODE'
      ? barcodeQuickInputRef.value
      : specimenNoQuickInputRef.value;
  const containerRef =
    identifierType === 'BARCODE'
      ? barcodeQuickInputContainerRef.value
      : specimenNoQuickInputContainerRef.value;
  const nativeInput = containerRef?.querySelector('input');
  nativeInput?.focus();
  if (nativeInput !== document.activeElement) {
    inputRef?.input?.focus();
  }
  if (
    nativeInput !== document.activeElement &&
    inputRef?.input !== document.activeElement
  ) {
    inputRef?.focus();
  }
}

defineExpose({
  focusQuickInput,
});
</script>

<template>
  <div class="mb-4 flex flex-wrap items-center gap-4 text-sm">
    <div class="font-semibold text-[color:#d6453d]">设置离体时间</div>
    <div>
      全部
      <span class="text-xl font-semibold text-primary">{{
        summary.totalCount
      }}</span>
    </div>
    <div>
      已离体
      <span class="text-xl font-semibold text-success">{{
        summary.confirmedCount
      }}</span>
    </div>
    <div>
      未设置
      <span class="text-xl font-semibold text-danger">{{
        summary.pendingCount
      }}</span>
    </div>
  </div>

  <div
    class="mb-4 grid gap-3 rounded-lg border border-[color:#dbe3f0] bg-[color:#f7f9fc] p-4 md:grid-cols-2"
  >
    <div
      ref="barcodeQuickInputContainerRef"
      v-loading="quickActionLoading.barcode"
      class="flex items-center gap-3"
    >
      <div class="min-w-20 text-sm font-medium text-[color:#1f2d3d]">
        标本ID
      </div>
      <ElInput
        ref="barcodeQuickInputRef"
        v-model="barcodeQuickInput"
        clearable
        placeholder="请输入标本ID后按回车确认"
        @keyup.enter="emit('quickConfirm', 'BARCODE')"
      />
    </div>
    <div
      ref="specimenNoQuickInputContainerRef"
      v-loading="quickActionLoading.specimenNo"
      class="flex items-center gap-3"
    >
      <div class="min-w-24 text-sm font-medium text-[color:#1f2d3d]">
        标本流水号
      </div>
      <ElInput
        ref="specimenNoQuickInputRef"
        v-model="specimenNoQuickInput"
        clearable
        placeholder="请输入标本流水号后按回车确认"
        @keyup.enter="emit('quickConfirm', 'SPECIMEN_NO')"
      />
    </div>
  </div>

  <ElForm inline label-width="88px">
    <ElFormItem label="申请单号">
      <ElInput
        v-model="filters.applicationNo"
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
    <ElFormItem label="登记日期">
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
</template>
